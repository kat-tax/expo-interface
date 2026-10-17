import {render, screen} from '@testing-library/react-native';
import {host, modifier, nodes} from 'expo-vitest/native';
import {Checkbox} from '.';

/** The labelled row inside the button. */
const row = () => host(p => p.spacing === 8);

describe('Checkbox (ios)', () => {
  it('takes a tap anywhere along the labelled row, the spacer included', async () => {
    await render(<Checkbox label="Show password" value={false} onValueChange={vi.fn()} testID="cb"/>);
    const types = row().props.modifiers.map((m: {$type: string}) => m.$type);
    // The shape after the frame, so it is the row's whole width.
    expect(types).toEqual(['frame', 'contentShape']);
    expect(modifier(row().props, 'contentShape')).toMatchObject({shape: 'rectangle'});
    expect(host(p => p.text === 'Show password', row())).toBeTruthy();
    expect(nodes(row()).some(n => n.type.endsWith('SpacerView'))).toBe(true);
  });

  it('reads as a toggle, on while its value is, the state from the value alone', async () => {
    const onValueChange = vi.fn();
    const {rerender} = await render(<Checkbox label="Remember me" value onValueChange={onValueChange} testID="cb"/>);
    const traits = () => modifier(screen.getByTestId('cb').props, 'accessibilityAddTraits')?.traits;
    expect(traits()).toEqual(['isToggle', 'isSelected']);
    // The glyph is hidden, so the symbol inside the button says nothing of its own.
    const glyph = () => host(p => typeof p.systemName === 'string');
    expect(modifier(glyph().props, 'accessibilityHidden')).toEqual({$type: 'accessibilityHidden', hidden: true});
    await rerender(<Checkbox label="Remember me" value={false} onValueChange={onValueChange} testID="cb"/>);
    expect(traits()).toEqual(['isToggle']);
    expect(modifier(glyph().props, 'accessibilityHidden')?.hidden).toBe(true);
  });

  it('is a toggle without a label and while disabled', async () => {
    await render(
      <>
        <Checkbox value onValueChange={vi.fn()} testID="bare"/>
        <Checkbox label="Updates" value={false} onValueChange={vi.fn()} disabled testID="off"/>
      </>,
    );
    expect(modifier(screen.getByTestId('bare').props, 'accessibilityAddTraits')?.traits).toEqual(['isToggle', 'isSelected']);
    const off = screen.getByTestId('off').props;
    expect(modifier(off, 'accessibilityAddTraits')?.traits).toEqual(['isToggle']);
    expect(modifier(off, 'disabled')?.disabled).toBe(true);
  });

  it('has no row to shape without a label', async () => {
    await render(<Checkbox value={false} onValueChange={vi.fn()} testID="cb"/>);
    expect(nodes().some(n => modifier(n.props ?? {}, 'contentShape') != null)).toBe(false);
    expect(screen.getByTestId('cb')).toBeTruthy();
  });
});
