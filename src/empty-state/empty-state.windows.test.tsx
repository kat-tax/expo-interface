import {fireEvent, render, screen} from '@testing-library/react-native';
import {host} from 'expo-vitest/native';
import {glyphChar, windowsGlyph} from '../symbol/segoe';
import * as icons from '../__stories__/icons';
import {EmptyState} from '.';

describe('EmptyState (windows)', () => {
  it('draws the column with a Segoe glyph, because WinUI has no control for this', async () => {
    await render(
      <EmptyState title="No drops yet" description="Nothing shared." icon={icons.add} testID="empty"/>,
    );
    const column = screen.getByTestId('empty');
    // One group, so Narrator reads the state rather than three loose lines.
    expect(column.props.accessibilityLabel).toBe('No drops yet. Nothing shared.');
    expect(screen.getByText('No drops yet')).toBeOnTheScreen();
    expect(screen.getByText('Nothing shared.')).toBeOnTheScreen();
    // The glyph is the Segoe character, not its code point.
    expect(screen.getByText(glyphChar(windowsGlyph(icons.add)!))).toBeOnTheScreen();
  });

  it('needs nothing but a title', async () => {
    await render(<EmptyState title="Nothing here" testID="bare"/>);
    expect(screen.getByTestId('bare').props.accessibilityLabel).toBe('Nothing here');
    expect(screen.queryByText('Nothing shared.')).toBeNull();
  });

  it('draws a data action as the kit\'s button island, and the ring while loading', async () => {
    const onPress = vi.fn();
    await render(<EmptyState title="No drops" action={{label: 'New drop', onPress}} testID="acting"/>);
    const button = host(p => p.label === 'New drop');
    expect(button.type).toBe('ExpoInterfaceButton');
    await fireEvent(screen.getByTestId('acting-action'), 'press');
    expect(onPress).toHaveBeenCalledTimes(1);
    await render(<EmptyState title="Opening" icon={icons.add} loading testID="busy"/>);
    expect(host(p => p.variant === 'circular').type).toBe('ExpoInterfaceProgress');
    expect(screen.queryByText(glyphChar(windowsGlyph(icons.add)!))).toBeNull();
  });
});
