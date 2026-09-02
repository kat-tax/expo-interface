import type {PropsWithChildren} from 'react';
import {StyleSheet, View} from 'react-native';
import {SymbolView} from 'expo-symbols';
import {
  Body,
  Button,
  Checkbox,
  Collapsible,
  DateTimePicker,
  Divider,
  FieldGroup,
  Footnote,
  Headline,
  ListItem,
  Picker,
  Progress,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Slider,
  Stepper,
  Switch,
  TextField,
  Title,
  Title3,
  useColor,
} from 'expo-interface';
import type {IconToken} from 'expo-interface';
import * as icons from '../../../src/__stories__/icons';
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

function ScreenHeaderPreview() {
  return <ScreenHeader title="Edit profile" onBack={noop} trailing={<Button label="Save" variant="text" onPress={noop}/>}/>;
}

// Controls

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

export const layout: CardEntry[] = [
  {name: 'Screen', href: docs('layout-screen'), stage: 'device', preview: <ScreenPreview/>},
  {name: 'ScreenHeader', href: docs('layout-screenheader'), preview: <ScreenHeaderPreview/>},
];

export const components: CardEntry[] = [
  {name: 'Alert', href: docs('components-alert'), stage: 'center', backdrop: true, preview: <AlertPreview/>},
  {
    name: 'Button',
    href: docs('components-button'),
    stage: 'center',
    preview: (
      <>
        <Button label="Save" onPress={noop}/>
        <Button label="Cancel" variant="outlined" onPress={noop}/>
        <Button label="Learn more" variant="text" onPress={noop}/>
      </>
    ),
  },
  {
    name: 'Checkbox',
    href: docs('components-checkbox'),
    preview: (
      <>
        <Checkbox label="Accept terms" value onValueChange={noop}/>
        <Checkbox label="Subscribe to newsletter" value={false} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'Collapsible',
    href: docs('components-collapsible'),
    preview: (
      <Collapsible label="Version 1.0.0" defaultExpanded>
        <Footnote color="secondaryLabel">Built with expo-interface on @expo/ui.</Footnote>
      </Collapsible>
    ),
  },
  {name: 'ContextMenu', href: docs('components-contextmenu'), preview: <ContextMenuPreview/>},
  {
    name: 'DateTimePicker',
    href: docs('components-datetimepicker'),
    preview: (
      <>
        <DateTimePicker label="Starts" value={JUNE_15} onChange={noop}/>
        <DateTimePicker label="Reminder" mode="time" value={JUNE_15} onChange={noop}/>
      </>
    ),
  },
  {
    name: 'Divider',
    href: docs('components-divider'),
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
  {name: 'FieldGroup', href: docs('components-fieldgroup'), preview: <FieldGroupPreview/>},
  {name: 'ListItem', href: docs('components-listitem'), preview: <ListItemPreview/>},
  {name: 'Menu', href: docs('components-menu'), stage: 'center', preview: <MenuPreview/>},
  {
    name: 'Picker',
    href: docs('components-picker'),
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
    name: 'Progress',
    href: docs('components-progress'),
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
    name: 'SegmentedControl',
    href: docs('components-segmentedcontrol'),
    preview: (
      <SegmentedControl label="Range" selectedValue="week" onValueChange={noop}>
        <SegmentedControl.Item label="Day" value="day"/>
        <SegmentedControl.Item label="Week" value="week"/>
        <SegmentedControl.Item label="Month" value="month"/>
      </SegmentedControl>
    ),
  },
  {name: 'Sheet', href: docs('components-sheet'), stage: 'device', backdrop: true, preview: <SheetPreview/>},
  {
    name: 'Slider',
    href: docs('components-slider'),
    preview: (
      <>
        <Slider label="Brightness" value={0.7} onValueChange={noop}/>
        <Slider label="Volume" value={40} min={0} max={100} step={5} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'Stepper',
    href: docs('components-stepper'),
    preview: (
      <>
        <Stepper label="Adults" value={2} min={1} max={8} onValueChange={noop}/>
        <Stepper label="Rooms" value={1} min={1} max={4} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'Switch',
    href: docs('components-switch'),
    preview: (
      <>
        <Switch label="Wi-Fi" value onValueChange={noop}/>
        <Switch label="Bluetooth" value={false} onValueChange={noop}/>
      </>
    ),
  },
  {
    name: 'TextField',
    href: docs('components-textfield'),
    preview: (
      <>
        <TextField placeholder="Name" value="Ada Lovelace" onChangeText={noop}/>
        <TextField placeholder="Email" value="" keyboardType="email" onChangeText={noop}/>
      </>
    ),
  },
  {name: 'Tooltip', href: docs('components-tooltip'), stage: 'center', preview: <TooltipPreview/>},
  {name: 'Typography', href: docs('components-typography'), preview: <TypographyPreview/>},
];

const styles = {
  ...StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'center', gap: 8},
    article: {gap: 8},
    sheetContent: {gap: 12, padding: 20},
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
};
