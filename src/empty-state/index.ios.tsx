import type {EmptyStateProps} from './types';
import {Platform, StyleSheet, View} from 'react-native';
import {ContentUnavailableView} from '@expo/ui/swift-ui';
import {iosSymbol} from '../button/shared';
import {NativeHost} from '../host';
import {spacing} from '../theme';
import {DrawnEmptyState} from './drawn';

/** `ContentUnavailableView` arrived in iOS 17; below that the kit draws it. */
const SUPPORTED = Number.parseInt(String(Platform.Version), 10) >= 17;

/**
 * iOS shows the system's own `ContentUnavailableView`, so an empty screen has
 * Apple's layout, metrics and Dynamic Type behaviour rather than an
 * approximation of them.
 *
 * An `action` stays React Native and sits underneath: the native view takes a
 * title, a symbol and a description and nothing else, and a kit `Button` is not
 * one of its children.
 */
export function EmptyState(props: EmptyStateProps) {
  if (!SUPPORTED) return <DrawnEmptyState {...props}/>;
  const {title, description, icon, action, testID, style} = props;
  return (
    <View style={[styles.column, style]} testID={testID}>
      <NativeHost fit>
        <ContentUnavailableView
          title={title}
          description={description}
          systemImage={icon ? iosSymbol(icon) : undefined}
        />
      </NativeHost>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
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
