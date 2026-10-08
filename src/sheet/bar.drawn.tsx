import type {SheetBarProps} from './shared';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {Footnote, Headline} from '../typography';
import {BAR_HEIGHT, BAR_SIDE, sub} from './shared';

/**
 * Web and Windows: the bar the kit draws along the sheet's top, in the
 * `ScreenHeader`'s look. The two ends are the same width whichever of them
 * holds a button, so the title stays centred.
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, testID}: SheetBarProps) {
  return (
    <View style={styles.bar} testID={testID}>
      <View style={styles.side}>
        {onBack ? (
          <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
        ) : null}
      </View>
      <View style={styles.titles}>
        {/* A dialog's title, at the level one takes: on web the drawer opens
            with a hidden title of `@expo/ui`'s, an `h2`, and a heading may go
            at most one level below the one before it. */}
        {title !== undefined ? <Headline color="label" numberOfLines={1} align="center" level={2}>{title}</Headline> : null}
        {subtitle !== undefined ? <Footnote color="secondaryLabel" numberOfLines={1} align="center">{subtitle}</Footnote> : null}
      </View>
      <View style={[styles.side, styles.trailing]}>
        {menu && menu.length > 0 ? (
          <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
        ) : null}
        {onClose ? (
          <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
        ) : null}
      </View>
    </View>
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
    minWidth: BAR_SIDE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailing: {
    justifyContent: 'flex-end',
  },
  titles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
});
