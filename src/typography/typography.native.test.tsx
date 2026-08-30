import {Platform, StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {AccentProvider, onAccent} from '../accent';
import {colors, fonts, fontWeights, variants} from '../theme';
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

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe(`Typography (${Platform.OS})`, () => {
  it('renders native text in the body variant with the label color', async () => {
    await render(<Typography testID="text">Hello</Typography>);
    const text = screen.getByTestId('text');
    expect(text.type).toBe('RCTText');
    expect(text.props.children).toBe('Hello');
    const body = variants.body;
    expect(style('text')).toEqual({
      textAlign: undefined,
      letterSpacing: body.letterSpacing,
      lineHeight: body.lineHeight,
      fontSize: body.fontSize,
      fontWeight: fontWeights[body.fontWeight],
      fontFamily: fonts.sans,
      color: colors.light.label,
    });
  });

  it('uses the platform type scale', () => {
    // iOS follows the HIG sizes, Android the Material scale.
    expect(variants.body.fontSize).toBe(Platform.OS === 'ios' ? 17 : 16);
    expect(variants.largeTitle.fontWeight).toBe(Platform.OS === 'ios' ? 'bold' : 'normal');
  });

  it.each(WRAPPERS)('%p maps to the %s variant', async (Component, variant) => {
    await render(<Component testID="text">x</Component>);
    const v = variants[variant];
    expect(style('text')).toMatchObject({
      fontSize: v.fontSize,
      lineHeight: v.lineHeight,
      fontWeight: fontWeights[v.fontWeight],
      letterSpacing: v.letterSpacing,
    });
  });

  it('overrides the weight and alignment', async () => {
    await render(<Typography weight="semibold" align="right" testID="text">x</Typography>);
    expect(style('text')).toMatchObject({fontWeight: '600', textAlign: 'right'});
  });

  it('resolves color tokens from the light palette', async () => {
    await render(<Typography color="secondaryLabel" testID="text">x</Typography>);
    expect(style('text').color).toBe(colors.light.secondaryLabel);
  });

  it('resolves tint and onTint from the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Typography color="tint" testID="tint">x</Typography>
        <Typography color="onTint" testID="on">x</Typography>
      </AccentProvider>,
    );
    expect(style('tint').color).toBe('#8959EA');
    expect(style('on').color).toBe(onAccent('#8959EA'));
  });

  it('forwards numberOfLines and merges custom styles last', async () => {
    await render(
      <Typography numberOfLines={2} style={{color: '#123456', marginTop: 4}} testID="text">
        x
      </Typography>,
    );
    expect(screen.getByTestId('text').props.numberOfLines).toBe(2);
    expect(style('text')).toMatchObject({color: '#123456', marginTop: 4, fontSize: variants.body.fontSize});
  });
});
