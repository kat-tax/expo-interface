import {Platform} from 'react-native';
import {NARROW_HEADER, drawnPlacement, iosPlacement, isNarrow} from './shared';

describe(`HeaderSearch placements (${Platform.OS})`, () => {
  it('names the placements in UIKit\'s words, with the three integrated looks', () => {
    expect(iosPlacement('automatic', 'field')).toBe('automatic');
    expect(iosPlacement('stacked', 'field')).toBe('stacked');
    expect(iosPlacement('inline', 'field')).toBe('inline');
    expect(iosPlacement('integrated', 'field')).toBe('integrated');
    expect(iosPlacement('integrated', 'button')).toBe('integratedButton');
    expect(iosPlacement('integrated', 'centered')).toBe('integratedCentered');
  });

  it('makes an action the bar\'s own search button', () => {
    expect(iosPlacement('action', 'field')).toBe('integratedButton');
  });

  it('calls a window narrow below the header\'s threshold, and a window it cannot measure wide', () => {
    expect(isNarrow(390)).toBe(true);
    expect(isNarrow(NARROW_HEADER)).toBe(false);
    expect(isNarrow(1024)).toBe(false);
    expect(isNarrow(0)).toBe(false);
  });

  it('resolves automatic by the header\'s width where the search is drawn, and keeps a placement asked for', () => {
    expect(drawnPlacement('automatic', true)).toBe('stacked');
    expect(drawnPlacement('automatic', false)).toBe('inline');
    expect(drawnPlacement('stacked', false)).toBe('stacked');
    expect(drawnPlacement('action', true)).toBe('action');
    expect(drawnPlacement('inline', true)).toBe('inline');
  });
});
