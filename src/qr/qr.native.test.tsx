import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {host} from '../__tests__/native';
import {QRCode} from '.';

/** `expo-image` renders a `ViewManagerAdapter_ExpoImage` host view carrying the source list. */
const image = () => host(p => Array.isArray(p.source));

describe(`QRCode (${Platform.OS})`, () => {
  it('hands expo-image a data URI encoding the value', async () => {
    await render(<QRCode value="https://expo.dev"/>);
    const {type, props} = image();
    expect(type).toBe('ViewManagerAdapter_ExpoImage');
    expect(props.source).toHaveLength(1);
    expect(props.source[0].uri).toMatch(/^data:image\/gif;base64,/);
    expect(props.contentFit).toBe('contain');
  });

  it('sizes the image to `size` with rounded corners', async () => {
    await render(<QRCode value="x" size={120}/>);
    expect(image().props.style).toEqual({width: 120, height: 120, borderRadius: 12});
  });

  it('defaults to 200 points', async () => {
    await render(<QRCode value="x"/>);
    expect(image().props.style).toMatchObject({width: 200, height: 200});
  });

  it('re-encodes when the value changes and memoizes otherwise', async () => {
    const {rerender} = await render(<QRCode value="alpha" size={100}/>);
    const first = image().props.source[0].uri;

    await rerender(<QRCode value="alpha" size={140}/>);
    expect(image().props.source[0].uri).toBe(first);
    expect(screen.toJSON()).toBeTruthy();

    await rerender(<QRCode value="beta" size={140}/>);
    expect(image().props.source[0].uri).not.toBe(first);
  });
});
