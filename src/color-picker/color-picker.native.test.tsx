import type {PropsWithChildren} from 'react';
import type {ColorPickerSheetProps} from './sheet';
import type {HostNode} from '../__tests__/native';
import {Platform, processColor} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {ColorPicker} from '.';

/**
 * The picker sheet is hosted in the bottom sheet's own window, which keeps
 * the testing library from firing events into it, so the sheet is stubbed
 * here and its props driven directly; sheet.native.test.tsx covers the sheet
 * itself.
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
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
/** The color painted in the well: the inner circle's background. */
const wellColor = (testID: string) => modifier(children(byComposeTestID(`${testID}-well`))[0].props, 'background')?.color;

/** Fires the Compose `clickable` modifier of a node. */
const tap = async (node: HostNode) => {
  await act(async () => {
    modifier(node.props, 'clickable')?.eventListener();
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

    it('composes the row by hand with preset swatches before the well', async () => {
      const onValueChange = vi.fn();
      await render(
        <ColorPicker label="Accent" value="#FF634780" swatches={['#FF6347', '#00FF00']} onValueChange={onValueChange} testID="cp"/>,
        options,
      );
      const row = screen.getByTestId('cp');
      expect(row.props.spacing).toBe(8);
      expect(host(p => p.text === 'Accent')).toBeTruthy();
      const swatches = nodes().filter(n => modifier(n.props, 'accessibilityLabel')?.label?.startsWith('Color #'));
      expect(swatches.map(s => modifier(s.props, 'accessibilityLabel')?.label)).toEqual(['Color #FF6347', 'Color #00FF00']);
      // The selected preset is ringed in the label color, the other is bare.
      const rings = swatches.map(s => modifier(children(s)[0].props, 'background'));
      expect(rings[0]).toMatchObject({color: colors.light.label, shape: 'circle'});
      expect(rings[1]).toMatchObject({color: '#00000000', shape: 'circle'});
      expect(modifier(children(children(swatches[0])[0])[0].props, 'frame')).toMatchObject({width: 22, height: 22});
      expect(modifier(children(children(swatches[1])[0])[0].props, 'frame')).toMatchObject({width: 28, height: 28});
      // The picker keeps its well, its own label hidden.
      const well = screen.getByTestId('cp-well');
      expect(well.props.label).toBe('Accent');
      expect(modifier(well.props, 'labelsHidden')).toBeDefined();
      // Picking a preset keeps the current alpha.
      const [, green] = screen.container.queryAll(i => modifier(i.props, 'accessibilityLabel')?.label === 'Color #00FF00');
      await fireEvent.press(green ?? screen.container.queryAll(i => modifier(i.props, 'accessibilityLabel')?.label === 'Color #00FF00')[0]);
      expect(onValueChange).toHaveBeenLastCalledWith('#00FF0080');
    });

    it('moves the swatches to lines of their own when they no longer fit beside the label', async () => {
      const swatches = Array.from({length: 24}, (_, i) => `#${i.toString(16).padStart(2, '0').repeat(3)}`);
      await render(
        <ColorPicker label="Accent" value="#000000" swatches={swatches} onValueChange={vi.fn()} testID="cp"/>,
        options,
      );
      // A column: the label with the well over lines of swatches.
      const column = screen.getByTestId('cp');
      expect(column.type).toContain('VStack');
      expect(nodes().filter(n => modifier(n.props, 'accessibilityLabel')?.label?.startsWith('Color #'))).toHaveLength(24);
      expect(screen.getByTestId('cp-well')).toBeTruthy();
      expect(nodes().filter(n => n.type.includes('HStack')).length).toBeGreaterThan(2);
    });

    it('drops the alpha of a preset when opacity is unsupported and can go without a label', async () => {
      const onValueChange = vi.fn();
      await render(
        <ColorPicker value="#FF6347" swatches={['#00FF00']} supportsOpacity={false} disabled onValueChange={onValueChange} testID="cp"/>,
        options,
      );
      expect(nodes().some(n => n.props.text === 'Accent')).toBe(false);
      expect(modifier(screen.getByTestId('cp').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      const [green] = screen.container.queryAll(i => modifier(i.props, 'accessibilityLabel')?.label === 'Color #00FF00');
      await fireEvent.press(green);
      expect(onValueChange).toHaveBeenLastCalledWith('#00FF00');
      expect(screen.queryByTestId('cp-well')).toBeTruthy();
    });

    it('treats an empty preset list as none, and needs no testID with presets', async () => {
      const {rerender} = await render(<ColorPicker value="#FF6347" swatches={[]} onValueChange={vi.fn()} testID="cp"/>, options);
      expect(screen.getByTestId('cp').props.selection).toBe(processColor('#FF6347'));
      expect(screen.queryByTestId('cp-well')).toBeNull();
      await rerender(<ColorPicker value="#FF6347" swatches={['#00FF00']} onValueChange={vi.fn()}/>);
      expect(nodes().some(n => n.props.testID != null)).toBe(false);
      expect(host(p => !!modifier(p, 'labelsHidden'))).toBeTruthy();
    });
    return;
  }

  it('renders the label and a Compose color well in a clickable row', async () => {
    await render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    const row = byComposeTestID('cp');
    expect(row.props.horizontalArrangement).toBe('spaceBetween');
    expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
    expect(modifier(row.props, 'clickable')).toBeDefined();
    expect(host(p => p.text === 'Accent').props.color).toBe(palette.onSurface);
    // The well: a 28dp circle ringed in `separator` around the color; no React Native view is hosted in the row.
    const well = byComposeTestID('cp-well');
    expect(modifier(well.props, 'size')).toEqual({$type: 'size', width: 28, height: 28});
    expect(modifier(well.props, 'clip')).toMatchObject({shape: expect.anything()});
    expect(modifier(well.props, 'background')?.color).toBe(colors.light.separator);
    expect(modifier(children(well)[0].props, 'size')).toEqual({$type: 'size', width: 22, height: 22});
    expect(wellColor('cp')).toBe('rgba(255, 99, 71, 1)');
    expect(nodes().some(n => n.type.endsWith('RNHostView'))).toBe(false);
    expect(sheets()).toHaveLength(0);
    expect(sheetProps).toBeUndefined();
  });

  it('dims the trailing content and drops the click handler when disabled', async () => {
    await render(<ColorPicker label="Accent" value="#FF6347" onValueChange={vi.fn()} disabled testID="cp"/>, options);
    expect(modifier(byComposeTestID('cp').props, 'clickable')).toBeUndefined();
    expect(host(p => p.text === 'Accent').props.color).toBe(palette.onSurfaceVariant);
    expect(host(p => modifier(p, 'alpha')?.alpha === 0.4)).toBeTruthy();
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
    await tap(byComposeTestID('cp'));
    expect(sheets()).toHaveLength(1);
    // The sheet is a Compose child of the row, hosting the React Native picker in its own window.
    expect(nodes().filter(n => n.type.endsWith('RNHostView'))).toHaveLength(1);
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
    expect(wellColor('cp')).toBe('rgba(255, 255, 255, 0.502)');
    expect(sheetProps?.value).toBe('#FFFFFF80');
    await act(async () => sheetProps?.onClose());
    expect(sheets()).toHaveLength(1);
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(0);
  });

  it('closes when the bottom sheet asks to dismiss', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    await tap(byComposeTestID('cp'));
    await act(async () => sheets()[0].props.onDismissRequest());
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(0);
  });

  it('keeps the sheet mounted when it is reopened before the hide animation ends', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} testID="cp"/>, options);
    await tap(byComposeTestID('cp'));
    // Reopened while hide() is still animating: its completion must not unmount the sheet.
    await act(async () => sheetProps?.onClose());
    await tap(byComposeTestID('cp'));
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(1);
  });

  it('titles the sheet "Colors" without a label and passes supportsOpacity through', async () => {
    await render(<ColorPicker value="#FF6347" onValueChange={vi.fn()} supportsOpacity={false} testID="cp"/>, options);
    await tap(byComposeTestID('cp'));
    expect(sheetProps).toEqual(expect.objectContaining({title: 'Colors', supportsOpacity: false, testID: 'cp-sheet'}));
  });

  it('draws preset swatches before the well and picks one on tap', async () => {
    const onValueChange = vi.fn();
    await render(
      <ColorPicker label="Accent" value="#FF634780" swatches={['#FF6347', '#00FF00']} onValueChange={onValueChange} testID="cp"/>,
      options,
    );
    const red = byComposeTestID('cp-swatch-#FF6347');
    const green = byComposeTestID('cp-swatch-#00FF00');
    // The selected preset is ringed in the label color and shrinks inside it.
    expect(modifier(red.props, 'background')?.color).toBe(colors.light.label);
    expect(modifier(children(red)[0].props, 'size')).toEqual({$type: 'size', width: 22, height: 22});
    expect(modifier(green.props, 'background')?.color).toBe('#00000000');
    expect(modifier(children(green)[0].props, 'size')).toEqual({$type: 'size', width: 28, height: 28});
    expect(modifier(children(green)[0].props, 'background')?.color).toBe('#00FF00');
    // Picking keeps the current alpha and moves the ring.
    await tap(green);
    expect(onValueChange).toHaveBeenLastCalledWith('#00FF0080');
    expect(modifier(byComposeTestID('cp-swatch-#00FF00').props, 'background')?.color).toBe(colors.light.label);
    expect(wellColor('cp')).toBe('rgba(0, 255, 0, 0.502)');
  });

  it('disables the preset swatches with the row', async () => {
    await render(
      <ColorPicker value="#FF6347" swatches={['#00FF00']} disabled onValueChange={vi.fn()} testID="cp"/>,
      options,
    );
    expect(modifier(byComposeTestID('cp-swatch-#00FF00').props, 'clickable')).toBeUndefined();
  });

  it('carries no test identifiers without a testID', async () => {
    await render(<ColorPicker value="#FF6347" swatches={['#00FF00']} onValueChange={vi.fn()}/>, options);
    expect(nodes().some(n => modifier(n.props, 'testID'))).toBe(false);
  });
});
