import {describe, expect, it} from 'vitest';
import {shareContent} from './shared';

describe('shareContent', () => {
  it('falls back to the button\'s own words for the sheet\'s title', () => {
    expect(shareContent({label: 'Share drop', url: 'https://example.com'})).toEqual({
      title: 'Share drop',
      message: '',
      url: 'https://example.com',
      empty: false,
    });
    expect(shareContent({label: 'Share', title: 'HIS-201', message: 'Look'}).title).toBe('HIS-201');
  });

  it('knows when there is nothing to share, so the button can say so', () => {
    expect(shareContent({label: 'Share'}).empty).toBe(true);
    expect(shareContent({label: 'Share', message: 'Look'}).empty).toBe(false);
    expect(shareContent({label: 'Share', url: 'https://example.com'}).empty).toBe(false);
  });
});
