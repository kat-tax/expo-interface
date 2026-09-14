import {render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import {Stepper} from '.';

const BOX = 'ExpoInterfaceNumberBox';

describe('Stepper (windows)', () => {
  it('renders the NumberBox island after the label with the bounds it has', async () => {
    await render(<Stepper label="Copies" value={2} min={1} max={9} step={2} onValueChange={vi.fn()} testID="copies"/>);
    const box = island(BOX);
    expect(screen.getByTestId('copies').queryAll(node => node === box)).toHaveLength(1);
    expect(box.props).toMatchObject({value: 2, step: 2, hasMin: true, min: 1, hasMax: true, max: 9, label: 'Copies'});
  });

  it('marks absent bounds so the native side leaves them open', async () => {
    await render(<Stepper value={0} onValueChange={vi.fn()} disabled/>);
    const box = island(BOX);
    expect(box.props).toMatchObject({step: 1, hasMin: false, min: 0, hasMax: false, max: 0, disabled: true});
    expect(box.props.label).toBeUndefined();
  });

  it('reports the typed or stepped value, kept inside the bounds', async () => {
    const onValueChange = vi.fn();
    await render(<Stepper label="Copies" value={2} min={1} max={9} onValueChange={onValueChange}/>);
    await fireIsland(island(BOX), 'valueChange', {value: 4});
    await fireIsland(island(BOX), 'valueChange', {value: 42});
    expect(onValueChange).toHaveBeenNthCalledWith(1, 4);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 9);
  });

  it('dims the label while disabled', async () => {
    await render(<Stepper label="Copies" value={0} onValueChange={vi.fn()} disabled/>);
    expect(screen.getByText('Copies')).toHaveStyle({opacity: 0.4});
  });
});
