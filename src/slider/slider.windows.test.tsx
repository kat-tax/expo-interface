import {render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import {Slider} from '.';

const SLIDER = 'ExpoInterfaceSlider';

describe('Slider (windows)', () => {
  it('renders the Slider island after the label, filling the row', async () => {
    await render(<Slider label="Volume" value={0.5} onValueChange={vi.fn()} testID="volume"/>);
    const slider = island(SLIDER);
    expect(screen.getByTestId('volume').queryAll(node => node === slider)).toHaveLength(1);
    expect(screen.getByText('Volume')).toBeOnTheScreen();
    expect(slider.props).toMatchObject({value: 0.5, min: 0, max: 1, step: 0, label: 'Volume', style: {flex: 1}});
  });

  it('passes the range, step, disabled state and colors', async () => {
    await render(<Slider value={5} min={1} max={10} step={0.5} disabled accentColor="#FF9500" onValueChange={vi.fn()}/>);
    const slider = island(SLIDER);
    expect(slider.props).toMatchObject({min: 1, max: 10, step: 0.5, disabled: true, color: '#FF9500'});
    expect(slider.props.label).toBeUndefined();
    expect(screen.queryByText('Volume')).toBeNull();
  });

  it('reports the value while dragging and once when released', async () => {
    const onValueChange = vi.fn();
    const onSlidingComplete = vi.fn();
    await render(<Slider value={0} onValueChange={onValueChange} onSlidingComplete={onSlidingComplete}/>);
    await fireIsland(island(SLIDER), 'valueChange', {value: 0.25});
    await fireIsland(island(SLIDER), 'slidingComplete', {value: 0.3});
    expect(onValueChange).toHaveBeenCalledWith(0.25);
    expect(onSlidingComplete).toHaveBeenCalledWith(0.3);
  });

  it('wires no completion handler when none is given', async () => {
    await render(<Slider value={0} onValueChange={vi.fn()}/>);
    expect(island(SLIDER).props.onSlidingComplete).toBeUndefined();
  });

  it('dims the label while disabled', async () => {
    await render(<Slider label="Volume" value={0} onValueChange={vi.fn()} disabled/>);
    expect(screen.getByText('Volume')).toHaveStyle({opacity: 0.4});
  });
});
