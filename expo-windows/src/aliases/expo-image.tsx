import type {ImageBackgroundProps, ImageProps as ExpoImageProps, ImageSource, ImageStyle} from 'expo-image';
import type {ImageResizeMode, ImageSourcePropType, StyleProp} from 'react-native';
import {Image as NativeImage, ImageBackground as NativeImageBackground} from 'react-native';

/**
 * `expo-image` on Windows: `withWindows` resolves the package to this file,
 * which draws the same `source` and `contentFit` with React Native's `Image`
 * — `ExpoImage` is a native view with no Windows implementation, and its
 * module throws at import. Caching, the blurhash and transitions come with
 * a real island in a later release; until then the props are accepted and
 * the image is drawn plainly.
 */
export type ImageProps = ExpoImageProps;

const RESIZE_MODES: Record<string, ImageResizeMode> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'stretch',
  none: 'center',
  'scale-down': 'contain',
};

/** `expo-image`'s source — a URI string, a module id, an object or a list of them — as React Native's. */
export function toNativeSource(source: ImageProps['source']): ImageSourcePropType | undefined {
  if (source == null) return undefined;
  if (typeof source === 'string') return {uri: source};
  if (typeof source === 'number') return source;
  if (Array.isArray(source)) {
    const first = source[0] as ImageSource | number | string | undefined;
    return first === undefined ? undefined : toNativeSource(first);
  }
  const {uri, width, height, headers} = source as ImageSource;
  return uri ? {uri, width: width ?? undefined, height: height ?? undefined, headers} : undefined;
}

export function Image({source, contentFit = 'cover', style, accessibilityLabel, alt, testID, onLoad, onError}: ImageProps) {
  return (
    <NativeImage
      source={toNativeSource(source)}
      resizeMode={RESIZE_MODES[contentFit] ?? 'cover'}
      style={style as StyleProp<ImageStyle>}
      accessibilityLabel={accessibilityLabel ?? alt}
      testID={testID}
      onLoad={onLoad as never}
      onError={onError as never}
    />
  );
}

export function ImageBackground({source, contentFit = 'cover', style, children, testID}: ImageBackgroundProps) {
  return (
    <NativeImageBackground
      source={toNativeSource(source)}
      resizeMode={RESIZE_MODES[contentFit] ?? 'cover'}
      style={style as StyleProp<ImageStyle>}
      testID={testID}>
      {children}
    </NativeImageBackground>
  );
}

export default Image;
