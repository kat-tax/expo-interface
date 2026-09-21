import type {PropsWithChildren, ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {SymbolView} from 'expo-symbols';
import {
  Avatar,
  Badge,
  Body,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapsible,
  ColorPicker,
  ConstrainedStackHeader,
  DateTimePicker,
  Divider,
  ExternalLink,
  EmptyState,
  Fab,
  FieldGroup,
  Footnote,
  Gauge,
  HeaderAction,
  HeaderActions,
  HeaderMenu,
  Headline,
  IconToggle,
  KeyboardBar,
  ListItem,
  Pager,
  Picker,
  Popover,
  NativeHost,
  Progress,
  Screen,
  ScreenHeader,
  SearchField,
  SegmentedControl,
  ShareLink,
  Slider,
  Spinner,
  Stack,
  Stepper,
  Surface,
  Switch,
  TabStack,
  TabView,
  Tabs,
  TextField,
  Title,
  Title3,
  Toast,
  Toolbar,
  useColor,
} from 'expo-interface';
import type {IconToken, TabRoute} from 'expo-interface';
import * as icons from '../../../src/__stories__/icons';
import {RouterApp} from '../../../src/__stories__/router';
import type {CardEntry} from './cards';
// The overlay previews below reuse the real overlays' classes without
// rendering the components, so their stylesheets have to be imported here:
// the static build only ships a component's CSS with the chunks that import
// it (the dev server loads every stylesheet reachable from the barrel).
import '../../../src/alert/alert.css';
import '../../../src/menu/menu.css';
import '../../../src/tooltip/tooltip.css';

/**
 * One live preview per export, in the state the Expo screenshots show:
 * controls with a value, a settings group with rows, an alert with its
 * actions. Everything renders the kit's web implementation, so a preview is
 * never stale, but overlays (alert, sheet, menus, tooltip) are the exception:
 * their real implementations open in the top layer (`<dialog>`, `[popover]`,
 * a portal), which cannot be shown inside a card. Those are drawn from the
 * same CSS classes as the real overlay, in place, so they still match.
 */

const noop = () => {};
const JUNE_15 = new Date(2026, 5, 15, 9, 30);

const docs = (id: string) => `?path=/docs/${id}--docs`;

/** Plain glyph for the leading/trailing slots, tinted from the theme. */
function Glyph({icon, size = 20}: {icon: IconToken; size?: number}) {
  const color = useColor('secondaryLabel');
  return <SymbolView name={icon.symbol} size={size} tintColor={color}/>;
}

function Row({children}: PropsWithChildren) {
  return <View style={styles.row}>{children}</View>;
}

/** Phone-like frame for screen-level layouts; restores the kit's real surfaces inside. */
function Device({children}: PropsWithChildren) {
  return <div style={styles.device}>{children}</div>;
}

/** A document card: a preview over its title. */
function CardPreview() {
  return (
    <Card
      label="Holiday photos"
      onPress={noop}
      footer={<Headline color="label">Holiday photos</Headline>}>
      <View style={styles.cardPreview}>
        <Footnote color="tertiaryLabel">Preview</Footnote>
      </View>
    </Card>
  );
}

/** A toolbar over a strip of canvas, with the tools it would carry. */
function ToolbarPreview() {
  return (
    <View style={styles.toolbarStage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        leading={
          <>
            <Button label="Add" prefixIcon={icons.add} hideLabel variant="text" tone="label" size="inline" onPress={noop}/>
            <Divider vertical/>
            <Button label="Share" prefixIcon={icons.share} hideLabel variant="text" tone="label" size="inline" onPress={noop}/>
          </>
        }
        trailing={<Button label="Export" variant="text" size="small" onPress={noop}/>}
      />
    </View>
  );
}

/** The toast pinned in a box of its own, since it floats over a screen. */
function ToastPreview() {
  return (
    <View style={styles.toastStage}>
      <Toast message="3 files added" visible action={{label: 'Undo', onPress: noop}}/>
    </View>
  );
}

// Overlays

function AlertPreview() {
  return (
    <div className="ui-alert" style={styles.inPlace}>
      <div className="ui-alert__body">
        <Headline>Delete drop?</Headline>
        <Body color="secondaryLabel">The files in this drop will be removed for everyone.</Body>
      </div>
      <div className="ui-alert__actions">
        <Button label="Cancel" variant="text" onPress={noop}/>
        <Button label="Delete" variant="text" role="destructive" onPress={noop}/>
      </div>
    </div>
  );
}

function MenuItems({items}: {items: {label: string; icon?: IconToken; destructive?: boolean; separator?: boolean}[]}) {
  return (
    <div className="ui-menu__list" role="presentation" style={styles.inPlace}>
      {items.map((item, index) => (
        <div key={item.label}>
          {item.separator && index > 0 ? <div className="ui-menu__separator"/> : null}
          <button
            type="button"
            tabIndex={-1}
            className={['ui-menu__item', item.destructive && 'ui-menu__item--destructive'].filter(Boolean).join(' ')}>
            {item.icon ? <SymbolView name={item.icon.symbol} size={16} tintColor="currentColor"/> : null}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

function MenuPreview() {
  return (
    <div style={styles.menu}>
      <Button label="Export" prefixIcon={icons.share} onPress={noop}/>
      <MenuItems
        items={[
          {label: 'Export drops', icon: icons.share},
          {label: 'Add to favorites', icon: icons.star},
          {label: 'Clear cache', icon: icons.trash, destructive: true, separator: true},
        ]}
      />
    </div>
  );
}

function ContextMenuPreview() {
  return (
    <div style={styles.contextMenu}>
      <ListItem supporting="128 MB">Holiday photos</ListItem>
      <div style={styles.contextMenuList}>
        <MenuItems
          items={[
            {label: 'Share', icon: icons.share},
            {label: 'Delete', icon: icons.trash, destructive: true, separator: true},
          ]}
        />
      </div>
    </div>
  );
}

function TooltipPreview() {
  return (
    <>
      <div className="ui-tooltip__hint" style={styles.inPlace}>Anyone with the link can view this drop</div>
      <span className="ui-tooltip"><Body>Public</Body></span>
    </>
  );
}

function SheetPreview() {
  return (
    <div style={styles.sheet}>
      <div style={styles.sheetHandle}/>
      <View style={styles.sheetContent}>
        <Title3>Share drop</Title3>
        <Footnote color="secondaryLabel">Anyone with the link can view this drop</Footnote>
        <Row>
          <Button variant="outlined" label="Copy link" onPress={noop}/>
          <Button label="Share" onPress={noop}/>
        </Row>
      </View>
    </div>
  );
}

// Layout

function ScreenPreview() {
  return (
    <Device>
      <ScreenHeader title="Settings" onBack={noop}/>
      <Screen header gutter>
        <View style={styles.article}>
          <Title>Welcome</Title>
          <Body color="secondaryLabel">Safe areas, status bar, background and content width, handled.</Body>
        </View>
      </Screen>
    </Device>
  );
}

function KeyboardBarPreview() {
  return (
    <Device>
      <Screen header gutter>
        <View style={styles.article}>
          <Title>Notes</Title>
          <Body color="secondaryLabel">The bar below rides up on the keyboard; the content is told how much it covers.</Body>
        </View>
      </Screen>
      <KeyboardBar style={styles.keyboardBar}>
        <NativeHost fit><Button label="Attach" prefixIcon={icons.add} hideLabel size="small" variant="text" tone="label" onPress={noop}/></NativeHost>
        <View style={styles.keyboardSpacer}/>
        <NativeHost fit><Button label="Send" prefixIcon={icons.share} size="small" onPress={noop}/></NativeHost>
      </KeyboardBar>
    </Device>
  );
}

function ScreenHeaderPreview() {
  return <ScreenHeader title="Edit profile" onBack={noop} trailing={<Button label="Save" variant="text" onPress={noop}/>}/>;
}

// Controls

function FabPreview() {
  return (
    <Row>
      <Fab label="New" icon={icons.add} size="small" onPress={noop}/>
      <Fab label="New" icon={icons.add} onPress={noop}/>
      <Fab label="New document" icon={icons.add} size="extended" onPress={noop}/>
    </Row>
  );
}

function FieldGroupPreview() {
  return (
    <FieldGroup>
      <FieldGroup.Section title="Connectivity">
        <Switch label="Wi-Fi" value onValueChange={noop}/>
        <Switch label="Bluetooth" value={false} onValueChange={noop}/>
        <ListItem supporting="Home network" onPress={noop}>Network</ListItem>
      </FieldGroup.Section>
    </FieldGroup>
  );
}

function ListItemPreview() {
  return (
    <div style={styles.group}>
      <ListItem leading={<Glyph icon={icons.share}/>} trailing={<Glyph icon={icons.chevron} size={14}/>} onPress={noop}>
        Share
      </ListItem>
      <Divider inset={48}/>
      <ListItem leading={<Glyph icon={icons.info}/>} supporting="Learn more about drops" onPress={noop}>
        About
      </ListItem>
    </div>
  );
}

function TypographyPreview() {
  return (
    <View style={styles.article}>
      <Title>Holiday photos</Title>
      <Body>128 MB in 42 files, shared with 3 people.</Body>
      <Footnote color="secondaryLabel">Expires in 7 days</Footnote>
    </View>
  );
}

function BadgePreview() {
  return (
    <>
      <Row>
        <Body>Inbox</Body>
        <Badge count={3} label="3 unread"/>
      </Row>
      <Row>
        <Body>Updates</Body>
        <Badge dot label="New updates"/>
      </Row>
      <Row>
        <Body>Notifications</Body>
        <Badge count={120} label="120 notifications"/>
      </Row>
    </>
  );
}

function ChipPreview() {
  return (
    <Row>
      <Chip label="Photos" selected onPress={noop}/>
      <Chip label="Videos" selected={false} onPress={noop}/>
      <Chip label="Recent" icon={icons.star} onPress={noop}/>
    </Row>
  );
}

function EmptyStatePreview() {
  return (
    <EmptyState
      title="No drops yet"
      description="Files dropped here show up for everyone with the link."
      icon={icons.add}
      action={<Button label="Add a file" variant="outlined" size="small" onPress={noop}/>}
    />
  );
}

function SearchFieldPreview() {
  return <SearchField value="Holi" onChangeText={noop} placeholder="Search drops" suggestions={['Holiday photos', 'Holiday video']}/>;
}

/** Three pages in a snapping row, with the indicator that says which one is on screen. */
function PagerPreview() {
  return (
    <Pager page={1} onPageChange={noop} label="Holiday photos">
      {['Beach', 'Harbour', 'Old town'].map(title => (
        <Surface key={title} border="all" padding={12} style={styles.page}>
          <Headline color="label">{title}</Headline>
          <Footnote color="secondaryLabel">Swipe for the next one</Footnote>
        </Surface>
      ))}
    </Pager>
  );
}

/** The strip alone: the card is narrower than the breakpoint, so the layout is forced. */
function TabViewPreview() {
  return (
    <TabView
      layout="strip"
      tabs={[
        {id: 'readme', title: 'README.md', icon: icons.info},
        {id: 'notes', title: 'Notes', pinned: true},
      ]}
      selected="readme"
      onSelect={noop}
      onClose={noop}
      onAdd={noop}
      label="Documents">
      <View style={styles.tabPage}>
        <Body color="secondaryLabel">The open document, under the strip.</Body>
      </View>
    </TabView>
  );
}

/** A card pointing at a word on a canvas. */
function PopoverPreview() {
  return (
    <View style={styles.popoverStage}>
      <Body>The quick brown fox jumps over the lazy dog</Body>
      <Popover
        at={{x: 60, y: 0, width: 40, height: 20}}
        title="Spelling"
        message="Did you mean “jumps”?"
        actions={[{label: 'Replace', onPress: noop}, {label: 'Ignore', onPress: noop}]}
        width={220}
      />
    </View>
  );
}

/** The menu at a point over a canvas the kit did not draw. */
function PopupMenuPreview() {
  return (
    <div style={styles.contextMenu}>
      <View style={styles.canvas}>
        <Footnote color="tertiaryLabel">A canvas the kit did not draw</Footnote>
      </View>
      <div style={styles.contextMenuList}>
        <MenuItems
          items={[
            {label: 'Heading', icon: icons.info},
            {label: 'Bullet list'},
            {label: 'Delete block', icon: icons.trash, destructive: true, separator: true},
          ]}
        />
      </div>
    </div>
  );
}

// Navigation

const NAV_ROUTES: TabRoute[] = [
  {href: '/', name: 'index', label: 'Drops', icon: {ios: 'arrow.down.square', android: 'download', web: 'download'}},
  {href: '/starred', name: 'starred', label: 'Starred', icon: {ios: 'star', android: 'star', web: 'star'}, badge: 2},
];

/**
 * A screen of the small app the navigation previews mount. `Screen` is what a
 * route renders, and it takes the room the bar or the header above it needs
 * from the navigator, so the text below is not under them.
 */
function NavScreen({title, body, header}: {title: string; body: string; header?: boolean}) {
  return (
    <Screen gutter header={header}>
      <View style={styles.navScreen}>
        <Headline color="label">{title}</Headline>
        <Footnote color="secondaryLabel">{body}</Footnote>
      </View>
    </Screen>
  );
}

const drops = () => <NavScreen title="Shared until Friday" body="Anyone with the link can open it."/>;
const starred = () => <NavScreen title="Two drops" body="The ones you keep coming back to."/>;
/** The same screen under a stack header, which takes the top inset itself. */
const stacked = () => <NavScreen header title="Shared until Friday" body="Anyone with the link can open it."/>;

/** One screen under the kit's web stack header, with `right` in its trailing slot. */
function headerApp(title: string, right: ReactNode) {
  return {
    _layout: () => (
      <Stack screenOptions={{headerShown: true, header: ConstrainedStackHeader, headerRight: () => right}}>
        <Stack.Screen name="index" options={{title}}/>
      </Stack>
    ),
    index: stacked,
  };
}

function StackPreview() {
  return (
    <Device>
      <RouterApp
        routes={{
          _layout: () => (
            <Stack>
              <Stack.Screen name="index" options={{title: 'Holiday photos'}}/>
            </Stack>
          ),
          index: stacked,
        }}
      />
    </Device>
  );
}

function TabsPreview() {
  return (
    <Device>
      <RouterApp routes={{_layout: () => <Tabs routes={NAV_ROUTES} webLogo="text-only"/>, index: drops, starred}}/>
    </Device>
  );
}

function TabStackPreview() {
  return (
    <Device>
      <RouterApp
        url="/drops"
        routes={{
          _layout: () => <Tabs routes={[{...NAV_ROUTES[0], href: '/drops', name: 'drops'}, NAV_ROUTES[1]]}/>,
          'drops/_layout': () => (
            <TabStack
              title="Drops"
              headerRight={() => <HeaderAction label="New" icon={icons.add} hideLabel onPress={noop}/>}
            />
          ),
          'drops/index': drops,
          starred,
        }}
      />
    </Device>
  );
}

function StackHeaderPreview() {
  return (
    <Device>
      <RouterApp routes={headerApp('Holiday photos', <HeaderAction label="Share" icon={icons.share} hideLabel onPress={noop}/>)}/>
    </Device>
  );
}

function HeaderMenuPreview() {
  return (
    <Device>
      <RouterApp routes={headerApp('Holiday photos', <HeaderMenu label="Export" icon={icons.share} hideLabel items={[{label: 'PDF'}, {label: 'Markdown'}]}/>)}/>
    </Device>
  );
}

function HeaderActionPreview() {
  return (
    <Device>
      <RouterApp routes={headerApp('Holiday photos', <HeaderAction label="Done" onPress={noop}/>)}/>
    </Device>
  );
}

function HeaderActionsPreview() {
  return (
    <Device>
      <RouterApp
        routes={headerApp(
          'Photos',
          <HeaderActions>
            <HeaderAction label="Star" icon={icons.star} hideLabel onPress={noop}/>
            <HeaderAction label="Share" icon={icons.share} hideLabel onPress={noop}/>
            <HeaderMenu label="Export" icon={icons.add} hideLabel items={[{label: 'PDF'}, {label: 'Markdown'}]}/>
          </HeaderActions>,
        )}
      />
    </Device>
  );
}

function ExternalLinkPreview() {
  return (
    <RouterApp
      routes={{
        index: () => (
          <View style={styles.article}>
            <Headline color="label">About</Headline>
            <ExternalLink href="https://docs.expo.dev">
              <Body color="tint">Expo documentation</Body>
            </ExternalLink>
          </View>
        ),
      }}
    />
  );
}

export const layout: CardEntry[] = [
  {name: 'Screen', href: docs('layout-screen'), stage: 'device', preview: <ScreenPreview/>},
  {name: 'ScreenHeader', href: docs('layout-screenheader'), preview: <ScreenHeaderPreview/>},
  {
    name: 'Surface',
    href: docs('layout-surface'),
    preview: (
      <>
        <Surface border="all" padding={12}>
          <Headline color="label">Holiday photos</Headline>
          <Footnote color="secondaryLabel">Edited yesterday</Footnote>
        </Surface>
        <Surface color="background" border="top" radius={0} padding={12}>
          <Footnote color="secondaryLabel">A bar along a canvas</Footnote>
        </Surface>
      </>
    ),
  },
  {
    name: 'Card',
    href: docs('layout-card'),
    preview: <CardPreview/>,
  },
  {name: 'Toolbar', href: docs('layout-toolbar'), preview: <ToolbarPreview/>},
  {name: 'KeyboardBar', href: docs('layout-keyboardbar'), stage: 'device', preview: <KeyboardBarPreview/>},
  {name: 'FieldGroup', href: docs('layout-fieldgroup'), preview: <FieldGroupPreview/>},
  {name: 'ListItem', href: docs('layout-listitem'), preview: <ListItemPreview/>},
  {
    name: 'Collapsible',
    href: docs('layout-collapsible'),
    preview: (
      <Collapsible label="Version 1.0.0" defaultExpanded>
        <Footnote color="secondaryLabel">Built with expo-interface on @expo/ui.</Footnote>
      </Collapsible>
    ),
  },
  {
    name: 'Divider',
    href: docs('layout-divider'),
    preview: (
      <>
        <Body>Wi-Fi</Body>
        <Divider/>
        <Body>Bluetooth</Body>
        <Divider inset={24}/>
        <Body>Airplane mode</Body>
      </>
    ),
  },
  {name: 'EmptyState', href: docs('layout-emptystate'), stage: 'center', preview: <EmptyStatePreview/>},
];

export const navigation: CardEntry[] = [
  {name: 'Stack', href: docs('navigation-stack'), stage: 'device', preview: <StackPreview/>},
  {name: 'Tabs', href: docs('navigation-tabs'), stage: 'device', preview: <TabsPreview/>},
  {name: 'TabStack', href: docs('navigation-tabstack'), stage: 'device', preview: <TabStackPreview/>},
  {name: 'ConstrainedStackHeader', href: docs('navigation-constrainedstackheader'), stage: 'device', preview: <StackHeaderPreview/>},
  {name: 'TabView', href: docs('navigation-tabview'), preview: <TabViewPreview/>},
  {name: 'Pager', href: docs('navigation-pager'), preview: <PagerPreview/>},
  {name: 'HeaderMenu', href: docs('navigation-headermenu'), stage: 'device', preview: <HeaderMenuPreview/>},
  {name: 'HeaderAction', href: docs('navigation-headeraction'), stage: 'device', preview: <HeaderActionPreview/>},
  {name: 'HeaderActions', href: docs('navigation-headeractions'), stage: 'device', preview: <HeaderActionsPreview/>},
  {name: 'ExternalLink', href: docs('navigation-externallink'), stage: 'center', preview: <ExternalLinkPreview/>},
  {name: 'ShareLink', href: docs('navigation-sharelink'), stage: 'center', preview: <ShareLink label="Share drop" icon={icons.share} url="https://drop.example/holiday" title="Holiday photos"/>},
];

export const controls: CardEntry[] = [
  {
    name: 'Button',
    href: docs('controls-button'),
    stage: 'center',
    preview: (
      <>
        <Button label="Save" onPress={noop}/>
        <Button label="Cancel" variant="outlined" onPress={noop}/>
        <Button label="Learn more" variant="text" onPress={noop}/>
      </>
    ),
  },
  {name: 'Fab', href: docs('controls-fab'), stage: 'center', preview: <FabPreview/>},
  {name: 'Chip', href: docs('controls-chip'), stage: 'center', preview: <ChipPreview/>},
  {
    name: 'IconToggle',
    href: docs('controls-icontoggle'),
    stage: 'center',
    preview: (
      <Row>
        <IconToggle label="Favourite" icon={icons.star} value onValueChange={noop}/>
        <IconToggle label="Share" icon={icons.share} value={false} onValueChange={noop}/>
      </Row>
    ),
  },
  {
    name: 'Switch',
    href: docs('controls-switch'),
    preview: (
      <>
        <Switch label="Wi-Fi" value onValueChange={noop}/>
        <Switch label="Bluetooth" value={false} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'Checkbox',
    href: docs('controls-checkbox'),
    preview: (
      <>
        <Checkbox label="Accept terms" value onValueChange={noop}/>
        <Checkbox label="Subscribe to newsletter" value={false} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'TextField',
    href: docs('controls-textfield'),
    preview: (
      <>
        <TextField placeholder="Name" value="Ada Lovelace" onChangeText={noop}/>
        <TextField placeholder="Email" value="" keyboardType="email" onChangeText={noop}/>
      </>
    ),
  },
  {name: 'SearchField', href: docs('controls-searchfield'), preview: <SearchFieldPreview/>},
  {
    name: 'Picker',
    href: docs('controls-picker'),
    preview: (
      <>
        <Picker label="Language" selectedValue="en" onValueChange={noop}>
          <Picker.Item label="English" value="en"/>
          <Picker.Item label="Español" value="es"/>
        </Picker>
        <Picker label="Appearance" selectedValue="system" onValueChange={noop}>
          <Picker.Item label="System" value="system"/>
          <Picker.Item label="Light" value="light"/>
          <Picker.Item label="Dark" value="dark"/>
        </Picker>
      </>
    ),
  },
  {
    name: 'SegmentedControl',
    href: docs('controls-segmentedcontrol'),
    preview: (
      <SegmentedControl label="Range" selectedValue="week" onValueChange={noop}>
        <SegmentedControl.Item label="Day" value="day"/>
        <SegmentedControl.Item label="Week" value="week"/>
        <SegmentedControl.Item label="Month" value="month"/>
      </SegmentedControl>
    ),
  },
  {
    name: 'Slider',
    href: docs('controls-slider'),
    preview: (
      <>
        <Slider label="Brightness" value={0.7} onValueChange={noop}/>
        <Slider label="Volume" value={40} min={0} max={100} step={5} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'Stepper',
    href: docs('controls-stepper'),
    preview: (
      <>
        <Stepper label="Adults" value={2} min={1} max={8} onValueChange={noop}/>
        <Stepper label="Rooms" value={1} min={1} max={4} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'DateTimePicker',
    href: docs('controls-datetimepicker'),
    preview: (
      <>
        <DateTimePicker label="Starts" value={JUNE_15} onChange={noop}/>
        <DateTimePicker label="Reminder" mode="time" value={JUNE_15} onChange={noop}/>
      </>
    ),
  },
  {
    name: 'ColorPicker',
    href: docs('controls-colorpicker'),
    preview: (
      <>
        <ColorPicker label="Accent" value="#FF6347" onValueChange={noop}/>
        <ColorPicker label="Background" value="#5AC8FA80" onValueChange={noop}/>
      </>
    ),
  },
];

export const indicators: CardEntry[] = [
  {
    name: 'Progress',
    href: docs('indicators-progress'),
    preview: (
      <>
        <Progress value={0.6}/>
        <Row>
          <Progress variant="circular" value={0.6} size={32}/>
          <Progress variant="circular" size={32}/>
        </Row>
      </>
    ),
  },
  {
    name: 'Spinner',
    href: docs('indicators-spinner'),
    stage: 'center',
    preview: <Spinner size={40}/>,
  },
  {
    name: 'Gauge',
    href: docs('indicators-gauge'),
    preview: (
      <>
        <Gauge label="Speed" value={211} max={260} currentValueLabel="211" minimumValueLabel="0" maximumValueLabel="260"/>
        <Row>
          <Gauge variant="circular" value={211} max={260} currentValueLabel="211" minimumValueLabel="0" maximumValueLabel="260"/>
          <Gauge variant="circularCapacity" value={0.72} currentValueLabel="72%"/>
        </Row>
      </>
    ),
  },
  {name: 'Badge', href: docs('indicators-badge'), preview: <BadgePreview/>},
  {
    name: 'Avatar',
    href: docs('indicators-avatar'),
    stage: 'center',
    preview: (
      <Row>
        {['Ada Lovelace', 'Grace Hopper', 'Alan Turing'].map(name => (
          <Avatar key={name} name={name}/>
        ))}
      </Row>
    ),
  },
  {name: 'Typography', href: docs('indicators-typography'), preview: <TypographyPreview/>},
];

export const overlays: CardEntry[] = [
  {name: 'Menu', href: docs('overlays-menu'), stage: 'center', preview: <MenuPreview/>},
  {name: 'ContextMenu', href: docs('overlays-contextmenu'), preview: <ContextMenuPreview/>},
  {name: 'PopupMenu', href: docs('overlays-popupmenu'), preview: <PopupMenuPreview/>},
  {name: 'Popover', href: docs('overlays-popover'), preview: <PopoverPreview/>},
  {name: 'Tooltip', href: docs('overlays-tooltip'), stage: 'center', preview: <TooltipPreview/>},
  {name: 'Alert', href: docs('overlays-alert'), stage: 'center', backdrop: true, preview: <AlertPreview/>},
  {name: 'Sheet', href: docs('overlays-sheet'), stage: 'device', backdrop: true, preview: <SheetPreview/>},
  {name: 'Toast', href: docs('overlays-toast'), stage: 'center', preview: <ToastPreview/>},
];

const styles = {
  ...StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'center', gap: 8},
    article: {gap: 8},
    sheetContent: {gap: 12, padding: 20},
    page: {height: 96, justifyContent: 'center'},
    tabPage: {padding: 12, minHeight: 72},
    navScreen: {flex: 1, gap: 4, padding: 12},
    popoverStage: {height: 150},
    canvas: {height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'var(--color-separator)'},
  }),
  // DOM-only styles; the previews mix kit components with plain elements.
  inPlace: {position: 'relative', display: 'block'} as const,
  device: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    borderRadius: '20px 20px 0 0',
    border: '1px solid var(--color-separator)',
    borderBottom: 'none',
    background: 'light-dark(#FFFFFF, #000000)',
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.18)',
    '--color-background': 'light-dark(#FFFFFF, #000000)',
    '--color-background-element': 'light-dark(#F0F0F3, #212225)',
    '--color-background-selected': 'light-dark(#E0E1E6, #2E3135)',
  } as const,
  sheet: {
    position: 'relative',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    borderRadius: '16px 16px 0 0',
    background: 'light-dark(#FFFFFF, #000000)',
    boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.18)',
    '--color-background': 'light-dark(#FFFFFF, #000000)',
    '--color-background-element': 'light-dark(#F0F0F3, #212225)',
  } as const,
  sheetHandle: {width: 32, height: 5, borderRadius: 3, background: 'var(--color-background-selected)'} as const,
  menu: {display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4} as const,
  contextMenu: {position: 'relative', display: 'flex', flexDirection: 'column'} as const,
  contextMenuList: {alignSelf: 'flex-end', marginTop: -12, marginRight: 16, minWidth: 160} as const,
  group: {overflow: 'hidden', borderRadius: 12, background: 'var(--color-background-element)'} as const,
  keyboardBar: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: 'var(--color-separator)'} as const,
  keyboardSpacer: {flex: 1} as const,
  cardPreview: {height: 72, alignItems: 'center', justifyContent: 'center'} as const,
  toolbarStage: {width: 260, gap: 16} as const,
  toastStage: {width: 260, height: 96} as const,
};
