import type {SheetBarProps} from './shared';
import {HStack, Text, VStack} from '@expo/ui/swift-ui';
import {font, foregroundStyle, frame} from '@expo/ui/swift-ui/modifiers';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {useColor} from '../theme';
import {BAR_HEIGHT, BAR_SIDE, sub} from './shared';

/**
 * iOS: the bar as SwiftUI content at the top of the sheet, a sibling of the
 * React Native body: the title in the headline font over the subtitle in
 * the secondary color, the kit's buttons (bare SwiftUI buttons here, inside
 * the sheet's host) at the two ends, which are the same width whichever
 * holds one so the title stays centred.
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, testID}: SheetBarProps) {
  const label = useColor('label');
  const secondary = useColor('secondaryLabel');
  return (
    <HStack alignment="center" spacing={0} modifiers={[frame({maxWidth: Infinity, minHeight: BAR_HEIGHT})]} testID={testID}>
      <HStack alignment="center" spacing={0} modifiers={[frame({minWidth: BAR_SIDE, alignment: 'leading'})]}>
        {onBack ? (
          <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
        ) : null}
      </HStack>
      <VStack alignment="center" spacing={2} modifiers={[frame({maxWidth: Infinity})]}>
        {title !== undefined ? (
          <Text modifiers={[font({size: 17, weight: 'semibold'}), foregroundStyle({type: 'color', color: label})]}>{title}</Text>
        ) : null}
        {subtitle !== undefined ? (
          <Text modifiers={[font({size: 13}), foregroundStyle({type: 'color', color: secondary})]}>{subtitle}</Text>
        ) : null}
      </VStack>
      <HStack alignment="center" spacing={0} modifiers={[frame({minWidth: BAR_SIDE, alignment: 'trailing'})]}>
        {menu && menu.length > 0 ? (
          <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
        ) : null}
        {onClose ? (
          <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
        ) : null}
      </HStack>
    </HStack>
  );
}
