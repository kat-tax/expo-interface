import {render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Symbol} from '.';

/** The glyph the kit drew, or `null` when it drew nothing. */
function glyph(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-symbol');
}

describe('Symbol (web)', () => {
  it('writes the symbol name for the font to draw as a ligature', () => {
    const {container} = render(<Symbol icon={icons.star}/>);
    const span = glyph(container);
    expect(span).toHaveTextContent('star');
    expect(span?.style.fontSize).toBe('24px');
    expect(span).not.toHaveClass('ui-symbol--filled');
    // Nothing may translate the ligature out from under the font.
    expect(span).toHaveAttribute('translate', 'no');
  });

  it('asks the variable font for the solid form of a filled token', () => {
    const {container} = render(<Symbol icon={icons.starFilled}/>);
    // The same glyph, drawn at `FILL 1` (see `symbol.css`).
    expect(glyph(container)).toHaveTextContent('star');
    expect(glyph(container)).toHaveClass('ui-symbol', 'ui-symbol--filled');
  });

  it('takes a size and a tint', () => {
    const {container} = render(<Symbol icon={icons.star} size={16} tintColor="#8959EA"/>);
    const span = glyph(container);
    expect(span?.style.fontSize).toBe('16px');
    expect(span?.style.color).toBe('rgb(137, 89, 234)');
  });

  it('draws nothing for a symbol with no Material name', () => {
    // A bare string is an SF Symbol, and a map need not carry a web name.
    const {container} = render(
      <>
        <Symbol icon={{symbol: 'star'}}/>
        <Symbol icon={{symbol: {ios: 'star'}}}/>
      </>,
    );
    expect(glyph(container)).toBeNull();
  });

  it('stays out of the accessible name of the control around it', () => {
    render(
      <button type="button">
        <Symbol icon={icons.star}/>
        Favourite
      </button>,
    );
    // Without `aria-hidden` the name would read "star Favourite".
    expect(screen.getByRole('button', {name: 'Favourite'})).toBeInTheDocument();
  });

  it('registers the Material Symbols family it draws with', () => {
    expect(document.getElementById('expo-generated-fonts')?.textContent)
      .toContain('font-family:"MaterialSymbols_400Regular"');
  });
});
