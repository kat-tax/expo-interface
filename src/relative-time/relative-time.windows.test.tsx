import {render, renderHook, screen} from '@testing-library/react-native';
import {RelativeTime, useRelativeTime} from '.';

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 7, 12);

describe('RelativeTime (windows)', () => {
  beforeEach(() => {
    vi.useFakeTimers({now: NOW});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('draws the time since in the engine\'s language, with no page to read one from', async () => {
    await render(<RelativeTime date={NOW - 2 * HOUR} testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('2 hours ago');
  });

  it('answers the words as a string, in a language of its own', async () => {
    const {result} = await renderHook(() => useRelativeTime(NOW - 2 * HOUR, {locale: 'de'}));
    expect(result.current).toBe('vor 2 Stunden');
  });
});
