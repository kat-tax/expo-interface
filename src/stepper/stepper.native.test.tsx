import type {PropsWithChildren} from 'react';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HostPaletteContext, type MaterialColors} from '@expo/ui/jetpack-compose';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier, nodes, type HostNode} from '../__tests__/native';
import {Stepper} from '.';

const isIOS = Platform.OS === 'ios';

/** Android reads the Material palette from the Host; no native module runs under Jest, so seed one. */
const palette: Partial<MaterialColors> = {
  onSurface: '#1B1B1FFF',
  onSurfaceVariant: '#45464FFF',
};

function Material({children}: PropsWithChildren) {
  if (isIOS) return <>{children}</>;
  return <HostPaletteContext.Provider value={palette as MaterialColors}>{children}</HostPaletteContext.Provider>;
}

const options = {wrapper: Material};

/** The Compose icon button wrapping the icon with the given description (Android only). */
function iconButton(description: 'Decrement' | 'Increment'): HostNode {
  const match = nodes().find(n =>
    n.children?.some(c => typeof c === 'object' && c.props.contentDescription === description),
  );
  if (!match) throw new Error(`No ${description} button rendered`);
  return match;
}

describe(`Stepper (${Platform.OS})`, () => {
  it('renders the label, value and native control', async () => {
    await render(<Stepper label="Quantity" value={3} onValueChange={vi.fn()} testID="st"/>, options);
    if (isIOS) {
      const {props} = screen.getByTestId('st');
      expect(props.value).toBe(3);
      expect(props.step).toBe(1);
      expect(props.min).toBeUndefined();
      expect(props.max).toBeUndefined();
      expect(props.label).toBe('Quantity');
      expect(modifier(props, 'labelsHidden')).toEqual({$type: 'labelsHidden'});
      expect(modifier(props, 'disabled')).toBeUndefined();
      expect(modifier(host(p => p.text === 'Quantity').props, 'foregroundStyle')?.color).toBe('#000000');
      expect(modifier(host(p => p.text === '3').props, 'foregroundStyle')?.color).toBe('#60646C');
      expect(modifier(nodes()[0].props, 'frame')).toEqual({$type: 'frame', maxWidth: 100000});
    } else {
      const row = byComposeTestID('st');
      expect(modifier(row.props, 'fillMaxWidth')).toBeDefined();
      expect(row.props.horizontalArrangement).toBe('spaceBetween');
      expect(host(p => p.text === 'Quantity').props.color).toBe(palette.onSurface);
      expect(host(p => p.text === '3').props.color).toBe(palette.onSurfaceVariant);
      for (const name of ['Decrement', 'Increment'] as const) {
        const button = iconButton(name);
        expect(button.props.enabled).toBe(true);
        expect(modifier(button.props, 'size')).toEqual({$type: 'size', width: 36, height: 36});
        expect(host(p => p.contentDescription === name).props.size).toBe(18);
      }
    }
  });

  it('forwards step, min and max', async () => {
    await render(<Stepper value={16} step={2} min={10} max={32} onValueChange={vi.fn()} testID="st"/>, options);
    if (isIOS) {
      const {props} = screen.getByTestId('st');
      expect(props.step).toBe(2);
      expect(props.min).toBe(10);
      expect(props.max).toBe(32);
    } else {
      expect(iconButton('Decrement').props.enabled).toBe(true);
      expect(iconButton('Increment').props.enabled).toBe(true);
    }
  });

  it('formats the displayed value', async () => {
    await render(<Stepper value={150} formatValue={v => `${v}%`} onValueChange={vi.fn()} testID="st"/>, options);
    expect(host(p => p.text === '150%')).toBeTruthy();
    expect(nodes().some(n => n.props.text === '150')).toBe(false);
  });

  it('tints the buttons with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Stepper value={1} onValueChange={vi.fn()} testID="st"/>
      </AccentProvider>,
      options,
    );
    if (isIOS) {
      // The Host `tint` cascade colors the SwiftUI stepper; no per-instance modifier is emitted.
      expect(modifier(screen.getByTestId('st').props, 'tint')).toBeUndefined();
    } else {
      expect(iconButton('Increment').props.colors).toEqual({
        contentColor: '#8959EA',
        disabledContentColor: palette.onSurfaceVariant,
      });
    }
  });

  it('disables the control', async () => {
    await render(<Stepper label="Guests" value={2} onValueChange={vi.fn()} disabled testID="st"/>, options);
    if (isIOS) {
      expect(modifier(screen.getByTestId('st').props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(host(p => p.text === 'Guests').props, 'foregroundStyle')?.color).toBe('#60646C');
    } else {
      expect(iconButton('Decrement').props.enabled).toBe(false);
      expect(iconButton('Increment').props.enabled).toBe(false);
      expect(iconButton('Decrement').props.onButtonPressed).toBeUndefined();
      expect(host(p => p.text === 'Guests').props.color).toBe(palette.onSurfaceVariant);
    }
  });

  (isIOS ? it.skip : it)('disables only the button at the reached bound', async () => {
    const {rerender} = await render(<Stepper value={1} min={1} max={5} onValueChange={vi.fn()}/>, options);
    expect(iconButton('Decrement').props.enabled).toBe(false);
    expect(iconButton('Increment').props.enabled).toBe(true);
    await rerender(<Stepper value={5} min={1} max={5} onValueChange={vi.fn()}/>);
    expect(iconButton('Decrement').props.enabled).toBe(true);
    expect(iconButton('Increment').props.enabled).toBe(false);
  });

  it('renders without a label', async () => {
    await render(<Stepper value={2} onValueChange={vi.fn()} testID="st"/>, options);
    const texts = nodes().filter(n => typeof n.props.text === 'string');
    expect(texts.map(n => n.props.text)).toEqual(['2']);
    if (isIOS) expect(screen.getByTestId('st').props.label).toBe('');
  });

  it('reports stepped values clamped to the bounds', async () => {
    const onValueChange = vi.fn();
    await render(<Stepper value={9} step={5} min={0} max={10} onValueChange={onValueChange} testID="st"/>, options);
    if (isIOS) {
      await fireEvent(screen.getByTestId('st'), 'valueChange', {nativeEvent: {value: 14}});
      expect(onValueChange).toHaveBeenLastCalledWith(10);
      await fireEvent(screen.getByTestId('st'), 'valueChange', {nativeEvent: {value: 0.30000000000000004}});
      expect(onValueChange).toHaveBeenLastCalledWith(0.3);
    } else {
      await act(async () => {
        iconButton('Increment').props.onButtonPressed();
      });
      expect(onValueChange).toHaveBeenLastCalledWith(10);
      await act(async () => {
        iconButton('Decrement').props.onButtonPressed();
      });
      expect(onValueChange).toHaveBeenLastCalledWith(4);
    }
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });
});
