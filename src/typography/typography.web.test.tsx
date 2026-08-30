import {render, screen} from '@testing-library/react';
import {variants, fontWeights} from '../theme';
import {
  Typography,
  LargeTitle,
  Title,
  Title2,
  Title3,
  Headline,
  Body,
  Callout,
  Subheadline,
  Footnote,
  Caption,
  Label,
} from '.';

const WRAPPERS = [
  [LargeTitle, 'largeTitle'],
  [Title, 'title'],
  [Title2, 'title2'],
  [Title3, 'title3'],
  [Headline, 'headline'],
  [Body, 'body'],
  [Callout, 'callout'],
  [Subheadline, 'subheadline'],
  [Footnote, 'footnote'],
  [Caption, 'caption'],
  [Label, 'label'],
] as const;

/** Inline style declaration of the rendered `<span>`. */
const css = (testID = 'text') => screen.getByTestId(testID).style;

describe('Typography (web)', () => {
  it('renders a <span> with the body variant by default', () => {
    render(<Typography testID="text">Hello</Typography>);
    const el = screen.getByTestId('text');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveTextContent('Hello');
    const body = variants.body;
    expect(css().fontSize).toBe(`${body.fontSize}px`);
    expect(css().lineHeight).toBe(`${body.lineHeight}px`);
    expect(css().fontWeight).toBe(fontWeights[body.fontWeight]);
    expect(css().letterSpacing).toBe(`${body.letterSpacing}px`);
    expect(css().fontFamily).toBe('var(--font-display)');
  });

  it.each(WRAPPERS)('%p maps to the %s variant', (Component, variant) => {
    render(<Component testID="text">x</Component>);
    const v = variants[variant];
    expect(css().fontSize).toBe(`${v.fontSize}px`);
    expect(css().lineHeight).toBe(`${v.lineHeight}px`);
    expect(css().fontWeight).toBe(fontWeights[v.fontWeight]);
  });

  it('overrides the weight and alignment', () => {
    render(<Typography weight="bold" align="center" testID="text">x</Typography>);
    expect(css().fontWeight).toBe('700');
    expect(css().textAlign).toBe('center');
  });

  it('truncates a single line with an ellipsis', () => {
    render(<Typography numberOfLines={1} testID="text">x</Typography>);
    expect(css().overflow).toBe('hidden');
    expect(css().whiteSpace).toBe('nowrap');
    expect(css().textOverflow).toBe('ellipsis');
  });

  it('clamps multiple lines with a box layout', () => {
    render(<Typography numberOfLines={3} testID="text">x</Typography>);
    expect(css().display).toBe('-webkit-box');
    expect(css().overflow).toBe('hidden');
    expect(css().whiteSpace).toBe('');
  });

  it('flattens the supported subset of RN text styles', () => {
    render(
      <Typography
        style={[{marginTop: 4, opacity: 0.5}, {color: '#123456', paddingHorizontal: 8, width: 120}]}
        testID="text">
        x
      </Typography>,
    );
    expect(css().marginTop).toBe('4px');
    expect(css().opacity).toBe('0.5');
    expect(css().color).toBe('rgb(18, 52, 86)');
    expect(css().paddingLeft).toBe('8px');
    expect(css().paddingRight).toBe('8px');
    expect(css().width).toBe('120px');
  });

  it('ignores unsupported style keys', () => {
    render(<Typography style={{backgroundColor: 'red', textDecorationLine: 'underline'}} testID="text">x</Typography>);
    expect(css().backgroundColor).toBe('');
    expect(css().textDecoration).toBe('');
  });

  it('switches to block display when the style shrinks in a flex row', () => {
    render(<Typography style={{flexShrink: 1}} testID="text">x</Typography>);
    expect(css().display).toBe('block');
    expect(css().flexShrink).toBe('1');
  });
});
