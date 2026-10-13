import type {SheetBarProps} from './shared';
import {useContext} from 'react';
import {Column, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {defaultMinSize, fillMaxWidth, height as heightModifier, onSizeChanged, testID as testIDModifier, weight} from '@expo/ui/jetpack-compose/modifiers';
import {Button} from '../button';
import {BACK, CLOSE, MORE} from '../glyphs';
import {Menu} from '../menu';
import {useSheetBarFit} from './bar-fit';
import {BAR_HEIGHT, sub} from './shared';
import {SheetContentWidthContext} from './width';

/**
 * Android: the bar as Compose content at the top of the sheet's column, in
 * the Material typography the sheet's palette gives: the title over the
 * subtitle, one line each, and the kit's buttons (bare Compose buttons
 * here, inside the sheet's host) at the two ends, which are as wide as the
 * wider of them whichever holds one, so the title stays centred. Each end
 * is at least that wide and grows to what it holds; its content reports its
 * width, and the bar is the width the sheet's column measured. Compose has
 * no app bar in `@expo/ui`, so this row is it.
 *
 * The accessory placed in the bar is Compose content at the leading end,
 * after the back button, or in a row of its own under the bar where the
 * bar has no room for it (`useSheetBarFit`).
 */
export function SheetBar({title, subtitle, onBack, onClose, menu, accessory, testID}: SheetBarProps) {
  const colors = useMaterialColors();
  const width = useContext(SheetContentWidthContext);
  const {inBar, side, onLeading, onTrailing} = useSheetBarFit({title, subtitle, accessory}, width);
  return (
    <>
      <Row verticalAlignment="center" modifiers={[fillMaxWidth(), heightModifier(BAR_HEIGHT), ...(testID ? [testIDModifier(testID)] : [])]}>
        <Row verticalAlignment="center" modifiers={[defaultMinSize({minWidth: side})]}>
          <Row verticalAlignment="center" modifiers={[onSizeChanged(size => onLeading(size.width))]}>
            {onBack ? (
              <Button label="Back" prefixIcon={BACK} hideLabel variant="text" tone="label" size="small" onPress={onBack} testID={sub(testID, 'back')}/>
            ) : null}
            {inBar ? accessory : null}
          </Row>
        </Row>
        <Column horizontalAlignment="center" modifiers={[weight(1)]}>
          {title !== undefined ? <Text color={colors.onSurface} style={{typography: 'titleMedium'}} maxLines={1}>{title}</Text> : null}
          {subtitle !== undefined ? <Text color={colors.onSurfaceVariant} style={{typography: 'bodySmall'}} maxLines={1}>{subtitle}</Text> : null}
        </Column>
        <Row verticalAlignment="center" horizontalArrangement="end" modifiers={[defaultMinSize({minWidth: side})]}>
          <Row verticalAlignment="center" modifiers={[onSizeChanged(size => onTrailing(size.width))]}>
            {menu && menu.length > 0 ? (
              <Menu label="More" icon={MORE} hideLabel variant="text" tone="label" size="small" items={menu} testID={sub(testID, 'menu')}/>
            ) : null}
            {onClose ? (
              <Button label="Close" prefixIcon={CLOSE} hideLabel variant="text" tone="label" size="small" onPress={onClose} testID={sub(testID, 'close')}/>
            ) : null}
          </Row>
        </Row>
      </Row>
      {inBar ? null : accessory}
    </>
  );
}
