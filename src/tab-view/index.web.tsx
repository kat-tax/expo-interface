import './tab-view.css';
import type {CSSProperties, RefObject} from 'react';
import type {TabViewProps} from './types';
import {useEffect, useId, useRef, useState} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {useRovingFocus} from '../a11y/roving';
import {Icon} from '../symbol';
import {flatten} from '../theme';
import {ADD_LABEL, closeLabel, resolveLayout, switcherLabel, tabIndex} from './shared';

/** The glyphs, as Material Symbols names — the family `Icon` draws with on web. */
const CLOSE = {symbol: {ios: 'xmark', android: 'close', web: 'close'}} as const;
const ADD = {symbol: {ios: 'plus', android: 'add', web: 'add'}} as const;
const GRID = {symbol: {ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view'}} as const;

const ICON = 16;
const CROSS = 14;

/**
 * How wide the tabs actually are, which is not how wide the window is: a
 * sidebar beside them changes the room a strip has without the window
 * changing at all. An element with no width yet — before the first
 * measurement, and in a test environment that lays nothing out — falls back to
 * the window, which is the best guess available and the one every framework
 * makes.
 */
function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    // The element is attached by the time an effect runs.
    const element = ref.current!;
    setWidth(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => setWidth(entries[0]!.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width || globalThis.innerWidth;
}

/**
 * On web the strip is the APG's tab pattern, in the DOM, with the one thing
 * that pattern does not cover: a close button inside each tab.
 *
 * **The close cross cannot be a control here, and that is ARIA's answer
 * rather than a shortcut.** Everything inside `role="tab"` is presentational,
 * so a button in a tab is never exposed at all; and `tablist` does not allow a
 * button among its children, so moving it beside the tab fails too. Both are
 * axe failures (`nested-interactive`, then `aria-required-children`) and both
 * are real: there is no arrangement in which a tab strip has a second
 * announced control per tab. So the cross is a pointer affordance, and the
 * keyboard closes with **Delete on the tab**, which each closable tab says for
 * itself through `aria-keyshortcuts`.
 *
 * iOS and Android have no such rule, and there the cross **is** a button
 * beside the tab that VoiceOver and TalkBack both reach; Windows gets the
 * control's own. Web is the platform whose semantics are strictest here, which
 * is worth knowing rather than papering over.
 *
 * A tab is a `div role="tab"` rather than a `<button>` for a related reason:
 * it is one stop in a composite, not a button in the tab order.
 *
 * Selection follows the arrow keys rather than waiting for Enter, the APG's
 * automatic activation, which is right here because switching tabs shows
 * content the app already has.
 *
 * Below 640 points the strip is a button and a grid of cards instead, the same
 * shape the native files draw — and the grid is a tab list too, so the tabs
 * are the same thing to a screen reader at either size.
 */
export function TabView({
  tabs,
  selected,
  onSelect,
  onClose,
  onAdd,
  children,
  label = 'Tabs',
  layout = 'auto',
  testID,
  style,
}: TabViewProps) {
  const id = useId().replaceAll(/[^A-Za-z0-9_-]/g, '_');
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const resolved = resolveLayout(layout, useContainerWidth(root));
  const current = tabIndex(tabs, selected);
  const roving = useRovingFocus(list, {
    orientation: 'horizontal',
    // A list with nothing selected still has to hold one tab stop, so the
    // first tab takes it.
    activeIndex: Math.max(current, 0),
    onMove: index => onSelect(tabs[index]!.id),
  });
  const cards = resolved === 'switcher' && open;
  const tabId = (tab: {id: string}) => `${id}-tab-${tab.id}`;
  const panelId = `${id}-panel`;
  /**
   * What names the panel: the open tab's **title**, never the tab itself.
   *
   * An element referenced by `aria-labelledby` is read whole, `aria-hidden`
   * descendants included — and the kit draws an icon as a Material Symbols
   * ligature, which is the glyph's name as text. Naming the panel after the
   * tab therefore called it "descriptionREADME.md". Only the harness's
   * accessibility tree showed it; every test passed.
   */
  const openId = `${id}-open`;

  const close = (tab: {id: string; title: string; pinned?: boolean}) =>
    onClose && !tab.pinned ? (
      <span
        className="ui-tab-view__cross"
        // A pointer affordance, not a control, and deliberately so: ARIA makes
        // everything inside `role="tab"` presentational, so a button here is
        // one assistive technology is never told about — and a button beside
        // the tab is a child the `tablist` role does not allow. Both fail axe,
        // and both would be real defects rather than pedantry. The keyboard
        // closes with Delete, which the tab announces itself.
        aria-hidden="true"
        title={closeLabel(tab)}
        data-testid={testID ? `${testID}-close-${tab.id}` : undefined}
        onClick={event => {
          // Without this the close bubbles to the tab under it and selects the
          // very tab that is going away.
          event.stopPropagation();
          onClose(tab.id);
        }}>
        <Icon icon={CLOSE} size={CROSS}/>
      </span>
    ) : null;

  const add = onAdd ? (
    <button
      type="button"
      className="ui-tab-view__add"
      aria-label={ADD_LABEL}
      data-testid={testID ? `${testID}-add` : undefined}
      onClick={() => {
        setOpen(false);
        onAdd();
      }}>
      <Icon icon={ADD} size={ICON}/>
    </button>
  ) : null;

  return (
    <div
      ref={root}
      className="ui-tab-view"
      style={flatten(StyleSheet.flatten(style) as TextStyle) as CSSProperties}
      data-testid={testID}>
      {resolved === 'strip' ? (
        <div className="ui-tab-view__bar">
          <div
            ref={list}
            className="ui-tab-view__strip"
            role="tablist"
            aria-label={label}
            onKeyDown={roving.onKeyDown}
            data-testid={testID ? `${testID}-strip` : undefined}>
            {tabs.map((tab, index) => {
              const cross = close(tab);
              return (
              <div key={tab.id} className="ui-tab-view__tab" data-selected={index === current}>
                <div
                  role="tab"
                  id={tabId(tab)}
                  className="ui-tab-view__tab-body"
                  aria-selected={index === current}
                  aria-controls={panelId}
                  // How the keyboard closes it, said out loud: without this the
                  // cross is the only hint, and the cross is pointer-only.
                  aria-keyshortcuts={cross ? 'Delete' : undefined}
                  data-testid={testID ? `${testID}-tab-${tab.id}` : undefined}
                  onClick={() => onSelect(tab.id)}
                  onKeyDown={event => {
                    if (event.key !== 'Delete' || !onClose || tab.pinned) return;
                    event.preventDefault();
                    onClose(tab.id);
                  }}
                  {...roving.itemProps(index)}>
                  {tab.icon ? <Icon icon={tab.icon} size={ICON}/> : null}
                  <span className="ui-tab-view__title" id={index === current ? openId : undefined}>
                    {tab.title}
                  </span>
                </div>
                {cross}
              </div>
              );
            })}
          </div>
          {add}
        </div>
      ) : (
        <div className="ui-tab-view__bar">
          <button
            type="button"
            className="ui-tab-view__switcher"
            aria-label={switcherLabel(tabs, selected)}
            aria-expanded={open}
            data-testid={testID ? `${testID}-switcher` : undefined}
            onClick={() => setOpen(!open)}>
            <Icon icon={GRID} size={ICON}/>
            <span className="ui-tab-view__title" id={openId}>{tabs[current] ? tabs[current].title : label}</span>
            <span className="ui-tab-view__count">{tabs.length}</span>
          </button>
          {add}
        </div>
      )}
      {cards ? (
        <div
          ref={list}
          className="ui-tab-view__cards"
          role="tablist"
          aria-label={label}
          onKeyDown={roving.onKeyDown}
          data-testid={testID ? `${testID}-cards` : undefined}>
          {tabs.map((tab, index) => {
            const cross = close(tab);
            return (
            <div key={tab.id} className="ui-tab-view__card" data-selected={index === current}>
              <div
                role="tab"
                id={tabId(tab)}
                className="ui-tab-view__card-body"
                aria-selected={index === current}
                aria-controls={panelId}
                aria-keyshortcuts={cross ? 'Delete' : undefined}
                data-testid={testID ? `${testID}-card-${tab.id}` : undefined}
                onClick={() => {
                  setOpen(false);
                  onSelect(tab.id);
                }}
                onKeyDown={event => {
                  if (event.key !== 'Delete' || !onClose || tab.pinned) return;
                  event.preventDefault();
                  onClose(tab.id);
                }}
                {...roving.itemProps(index)}>
                {tab.icon ? <Icon icon={tab.icon} size={ICON}/> : null}
                <span className="ui-tab-view__card-title">{tab.title}</span>
              </div>
              {cross}
            </div>
            );
          })}
        </div>
      ) : (
        <div
          className="ui-tab-view__panel"
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabs[current] ? openId : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}
