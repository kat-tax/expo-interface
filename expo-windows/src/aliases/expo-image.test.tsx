import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Image as NativeImage, Text, TurboModuleRegistry} from 'react-native';
import ExpoImage, {hexOf, Image, ImageBackground, ImageRef, resolveContentPosition, resolveSource, resolveSources, resolveTransition, useImage} from './expo-image';
import {Commands} from '../windows/specs/ExpoWindowsImageViewNativeComponent';

const LOADED = {uri: 'file:///C:/cache/abc', width: 40, height: 30, isAnimated: false, mediaType: 'image/png', cacheType: 'disk'};

function withLoader(overrides: Record<string, unknown> = {}) {
  const loader = {
    prefetch: vi.fn(async () => true),
    clearDiskCache: vi.fn(async () => true),
    clearMemoryCache: vi.fn(async () => true),
    getCachePath: vi.fn(async (key: string) => (key === 'known' ? 'C:\\cache\\known' : null)),
    writeToCache: vi.fn(async () => {}),
    load: vi.fn(async () => LOADED),
    generateBlurhash: vi.fn(async () => 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'),
    ...overrides,
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsImageLoader' ? loader : null) as never);
  return loader;
}

beforeEach(() => {
  for (const name of Object.keys(Commands) as (keyof typeof Commands)[]) vi.spyOn(Commands, name).mockImplementation(() => {});
});

describe('expo-image sources (windows)', () => {
  it('resolves every shape a source takes to what the island reads', () => {
    expect(resolveSource(undefined)).toBeNull();
    expect(resolveSource(null)).toBeNull();
    expect(resolveSource('https://x/a.png')).toEqual({uri: 'https://x/a.png'});
    expect(resolveSource('blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj/32/24')).toEqual({uri: 'blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 32, height: 24});
    expect(resolveSource('blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj')).toEqual({uri: 'blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 16, height: 16});
    // Without the prefix a hash is a URI, as the package reads it.
    expect(resolveSource('LEHV6nWB2yk8pyo0adR*.7kCMdnj')).toEqual({uri: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'});
    expect(resolveSource('blurhash:/L#?#/2/2')).toEqual({uri: 'blurhash:/L%23%3F%23', width: 2, height: 2});
    expect(resolveSource('thumbhash:/1QcSHQRnh493V4dIh4eXh1h4kJUI')).toEqual({uri: 'thumbhash:/1QcSHQRnh493V4dIh4eXh1h4kJUI'});
    expect(resolveSource('thumbhash:/a/b')).toEqual({uri: 'thumbhash:/a%5Cb'});
    expect(resolveSource('sf:star.fill')).toEqual({uri: 'sf:/star.fill'});
    expect(resolveSource({uri: 'https://x/h.png', headers: {a: 'b'}, cacheKey: 'k'})).toEqual({uri: 'https://x/h.png', headers: {a: 'b'}, cacheKey: 'k'});
    expect(resolveSource({blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 8, height: 6})).toEqual({uri: 'blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 8, height: 6});
    expect(resolveSource({thumbhash: 'abc', width: 3})).toEqual({uri: 'thumbhash:/abc', width: 3});
    expect(resolveSource({})).toBeNull();
    expect(resolveSource(new ImageRef('file:///C:/a.png', 4, 3, null, false))).toEqual({uri: 'file:///C:/a.png', width: 4, height: 3});
    vi.spyOn(NativeImage, 'resolveAssetSource').mockImplementation(id => (id === 7 ? {uri: 'file:///C:/Bundle/assets/icon.png', width: 10, height: 12, scale: 1, __packager_asset: true} : null) as never);
    expect(resolveSource(7)).toEqual({uri: 'file:///C:/Bundle/assets/icon.png', width: 10, height: 12, scale: 1});
    expect(resolveSource(8)).toBeNull();
    expect(resolveSources([{uri: 'https://x/first.png'}, 8, 'https://x/second.png'])).toEqual([{uri: 'https://x/first.png'}, {uri: 'https://x/second.png'}]);
    expect(resolveSources(undefined)).toEqual([]);
  });

  it('resolves the position, the transition and the tint the way the island reads them', () => {
    expect(resolveContentPosition(undefined)).toEqual({top: '50%', left: '50%'});
    expect(resolveContentPosition('bottom right')).toEqual({bottom: 0, right: 0});
    expect(resolveContentPosition('nowhere' as never)).toEqual({top: '50%', left: '50%'});
    expect(resolveContentPosition({top: 4, right: '10%'})).toEqual({top: 4, right: '10%'});
    expect(resolveTransition(200)).toEqual({duration: 200});
    expect(resolveTransition({duration: 300, timing: 'linear'})).toEqual({duration: 300, timing: 'linear'});
    expect(resolveTransition(undefined, 150)).toEqual({duration: 150});
    expect(resolveTransition(null)).toBeNull();
    expect(hexOf('#ff0000')).toBe('#ff0000ff');
    expect(hexOf('rgba(0, 128, 255, 0.5)')).toBe('#0080ff80');
    expect(hexOf(null)).toBe('');
    expect(hexOf('not a colour')).toBe('');
  });
});

describe('expo-image view (windows)', () => {
  it('draws the sources in the island with the props it takes, drops the rest, and relays the events', async () => {
    const onLoadStart = vi.fn();
    const onLoad = vi.fn();
    const onLoadEnd = vi.fn();
    const onError = vi.fn();
    const onProgress = vi.fn();
    const onDisplay = vi.fn();
    await render(
      <Image
        source={[{uri: 'https://x/a.png', cacheKey: 'a'}, {uri: 'https://x/b.png'}]}
        placeholder="blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj"
        contentFit="contain"
        contentPosition="top left"
        transition={250}
        cachePolicy="memory-disk"
        tintColor="#00ff00"
        blurRadius={3}
        autoplay={false}
        priority="high"
        recyclingKey="row-1"
        alt="A"
        testID="img"
        style={{width: 10, resizeMode: 'center', tintColor: 'red'}}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onProgress={onProgress}
        onDisplay={onDisplay}
      />,
    );
    const island = screen.getByTestId('img');
    expect(JSON.parse(island.props.source)).toEqual([{uri: 'https://x/a.png', cacheKey: 'a'}, {uri: 'https://x/b.png'}]);
    expect(JSON.parse(island.props.placeholder)).toEqual([{uri: 'blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj', width: 16, height: 16}]);
    expect(island.props.contentFit).toBe('contain');
    expect(island.props.placeholderContentFit).toBe('scale-down');
    expect(JSON.parse(island.props.contentPosition)).toEqual({top: 0, left: 0});
    expect(JSON.parse(island.props.transition)).toEqual({duration: 250});
    expect(island.props.cachePolicy).toBe('memory-disk');
    expect(island.props.tintColor).toBe('#00ff00ff');
    expect(island.props.blurRadius).toBe(3);
    expect(island.props.autoplay).toBe(false);
    expect(island.props.accessibilityLabel).toBe('A');
    expect(island.props).not.toHaveProperty('priority');
    expect(island.props).not.toHaveProperty('recyclingKey');
    expect(island).toHaveStyle({width: 10});
    expect(island.props.style).not.toHaveProperty('resizeMode');
    expect(ExpoImage).toBe(Image);
    expect(Image.Image).toBe(ImageRef);
    await fireEvent(island, 'loadStart', {nativeEvent: {}});
    await fireEvent(island, 'progress', {nativeEvent: {loaded: 5, total: 10}});
    await fireEvent(island, 'load', {nativeEvent: {url: 'https://x/a.png', width: 40, height: 30, isAnimated: false, mediaType: '', cacheType: 'disk'}});
    await fireEvent(island, 'display', {nativeEvent: {}});
    await fireEvent(island, 'error', {nativeEvent: {error: 'boom'}});
    expect(onLoadStart).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({loaded: 5, total: 10});
    expect(onLoad).toHaveBeenCalledWith({cacheType: 'disk', source: {url: 'https://x/a.png', width: 40, height: 30, isAnimated: false, mediaType: null}});
    expect(onDisplay).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({error: 'boom'});
    expect(onLoadEnd).toHaveBeenCalledTimes(2);
  });

  it('covers by default, maps a deprecated resize mode and fade, tints from the style, and takes the events without handlers', async () => {
    await render(
      <>
        <Image source="https://x/a.png" testID="plain"/>
        <Image source="https://x/b.png" resizeMode="stretch" fadeDuration={100} defaultSource={{uri: 'https://x/p.png'}} style={[{tintColor: 'rgb(1, 2, 3)'}, {resizeMode: 'contain'}]} testID="legacy"/>
        <Image source="https://x/c.png" style={{resizeMode: 'contain'}} cachePolicy={null} testID="styled"/>
      </>,
    );
    expect(screen.getByTestId('styled').props.cachePolicy).toBe('disk');
    const plain = screen.getByTestId('plain');
    expect(plain.props.contentFit).toBe('cover');
    expect(plain.props.placeholder).toBe('');
    expect(plain.props.transition).toBe('');
    expect(plain.props.tintColor).toBe('');
    expect(plain.props.cachePolicy).toBe('disk');
    expect(plain.props.autoplay).toBe(true);
    const legacy = screen.getByTestId('legacy');
    expect(legacy.props.contentFit).toBe('fill');
    expect(JSON.parse(legacy.props.transition)).toEqual({duration: 100});
    expect(JSON.parse(legacy.props.placeholder)).toEqual([{uri: 'https://x/p.png'}]);
    expect(legacy.props.tintColor).toBe('#010203ff');
    expect(screen.getByTestId('styled').props.contentFit).toBe('contain');
    await fireEvent(plain, 'loadStart', {nativeEvent: {}});
    await fireEvent(plain, 'progress', {nativeEvent: {loaded: 1, total: 2}});
    await fireEvent(plain, 'load', {nativeEvent: {url: 'https://x/a.png', width: 1, height: 1, isAnimated: true, mediaType: 'image/gif', cacheType: 'none'}});
    await fireEvent(plain, 'display', {nativeEvent: {}});
    await fireEvent(plain, 'error', {nativeEvent: {error: 'x'}});
  });

  it('plays, stops and reloads through the island on the instance, and locks nothing', async () => {
    let instance: Image | null = null;
    const {unmount} = await render(<Image ref={ref => { instance = ref; }} source="https://x/a.gif" testID="gif"/>);
    const image = instance as unknown as Image;
    expect(image.getAnimatableRef()).toBe(image);
    await act(async () => {
      await image.startAnimating();
      await image.stopAnimating();
      await image.reloadAsync();
      await image.lockResourceAsync();
      await image.unlockResourceAsync();
    });
    expect(Commands.startAnimating).toHaveBeenCalledTimes(1);
    expect(Commands.stopAnimating).toHaveBeenCalledTimes(1);
    expect(Commands.reload).toHaveBeenCalledTimes(1);
    await unmount();
    await image.startAnimating();
    await image.stopAnimating();
    await image.reloadAsync();
    expect(Commands.startAnimating).toHaveBeenCalledTimes(1);
    expect(Commands.reload).toHaveBeenCalledTimes(1);
  });

  it('draws a background image under its children', async () => {
    await render(
      <ImageBackground source="https://x/bg.png" contentFit="none" style={{height: 20}} imageStyle={{opacity: 0.5}} testID="bg">
        <Text>Over</Text>
      </ImageBackground>,
    );
    expect(screen.getByText('Over')).toBeOnTheScreen();
    const island = screen.getByTestId('bg');
    expect(island.props.contentFit).toBe('none');
    expect(island).toHaveStyle({position: 'absolute', opacity: 0.5});
  });
});

describe('expo-image statics (windows)', () => {
  it('prefetches, clears and reads the caches, loads references and makes blurhashes through the loader', async () => {
    const loader = withLoader();
    await expect(Image.prefetch('https://x/a.png')).resolves.toBe(true);
    expect(loader.prefetch).toHaveBeenLastCalledWith(['https://x/a.png'], 'memory-disk', null);
    await expect(Image.prefetch(['https://x/a.png', 'https://x/b.png'], 'disk')).resolves.toBe(true);
    expect(loader.prefetch).toHaveBeenLastCalledWith(['https://x/a.png', 'https://x/b.png'], 'disk', null);
    await Image.prefetch('https://x/c.png', {headers: {a: 'b'}});
    expect(loader.prefetch).toHaveBeenLastCalledWith(['https://x/c.png'], 'memory-disk', {a: 'b'});
    await Image.prefetch('https://x/d.png', {cachePolicy: 'memory'});
    expect(loader.prefetch).toHaveBeenLastCalledWith(['https://x/d.png'], 'memory', null);
    await expect(Image.clearMemoryCache()).resolves.toBe(true);
    await expect(Image.clearDiskCache()).resolves.toBe(true);
    await expect(Image.getCachePathAsync('known')).resolves.toBe('C:\\cache\\known');
    await expect(Image.getCachePathAsync('other')).resolves.toBeNull();
    await Image.writeToCacheAsync('file:///C:/a.png', 'k');
    expect(loader.writeToCache).toHaveBeenCalledWith('file:///C:/a.png', 'k');
    const ref = await Image.readFromCacheAsync('known');
    expect(ref).toBeInstanceOf(ImageRef);
    expect(ref).toMatchObject({uri: LOADED.uri, width: 40, height: 30, mediaType: 'image/png', isAnimated: false, scale: 1, nativeRefType: 'image'});
    expect(loader.load).toHaveBeenLastCalledWith('C:\\cache\\known', null, '');
    await expect(Image.readFromCacheAsync('other')).resolves.toBeNull();
    const loaded = await Image.loadAsync({uri: 'https://x/a.png', headers: {h: '1'}, cacheKey: 'ck'}, {maxWidth: 10});
    expect(loader.load).toHaveBeenLastCalledWith('https://x/a.png', {h: '1'}, 'ck');
    expect(loaded.toSource()).toEqual({uri: LOADED.uri, width: 40, height: 30});
    loaded.release();
    await Image.loadAsync(loaded);
    expect(loader.load).toHaveBeenLastCalledWith(LOADED.uri, null, '');
    await Image.writeToCacheAsync(loaded, 'k2');
    expect(loader.writeToCache).toHaveBeenLastCalledWith(LOADED.uri, 'k2');
    loader.load.mockResolvedValueOnce({...LOADED, mediaType: ''});
    expect((await Image.loadAsync('https://x/unknown')).mediaType).toBeNull();
    await expect(Image.loadAsync({} as never)).rejects.toThrow(/names no image/);
    await expect(Image.loadAsync('')).rejects.toThrow(/needs a source with a URI/);
    await expect(Image.generateBlurhashAsync('file:///C:/a.png')).resolves.toBe('LEHV6nWB2yk8pyo0adR*.7kCMdnj');
    expect(loader.generateBlurhash).toHaveBeenLastCalledWith('file:///C:/a.png', 4, 3);
    await Image.generateBlurhashAsync(loaded, {width: 5, height: 2});
    expect(loader.generateBlurhash).toHaveBeenLastCalledWith(LOADED.uri, 5, 2);
    await Image.generateBlurhashAsync('file:///C:/b.png', [2, 2]);
    expect(loader.generateBlurhash).toHaveBeenLastCalledWith('file:///C:/b.png', 2, 2);
    await expect(Image.generateThumbhashAsync()).rejects.toThrow(/generateThumbhashAsync/);
    expect(Image.configureCache()).toBeUndefined();
  });

  it('answers empty without the loader, and says so for what needs it', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(Image.prefetch('https://x/a.png')).resolves.toBe(false);
    await expect(Image.clearMemoryCache()).resolves.toBe(false);
    await expect(Image.clearDiskCache()).resolves.toBe(false);
    await expect(Image.getCachePathAsync('k')).resolves.toBeNull();
    await expect(Image.writeToCacheAsync('file:///C:/a.png', 'k')).rejects.toThrow(/writeToCacheAsync/);
    await expect(Image.readFromCacheAsync('k')).rejects.toThrow(/readFromCacheAsync/);
    await expect(Image.loadAsync('https://x/a.png')).rejects.toThrow(/loadAsync/);
    await expect(Image.generateBlurhashAsync('file:///C:/a.png')).rejects.toThrow(/generateBlurhashAsync/);
  });
});

function Probe({source, deps = [0]}: {source: string; deps?: unknown[]}) {
  const image = useImage(source, {onError: (error, retry) => { retries.push([error.message, retry]); }}, deps);
  return <Text testID="size">{image ? `${image.width}x${image.height}` : 'loading'}</Text>;
}

const retries: [string, () => void][] = [];

describe('useImage (windows)', () => {
  it('answers with the reference once loaded, again for a new URI, and hears failures with a retry', async () => {
    const loader = withLoader();
    let settle: (value: typeof LOADED) => void = () => {};
    loader.load.mockImplementationOnce(() => new Promise(resolve => { settle = resolve; }));
    const {rerender} = await render(<Probe source="https://x/a.png"/>);
    expect(screen.getByTestId('size')).toHaveTextContent('loading');
    await act(async () => settle(LOADED));
    expect(screen.getByTestId('size')).toHaveTextContent('40x30');
    expect(loader.load).toHaveBeenCalledTimes(1);
    loader.load.mockRejectedValueOnce(new Error('offline'));
    await rerender(<Probe source="https://x/b.png"/>);
    await act(async () => {});
    expect(retries).toHaveLength(1);
    expect(retries[0][0]).toBe('offline');
    loader.load.mockResolvedValueOnce({...LOADED, width: 8, height: 8});
    await act(async () => retries[0][1]());
    expect(screen.getByTestId('size')).toHaveTextContent('8x8');
    await rerender(<Probe source="https://x/b.png" deps={[1]}/>);
    await act(async () => {});
    expect(loader.load).toHaveBeenCalledTimes(4);
  });

  it('fails for a source that names no image', async () => {
    withLoader();
    const errors: string[] = [];
    function Empty() {
      const image = useImage({} as never, {onError: error => { errors.push(error.message); }});
      return <Text testID="empty">{image ? 'there' : 'nothing'}</Text>;
    }
    await render(<Empty/>);
    await act(async () => {});
    expect(screen.getByTestId('empty')).toHaveTextContent('nothing');
    expect(errors).toEqual([expect.stringMatching(/needs a source with a URI/)]);
  });

  it('prints a failure without an error handler, and ignores an answer after unmounting', async () => {
    const loader = withLoader();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    loader.load.mockRejectedValueOnce(new Error('gone'));
    function Plain() {
      const image = useImage('https://x/c.png');
      return <Text testID="plain">{image ? 'there' : 'loading'}</Text>;
    }
    const {unmount} = await render(<Plain/>);
    await act(async () => {});
    expect(error).toHaveBeenCalledWith(expect.stringContaining("'https://x/c.png' failed"), expect.any(Error));
    let settle: (value: typeof LOADED) => void = () => {};
    loader.load.mockImplementationOnce(() => new Promise(resolve => { settle = resolve; }));
    let reject: (error: Error) => void = () => {};
    const {unmount: unmountSecond} = await render(<Plain/>);
    await unmount();
    loader.load.mockImplementationOnce(() => new Promise((_resolve, rejectLoad) => { reject = rejectLoad; }));
    const {unmount: unmountThird} = await render(<Plain/>);
    await unmountSecond();
    await unmountThird();
    await act(async () => {
      settle(LOADED);
      reject(new Error('late'));
    });
    expect(error).toHaveBeenCalledTimes(1);
  });
});
