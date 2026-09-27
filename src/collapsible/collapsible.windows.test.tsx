import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {Collapsible} from '.';

const EXPANDER = 'ExpoInterfaceExpander';
const PORTAL = 'ExpoInterfacePortal';

describe('Collapsible (windows)', () => {
  it('renders the Expander island, closed by default, with a portal naming the same slot', async () => {
    await render(
      <Collapsible label="Advanced" testID="advanced">
        <Text>Options</Text>
      </Collapsible>,
    );
    const expander = island(EXPANDER);
    expect(expander.props.header).toBe('Advanced');
    expect(expander.props.expanded).toBe(false);
    expect(expander.props.testID).toBe('advanced');
    expect(expander.props.theme).toBe('light');
    expect(typeof expander.props.slot).toBe('string');
    expect(island(PORTAL).props.slot).toBe(expander.props.slot);
  });

  it('mounts the content only once the portal reports its island connected', async () => {
    await render(
      <Collapsible label="Advanced" defaultExpanded>
        <Text>Options</Text>
      </Collapsible>,
    );
    expect(screen.queryByText('Options')).toBeNull();
    await fireIsland(island(PORTAL), 'ready', {connected: true});
    expect(screen.getByText('Options')).toBeOnTheScreen();
    expect(screen.getByText('Options').parent?.props.importantForAccessibility).toBe('auto');
  });

  it('keeps hidden content mounted but out of the accessibility tree', async () => {
    await render(
      <Collapsible label="Advanced" defaultExpanded>
        <Text>Options</Text>
      </Collapsible>,
    );
    await fireIsland(island(PORTAL), 'ready', {connected: true});
    await fireIsland(island(PORTAL), 'visibleChange', {visible: false});
    // Hidden from the accessibility tree, which is what the default query honors; still mounted.
    expect(screen.queryByText('Options')).toBeNull();
    const wrapper = screen.getByText('Options', {includeHiddenElements: true}).parent;
    expect(wrapper?.props.accessibilityElementsHidden).toBe(true);
    expect(wrapper?.props.importantForAccessibility).toBe('no-hide-descendants');
    await fireIsland(island(PORTAL), 'visibleChange', {visible: true});
    expect(screen.getByText('Options').parent?.props.accessibilityElementsHidden).toBe(false);
  });

  it('reports a toggle from the control and follows it when uncontrolled', async () => {
    const onExpandedChange = vi.fn();
    await render(
      <Collapsible label="Advanced" onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    await fireIsland(island(EXPANDER), 'toggle', {expanded: true});
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(island(EXPANDER).props.expanded).toBe(true);
  });

  it('follows the expanded prop when controlled', async () => {
    const onExpandedChange = vi.fn();
    const {rerender} = await render(
      <Collapsible label="Advanced" expanded={false} onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    await fireIsland(island(EXPANDER), 'toggle', {expanded: true});
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(island(EXPANDER).props.expanded).toBe(false);
    await rerender(
      <Collapsible label="Advanced" expanded onExpandedChange={onExpandedChange}>
        <Text>Options</Text>
      </Collapsible>,
    );
    expect(island(EXPANDER).props.expanded).toBe(true);
  });
});
