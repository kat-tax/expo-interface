import type {MenuItem} from '../menu/types';
import type {PopupMenuProps} from './types';
import {Fragment} from 'react';
import {StyleSheet} from 'react-native';
import {Button, Divider, HStack, Image, Popover, Spacer, Text, VStack} from '@expo/ui/swift-ui';
import {buttonStyle, foregroundStyle, frame, opacity, padding} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {NativeHost} from '../host';
import {useColor} from '../theme';
import {anchorPoint, filterItems} from './types';

/** Width the popover asks for, so its rows are not squeezed to their text. */
const MIN_WIDTH = 220;
const ICON_SIZE = 16;

/**
 * Where the popover's arrow sits for each preference: on its top edge for a
 * popover under the anchor, on its bottom edge for one over it. A point with
 * no preference leaves the side to the system.
 */
function arrowEdgeFor(rect: boolean, edge: 'auto' | 'top' | 'bottom'): 'top' | 'bottom' | undefined {
  if (edge === 'top') return 'bottom';
  return edge === 'bottom' || rect ? 'top' : undefined;
}

/**
 * iOS presents a SwiftUI `popover` from a point-sized anchor laid over the
 * content — the only SwiftUI presentation that opens where it is asked to,
 * and the one UIKit uses for an editor's own menus. `presentationCompact-
 * Adaptation` keeps it a popover on a phone rather than a sheet. Beside a
 * rectangle the anchor is the rectangle's bottom edge, or its top edge when
 * the top is asked for, and the arrow is fixed to that side.
 *
 * A popover's content is drawn by hand rather than taken from a `Menu`,
 * which SwiftUI only opens from its own button.
 */
export function PopupMenu({items, at, preferredEdge = 'auto', filter, onDismiss, testID}: PopupMenuProps) {
  const point = anchorPoint(at, preferredEdge);
  return (
    <NativeHost
      fit
      pointerEvents="box-none"
      style={[styles.anchor, {left: point.x, top: point.y}]}>
      <Popover
        isPresented={at != null}
        arrowEdge={arrowEdgeFor(at !== null && 'width' in at, preferredEdge)}
        onIsPresentedChange={presented => {
          if (!presented) onDismiss?.('dismiss');
        }}
        testID={testID}>
        <Popover.Trigger>
          <Spacer modifiers={[frame({width: 1, height: 1})]}/>
        </Popover.Trigger>
        <Popover.Content>
          <PopupItems items={filterItems(items, filter)} onClose={() => onDismiss?.('select')}/>
        </Popover.Content>
      </Popover>
    </NativeHost>
  );
}

function PopupItems({items, onClose}: {items: MenuItem[]; onClose: () => void}) {
  const label = useColor('label');
  const tint = useColor('tint');
  const destructive = useColor('destructive');
  return (
    <VStack spacing={0} modifiers={[frame({minWidth: MIN_WIDTH}), padding({vertical: 8})]}>
      {items.map((item, index) => {
        const color = item.role === 'destructive' ? destructive : label;
        return (
          <Fragment key={index}>
            {item.separator && index > 0 ? <Divider/> : null}
            <Button
              onPress={() => {
                if (item.disabled) return;
                item.onPress?.();
                onClose();
              }}
              modifiers={[buttonStyle('plain'), ...(item.disabled ? [opacity(0.4)] : [])]}>
              <HStack spacing={10} modifiers={[padding({horizontal: 16, vertical: 8})]}>
                {item.icon ? <Image systemName={iosSymbol(item.icon)} color={color} size={ICON_SIZE}/> : null}
                <Text modifiers={[foregroundStyle({type: 'color', color})]}>{item.label}</Text>
                <Spacer/>
                {item.active ? <Image systemName="checkmark" color={tint} size={ICON_SIZE}/> : null}
              </HStack>
            </Button>
          </Fragment>
        );
      })}
    </VStack>
  );
}

const styles = StyleSheet.create({
  anchor: {position: 'absolute'},
});
