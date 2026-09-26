import {render, screen} from '@testing-library/react-native';
import {PaneToggleContext} from '../tabs/shell';
import {ScreenHeader} from './header.windows';

/** The header's outer row: two levels above its title text. */
function bar() {
  return screen.getByText('Drops').parent!.parent!;
}

describe('ScreenHeader under a minimal pane (windows)', () => {
  it('starts after the pane\'s toggle row, so that the title is beside the toggle button', async () => {
    await render(
      <PaneToggleContext.Provider value={88}>
        <ScreenHeader title="Drops"/>
      </PaneToggleContext.Provider>,
    );
    expect(bar()).toHaveStyle({paddingStart: 88});
  });

  it('starts at the edge where there is no such row', async () => {
    await render(<ScreenHeader title="Drops"/>);
    expect(bar()).not.toHaveStyle({paddingStart: 0});
  });
});
