import {createRef} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Share, Text, View} from 'react-native';
import {fireIsland, island} from '../../__tests__/windows';
import {Checkbox as CommunityCheckbox, PagerView, Picker as CommunityPicker} from './community-controls';
import {MenuView, menuItemsOf} from './community-sheet-menu';
import * as universal from './expo-ui';
import * as compose from './expo-ui-jetpack-compose';
import * as swift from './expo-ui-swift-ui';
import {italic, offset, pickerStyle, toggleStyle} from './expo-ui-swift-ui-modifiers';
import {styleOf} from './ui-kit';

const BUTTON = 'ExpoInterfaceButton';
const SLIDER = 'ExpoInterfaceSlider';
const COMBO = 'ExpoInterfaceComboBox';
const BAR = 'ExpoInterfaceSelectorBar';
const COLOR = 'ExpoInterfaceColorPicker';
const BOX = 'ExpoInterfaceTextBox';
const DIALOG = 'ExpoInterfaceContentDialog';
const MENU = 'ExpoInterfaceMenuFlyout';

/** A slot component hands its children back, or is nothing on its own. */
function passesThrough(component: (props: {children?: React.ReactNode}) => React.ReactNode) {
  expect(component({children: 'inside'})).toBe('inside');
}

describe('@expo/ui slots (windows)', () => {
  it('has the universal slots hand their children back, and the items stay silent', () => {
    for (const slot of [universal.ListItem.Leading, universal.ListItem.Trailing, universal.ListItem.Supporting]) passesThrough(slot);
    expect(universal.Picker.Item({label: 'x'})).toBeNull();
    expect(universal.FieldGroup.SectionHeader({children: 'h'})).toBeNull();
    expect(universal.FieldGroup.SectionFooter({children: 'f'})).toBeNull();
    expect(CommunityPicker.Item({label: 'x'})).toBeNull();
  });

  it('has the SwiftUI slots hand their children back', async () => {
    for (const slot of [swift.Items, swift.Trigger, swift.Preview, swift.Actions, swift.Alert.Message, swift.DisclosureGroup.Label, swift.Mask.Content, swift.TextField.Placeholder, swift.TabView.Tab as never]) passesThrough(slot as never);
    await render(
      <swift.Grid.Row>
        <Text>row</Text>
      </swift.Grid.Row>,
    );
    expect(screen.getByText('row')).toBeOnTheScreen();
  });

  it('has the Compose slots hand their children back, and the silent items stay silent', () => {
    const slots = [
      compose.FloatingActionButton.Icon,
      compose.ExtendedFloatingActionButton.Text,
      compose.Switch.ThumbContent,
      compose.SwitchThumbContent,
      compose.Slider.Thumb,
      compose.Slider.Track,
      compose.SegmentedButton.Label,
      compose.Items,
      compose.Trigger,
      compose.Preview,
      compose.AlertDialog.Title,
      compose.AlertDialog.Text,
      compose.AlertDialog.ConfirmButton,
      compose.AlertDialog.DismissButton,
      compose.AlertDialog.Icon,
      compose.BadgedBox.Badge,
      compose.AssistChip.Label,
      compose.AssistChip.LeadingIcon,
      compose.ListItem.HeadlineContent,
      compose.ListItem.OverlineContent,
      compose.ListItem.SupportingContent,
      compose.ListItem.LeadingContent,
      compose.ListItem.TrailingContent,
      compose.TooltipBox.PlainTooltip,
      compose.TooltipBox.RichTooltip,
      compose.TooltipBox.RichTooltip.Title,
      compose.TooltipBox.RichTooltip.Text,
      compose.TooltipBox.RichTooltip.Action,
      compose.SearchBar.Placeholder,
      compose.SearchBar.ExpandedFullScreenSearchBar,
      compose.DockedSearchBar.LeadingIcon,
      compose.NavigationBarItem.Icon,
      compose.NavigationBarItem.Label,
    ];
    for (const slot of slots) passesThrough(slot as never);
    expect(compose.ModalBottomSheet.DragHandle()).toBeNull();
    expect(compose.DropdownMenuItem({text: 'x'})).toBeNull();
    expect(compose.SegmentedButton({})).toBeNull();
    expect(compose.NavigationBarItem({})).toBeNull();
    expect(compose.Snackbar({})).toBeNull();
  });
});

describe('@expo/ui defaults (windows)', () => {
  it('takes the universal controls without their optional props', async () => {
    await render(
      <>
        <universal.Button label="Odd" variant={'mystery' as never} testID="odd"/>
        <universal.Picker testID="bare">
          <universal.Picker.Item/>
          <Text>not an option</Text>
        </universal.Picker>
        <universal.FieldGroup>
          <universal.FieldGroup.Section>
            <Text>untitled</Text>
          </universal.FieldGroup.Section>
        </universal.FieldGroup>
      </>,
    );
    expect(island(BUTTON).props.variant).toBe('filled');
    expect(JSON.parse(island(COMBO).props.options)).toEqual(['']);
    expect(screen.getByText('untitled')).toBeOnTheScreen();
    expect(styleOf([offset({y: 2})])).toEqual({transform: [{translateX: 0}, {translateY: 2}]});
  });

  it('takes the SwiftUI views without their optional props', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    await render(
      <>
        <swift.Text modifiers={[italic()]} testID="italic">
          i
        </swift.Text>
        <swift.Text testID="empty"/>
        <swift.ZStack alignment="leading" testID="z">
          <Text>only</Text>
        </swift.ZStack>
        <swift.Section>
          <Text>plain section</Text>
        </swift.Section>
        <swift.Section isExpanded>
          <Text>expanded section</Text>
        </swift.Section>
        <swift.ControlGroup testID="cg">
          <Text>c</Text>
        </swift.ControlGroup>
        <swift.Overlay testID="overlay">
          <Text>base</Text>
        </swift.Overlay>
        <swift.Toggle isOn modifiers={[toggleStyle('button')]} testID="on"/>
        <swift.Slider testID="slider"/>
        <swift.Picker testID="picker">
          <swift.Text>one</swift.Text>
        </swift.Picker>
        <swift.Picker modifiers={[pickerStyle('segmented')]} testID="segments">
          <swift.Text>one</swift.Text>
        </swift.Picker>
        <swift.Gauge value={1} testID="gauge"/>
        <swift.ColorPicker selection={null} testID="color"/>
        <swift.ContextMenu>
          <swift.ContextMenu.Items>
            <swift.Section title="Empty"/>
            <swift.Toggle>
              <swift.Text>Untitled toggle</swift.Text>
            </swift.Toggle>
            <swift.Picker>
              <swift.Text>untagged</swift.Text>
            </swift.Picker>
          </swift.ContextMenu.Items>
          <swift.ContextMenu.Trigger>
            <Text>target</Text>
          </swift.ContextMenu.Trigger>
        </swift.ContextMenu>
        <swift.Alert title="Plain" isPresented testID="plain"/>
        <swift.Alert title="Later" isPresented>
          <swift.Alert.Actions>
            <swift.Button>
              <swift.Text>Later</swift.Text>
            </swift.Button>
          </swift.Alert.Actions>
        </swift.Alert>
        <swift.TabView testID="tabs"/>
        <swift.ShareLink testID="share"/>
      </>,
    );
    expect(screen.getByTestId('italic')).toHaveStyle({fontStyle: 'italic'});
    expect(screen.getByTestId('empty').props.children).toBeNull();
    expect(screen.getByTestId('z')).toHaveStyle({alignItems: 'flex-start'});
    expect(screen.getByText('plain section')).toBeOnTheScreen();
    expect(screen.getByText('expanded section')).toBeOnTheScreen();
    expect(island(BUTTON, 0).props).toMatchObject({variant: 'filled'});
    await fireIsland(island(SLIDER), 'valueChange', {value: 0.5});
    expect(island(COMBO).props.label).toBeUndefined();
    expect(island(BAR).props.label).toBeUndefined();
    await fireIsland(island(COLOR), 'valueChange', {value: '#112233'});
    const items = JSON.parse(island(MENU).props.items) as {label: string}[];
    expect(items.map(item => item.label)).toEqual(['Untitled toggle', 'untagged']);
    expect(JSON.parse(island(DIALOG, 1).props.actions)).toEqual([{label: 'Later', role: 'default'}]);
    expect(screen.getByTestId('tabs')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('share'), 'press');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(share).toHaveBeenLastCalledWith({message: '', title: undefined});
    share.mockRestore();
  });

  it('takes the Compose views without their optional props', async () => {
    const onSearch = vi.fn();
    const pager = createRef<compose.HorizontalPagerHandle>();
    await render(
      <>
        <compose.Row testID="row">
          <Text>r</Text>
        </compose.Row>
        <compose.Row horizontalArrangement={{spacedBy: 2}} testID="spaced"/>
        <compose.Column verticalArrangement="bottom" testID="col"/>
        <compose.Box testID="box">
          <Text>b</Text>
        </compose.Box>
        <compose.Icon source={{uri: 'https://x/i.png'}} testID="icon"/>
        <compose.SingleChoiceSegmentedButtonRow testID="none">
          <compose.SegmentedButton>
            <Text>Off</Text>
          </compose.SegmentedButton>
        </compose.SingleChoiceSegmentedButtonRow>
        <compose.TooltipBox testID="title-only">
          <compose.TooltipBox.RichTooltip>
            <compose.TooltipBox.RichTooltip.Title>
              <Text>Only title</Text>
            </compose.TooltipBox.RichTooltip.Title>
          </compose.TooltipBox.RichTooltip>
          <Text>anchor</Text>
        </compose.TooltipBox>
        <compose.TooltipBox testID="no-tip">
          <Text>bare anchor</Text>
        </compose.TooltipBox>
        <compose.SearchBar onSearch={onSearch} testID="search"/>
        <compose.HorizontalPager ref={pager} testID="pager">
          <Text>only page</Text>
        </compose.HorizontalPager>
      </>,
    );
    expect(screen.getByTestId('row')).toHaveStyle({alignItems: 'center'});
    expect(screen.getByTestId('spaced')).toHaveStyle({gap: 2});
    expect(screen.getByTestId('col')).toHaveStyle({justifyContent: 'flex-end', alignItems: 'flex-start'});
    expect(screen.getByTestId('icon')).toHaveStyle({width: 24, height: 24});
    expect(island(BAR)).toBeDefined();
    expect(screen.getByText('anchor')).toBeOnTheScreen();
    expect(screen.getByText('bare anchor')).toBeOnTheScreen();
    expect(island(BOX).props.placeholder).toBe('Search');
    await fireIsland(island(BOX), 'changeText', {text: 'typing'});
    expect(onSearch).not.toHaveBeenCalled();
    await act(async () => pager.current?.scrollToPage(5));
    expect(screen.queryByText('only page')).toBeNull();
  });

  it('takes the community views without their optional props', async () => {
    const onOpenMenu = vi.fn();
    const onCloseMenu = vi.fn();
    await render(
      <>
        <PagerView testID="pager">
          <View/>
        </PagerView>
        <MenuView actions={[{title: 'Empty', subactions: [{title: 'h', attributes: {hidden: true}}]}]} onOpenMenu={onOpenMenu} onCloseMenu={onCloseMenu} testID="menu">
          <Text>target</Text>
        </MenuView>
        <CommunityCheckbox/>
      </>,
    );
    await fireEvent(screen.getByTestId('pager'), 'momentumScrollEnd', {nativeEvent: {contentOffset: {x: 0, y: 0}}});
    expect(menuItemsOf([{title: 'Empty', subactions: [{title: 'h', attributes: {hidden: true}}]}])).toHaveLength(1);
    await fireEvent(screen.getByTestId('menu'), 'pointerDown', {nativeEvent: {button: 2, offsetX: 4, offsetY: 5}});
    await fireIsland(island(MENU), 'openChange', {open: false});
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(onCloseMenu).toHaveBeenCalledTimes(1);
  });
});
