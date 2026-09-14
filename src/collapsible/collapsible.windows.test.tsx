import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {Collapsible} from '.';

describe('Collapsible (windows)', () => {
  it('draws a pressable header with a chevron, closed by default', async () => {
    await render(
      <Collapsible label="Advanced" testID="advanced">
        <Text>Options</Text>
      </Collapsible>,
    );
    const header = screen.getByRole('button');
    expect(header.props.accessibilityState?.expanded ?? header.props['aria-expanded']).toBe(false);
    expect(screen.getByText('Advanced')).toBeOnTheScreen();
    expect(screen.getByText('')).toBeOnTheScreen();
    expect(screen.queryByText('Options')).toBeNull();
  });

  it('opens and closes on press when uncontrolled, turning the chevron', async () => {
    const onExpandedChange = vi.fn();
    await render(
      <Collapsible label="Advanced" defaultExpanded onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    expect(screen.getByText('Options')).toBeOnTheScreen();
    expect(screen.getByText('')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button'));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Options')).toBeNull();
  });

  it('follows the expanded prop when controlled', async () => {
    const onExpandedChange = vi.fn();
    const {rerender} = await render(
      <Collapsible label="Advanced" expanded={false} onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    await fireEvent.press(screen.getByRole('button'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Options')).toBeNull();
    await rerender(
      <Collapsible label="Advanced" expanded onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    expect(screen.getByText('Options')).toBeOnTheScreen();
  });
});
