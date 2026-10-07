import type {SwitchProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Toggle} from '@expo/ui/swift-ui';
import {disabled as disabledMod, tint} from '@expo/ui/swift-ui/modifiers';
import {SelfHosted} from '../host';

/**
 * iOS renders the toggle inline using SwiftUI's `Toggle`, which is exactly the
 * Form row look the other platforms emulate: a leading label with the switch
 * pinned to the trailing edge. Drop it straight into a `FieldGroup.Section`,
 * or anywhere in a React Native layout: outside a host it mounts one of its
 * own, the width of its container with a label and of the switch without.
 */
export function Switch(props: SwitchProps) {
  return (
    <SelfHosted fit={props.label == null}>
      <NativeSwitch {...props}/>
    </SelfHosted>
  );
}

function NativeSwitch({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
}: SwitchProps) {
  const modifiers: ViewModifier[] = [];
  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <Toggle
      isOn={value}
      onIsOnChange={onValueChange}
      label={label}
      modifiers={modifiers}
      testID={testID}
    />
  );
}
