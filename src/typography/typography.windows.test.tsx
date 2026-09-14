import {render, screen} from '@testing-library/react-native';
import {colors, fonts, variants} from '../theme';
import {Body, Callout, Caption, Footnote, Headline, Label, LargeTitle, Subheadline, Title, Title2, Title3, Typography} from '.';

describe('Typography (windows)', () => {
  it('draws text in the Fluent ramp with Segoe UI Variable', async () => {
    await render(<Typography testID="t">Body</Typography>);
    expect(screen.getByTestId('t')).toHaveStyle({
      fontFamily: 'Segoe UI Variable Text',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.light.label,
    });
    expect(fonts.sans).toBe('Segoe UI Variable Text');
  });

  it('takes a variant, weight, color, alignment and line clamp', async () => {
    await render(<Typography variant="title" weight="bold" color="secondaryLabel" align="center" numberOfLines={1} testID="t">Title</Typography>);
    const text = screen.getByTestId('t');
    expect(text).toHaveStyle({fontSize: variants.title.fontSize, fontWeight: '700', color: colors.light.secondaryLabel, textAlign: 'center'});
    expect(text.props.numberOfLines).toBe(1);
  });

  it('has a shortcut per variant', async () => {
    await render(
      <>
        <LargeTitle testID="largeTitle">a</LargeTitle>
        <Title testID="title">a</Title>
        <Title2 testID="title2">a</Title2>
        <Title3 testID="title3">a</Title3>
        <Headline testID="headline">a</Headline>
        <Body testID="body">a</Body>
        <Callout testID="callout">a</Callout>
        <Subheadline testID="subheadline">a</Subheadline>
        <Footnote testID="footnote">a</Footnote>
        <Caption testID="caption">a</Caption>
        <Label testID="label">a</Label>
      </>,
    );
    for (const variant of Object.keys(variants) as (keyof typeof variants)[]) {
      expect(screen.getByTestId(variant)).toHaveStyle({fontSize: variants[variant].fontSize});
    }
  });
});
