import {render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {fireIsland, island} from 'expo-vitest/windows';
import {Picker} from '.';

const COMBO = 'ExpoInterfaceComboBox';

// Items are direct children: `Picker` reads them as `Picker.Item` elements.
const options = [
  <Picker.Item key="s" label="Small" value="s"/>,
  <Picker.Item key="m" label="Medium" value="m"/>,
  <Picker.Item key="l" label="Large" value="l"/>,
];

describe('Picker (windows)', () => {
  it('renders the ComboBox island with the option labels and the selected index', async () => {
    await render(<Picker label="Size" selectedValue="m" onValueChange={vi.fn()} testID="size">{options}</Picker>);
    const combo = island(COMBO);
    expect(screen.getByTestId('size').queryAll(node => node === combo)).toHaveLength(1);
    expect(JSON.parse(combo.props.options)).toEqual(['Small', 'Medium', 'Large']);
    expect(combo.props.selectedIndex).toBe(1);
    expect(combo.props.label).toBe('Size');
    expect(combo.props.accentColor).toBe('#007AFF');
  });

  it('seeds itself with the first option when uncontrolled and follows a pick', async () => {
    await render(<Picker>{options}</Picker>);
    expect(island(COMBO).props.selectedIndex).toBe(0);
    await fireIsland(island(COMBO), 'selectionChange', {index: 2});
    expect(island(COMBO).props.selectedIndex).toBe(2);
  });

  it('reports the picked value and ignores an index outside the options', async () => {
    const onValueChange = vi.fn();
    await render(<Picker selectedValue="s" onValueChange={onValueChange}>{options}</Picker>);
    await fireIsland(island(COMBO), 'selectionChange', {index: 2});
    await fireIsland(island(COMBO), 'selectionChange', {index: 7});
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('l');
  });

  it('passes disabled and a custom accent, and dims the label', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Picker label="Size" disabled accentColor="#FF9500">{options}</Picker>
      </AccentProvider>,
    );
    expect(island(COMBO).props.disabled).toBe(true);
    expect(island(COMBO).props.accentColor).toBe('#FF9500');
    expect(screen.getByText('Size')).toHaveStyle({opacity: 0.4});
  });
});
