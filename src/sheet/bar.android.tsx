import type {SheetBarProps} from './shared';
import {Column, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, height as heightModifier, testID as testIDModifier, weight, width as widthModifier} from '@expo/ui/jetpack-compose/modifiers';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {BAR_HEIGHT, BAR_SIDE, sub} from './shared';

/**
 * Android: the bar as Compose content at the top of the sheet's column, in
 * the Material typography the sheet's palette
 * gives: the title over the subtitle, the kit's buttons (bare Compose
 * buttons here, inside the sheet's host) at the two ends, which are the
 * same width whichever holds one so the title stays centred. Compose has no
 * app bar in `@expo/ui`, so this row is it.
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, testID}: SheetBarProps) {
  const colors = useMaterialColors();
  return (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth(), heightModifier(BAR_HEIGHT), ...(testID ? [testIDModifier(testID)] : [])]}>
      <Row verticalAlignment="center" modifiers={[widthModifier(BAR_SIDE)]}>
        {onBack ? (
          <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
        ) : null}
      </Row>
      <Column horizontalAlignment="center" modifiers={[weight(1)]}>
        {title !== undefined ? <Text color={colors.onSurface} style={{typography: 'titleMedium'}} maxLines={1}>{title}</Text> : null}
        {subtitle !== undefined ? <Text color={colors.onSurfaceVariant} style={{typography: 'bodySmall'}} maxLines={1}>{subtitle}</Text> : null}
      </Column>
      <Row verticalAlignment="center" horizontalArrangement="end" modifiers={[widthModifier(BAR_SIDE)]}>
        {menu && menu.length > 0 ? (
          <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
        ) : null}
        {onClose ? (
          <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
        ) : null}
      </Row>
    </Row>
  );
}
