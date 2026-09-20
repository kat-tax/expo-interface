import type {ChipProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlChip from '../windows/specs/ExpoInterfaceChipNativeComponent';
import {Button} from '../button';
import {glyphOf, useXamlProps} from '../windows';
import {chipKind, nextSelected} from './shared';

/** The height a Fluent chip asks for: a capsule around a 14pt label. */
const HEIGHT = 32;

/**
 * Windows splits the same way iOS does, and for the same reason.
 *
 * A chip that can be off is a WinUI 3 `ToggleButton` with a pill radius, in
 * an island of its own — not because a styled button would look wrong, but
 * because UI Automation reports the **toggle pattern** from a toggle. Narrator
 * then says "on" or "off"; from a button it would read a chosen filter and an
 * unchosen one identically.
 *
 * A chip that cannot be off is the kit's own `Button`, which is already a
 * WinUI `Button`, shaped into a capsule.
 */
export function Chip(props: ChipProps) {
  const {label, onPress, selected, icon, disabled, testID} = props;
  const xaml = useXamlProps();
  if (chipKind(props) === 'action') {
    // Boxed to the toggle's height. The two are different controls and WinUI
    // sizes a standard button shorter than a chip, which in a row of chips
    // reads as one of them having slipped.
    return (
      <View style={styles.action}>
        <Button
          label={label}
          variant="outlined"
          size="small"
          shape="pill"
          prefixIcon={icon}
          disabled={disabled}
          onPress={() => onPress?.(nextSelected(props))}
          testID={testID}
        />
      </View>
    );
  }
  return (
    <XamlChip
      value={selected!}
      label={label}
      glyph={glyphOf(icon)}
      disabled={disabled}
      onValueChange={event => onPress?.(event.nativeEvent.value)}
      style={{height: HEIGHT}}
      testID={testID}
      {...xaml}
    />
  );
}

const styles = StyleSheet.create({
  action: {
    height: HEIGHT,
    justifyContent: 'center',
  },
});
