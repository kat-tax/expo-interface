import type {SFSymbol} from 'expo-symbols';
import type {EmptyStateProps} from './types';
import {Platform, StyleSheet, View} from 'react-native';
import {ContentUnavailableView, Image, ProgressView, RNHostView, Text, VStack} from '@expo/ui/swift-ui';
import {controlSize, fixedSize, font, foregroundStyle, frame, multilineTextAlignment, padding, progressViewStyle, textSelection} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {NativeHost, NativeHostContext, useNativeHost} from '../host';
import {spacing, useColor} from '../theme';
import {EMPTY_ICON, EmptyStateAction} from './shared';
import {isActionData} from './types';

/** `ContentUnavailableView` arrived in iOS 17; below that the layout is composed in SwiftUI. */
const SUPPORTED = Number.parseInt(String(Platform.Version), 10) >= 17;

/**
 * iOS shows the system's own `ContentUnavailableView`, so an empty screen has
 * Apple's layout, metrics and Dynamic Type behaviour rather than an
 * approximation of them.
 *
 * The view and the action share one stack, so an `action` given as data is
 * the kit's SwiftUI button under the view, native beside native. Outside a
 * host the stack gets one of its own that fills the width, so the description
 * wraps at the screen's width, and a node of the app's own is React Native
 * underneath the host. Inside a host (a `Screen native`, a `Sheet`, a hosted
 * `List`'s `empty`) the stack renders bare, as every self-hosting control
 * does, and a node of the app's own rides in it as hosted React Native.
 *
 * The view takes its own height and the stack is the part that fills: a
 * system view left to fill a host of a definite size would push the action
 * to the host's bottom edge, where the stack instead centres the two as one.
 *
 * While `loading`, and on iOS 16 where the system view does not exist, the
 * view is composed by hand to the same layout, since the system view takes a
 * symbol and nothing else above its title.
 */
export function EmptyState(props: EmptyStateProps) {
  const hosted = useNativeHost();
  const stack = <EmptyStateStack {...props} hosted={hosted}/>;
  if (hosted) return stack;
  const {action, testID, style} = props;
  return (
    <View style={[styles.column, style]} testID={testID}>
      <NativeHost>{stack}</NativeHost>
      {action && !isActionData(action) ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/** The view and the action in one SwiftUI stack, with the test ID on it when there is no view around it. */
function EmptyStateStack({title, description, icon, action, loading = false, selectable = true, testID, hosted}: EmptyStateProps & {hosted: boolean}) {
  const data = isActionData(action);
  const symbol = icon ? iosSymbol(icon) : undefined;
  // Its own host fits the height, so only a bare stack has height to fill.
  const fill = frame(hosted ? {maxWidth: Infinity, maxHeight: Infinity} : {maxWidth: Infinity});
  return (
    <VStack spacing={spacing.three} testID={hosted ? testID : undefined} modifiers={[fill]}>
      {SUPPORTED && !loading ? (
        <ContentUnavailableView
          title={title}
          description={description}
          systemImage={symbol}
          modifiers={[fixedSize({vertical: true}), textSelection(selectable)]}
        />
      ) : (
        <Composed title={title} description={description} symbol={symbol} loading={loading} selectable={selectable}/>
      )}
      {data ? <EmptyStateAction action={action} testID={testID}/> : null}
      {hosted && action && !data ? (
        // The stack's spacing separates it, so no margin: the hosted view's
        // size is its frame, which a margin would fall outside of.
        <RNHostView matchContents>
          {/* React Native again, so the kit's controls in the node mount hosts of their own. */}
          <NativeHostContext.Provider value={false}>
            <View>{action}</View>
          </NativeHostContext.Provider>
        </RNHostView>
      ) : null}
    </VStack>
  );
}

/**
 * The system view's layout, composed: the symbol, or while loading the large
 * spinner in the symbol's 48 point slot, the title in the bold title2 style and
 * the description in the secondary color, centred, as
 * `ContentUnavailableView` draws them. It pads by the system's standard inset,
 * so a long description stops short of the edges, and it is as flexible as
 * the system view and takes its own height in the stack as the system view
 * does, so the state stays where it is when loading ends.
 */
function Composed({title, description, symbol, loading, selectable}: {title: string; description?: string; symbol?: SFSymbol; loading: boolean; selectable: boolean}) {
  const secondary = useColor('secondaryLabel');
  return (
    // The padding comes before the frame, so the padded content is centred in it.
    <VStack spacing={spacing.one} modifiers={[padding({all: 'default'}), frame({maxWidth: Infinity, maxHeight: Infinity}), fixedSize({vertical: true}), textSelection(selectable)]}>
      {loading ? (
        // SwiftUI's spinner keeps its own size whatever its frame, so the large
        // one, centred in the symbol's slot.
        <ProgressView modifiers={[progressViewStyle('circular'), controlSize('large'), frame({width: EMPTY_ICON, height: EMPTY_ICON})]}/>
      ) : symbol ? (
        <Image systemName={symbol} size={EMPTY_ICON} color={secondary}/>
      ) : null}
      <Text modifiers={[font({textStyle: 'title2', weight: 'bold'}), multilineTextAlignment('center')]}>{title}</Text>
      {description ? (
        <Text modifiers={[foregroundStyle({type: 'color', color: secondary}), multilineTextAlignment('center')]}>{description}</Text>
      ) : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    marginTop: spacing.two,
  },
});
