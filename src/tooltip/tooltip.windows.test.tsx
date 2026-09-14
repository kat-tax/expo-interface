import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {Tooltip} from '.';

describe('Tooltip (windows)', () => {
  it('sets the platform tooltip on a view around the content', async () => {
    await render(
      <Tooltip text="Share this document" testID="hint">
        <Text>Share</Text>
      </Tooltip>,
    );
    const view = screen.getByTestId('hint');
    expect(view.props.tooltip).toBe('Share this document');
    expect(screen.getByText('Share')).toBeOnTheScreen();
  });
});
