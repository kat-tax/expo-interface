import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {icon} from '../icons';
import {glyphChar, SEGOE_GLYPHS, windowsGlyph} from './segoe';
import {Icon, SYMBOL_FONT} from './index.windows';

describe('Icon (windows)', () => {
  it('draws the Fluent twin of a Material name in Segoe Fluent Icons', async () => {
    await render(<Icon icon={icons.share} size={20} tintColor="#FF0000"/>);
    const glyph = screen.getByText('');
    expect(glyph).toHaveStyle({fontFamily: SYMBOL_FONT, fontSize: 20, lineHeight: 20, color: '#FF0000'});
    expect(glyph.props.accessible).toBe(false);
  });

  it('draws nothing for a token without a glyph', async () => {
    await render(<Icon icon={icon('questionmark')}/>);
    expect(screen.toJSON()).toBeNull();
  });
});

describe('windowsGlyph', () => {
  it('prefers the token\'s own Windows code point', () => {
    expect(windowsGlyph(icon({ios: 'star', android: 'star', web: 'star', windows: 'E001'}))).toBe('E001');
  });

  it('maps the Android name, then the web name', () => {
    expect(windowsGlyph(icons.settings)).toBe('E713');
    expect(windowsGlyph(icon({ios: 'star', android: 'nope' as never, web: 'download'}))).toBe('E896');
    expect(windowsGlyph(icon({ios: 'star', android: 'nope' as never, web: 'nope' as never}))).toBeUndefined();
    expect(windowsGlyph(icon({ios: 'star'}))).toBeUndefined();
  });

  it('picks the solid form for a filled token, falling back to the outline', () => {
    expect(windowsGlyph(icons.star)).toBe('E734');
    expect(windowsGlyph(icons.starFilled)).toBe('E735');
    expect(windowsGlyph(icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'}, undefined, {fill: true}))).toBe('E72D');
  });

  it('keeps a table of Fluent code points and turns them into characters', () => {
    expect(SEGOE_GLYPHS.share).toEqual(['E72D']);
    expect(glyphChar('E72D')).toBe('');
  });
});
