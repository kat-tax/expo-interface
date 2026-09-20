import type {ChipProps} from './types';
import {AssistChip, FilterChip, Icon, SuggestionChip, Text} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SIZE_ICON} from '../button/shared';
import {useColor} from '../theme';
import {chipKind, nextSelected} from './shared';

/** Material sizes a chip's icon at 18dp; the small button icon is the same. */
const ICON = SIZE_ICON.small;

/**
 * Android is the one platform with a control called a chip, and it has four.
 * The kit uses three of them, chosen by what the props say the chip is:
 *
 * - `selected` given at all → `FilterChip`, which draws its own check when on.
 * - an `icon` and no state → `AssistChip`, Material's "help me do a thing".
 * - neither → `SuggestionChip`.
 *
 * The fourth, `InputChip`, is the one with a remove cross, and the kit does
 * not offer it: see `types.ts` for why.
 */
export function Chip(props: ChipProps) {
  const {label, onPress, selected, icon, disabled, testID} = props;
  const ink = useColor('label');
  const modifiers = testID ? [testIDModifier(testID)] : undefined;
  const press = () => onPress?.(nextSelected(props));
  if (chipKind(props) === 'filter') {
    return (
      <FilterChip selected={selected!} enabled={!disabled} onClick={press} modifiers={modifiers}>
        <FilterChip.Label><Text>{label}</Text></FilterChip.Label>
        {icon?.drawable ? (
          <FilterChip.LeadingIcon><Icon source={icon.drawable} size={ICON} tint={ink}/></FilterChip.LeadingIcon>
        ) : null}
      </FilterChip>
    );
  }
  if (icon?.drawable) {
    return (
      <AssistChip enabled={!disabled} onClick={press} modifiers={modifiers}>
        <AssistChip.Label><Text>{label}</Text></AssistChip.Label>
        <AssistChip.LeadingIcon><Icon source={icon.drawable} size={ICON} tint={ink}/></AssistChip.LeadingIcon>
      </AssistChip>
    );
  }
  return (
    <SuggestionChip enabled={!disabled} onClick={press} modifiers={modifiers}>
      <SuggestionChip.Label><Text>{label}</Text></SuggestionChip.Label>
    </SuggestionChip>
  );
}
