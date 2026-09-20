/**
 * `expo-image` over the runtime's image island: a photo fitted four ways
 * over a blurhash placeholder with a dissolve, an SVG, an animated GIF, a
 * tinted and a blurred copy, a data URI, the load events, and the disk
 * cache prefetched, read and cleared — the route the Windows CI app and
 * the harness carry to prove them on screen.
 */
import {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Body, Screen, Title} from '../probe';
import {Image, useImage} from 'expo-image';

const PHOTO = 'https://picsum.photos/id/1015/600/400';
const SVG = 'https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg';
const GIF = 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif';
const BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const DOT = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOSIgZmlsbD0iIzg5NTlFQSIvPjwvc3ZnPg==';

const FITS = ['cover', 'contain', 'fill', 'scale-down'] as const;

export default function ImageRoute() {
  const [loaded, setLoaded] = useState('loading…');
  const [svg, setSvg] = useState('loading…');
  const [gif, setGif] = useState('loading…');
  const [cache, setCache] = useState('…');
  const [errors, setErrors] = useState<string[]>([]);
  const dot = useImage(DOT);

  useEffect(() => {
    (async () => {
      const prefetched = await Image.prefetch(PHOTO);
      const path = await Image.getCachePathAsync(PHOTO);
      const ref = await Image.loadAsync(PHOTO);
      const hash = await Image.generateBlurhashAsync(PHOTO, [4, 3]);
      setCache(`prefetch ${prefetched} · cached ${path ? path.slice(-12) : 'no'} · loaded ${ref.width}×${ref.height} ${ref.mediaType} · blurhash ${hash}`);
    })().catch((error: Error) => setCache(`✕ ${error.message}`));
  }, []);

  const fail = (what: string) => (event: {error: string}) => setErrors(list => [...list, `${what}: ${event.error}`]);

  return (
    <Screen>
      <Title>Image</Title>
      <View style={{flexDirection: 'row', gap: 8}}>
        {FITS.map(fit => (
          <View key={fit} style={{width: 120, height: 90, backgroundColor: '#333'}}>
            <Image
              source={PHOTO}
              placeholder={{blurhash: BLURHASH}}
              contentFit={fit}
              contentPosition={fit === 'cover' ? 'top right' : 'center'}
              transition={400}
              style={{width: 120, height: 90}}
              testID={`fit-${fit}`}
              onLoad={event => { if (fit === 'cover') setLoaded(`${event.source.width}×${event.source.height} ${event.source.mediaType} from ${event.cacheType}`); }}
              onError={fail(fit)}
            />
          </View>
        ))}
      </View>
      <Body testID="photo">{`Photo ${loaded}`}</Body>
      <View style={{flexDirection: 'row', gap: 8}}>
        <Image source={SVG} contentFit="contain" style={{width: 90, height: 90}} testID="svg" onLoad={event => setSvg(`${event.source.width}×${event.source.height} ${event.source.mediaType}`)} onError={fail('svg')}/>
        <Image source={GIF} contentFit="contain" style={{width: 90, height: 90}} testID="gif" onLoad={event => setGif(`${event.source.width}×${event.source.height} animated ${event.source.isAnimated}`)} onError={fail('gif')}/>
        <Image source={PHOTO} tintColor="#8959EA" contentFit="cover" style={{width: 90, height: 90}} testID="tinted" onError={fail('tint')}/>
        <Image source={PHOTO} blurRadius={8} contentFit="cover" style={{width: 90, height: 90}} testID="blurred" onError={fail('blur')}/>
        <Image source={`blurhash:/${BLURHASH}/9/9`} style={{width: 90, height: 90}} testID="hash"/>
        {dot ? <Image source={dot} style={{width: 90, height: 90}} testID="ref"/> : null}
      </View>
      <Body testID="svg-status">{`SVG ${svg}`}</Body>
      <Body testID="gif-status">{`GIF ${gif}`}</Body>
      <Body testID="ref-status">{`Data URI ref ${dot ? `${dot.width}×${dot.height} ${dot.mediaType}` : 'loading…'}`}</Body>
      <Body testID="cache">{`Cache ${cache}`}</Body>
      <Body testID="errors">{errors.length ? errors.join(' | ') : 'No errors'}</Body>
    </Screen>
  );
}
