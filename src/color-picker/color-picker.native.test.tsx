import type {PropsWithChildren} from 'react';
import type {ColorPickerSheetProps} from './sheet';
import {Platform, processColor} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {ColorPicker} from '.';

/**
 * The picker sheet is hosted in the bottom sheet's own window
 * (`pointerEvents="none"` on its host), which keeps the testing library from
 * firing events into it, so the sheet is stubbed here and its props driven
 * directly; sheet.native.test.tsx covers the sheet itself.
 */
let sheetProps: ColorPickerSheetProps | undefined;
vi.mock('./sheet', () => ({
  ColorPickerSheet: (props: ColorPickerSheetProps) => {
    sheetProps = props;
    return null;
  },
}));

/**
 * The bottom sheet's `hide()` is a native command; give the mocked view one
 * whose promise a test settles with `finishHide()`, so dismissal unmounts it.
 */
let finishHide: (() => void) | undefined;
vi.mock('@expo/ui/jetpack-compose', async importOriginal => {
  const compose = await importOriginal<typeof import('@expo/ui/jetpack-compose')>();
  const {forwardRef, useImperativeHandle} = await import('react');
  const ModalBottomSheet = forwardRef<{hide: () => Promise<void>}, Parameters<typeof compose.ModalBottomSheet>[0]>(
    function ModalBottomSheetStub(props, ref) {
      useImperativeHandle(ref, () => ({
        hide: () => new Promise<void>(resolve => {
          finishHide = resolve;
        }),
      }));
      return <compose.ModalBottomSheet {...props}/>;
    },
  );
  return {...compose, ModalBottomSheet};
});

const isIOS = Platform.OS === 'ios';

const palette: Partial<MaterialColors> = {onSurface: '#1B1B1FFF', onSurfaceVariant: '#45464FFF'};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};
const sheets = () => nodes().filter(n => n.type.endsWith('ModalBottomSheetView'));

/** Fires the Compose `clickable` modifier of the row. */
const tapRow = async (testID: string) => {
  const {props} = byComposeTestID(testID);
  await act(async () => {
    modifier(props, 'clickable')?.eventListener();
  });
};

beforeEach(() => {
  sheetProps = undefined;
});

describe(`ColorPicker (${Platform.OS})`, () => {
  if (isIOS) {
    it('renders the SwiftUI color picker with the label and processed selection', async () => {
      await render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
      const {props} = screen.getByTestId('cp');
      expect(props.label).toBe('Accent');
      expect(props.selection).toBe(processColor('#FF6347'));
      expect(props.supportsOpacity).toBe(true);
      expect(props.modifiers).toEqual([]);
    });

    it('reports the native selection and applies supportsOpacity and disabled', async () => {
      const onValueChange = vi.fn();
      await render(
        <ColorPicker value="#FF634780" onValueChange={onValueChange} supportsOpacity={false} disabled testID="cp"/>,
        options,
      );
      const {props} = screen.getByTestId('cp');
      expect(props.label).toBeUndefined();
      expect(props.supportsOpacity).toBe(false);
      expect(props.modifiers).toEqual([{$type: 'disabled', disabled: true}]);
      await fireEvent(screen.getByTestId('cp'), 'selectionChange', {nativeEvent: {value: '#00FF00'}});
      expect(onValueChange).toHaveBeenCalledWith('#00FF00');
    });
    return;
  }

  it('renders the label and the hosted color well in a clickable row', async () => {
    await render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    const row = byComposeTestID('cp');
    expect(row.props.horizontalArrangement).toBe('spaceBetween');
    expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
    expect(modifier(row.props, 'clickable')).toBeDefined();
    expect(host(p => p.text === 'Accent').props.color).toBe(palette.onSurface);
    const rnHost = host(p => p.matchContents === true);
    expect(rnHost.props.modifiers).toEqual([]);
    const well = screen.getByLabelText('Selected color #FF6347FF');
    expect(well.props.pointerEvents).toBe('box-none');
    const ring = host(p => p.contentFit === 'fill');
    expect(JSON.stringify(ring.props.source)).toContain('data:image/svg+xml;base64,');
    expect(host(p => Array.isArray(p.style) && p.style[1]?.backgroundColor === 'rgba(255, 99, 71, 1)')).toBeTruthy();
    expect(sheets()).toHaveLength(0);
    expect(sheetProps).toBeUndefined();
  });

  it('dims the well and drops the click handler when disabled', async () => {
    await render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} disabled testID="cp"/>, options);
    expect(modifier(byComposeTestID('cp').props, 'clickable')).toBeUndefined();
    expect(host(p => p.text === 'Accent').props.color).toBe(palette.onSurfaceVariant);
    expect(host(p => p.matchContents === true).props.modifiers).toEqual([{$type: 'alpha', alpha: 0.4}]);
  });

  it('fills the leading slot with a spacer without a label', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()}/>, options);
    expect(nodes().filter(n => n.type.endsWith('TextView'))).toHaveLength(0);
    expect(nodes().filter(n => n.type.endsWith('SpacerView'))).toHaveLength(1);
    expect(nodes()[0].props.modifiers.map((m: {$type: string}) => m.$type)).toEqual(['fillMaxWidth', 'clickable']);
  });

  it('opens the picker sheet from the row, reports its colors and closes it', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker label="Accent" value="#FF634780" onValueChange={onValueChange} testID="cp"/>, options);
    await tapRow('cp');
    expect(sheets()).toHaveLength(1);
    expect(sheetProps).toEqual(expect.objectContaining({
      title: 'Accent',
      value: '#FF634780',
      supportsOpacity: true,
      testID: 'cp-sheet',
    }));
    // The sheet is as wide as the window minus the bottom sheet's insets.
    expect(sheetProps?.width).toBeGreaterThan(0);
    await act(async () => sheetProps?.onValueChange('#FFFFFF80'));
    expect(onValueChange).toHaveBeenLastCalledWith('#FFFFFF80');
    expect(screen.getByLabelText('Selected color #FFFFFF80')).toBeTruthy();
    expect(sheetProps?.value).toBe('#FFFFFF80');
    await act(async () => sheetProps?.onClose());
    expect(sheets()).toHaveLength(1);
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(0);
  });

  it('closes when the bottom sheet asks to dismiss', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    await tapRow('cp');
    await act(async () => sheets()[0].props.onDismissRequest());
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(0);
  });

  it('keeps the sheet mounted when it is reopened before the hide animation ends', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    await tapRow('cp');
    // Reopened while hide() is still animating: its completion must not unmount the sheet.
    await act(async () => sheetProps?.onClose());
    await tapRow('cp');
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(1);
  });

  it('titles the sheet "Colors" without a label and passes supportsOpacity through', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} supportsOpacity={false} testID="cp"/>, options);
    await tapRow('cp');
    expect(sheetProps).toEqual(expect.objectContaining({title: 'Colors', supportsOpacity: false, testID: 'cp-sheet'}));
  });
});
