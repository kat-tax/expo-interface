import type {SheetBarProps} from './shared';
import type {LayoutChangeEvent, ViewProps} from 'react-native';
import {useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {Footnote, Headline} from '../typography';
import {useSheetBarFit} from './bar-fit';
import {BAR_HEIGHT, sub} from './shared';

/**
 * Web: marks the box the title sits in, for the sheet to find the heading
 * and move the keyboard focus to it as it opens, and for `sheet.css` to
 * draw no focus ring on it there. react-native-web writes `dataSet` out as
 * a `data-*` attribute, which React Native's own types do not know; Windows
 * has no use for it.
 */
const TITLES: ViewProps = Platform.OS === 'web' ? ({dataSet: {uiSheetTitle: ''}} as ViewProps) : {};

/** The width a layout event reports. */
const widthOf = (event: LayoutChangeEvent) => event.nativeEvent.layout.width;

/**
 * Web and Windows: the bar the kit draws along the sheet's top, in the
 * `ScreenHeader`'s look. The two ends are as wide as the wider of them
 * whichever holds a button, so the title stays centred: each end's content
 * reports its width, and the bar its own. The accessory placed in the bar
 * is React Native content at the leading end, after the back button, or in
 * a row of its own under the bar where the bar has no room for it
 * (`useSheetBarFit`).
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, accessory, testID}: SheetBarProps) {
  const [width, setWidth] = useState<number>();
  const {inBar, side, onLeading, onTrailing} = useSheetBarFit({title, subtitle, accessory}, width);
  return (
    <>
      <View style={styles.bar} testID={testID} onLayout={event => setWidth(widthOf(event))}>
        <View style={[styles.side, {minWidth: side}]}>
          <View style={styles.end} onLayout={event => onLeading(widthOf(event))}>
            {onBack ? (
              <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
            ) : null}
            {inBar ? accessory : null}
          </View>
        </View>
        <View style={styles.titles} {...TITLES}>
          {/* A dialog's title, at the level one takes: on web the drawer opens
              with a hidden title of `@expo/ui`'s, an `h2`, and a heading may go
              at most one level below the one before it. The web sheet moves
              the keyboard focus to it as it opens, so a script can focus it. */}
          {title !== undefined ? <Headline color="label" numberOfLines={1} align="center" level={2} tabIndex={-1}>{title}</Headline> : null}
          {subtitle !== undefined ? <Footnote color="secondaryLabel" numberOfLines={1} align="center">{subtitle}</Footnote> : null}
        </View>
        <View style={[styles.side, styles.trailing, {minWidth: side}]}>
          <View style={styles.end} onLayout={event => onTrailing(widthOf(event))}>
            {menu && menu.length > 0 ? (
              <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
            ) : null}
            {onClose ? (
              <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
            ) : null}
          </View>
        </View>
      </View>
      {inBar ? null : accessory}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailing: {
    justifyContent: 'flex-end',
  },
  // An end's content, as wide as what it holds: its width is what the ends are matched by.
  end: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
});
