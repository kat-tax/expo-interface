import {render, screen} from '@testing-library/react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {Checkbox} from '.';

const BOX = 'ExpoInterfaceCheckBox';

describe('Checkbox (windows)', () => {
  it('renders a labelled row with the CheckBox island named after the label', async () => {
    await render(<Checkbox label="Remember me" value onValueChange={vi.fn()} testID="remember"/>);
    const box = island(BOX);
    expect(screen.getByTestId('remember').queryAll(node => node === box)).toHaveLength(1);
    expect(box.props.value).toBe(true);
    expect(box.props.label).toBe('Remember me');
    expect(box.props.testID).toBeUndefined();
    expect(screen.getByText('Remember me')).not.toHaveStyle({opacity: 0.4});
  });

  it('reports the toggled value', async () => {
    const onValueChange = vi.fn();
    await render(<Checkbox label="Terms" value={false} onValueChange={onValueChange}/>);
    await fireIsland(island(BOX), 'valueChange', {value: true});
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('disables the box and dims the label', async () => {
    await render(<Checkbox label="Terms" value onValueChange={vi.fn()} disabled accentColor="#FF9500"/>);
    expect(island(BOX).props.disabled).toBe(true);
    expect(island(BOX).props.color).toBe('#FF9500');
    expect(screen.getByText('Terms')).toHaveStyle({opacity: 0.4});
  });

  it('renders the bare box carrying the testID without a label', async () => {
    await render(<Checkbox value={false} onValueChange={vi.fn()} testID="bare"/>);
    expect(island(BOX).props.testID).toBe('bare');
    expect(island(BOX).props.label).toBeUndefined();
  });
});
