import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';

/**
 * Document tabs: a strip of open things the user opened and can close, with
 * the selected one's content under it.
 *
 * **These are not the tabs `Tabs` draws.** That component is the app's
 * sections — three to five, fixed by the app, a bar along the bottom on a
 * phone. This one is open documents — as many as the user makes, each with a
 * close cross, an add button at the end. The two share a name and nothing
 * else, which is why this is its own component rather than a prop on that one.
 *
 * | | strip (wide) | switcher (narrow) |
 * | --- | --- | --- |
 * | Windows | **native** — WinUI 3 `TabView` | drawn grid |
 * | iOS | drawn strip | drawn card grid |
 * | Android | drawn strip | drawn card grid |
 * | Web | drawn strip, the APG tab pattern | drawn card grid |
 *
 * Only Windows has a control for this, and it is the only platform that does:
 * iOS's `TabView` and Compose's `TabRow` are both the navigation kind, and no
 * browser exposes its own tab strip to a page. So the kit draws the strip on
 * three platforms and uses the real `TabView` on the fourth — the opposite
 * balance to the rest of the kit, and honest about it.
 *
 * **Below 640 points there is no strip on any platform**, because there is no
 * room for one: Safari and Chrome both hide open pages behind a numbered
 * button that opens a grid of cards, on iOS and on Android alike, and that is
 * what this draws. 640 is both WinUI's compact breakpoint and Android's medium
 * window class. It is measured rather than taken from the window, because a
 * navigation pane beside the tabs changes the room they have without the
 * window changing size at all.
 *
 * The cards are a title, an icon and a close cross — not the live page
 * previews a browser draws, which would need a way to snapshot arbitrary
 * React Native content that the kit has no dependency for. For a switcher over
 * an app's own documents rather than over web pages, that is what one would
 * want anyway.
 */
export interface TabViewProps {
  /** The open tabs, in the order they are drawn. */
  tabs: readonly TabViewTab[];
  /**
   * The open tab, by `id`. When no tab has it, no tab is marked open; the
   * WinUI strip, which always has one selected, marks the first.
   */
  selected: string;
  /** A tab was pressed, or the keyboard moved to one. */
  onSelect: (id: string) => void;
  /**
   * A tab's close cross was pressed. Leaving this out takes the crosses away:
   * a set of tabs the user cannot close should not show a control that says
   * they can. See {@link nextSelection} for which tab to open afterwards.
   */
  onClose?: (id: string) => void;
  /** The add button at the end of the strip. Leaving this out takes it away. */
  onAdd?: () => void;
  /**
   * What the add button is called, to a screen reader and in Windows'
   * tooltip: "New document", "New chat". Left out, the WinUI strip keeps
   * WinUI's own name and tooltip for the button, in the system's language;
   * everywhere else, the switcher on Windows included, it is "New tab".
   * @default 'New tab'
   */
  addLabel?: string;
  /**
   * The selected tab's content, drawn under the strip. Left out of the
   * element altogether, the view is the tabs alone: as tall as the strip or
   * the switcher's bar rather than growing into its parent, and on web with
   * no `tabpanel` for the tabs to control. That is the shape for a strip in a
   * `HeaderAccessory`, whose pages are the screen's content. Children written
   * but rendering nothing, `null` or the `undefined` of
   * `{current && <Editor/>}`, are a page with nothing in it, which keeps the
   * view's size when the last document closes. A component that wraps a
   * `TabView` passes `children` on only when it was given some.
   */
  children?: ReactNode;
  /**
   * What the strip is called — "Open files", "Documents". Each tab is named
   * by its own `label`, or its title, so this names the group they are in.
   * @default 'Tabs'
   */
  label?: string;
  /**
   * Force the shape instead of measuring for it. `strip` and `switcher` are
   * for a caller that knows better than the width does — a story, a test, a
   * layout with its own rules.
   * @default 'auto'
   */
  layout?: TabViewLayout;
  /**
   * What the strip, or the switcher's bar, is painted with: the raised fill,
   * against which the open tab is the page's own colour, or nothing, for tabs
   * on a material (a `HeaderAccessory` under a header the screens run under,
   * the web bar's pill) that a fill of their own would cover. With `none` the
   * open tab is a pill in the palette's pill fill. The WinUI strip is an
   * island, which cannot be see-through, so on Windows `none` paints it in
   * the screen's background, the fill of the header it sits in there.
   * @default 'element'
   */
  fill?: TabViewFill;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** One open document. */
export interface TabViewTab {
  /** Stable identity: what `selected` names, and what the callbacks report. */
  id: string;
  /** The tab's text, and what a screen reader says unless `label` says otherwise. */
  title: string;
  /**
   * What a screen reader calls the tab, where the accessory says something
   * the title does not: "index.tsx, Ana is here". Start it with the title, so
   * a voice command can still find the tab by what it shows. On Windows it
   * names the WinUI tab too, whose strip draws no accessory. An empty label
   * is the title as well.
   * @default the title
   */
  label?: string;
  /** Drawn before the title, and on the switcher's card. */
  icon?: IconToken;
  /**
   * This tab has no close cross, wherever the others have one — a home tab, a
   * document with unsaved work that has its own confirmation.
   * @default false
   */
  pinned?: boolean;
  /**
   * The tab's own actions (rename, duplicate, close others), in the
   * platform's menu at the tab: a long press on iOS and Android, a right
   * click or the Menu key on web and Windows, with the kit's `PopupMenu`.
   */
  menu?: MenuItem[];
  /**
   * How far the tab is nested, for a strip of documents that belong to one
   * another: each level indents the tab a little further.
   * @default 0
   */
  depth?: number;
  /**
   * Content of the app's own after the title: a presence dot, a count, an
   * unsaved mark. Drawn on the strips the kit draws and on the switcher's
   * cards; the WinUI strip holds text and a glyph alone. A screen reader does
   * not read it: say what it means in `label`.
   */
  accessory?: ReactNode;
}

/** What {@link TabViewProps.layout} asks for, before a width has decided it. */
export type TabViewLayout = 'auto' | 'strip' | 'switcher';

/** What {@link TabViewProps.fill} paints behind the tabs: the raised fill, or nothing. */
export type TabViewFill = 'element' | 'none';
