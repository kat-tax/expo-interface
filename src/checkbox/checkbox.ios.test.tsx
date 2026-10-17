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

  it('has no row to shape without a label', async () => {
    await render(<Checkbox value={false} onValueChange={vi.fn()} testID="cb"/>);
    expect(nodes().some(n => modifier(n.props ?? {}, 'contentShape') != null)).toBe(false);
    expect(screen.getByTestId('cb')).toBeTruthy();
  });
});
