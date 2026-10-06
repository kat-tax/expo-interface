import {Platform} from 'react-native';
import {drawnPlacement, iosPlacement} from './shared';

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

  it('draws automatic inline where the search is drawn, and keeps a placement asked for', () => {
    expect(drawnPlacement('automatic')).toBe('inline');
    expect(drawnPlacement('stacked')).toBe('stacked');
    expect(drawnPlacement('action')).toBe('action');
    expect(drawnPlacement('inline')).toBe('inline');
  });
});
