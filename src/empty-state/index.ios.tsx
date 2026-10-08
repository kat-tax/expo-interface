import type {EmptyStateProps} from './types';
import {Platform, StyleSheet, View} from 'react-native';
import {ContentUnavailableView, ProgressView, Text, VStack} from '@expo/ui/swift-ui';
import {font, foregroundStyle, frame, multilineTextAlignment, padding, progressViewStyle, textSelection} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {NativeHost} from '../host';
import {spacing, useColor} from '../theme';
import {DrawnEmptyState} from './drawn';
import {EMPTY_ICON, EmptyStateAction} from './shared';
import {isActionData} from './types';

/** `ContentUnavailableView` arrived in iOS 17; below that the kit draws it. */
const SUPPORTED = Number.parseInt(String(Platform.Version), 10) >= 17;

/**
 * iOS shows the system's own `ContentUnavailableView`, so an empty screen has
 * Apple's layout, metrics and Dynamic Type behaviour rather than an
 * approximation of them.
 *
 * The view and the action share one host that fills the width, so the
 * description wraps at the screen's width and an `action` given as data is
 * the kit's SwiftUI button under the view, native beside native. A node of
 * the app's own is React Native and sits underneath the host instead.
 *
 * While `loading` the view is composed by hand to the same layout, since the
 * system view takes a symbol and nothing else above its title.
 */
export function EmptyState(props: EmptyStateProps) {
  if (!SUPPORTED) return <DrawnEmptyState {...props}/>;
  const {title, description, icon, action, loading = false, selectable = true, testID, style} = props;
  const data = isActionData(action);
  return (
    <View style={[styles.column, style]} testID={testID}>
      <NativeHost>
        <VStack spacing={spacing.three} modifiers={[frame({maxWidth: Infinity})]}>
          {loading ? (
            <Composed title={title} description={description} selectable={selectable}/>
          ) : (
            <ContentUnavailableView
              title={title}
              description={description}
              systemImage={icon ? iosSymbol(icon) : undefined}
              modifiers={[textSelection(selectable)]}
            />
          )}
          {data ? <EmptyStateAction action={action} testID={testID}/> : null}
        </VStack>
      </NativeHost>
      {action && !data ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/**
 * The system view's layout with the spinner in the symbol's place, in the
 * symbol's size: the title in the bold title2 style and the description in
 * the secondary color, centred, as `ContentUnavailableView` draws them. It
 * pads by the system's standard inset and fills what it is offered, as the
 * system view does, so a long description stops short of the edges and the
 * state stays where it is when loading ends.
 */
function Composed({title, description, selectable}: {title: string; description?: string; selectable: boolean}) {
  const secondary = useColor('secondaryLabel');
  return (
    // The padding comes before the frame, so the padded content is centred in it.
    <VStack spacing={spacing.one} modifiers={[padding({all: 'default'}), frame({maxWidth: Infinity, maxHeight: Infinity}), textSelection(selectable)]}>
      <ProgressView modifiers={[progressViewStyle('circular'), frame({width: EMPTY_ICON, height: EMPTY_ICON})]}/>
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
