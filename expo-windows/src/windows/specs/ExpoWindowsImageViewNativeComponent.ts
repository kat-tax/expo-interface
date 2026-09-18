import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

// The events carry nothing; codegen wants an object type all the same.
// oxlint-disable-next-line typescript/no-empty-object-type
type EmptyEvent = Readonly<{}>;

type LoadEvent = Readonly<{
  url: string;
  width: CodegenTypes.Int32;
  height: CodegenTypes.Int32;
  isAnimated: boolean;
  mediaType: string;
  cacheType: string;
}>;

type ErrorEvent = Readonly<{error: string}>;

type ProgressEvent = Readonly<{loaded: CodegenTypes.Int32; total: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `Image` hosted in a XAML island: the view behind `expo-image`
 * on Windows. It shows the first of its sources — fetched into the disk
 * cache, decoded by the system's codecs, SVG through `SvgImageSource`, a
 * blurhash decoded by the runtime — fitted and placed as asked, over a
 * placeholder, with a cross-dissolve when the picture arrives.
 */
export interface NativeProps extends ViewProps {
  /** The sources as JSON: `[{uri, width, height, headers, cacheKey}]`; the first is shown. */
  source?: string;
  /** The placeholder as JSON, in the same shape; a `blurhash:/` URI is decoded here. */
  placeholder?: string;
  /** cover, contain, fill, none or scale-down. */
  contentFit?: string;
  placeholderContentFit?: string;
  /** The position as JSON: `{top, left, right, bottom}`, each a number of pixels or a percentage string. */
  contentPosition?: string;
  /** The transition as JSON: `{duration, timing, effect}`; empty for none. */
  transition?: string;
  /** none, disk, memory or memory-disk. */
  cachePolicy?: string;
  /** The tint as `#rrggbbaa`; empty for none. */
  tintColor?: string;
  blurRadius?: CodegenTypes.Double;
  autoplay?: CodegenTypes.WithDefault<boolean, true>;
  onLoadStart?: CodegenTypes.DirectEventHandler<EmptyEvent>;
  onLoad?: CodegenTypes.DirectEventHandler<LoadEvent>;
  onError?: CodegenTypes.DirectEventHandler<ErrorEvent>;
  onProgress?: CodegenTypes.DirectEventHandler<ProgressEvent>;
  onDisplay?: CodegenTypes.DirectEventHandler<EmptyEvent>;
}

export interface NativeCommands {
  startAnimating: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  stopAnimating: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  reload: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['startAnimating', 'stopAnimating', 'reload'],
});

export default codegenNativeComponent<NativeProps>('ExpoWindowsImageView');
