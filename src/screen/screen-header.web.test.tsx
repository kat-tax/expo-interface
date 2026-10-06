import {useContext} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Button} from '../button';
import {DrawnSearchContext} from '../header-search/shared';
import {bound, inset, theme} from '../theme';
import {TabBarContext} from '../tabs/context';
import {ScreenHeader} from './header';

/** A stand-in for the search element: says which placement the header resolved, and opens as an action does. */
function SearchStandIn() {
  const site = useContext(DrawnSearchContext)!;
  return <button onClick={() => site.setOpen(true)}>{`search:${site.placement}`}</button>;
}

function mount(ui: React.ReactElement) {
  return render(<SafeAreaProvider>{ui}</SafeAreaProvider>);
}

describe('ScreenHeader (web)', () => {
  it('renders the title inside a constrained row', () => {
    mount(<ScreenHeader title="Settings"/>);
    const title = screen.getByText('Settings');
    expect(getComputedStyle(title.parentElement!).maxWidth).toBe(`${bound.contentMaxWidth}px`);
  });

  it('shows the back button only with onBack', () => {
    mount(<ScreenHeader title="Settings"/>);
    expect(screen.queryByLabelText('Go back')).toBeNull();

    const onBack = vi.fn();
    mount(<ScreenHeader title="Settings" onBack={onBack}/>);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders the trailing slot', () => {
    mount(<ScreenHeader title="Settings" trailing={<Button label="Done"/>}/>);
    expect(screen.getByRole('button', {name: 'Done'})).toBeInTheDocument();
  });

  it('paints the background by default, and hands the bar to the stylesheet for a material', () => {
    mount(<ScreenHeader title="Settings"/>);
    const bar = () => screen.getByText('Settings').parentElement!.parentElement!;
    expect(getComputedStyle(bar()).backgroundColor).toBe(theme.background);
    expect(bar()).not.toHaveAttribute('data-material');

    // The screen's background thinned over a blur, with a hairline along the
    // bottom: drawn by `material.css` from these attributes, so the bar's own
    // fill stays off.
    const {unmount} = mount(<ScreenHeader title="Glass" material="thin"/>);
    const glass = screen.getByText('Glass').parentElement!.parentElement!;
    expect(glass).toHaveAttribute('data-material', 'thin');
    expect(glass).toHaveAttribute('data-material-fill', 'background');
    expect(glass).toHaveAttribute('data-material-edge', 'bottom');
    expect(getComputedStyle(glass).backgroundColor).not.toBe(theme.background);
    unmount();

    // `none` is the default said out loud.
    mount(<ScreenHeader title="Plain" material="none"/>);
    expect(screen.getByText('Plain').parentElement!.parentElement!).not.toHaveAttribute('data-material');
  });

  it('draws the search where its placement says: under the row, in the row, or in the row with the title gone once it opens', () => {
    const {rerender} = mount(<ScreenHeader title="Settings" search={{placement: 'stacked', node: <SearchStandIn/>}}/>);
    const row = () => screen.getByText('Settings').parentElement!;
    let search = screen.getByRole('button', {name: 'search:stacked'});
    expect(row().contains(search)).toBe(false);
    expect(row().parentElement!.contains(search)).toBe(true);

    // A window it cannot measure is drawn wide: automatic is inline.
    rerender(<SafeAreaProvider><ScreenHeader title="Settings" search={{placement: 'automatic', node: <SearchStandIn/>}}/></SafeAreaProvider>);
    search = screen.getByRole('button', {name: 'search:inline'});
    expect(row().contains(search)).toBe(true);

    rerender(<SafeAreaProvider><ScreenHeader title="Settings" search={{placement: 'action', node: <SearchStandIn/>}}/></SafeAreaProvider>);
    search = screen.getByRole('button', {name: 'search:action'});
    expect(row().contains(search)).toBe(true);
    fireEvent.click(search);
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.getByRole('button', {name: 'search:action'})).toBeInTheDocument();
  });

  it('applies no safe-area padding on web, and clears a floating tab bar', () => {
    mount(<ScreenHeader title="Settings"/>);
    const bar = () => screen.getByText('Settings').parentElement!.parentElement!;
    expect(getComputedStyle(bar()).paddingTop).toBe('0px');

    // Under a shown web tab bar the header starts below it.
    render(
      <SafeAreaProvider>
        <TabBarContext.Provider value={true}>
          <ScreenHeader title="Under the bar"/>
        </TabBarContext.Provider>
      </SafeAreaProvider>,
    );
    const under = screen.getByText('Under the bar').parentElement!.parentElement!;
    expect(getComputedStyle(under).paddingTop).toBe(`${inset.topBar}px`);
  });
});
