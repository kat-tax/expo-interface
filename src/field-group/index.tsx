import type {FieldGroupProps, FieldGroupSectionProps, FieldSectionFooterColor} from './types';
import {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {FieldGroup as Base} from '@expo/ui';
import {Spacer, Text} from '@expo/ui/swift-ui';
import {font, foregroundStyle, frame, listRowBackground, listRowSeparator} from '@expo/ui/swift-ui/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useScrollInsets} from '../screen/insets';
import {SheetBodyCapContext} from '../sheet/cap-context';
import {useColor} from '../theme';
import {baseSection, mapSections} from './shared';

/**
 * App `FieldGroup`: a scrollable container of grouped settings-style rows.
 * iOS (this file) uses `@expo/ui`'s SwiftUI `Form`, whose `Section` gains
 * the `footer` prop as the native section footer slot. Android
 * (`index.android.tsx`) keeps the Material 3 connected-list look with app
 * palette colors. Web (`index.web.tsx` + `field-group.css`) re-themes the
 * universal component via CSS instead of forking its layout.
 *
 * Under a host (a `Screen native`, a `NativeHost`, a `Sheet`'s native
 * content) the form is bare native content. Outside one it mounts a host of
 * its own, as `List` does: filling its parent, or, as the body of a `Sheet`
 * with `maxHeight`, the cap tall, since the body's scroll view gives a child
 * no height to fill. The form then scrolls inside the cap and leaves the
 * sheet's footer and actions their room.
 */

/** The section `footer` as SwiftUI text, in the footnote size and the token's color. */
function FooterText({color, children}: {color: FieldSectionFooterColor; children: string}) {
  const resolved = useColor(color);
  return <Text modifiers={[foregroundStyle({type: 'color', color: resolved}), font({size: 13})]}>{children}</Text>;
}

const renderFooter = (footer: string, color: FieldSectionFooterColor) => <FooterText color={color}>{footer}</FooterText>;

function Section(props: FieldGroupSectionProps) {
  return baseSection(props, renderFooter);
}

function FieldGroupBase(props: FieldGroupProps) {
  const hosted = useNativeHost();
  const cap = useContext(SheetBodyCapContext);
  if (hosted) return <NativeForm {...props}/>;
  // The form's own props stay on the native form (`testID`, `style`, the
  // `hidden` modifier); the box only sizes the host, and goes with a hidden form.
  return (
    <View style={[cap === undefined ? styles.fill : {alignSelf: 'stretch', height: cap}, props.hidden ? styles.hidden : null]}>
      <NativeHost fit="fill"><NativeForm {...props}/></NativeHost>
    </View>
  );
}

function NativeForm({children, ...props}: FieldGroupProps) {
  // The room the screen keeps at its bottom (the tab bar's floating action):
  // SwiftUI's `Form` takes no content padding, so a clear row of that height
  // ends the form, as the iOS `List` pads.
  const {bottom} = useScrollInsets();
  return (
    <Base {...props}>
      {mapSections(children, Section, renderFooter)}
      {bottom > 0 ? <Spacer modifiers={[frame({height: bottom}), listRowBackground('clear'), listRowSeparator('hidden')]}/> : null}
    </Base>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1, alignSelf: 'stretch'},
  hidden: {display: 'none'},
});

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader: Base.SectionHeader,
  SectionFooter: Base.SectionFooter,
});

export type {FieldGroupProps, FieldGroupSectionProps};
