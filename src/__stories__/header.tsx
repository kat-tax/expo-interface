import type {ReactElement, ReactNode} from 'react';
import {Children, isValidElement} from 'react';
import {Stack} from 'expo-router';
import {ScreenStackHeaderRightView} from 'react-native-screens';
import {stackHeaders} from 'expo-vitest/native';

/**
 * What the native header holds for a screen in a test, by the header's title,
 * in the shape react-native-screens gives iOS's bar button items: `type`,
 * `title`, `icon`, `tintColor`, `disabled`, `onPress`, and for a menu
 * `menu.items` of actions (`state` on or off) and inline submenus.
 *
 * On iOS the items reach react-native-screens as that data
 * (`headerRightBarButtonItems`). On Android they are Expo Router's Compose
 * elements in the header's trailing view, which the test renderer keeps as
 * elements in the header config; the kit's part is the elements it made, so
 * those are read off the tree without rendering it and put in the same shape.
 */
export function barItems(title: string): Record<string, any>[] {
  const header = stackHeaders().find(h => h.title === title);
  if (!header) throw new Error(`No native header titled ${title}`);
  if (header.headerRightBarButtonItems) {
    // iOS lays its right items out from the edge, so React Navigation hands
    // them over reversed, each with its `index` there; a custom view is a
    // `ScreenStackHeaderRightView` among the header's children keyed by the
    // same index. Put back together in the order the screen gave them.
    const slots: Record<string, any>[] = [];
    for (const data of header.headerRightBarButtonItems) slots[data.index] = data;
    for (const view of rightViews(header.children)) slots[Number(view.key)] = {type: 'custom', children: view.props.children};
    return slots.reverse();
  }
  return barElements(header.children).map(element => item(element, false));
}

/** iOS's custom right views among the header's children. */
function rightViews(node: ReactNode): ReactElement<{children?: ReactNode}>[] {
  const out: ReactElement<{children?: ReactNode}>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement(child)) return;
    if (child.type === ScreenStackHeaderRightView) out.push(child as ReactElement<{children?: ReactNode}>);
    else out.push(...rightViews((child.props as {children?: ReactNode}).children));
  });
  return out;
}

const NAMES = new Map<unknown, string>([
  [Stack.Toolbar.Button, 'button'],
  [Stack.Toolbar.Menu, 'menu'],
  [Stack.Toolbar.MenuAction, 'action'],
  [Stack.Toolbar.View, 'custom'],
]);

/** An Android toolbar element as an iOS item. */
function item(element: ReactElement, nested: boolean): Record<string, any> {
  const {children, isOn, inline, ...props} = element.props as Record<string, any>;
  switch (NAMES.get(element.type)) {
    case 'button':
      return {type: 'button', title: text(children), ...props};
    case 'menu':
      return nested
        ? {type: 'submenu', displayInline: !!inline, items: barElements(children).map(child => item(child, true))}
        : {type: 'menu', title: text(children), ...props, menu: {items: barElements(children).map(child => item(child, true))}};
    case 'action':
      return {type: 'action', title: text(children), state: isOn ? 'on' : 'off', ...props};
    default:
      return {type: 'custom', children};
  }
}

function text(children: ReactNode): string {
  return Children.toArray(children).filter(child => typeof child === 'string').join('');
}

/** The toolbar item elements in a tree, in order, without rendering it. */
export function barElements(node: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  Children.forEach(node, child => {
    if (!isValidElement(child)) return;
    if (NAMES.has(child.type)) {
      out.push(child);
      return;
    }
    out.push(...barElements((child.props as {children?: ReactNode}).children));
  });
  return out;
}
