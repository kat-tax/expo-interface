import type {Key, PropsWithChildren, ReactElement, ReactNode} from 'react';
import type {ButtonTone} from '../button/types';
import type {HeaderActionProps} from '../header-action';
import type {HeaderMenuProps} from '../header-menu';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {Children, Fragment, isValidElement} from 'react';
import {Platform} from 'react-native';
import {Stack} from 'expo-router';
import {Button} from '../button';
import {iosSymbol} from '../button/shared';
import {drawableOf} from '../icons';
import {Menu} from '../menu';
import {useColor} from '../theme';
import {HeaderHost, InHeaderContext, useHeaderTrigger} from './shared';

/**
 * What a kit header component is, read off its element without rendering
 * it: the native header takes its items as data, not as React children, so
 * `HeaderAction`, `HeaderMenu` and `HeaderActions` carry this mark and the
 * slot converts their elements. `HeaderSearch` carries `search`: it is the
 * bar's search rather than one of its items, and goes beside the toolbar.
 */
export type HeaderItem = 'action' | 'menu' | 'actions' | 'search';

/** The colors a header control draws in: the header's own label color, or the accent. */
export interface Tints {
  label: string;
  accent: string;
}

/** The palette's two tints for the bar's items, for {@link toolbarItems}. */
export function useHeaderTints(): Tints {
  return {label: useColor('label'), accent: useColor('tint')};
}

/**
 * iOS and Android: the platform's own header items, through Expo Router's
 * `Stack.Toolbar`. On iOS they are the navigation bar's button items and
 * menus; on Android the top app bar's icon buttons and dropdown menu. The
 * slot is rendered in the screen's content, where the toolbar reaches the
 * screen's options (`TabStack` declares the index screen's items statically
 * instead, with the same conversion). The kit's header controls are never
 * rendered here: their elements are read.
 */
export function ToolbarSlot({children}: PropsWithChildren) {
  return (
    <>
      {/* A search among the controls is the bar's own search, not an item: it sends itself beside the toolbar. */}
      {searchElements(children)}
      <Stack.Toolbar placement="right">{toolbarItems(children, useHeaderTints())}</Stack.Toolbar>
    </>
  );
}

function itemOf(element: ReactElement): HeaderItem | undefined {
  return (element.type as {item?: HeaderItem}).item;
}

/** The `HeaderSearch` elements among the slot's children, through rows and fragments, to render as they are. */
export function searchElements(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap((child): ReactElement[] => {
    if (!isValidElement(child)) return [];
    const item = itemOf(child);
    if (item === 'actions' || child.type === Fragment) return searchElements((child.props as PropsWithChildren).children);
    return item === 'search' ? [child] : [];
  });
}

/**
 * The toolbar's items for the slot's children: a `HeaderAction` is a button,
 * a `HeaderMenu` a menu, a `HeaderActions` its children one after another,
 * and any other element a custom view in the bar. Bare text is left out: the
 * bar has no item for it.
 *
 * A custom view is rendered inside the bar, so it counts as a header there:
 * a kit control it renders (an app's component around a `HeaderMenu`) draws
 * itself in the view, in a host, rather than sending itself to the header a
 * second time, which would be a `Stack.Toolbar` inside the bar's own.
 */
export function toolbarItems(children: ReactNode, tints: Tints): ReactNode[] {
  return Children.toArray(children).flatMap((child): ReactNode[] => {
    if (!isValidElement(child)) return [];
    const item = itemOf(child);
    const props = child.props as PropsWithChildren;
    if (item === 'actions' || child.type === Fragment) return toolbarItems(props.children, tints);
    if (item === 'action') return [action(child.props as HeaderActionProps, tints, child.key)];
    if (item === 'menu') return [menu(child.props as HeaderMenuProps, tints, child.key)];
    if (item === 'search') return [];
    return [
      <Stack.Toolbar.View key={child.key}>
        <InHeaderContext.Provider value={true}>{child}</InHeaderContext.Provider>
      </Stack.Toolbar.View>,
    ];
  });
}

function tint(tone: ButtonTone | undefined, tints: Tints): string {
  return tone === 'label' ? tints.label : tints.accent;
}

/**
 * The icon as the platform's bar wants it: the SF Symbol's name on iOS, the
 * drawable Compose draws on Android (none without one: the bar cannot draw a
 * Material Symbol by name, so the control falls back to the kit's own button).
 */
function barIcon(icon: IconToken | undefined) {
  if (!icon) return undefined;
  return Platform.OS === 'ios' ? iosSymbol(icon) : drawableOf(icon);
}

/**
 * A `HeaderAction` as a bar button item. iOS draws the symbol in place of the
 * label when asked to and the label otherwise; Android's app bar actions are
 * icons, so an icon is drawn whenever there is one, with the label as the
 * accessible name, and a text action is the kit's button in a host.
 */
function action({label, icon, onPress, hideLabel, tone, disabled}: HeaderActionProps, tints: Tints, key: Key | null) {
  const tintColor = tint(tone, tints);
  const bar = barIcon(icon);
  if (bar && (hideLabel || Platform.OS === 'android')) {
    return <Stack.Toolbar.Button key={key} icon={bar} accessibilityLabel={label} tintColor={tintColor} disabled={disabled} onPress={onPress}/>;
  }
  if (Platform.OS === 'ios') {
    return <Stack.Toolbar.Button key={key} tintColor={tintColor} disabled={disabled} onPress={onPress}>{label}</Stack.Toolbar.Button>;
  }
  return (
    <Stack.Toolbar.View key={key}>
      <HeaderHost>
        <TextAction label={label} onPress={onPress} tone={tone} disabled={disabled}/>
      </HeaderHost>
    </Stack.Toolbar.View>
  );
}

/** A `HeaderMenu` as a bar menu: the same rules as an action's for the trigger, with the entries as its menu. */
function menu({label, icon, items: entries, hideLabel, tone, disabled}: HeaderMenuProps, tints: Tints, key: Key | null) {
  const tintColor = tint(tone, tints);
  const bar = barIcon(icon);
  if (bar && (hideLabel || Platform.OS === 'android')) {
    return (
      <Stack.Toolbar.Menu key={key} icon={bar} accessibilityLabel={label} tintColor={tintColor} disabled={disabled}>
        {actions(entries)}
      </Stack.Toolbar.Menu>
    );
  }
  if (Platform.OS === 'ios') {
    return (
      <Stack.Toolbar.Menu key={key} title={label} tintColor={tintColor} disabled={disabled}>
        {actions(entries)}
      </Stack.Toolbar.Menu>
    );
  }
  return (
    <Stack.Toolbar.View key={key}>
      <HeaderHost>
        <TextMenu label={label} items={entries} tone={tone} disabled={disabled}/>
      </HeaderHost>
    </Stack.Toolbar.View>
  );
}

/**
 * The menu's entries as the bar menu's actions, in groups: a `separator`
 * starts a new one, drawn as an inline menu, which is how the platform's menu
 * draws a rule between entries. An `active` entry is on (iOS's check mark,
 * Android's trailing check), a `destructive` one is in the danger color.
 */
function actions(entries: MenuItem[]): ReactNode {
  const groups: MenuItem[][] = [];
  entries.forEach((entry, index) => {
    if (groups.length === 0 || (entry.separator && index > 0)) groups.push([]);
    groups[groups.length - 1].push(entry);
  });
  return groups.map((group, g) => {
    const list = group.map((entry, i) => (
      <Stack.Toolbar.MenuAction
        key={i}
        icon={barIcon(entry.icon)}
        isOn={entry.active}
        destructive={entry.role === 'destructive'}
        disabled={entry.disabled}
        onPress={entry.onPress}>
        {entry.label}
      </Stack.Toolbar.MenuAction>
    ));
    return g === 0 ? list : <Stack.Toolbar.Menu key={g} inline>{list}</Stack.Toolbar.Menu>;
  });
}

/** Android's text action: the kit's button at the header's size, since the app bar has no text item of its own. */
export function TextAction({label, onPress, tone = 'accent', disabled}: Pick<HeaderActionProps, 'label' | 'onPress' | 'tone' | 'disabled'>) {
  const {size, iconSize} = useHeaderTrigger();
  return <Button label={label} onPress={onPress} tone={tone} disabled={disabled} variant="text" size={size} iconSize={iconSize}/>;
}

/** Android's text menu, likewise. */
export function TextMenu({label, items: entries, tone = 'accent', disabled}: Pick<HeaderMenuProps, 'label' | 'items' | 'tone' | 'disabled'>) {
  const {size, iconSize} = useHeaderTrigger();
  return <Menu label={label} items={entries} tone={tone} disabled={disabled} variant="text" size={size} iconSize={iconSize}/>;
}
