import {fetch} from './winter-fetch';

type Saved = {__expoWindowsFetch?: typeof globalThis.fetch};

describe('winter fetch (windows)', () => {
  afterEach(() => {
    delete (globalThis as Saved).__expoWindowsFetch;
  });

  it('calls the fetch the install saved', async () => {
    const saved = vi.fn(async () => new Response('ok'));
    (globalThis as Saved).__expoWindowsFetch = saved as unknown as typeof globalThis.fetch;
    const response = await fetch('https://expo.dev', {method: 'GET'});
    expect(saved).toHaveBeenCalledWith('https://expo.dev', {method: 'GET'});
    expect(response).toBeInstanceOf(Response);
  });

  it('refuses when nothing was saved', () => {
    expect(() => fetch('https://expo.dev')).toThrow(/install runs first/);
  });
});
