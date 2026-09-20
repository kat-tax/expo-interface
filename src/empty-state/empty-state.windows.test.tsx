import {render, screen} from '@testing-library/react-native';
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
});
