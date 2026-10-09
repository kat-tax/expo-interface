import type {HeaderSearchSlot} from '../header-search/types';
import type {SheetMaterial} from '../sheet/types';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BACK} from '../glyphs';
import {InHeaderContext} from '../header/shared';
import {useSearchSite} from '../header-search/site';
import {materialProps} from '../material';
import {hasMaterial} from '../sheet/shared';
import {Icon} from '../symbol';
import {bound, spacing, useColor} from '../theme';
import {useTabBarInset} from '../tabs/context';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  /**
   * The screen's search (`HeaderSearch`), as the route's `headerSearch`
   * option hands it over: a field under the title in a second row, a
   * frameless field in the row after the title, or a magnifier among the
   * trailing controls that takes the row when it opens. `automatic` is
   * `inline`: the field shares the row's width with the title at every
   * width.
   */
  search?: HeaderSearchSlot;
  /** A row of the screen's own under the header's (`HeaderAccessory`), in the bar's fill. */
  accessory?: React.ReactNode;
  /**
   * Web only: draws the bar as one of the kit's materials, the ones `Sheet`
   * takes: the screen's background thinned over a blur of what the app lays
   * under the bar, a hairline along its bottom edge and a soft shadow. Solid
   * where the browser has no `backdrop-filter`, under a reduced-transparency
   * setting and in forced colors. Natively the bar stays opaque.
   * @default 'none'
   */
  material?: SheetMaterial;
  /** Windows only: the root stack's header drags the window while the content is in the title bar. Nothing here. */
  dragRegion?: boolean;
}

export function ScreenHeader({title, onBack, trailing, search, accessory, material = 'none'}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarInset();
  const label = useColor('label');
  const background = useColor('background');
  const site = useSearchSite(search);
  // Under the status bar natively; under the floating tab bar on web.
  const paddingTop = Platform.OS === 'web' ? tabBar : insets.top;

  return (
    // A material paints the bar through the stylesheet, so its own fill stays off then.
    <View style={[styles.bar, !hasMaterial(material) && {backgroundColor: background}, {paddingTop}]} {...materialProps(material, 'background', 'bottom')}>
      <View style={styles.inner}>
        {onBack ? (
          // The kit's own glyph: on web the stylesheet draws it from the font
          // the app registers, where `SymbolView` would fetch the static instance.
          <Pressable
            onPress={onBack}
            role="button"
            accessibilityLabel="Go back"
            style={styles.back}>
            <Icon icon={BACK} size={24} tone="label"/>
          </Pressable>
        ) : null}
        {/* An open search takes the row, as Android's does: the title goes until it closes. */}
        {site.open ? null : (
          <Text numberOfLines={1} style={[styles.title, {color: label}]}>
            {title}
          </Text>
        )}
        {site.inRow}
        <InHeaderContext.Provider value={true}>{trailing}</InHeaderContext.Provider>
      </View>
      {site.stacked ? <View style={styles.search}>{site.stacked}</View> : null}
      {accessory != null ? <View style={styles.search}>{accessory}</View> : null}
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
    height: 64,
    gap: spacing.two,
  },
  back: {
    padding: spacing.one,
    marginLeft: -spacing.one,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  // The stacked search and the accessory: rows under the title at the content's width, in the bar's own fill.
  search: {
    width: '100%',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.three,
    paddingBottom: spacing.two,
  },
});
