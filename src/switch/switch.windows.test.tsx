import {render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {fireIsland, island} from '../__tests__/windows';
import {Switch} from '.';

const TOGGLE = 'ExpoInterfaceToggleSwitch';

describe('Switch (windows)', () => {
  it('renders a labelled row with the ToggleSwitch island at its trailing edge', async () => {
    await render(<Switch label="Wi-Fi" value onValueChange={vi.fn()} testID="wifi"/>);
    const row = screen.getByTestId('wifi');
    const toggle = island(TOGGLE);
    expect(row.queryAll(node => node === toggle)).toHaveLength(1);
    expect(screen.getByText('Wi-Fi')).toBeOnTheScreen();
    expect(toggle.props.value).toBe(true);
    expect(toggle.props.accessibilityLabel).toBe('Wi-Fi');
    expect(toggle.props.testID).toBeUndefined();
    expect(toggle.props.theme).toBe('light');
  });

  it('reports the toggled value from the island', async () => {
    const onValueChange = vi.fn();
    await render(<Switch label="Wi-Fi" value={false} onValueChange={onValueChange}/>);
    await fireIsland(island(TOGGLE), 'valueChange', {value: true});
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('disables the control and dims the label', async () => {
    await render(<Switch label="Bluetooth" value onValueChange={vi.fn()} disabled/>);
    expect(island(TOGGLE).props.disabled).toBe(true);
    expect(screen.getByText('Bluetooth')).toHaveStyle({opacity: 0.4});
  });

  it('renders the bare switch carrying the testID without a label', async () => {
    await render(<Switch value={false} onValueChange={vi.fn()} testID="bare"/>);
    const toggle = island(TOGGLE);
    expect(toggle.props.testID).toBe('bare');
    expect(toggle.props.value).toBe(false);
    expect(screen.queryByText('Wi-Fi')).toBeNull();
  });

  it('seeds the on fill with the accent, or a custom accentColor', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Switch value onValueChange={vi.fn()} accentColor="#FF9500"/>
      </AccentProvider>,
    );
    const toggle = island(TOGGLE);
    expect(toggle.props.accentColor).toBe('#8959EA');
    expect(toggle.props.color).toBe('#FF9500');
  });
});
