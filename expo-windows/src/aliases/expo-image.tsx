import type {
  ImageBackgroundProps as ExpoImageBackgroundProps,
  ImageContentPosition,
  ImageErrorEventData,
  ImageLoadEventData,
  ImageLoadOptions,
  ImagePrefetchOptions,
  ImageProgressEventData,
  ImageProps as ExpoImageProps,
  ImageSource,
  ImageTransition,
} from 'expo-image';
import type {ComponentRef, DependencyList} from 'react';
import type {ImageStyle, NativeSyntheticEvent, StyleProp, ViewStyle} from 'react-native';
import {createRef, PureComponent, useEffect, useRef, useState} from 'react';
import {Image as NativeImage, processColor, StyleSheet, View} from 'react-native';
import type {CachePolicy, ResolvedImageSource} from '../modules/image';
import {clearDiskCache, clearMemoryCache, generateBlurhash, getCachePath, ImageRef, isImageRef, loadImage, prefetch, readFromCache, writeToCache} from '../modules/image';
import {UnavailabilityError} from '../modules/base';
import NativeImageView, {Commands} from '../windows/specs/ExpoWindowsImageViewNativeComponent';

/**
 * `expo-image` on Windows: `withWindows` resolves the package to this file,
 * which draws through the runtime's image island — WinUI `Image`s fed by
 * the system's codecs, `SvgImageSource` for SVG, a blurhash decoded by the
 * runtime, a disk cache under the app's cache folder — with the package's
 * own props, events, statics and hook over it. Where the package's type
 * for a prop is wider than what Windows draws, the rest is taken without
 * effect: the priority, the responsive policy, the decode format, the
 * live text, the SF Symbol effects.
 */
export type ImageProps = ExpoImageProps;
export type ImageBackgroundProps = ExpoImageBackgroundProps;
export {ImageRef};
export type {ImageSource, ImageStyle};

type AnyImageSource = ImageProps['source'];
type Position = {top?: number | string; left?: number | string; right?: number | string; bottom?: number | string};

const POSITIONS: Record<string, Position> = {
  center: {top: '50%', left: '50%'},
  top: {top: 0, left: '50%'},
  right: {top: '50%', right: 0},
  bottom: {bottom: 0, left: '50%'},
  left: {top: '50%', left: 0},
  'top center': {top: 0, left: '50%'},
  'top right': {top: 0, right: 0},
  'top left': {top: 0, left: 0},
  'right center': {top: '50%', right: 0},
  'right top': {top: 0, right: 0},
  'right bottom': {bottom: 0, right: 0},
  'bottom center': {bottom: 0, left: '50%'},
  'bottom right': {bottom: 0, right: 0},
  'bottom left': {bottom: 0, left: 0},
  'left center': {top: '50%', left: 0},
  'left top': {top: 0, left: 0},
  'left bottom': {bottom: 0, left: 0},
};

function isBlurhash(text: string): boolean {
  return /^(blurhash:\/)+[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(text);
}

function hashUri(type: string, hash: string): string {
  return `${type}:/${encodeURI(hash).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
}

/** `blurhash:/<hash>/<width>/<height>` (or the hash alone) as a source the island decodes at that size. */
export function resolveBlurhash(text: string): ResolvedImageSource {
  const [hash = '', width = '', height = ''] = text.replace(/^blurhash:\//, '').split('/');
  return {uri: hashUri('blurhash', hash), width: parseInt(width, 10) || 16, height: parseInt(height, 10) || 16};
}

/** One source as the island takes it: a URI with what is known; null for nothing. */
export function resolveSource(source?: ImageSource | ImageRef | string | number | null): ResolvedImageSource | null {
  if (typeof source === 'string') {
    if (isBlurhash(source)) return resolveBlurhash(source);
    if (source.startsWith('thumbhash:/')) return {uri: hashUri('thumbhash', source.replace(/^thumbhash:\//, '').replace(/\//g, '\\'))};
    if (source.startsWith('sf:')) return {uri: `sf:/${source.slice(3)}`};
    return {uri: source};
  }
  if (typeof source === 'number') {
    const asset = NativeImage.resolveAssetSource(source);
    return asset ? {uri: asset.uri, width: asset.width, height: asset.height, scale: asset.scale} : null;
  }
  if (isImageRef(source)) return source.toSource();
  if (source && typeof source === 'object') {
    const {blurhash, thumbhash, ...rest} = source;
    if (thumbhash) return {...resolveSource(`thumbhash:/${thumbhash}`), ...rest};
    if (blurhash) return {...resolveBlurhash(blurhash), ...rest};
    return rest.uri ? rest : null;
  }
  return null;
}

/** The sources as the island takes them, in the order given, without the ones that name nothing. */
export function resolveSources(sources?: AnyImageSource | ImageProps['placeholder'] | (ImageSource | ImageRef | string | number | null | undefined)[]): ResolvedImageSource[] {
  const list: (ImageSource | ImageRef | string | number | null | undefined)[] = Array.isArray(sources) ? sources : [sources as ImageSource | string | number | null | undefined];
  return list.map(source => resolveSource(source)).filter((source): source is ResolvedImageSource => source !== null);
}

export function resolveContentPosition(position?: ImageContentPosition): Position {
  if (typeof position === 'string') return POSITIONS[position] ?? POSITIONS.center;
  return position ?? POSITIONS.center;
}

export function resolveTransition(transition?: ImageProps['transition'], fadeDuration?: number): ImageTransition | null {
  if (typeof transition === 'number') return {duration: transition};
  if (transition) return transition;
  return typeof fadeDuration === 'number' ? {duration: fadeDuration} : null;
}

/** A colour as `#rrggbbaa`, the way the island takes a tint; empty for none. */
export function hexOf(color: ImageProps['tintColor'] | ImageStyle['tintColor']): string {
  const processed = color ? processColor(color) : null;
  if (typeof processed !== 'number') return '';
  const argb = processed >>> 0;
  const hex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${hex((argb >> 16) & 255)}${hex((argb >> 8) & 255)}${hex(argb & 255)}${hex((argb >>> 24) & 255)}`;
}

function json(value: unknown[] | object | null): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '';
  return JSON.stringify(value);
}

type LoadNativeEvent = {url: string; width: number; height: number; isAnimated: boolean; mediaType: string; cacheType: string};

/**
 * The image: the package's component over the island, with its statics
 * over the runtime's loader. Recycling keys remount the island, so a
 * reused row starts empty as on the other platforms.
 */
export class Image extends PureComponent<ImageProps> {
  /** @hidden The reference class, as the package exposes it. */
  static Image = ImageRef;

  static async prefetch(urls: string | string[], options?: ImagePrefetchOptions['cachePolicy'] | ImagePrefetchOptions): Promise<boolean> {
    let cachePolicy: CachePolicy = 'memory-disk';
    let headers: Record<string, string> | undefined;
    if (typeof options === 'string') cachePolicy = options;
    else if (options) {
      cachePolicy = options.cachePolicy ?? cachePolicy;
      headers = options.headers;
    }
    return prefetch(Array.isArray(urls) ? urls : [urls], cachePolicy, headers);
  }

  static async clearMemoryCache(): Promise<boolean> {
    return clearMemoryCache();
  }

  static async clearDiskCache(): Promise<boolean> {
    return clearDiskCache();
  }

  static async getCachePathAsync(cacheKey: string): Promise<string | null> {
    return getCachePath(cacheKey);
  }

  static async writeToCacheAsync(source: string | ImageRef, cacheKey: string): Promise<void> {
    return writeToCache(source, cacheKey);
  }

  static async readFromCacheAsync(cacheKey: string): Promise<ImageRef | null> {
    return readFromCache(cacheKey);
  }

  /** The cache is the runtime's own; its eviction is not configurable. */
  static configureCache(): void {}

  static async generateBlurhashAsync(source: string | ImageRef, numberOfComponents?: [number, number] | {width: number; height: number}): Promise<string | null> {
    return generateBlurhash(source, numberOfComponents);
  }

  static async generateThumbhashAsync(): Promise<string> {
    throw new UnavailabilityError('ExpoImage', 'generateThumbhashAsync');
  }

  static async loadAsync(source: ImageSource | string | number, _options?: ImageLoadOptions): Promise<ImageRef> {
    const resolved = resolveSource(source);
    if (!resolved) throw new Error('expo-image: loadAsync was given a source that names no image');
    return loadImage(resolved);
  }

  island = createRef<ComponentRef<typeof NativeImageView>>();

  getAnimatableRef = () => this;

  async startAnimating(): Promise<void> {
    if (this.island.current) Commands.startAnimating(this.island.current);
  }

  async stopAnimating(): Promise<void> {
    if (this.island.current) Commands.stopAnimating(this.island.current);
  }

  /** The island reloads on request and never on its own, so there is nothing to lock. */
  async lockResourceAsync(): Promise<void> {}

  async unlockResourceAsync(): Promise<void> {}

  async reloadAsync(): Promise<void> {
    if (this.island.current) Commands.reload(this.island.current);
  }

  private onLoad = (event: NativeSyntheticEvent<LoadNativeEvent>) => {
    const {cacheType, ...source} = event.nativeEvent;
    this.props.onLoad?.({cacheType, source: {...source, mediaType: source.mediaType || null}} as ImageLoadEventData);
    this.props.onLoadEnd?.();
  };

  private onError = (event: NativeSyntheticEvent<{error: string}>) => {
    this.props.onError?.({error: event.nativeEvent.error} as ImageErrorEventData);
    this.props.onLoadEnd?.();
  };

  private onProgress = (event: NativeSyntheticEvent<{loaded: number; total: number}>) => {
    this.props.onProgress?.({loaded: event.nativeEvent.loaded, total: event.nativeEvent.total} as ImageProgressEventData);
  };

  render() {
    const {
      source,
      placeholder,
      defaultSource,
      loadingIndicatorSource,
      contentFit,
      placeholderContentFit = 'scale-down',
      contentPosition,
      transition,
      fadeDuration,
      resizeMode,
      cachePolicy = 'disk',
      tintColor,
      blurRadius = 0,
      autoplay = true,
      recyclingKey,
      alt,
      accessibilityLabel,
      style,
      onLoadStart,
      onDisplay,
      // Taken without effect: what Windows draws the same way regardless, or has no counterpart for.
      priority: _priority,
      allowDownscaling: _downscaling,
      responsivePolicy: _responsive,
      decodeFormat: _decode,
      enableLiveTextInteraction: _liveText,
      useAppleWebpCodec: _appleWebp,
      sfEffect: _sfEffect,
      onLoad: _onLoad,
      onError: _onError,
      onLoadEnd: _onLoadEnd,
      onProgress: _onProgress,
      ...rest
    } = this.props;
    const flat = (StyleSheet.flatten(style) as ImageStyle | undefined) ?? {};
    const {resizeMode: styleResizeMode, tintColor: styleTint, ...restStyle} = flat as ImageStyle & {resizeMode?: string};
    const fit = contentFit ?? ({contain: 'contain', cover: 'cover', none: 'none', stretch: 'fill', center: 'scale-down', repeat: 'cover'} as Record<string, string>)[(resizeMode ?? styleResizeMode) as string] ?? 'cover';
    return (
      <NativeImageView
        key={recyclingKey ?? undefined}
        ref={this.island}
        {...rest}
        style={restStyle as StyleProp<ViewStyle>}
        accessibilityLabel={accessibilityLabel ?? alt}
        source={json(resolveSources(source))}
        placeholder={json(resolveSources(placeholder ?? defaultSource ?? loadingIndicatorSource))}
        contentFit={fit}
        placeholderContentFit={placeholderContentFit}
        contentPosition={json(resolveContentPosition(contentPosition))}
        transition={json(resolveTransition(transition, fadeDuration))}
        cachePolicy={cachePolicy ?? 'disk'}
        tintColor={hexOf(tintColor ?? styleTint)}
        blurRadius={blurRadius}
        autoplay={autoplay}
        onLoadStart={() => onLoadStart?.()}
        onLoad={this.onLoad}
        onError={this.onError}
        onProgress={this.onProgress}
        onDisplay={() => onDisplay?.()}
      />
    );
  }
}

export function ImageBackground({style, imageStyle, children, ...props}: ImageBackgroundProps) {
  return (
    <View style={style}>
      <Image {...props} style={[StyleSheet.absoluteFill, imageStyle]}/>
      {children}
    </View>
  );
}

/**
 * Loads the source through the runtime's loader and answers with its
 * reference once it is there, again when the URI or a dependency changes;
 * `onError` hears a failure with a retry, else the console does.
 */
export function useImage(source: ImageSource | string | number, options: ImageLoadOptions = {}, dependencies: DependencyList = []): ImageRef | null {
  const resolved = resolveSource(source);
  const [image, setImage] = useState<ImageRef | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const uri = resolved?.uri;
  useEffect(() => {
    let valid = true;
    function load() {
      Image.loadAsync(resolved ?? '')
        .then(loaded => {
          if (valid) setImage(loaded);
        })
        .catch((error: Error) => {
          if (!valid) return;
          if (latest.current.onError) latest.current.onError(error, load);
          else console.error(`Loading an image from '${uri}' failed, use 'onError' option to handle errors and suppress this message`, error);
        });
    }
    load();
    return () => {
      valid = false;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, ...dependencies]);
  return image;
}

export default Image;
