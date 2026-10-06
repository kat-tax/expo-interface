import type {HeaderSearchSlot} from '../header-search/types';
import {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {InHeaderContext} from '../header/shared';
import {useSearchSite} from '../header-search/site';
import {Icon} from '../symbol';
import {icon} from '../icons';
import {StatePressable} from '../surface/pressable';
import {pressFeedback} from '../surface/shared';
import {PaneToggleContext} from '../tabs/shell';
import {bound, fonts, fontWeights, spacing, useColor} from '../theme';
import {reportDragRegion, useWindowChromeState} from '../windows/chrome';

interface ScreenHeaderProps {
  title: string;
  /** Drawn in place of the title text, when a screen renders its own (`headerTitle` as a function). */
  titleNode?: React.ReactNode;
  onBack?: () => void;
  /** Drawn in place of the back button (`headerLeft`). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /**
   * The screen's search (`HeaderSearch`), as the route's `headerSearch`
   * option hands it over: the `AutoSuggestBox` under the title in a second
   * row, in the row beside the title, or behind a magnifier among the
   * trailing controls that takes the row when it opens. `automatic` is
   * `inline`: a desktop window has the room.
   */
  search?: HeaderSearchSlot;
  /**
   * The root stack's header: while the content is in the title bar
   * (`useWindowChrome`), it drags the window and leaves the caption buttons
   * their room on the right.
   */
  dragRegion?: boolean;
}

/** The header's back glyph: Segoe's `Back` arrow, as WinUI's own headers draw it. */
const BACK = icon({ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back', windows: 'E72B'});

/**
 * Windows: the same row as everywhere, 48 points tall like a WinUI title
 * row, with the back arrow in Segoe Fluent Icons — a subtle button, with
 * the fill under the pointer, the focus ring and Enter that a
 * `NavigationView` back button has. A desktop window has no status bar to
 * leave room for. Under a minimal pane the row starts after the pane's
 * toggle row, so that the title is beside the toggle button as a WinUI
 * header is.
 */
export function ScreenHeader({title, titleNode, onBack, leading, trailing, search, dragRegion = false}: ScreenHeaderProps) {
  const label = useColor('label');
  const background = useColor('background');
  const chrome = useWindowChromeState();
  const toggleRow = useContext(PaneToggleContext);
  const site = useSearchSite(search, false);
  const bar = useRef<View>(null);
  // A header that is not the root's but lies in the title bar's band all the same — the root's hidden, a tab's stack at the top.
  const [inBand, setInBand] = useState(false);
  // Where the root's row is in the window, minus the caption buttons' room, drags the window; any other row learns whether it is in the band.
  const place = useCallback(() => {
    if (!chrome.extended) return;
    if (dragRegion) reportDragRegion(bar.current, chrome.insets);
    else bar.current?.measureInWindow((_x, y) => setInBand(y < chrome.insets.height));
  }, [chrome.extended, chrome.insets, dragRegion]);
  const onLayout = place;
  // The chrome answers after the first layout as often as not: placed again when it does.
  useEffect(place, [place]);
  // The caption buttons' room, on whichever side they are: the right, or the left of a right-to-left window.
  const room = chrome.extended && (dragRegion || inBand) && {
    paddingLeft: spacing.three + chrome.insets.left,
    paddingRight: spacing.three + chrome.insets.right,
  };

  return (
    <View ref={bar} onLayout={onLayout} style={[styles.bar, {backgroundColor: background}, toggleRow > 0 && {paddingStart: toggleRow}]}>
      <View style={[styles.inner, room]}>
        {leading ?? (onBack ? (
          <StatePressable
            onPress={onBack}
            role="button"
            accessibilityLabel="Go back"
            style={state => [styles.back, pressFeedback(state, 'subtle')]}>
            <Icon icon={BACK} size={16} tintColor={label}/>
          </StatePressable>
        ) : null)}
        {/* An open search takes the row: the title goes until it closes. */}
        {site.open ? null : titleNode ?? (
          <Text numberOfLines={1} style={[styles.title, {color: label}]}>
            {title}
          </Text>
        )}
        {site.inRow}
        <InHeaderContext.Provider value={true}>{trailing}</InHeaderContext.Provider>
      </View>
      {site.stacked ? <View style={[styles.search, room]}>{site.stacked}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.three,
    height: 48,
    gap: spacing.two,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.one,
  },
  title: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  },
  // The stacked search: a row under the title at the content's width, in the bar's own fill.
  search: {
    width: '100%',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.three,
    paddingBottom: spacing.two,
  },
});
