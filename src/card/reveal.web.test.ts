import {hoverCapable} from './reveal.web';

describe('hoverCapable (web)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is what the browser says of the primary pointer, and false where it says nothing', () => {
    expect(hoverCapable()).toBe(false);
    vi.stubGlobal('matchMedia', () => ({matches: true}));
    expect(hoverCapable()).toBe(true);
    vi.stubGlobal('matchMedia', () => undefined);
    expect(hoverCapable()).toBe(false);
  });

  it('is false on a server, which has no window', () => {
    vi.stubGlobal('window', undefined);
    expect(hoverCapable()).toBe(false);
  });
});
