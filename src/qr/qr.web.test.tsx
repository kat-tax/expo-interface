import {render} from '@testing-library/react';
import {QRCode} from '.';

const image = (container: HTMLElement) => container.querySelector('img')!;
const frame = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-expoimage]')!;

describe('QRCode (web)', () => {
  it('renders the encoded value as a data URI image', () => {
    const {container} = render(<QRCode value="https://expo.dev"/>);
    const img = image(container);
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toMatch(/^data:image\/gif;base64,/);
    expect(img.style.objectFit).toBe('contain');
  });

  it('sizes the image frame to `size` and rounds its corners', () => {
    const {container, rerender} = render(<QRCode value="x" size={120}/>);
    const small = frame(container).style;
    expect([small.width, small.height, small.borderTopLeftRadius]).toEqual(['120px', '120px', '12px']);

    rerender(<QRCode value="x"/>);
    const large = frame(container).style;
    expect([large.width, large.height]).toEqual(['200px', '200px']);
  });

  it('keeps the encoded image when only the size changes', () => {
    const {container, rerender} = render(<QRCode value="alpha" size={100}/>);
    const first = image(container).getAttribute('src');

    rerender(<QRCode value="alpha" size={140}/>);
    expect(image(container).getAttribute('src')).toBe(first);
  });

  it('encodes different values to different images', () => {
    // expo-image on web swaps the <img> only after the new source loads, so
    // compare two independent mounts instead of rerendering.
    const alpha = render(<QRCode value="alpha"/>);
    const beta = render(<QRCode value="beta"/>);
    expect(image(alpha.container).getAttribute('src')).not.toBe(image(beta.container).getAttribute('src'));
  });
});
