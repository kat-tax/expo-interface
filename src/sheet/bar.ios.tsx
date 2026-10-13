import type {SheetBarProps} from './shared';
import {useContext} from 'react';
import {HStack, Text, VStack} from '@expo/ui/swift-ui';
import {fixedSize, font, foregroundStyle, frame, lineLimit, onGeometryChange} from '@expo/ui/swift-ui/modifiers';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {useColor} from '../theme';
import {useSheetBarFit} from './bar-fit';
import {BAR_HEIGHT, sub} from './shared';
import {SheetContentWidthContext} from './width';

/**
 * iOS: the bar as SwiftUI content at the top of the sheet's stack: the
 * title in the headline font over the subtitle in the secondary color, one
 * line each, and the kit's buttons (bare SwiftUI buttons here, inside the
 * sheet's host) at the two ends, which are as wide as the wider of them
 * whichever holds one, so the title stays centred. Each end's content
 * reports its width, and the bar is the width the sheet's column measured.
 *
 * The accessory placed in the bar is SwiftUI content at the leading end,
 * after the back button, at its own ideal width, as a toolbar item is: a
 * control that grows to the room it is offered, a segmented picker, would
 * otherwise take the bar. Where the bar has no room for it, it is in a row
 * of its own under the bar (`useSheetBarFit`).
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, accessory, testID}: SheetBarProps) {
  const label = useColor('label');
  const secondary = useColor('secondaryLabel');
  const width = useContext(SheetContentWidthContext);
  const {inBar, side, onLeading, onTrailing} = useSheetBarFit({title, subtitle, accessory}, width);
  return (
    <>
      <HStack alignment="center" spacing={0} modifiers={[frame({maxWidth: Infinity, minHeight: BAR_HEIGHT})]} testID={testID}>
        <HStack alignment="center" spacing={0} modifiers={[frame({minWidth: side, alignment: 'leading'})]}>
          <HStack alignment="center" spacing={0} modifiers={[fixedSize({horizontal: true, vertical: false}), onGeometryChange(size => onLeading(size.width))]}>
            {onBack ? (
              <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
            ) : null}
            {inBar ? accessory : null}
          </HStack>
        </HStack>
        <VStack alignment="center" spacing={2} modifiers={[frame({maxWidth: Infinity})]}>
          {title !== undefined ? (
            <Text modifiers={[font({size: 17, weight: 'semibold'}), foregroundStyle({type: 'color', color: label}), lineLimit(1)]}>{title}</Text>
          ) : null}
          {subtitle !== undefined ? (
            <Text modifiers={[font({size: 13}), foregroundStyle({type: 'color', color: secondary}), lineLimit(1)]}>{subtitle}</Text>
          ) : null}
        </VStack>
        <HStack alignment="center" spacing={0} modifiers={[frame({minWidth: side, alignment: 'trailing'})]}>
          <HStack alignment="center" spacing={0} modifiers={[onGeometryChange(size => onTrailing(size.width))]}>
            {menu && menu.length > 0 ? (
              <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
            ) : null}
            {onClose ? (
              <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
            ) : null}
          </HStack>
        </HStack>
      </HStack>
      {inBar ? null : accessory}
    </>
  );
}
