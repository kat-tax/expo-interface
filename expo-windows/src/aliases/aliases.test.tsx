import type {TestInstance} from 'test-renderer';
import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {GlassContainer, GlassView, isLiquidGlassAvailable} from './expo-glass-effect';
import ExpoImage, {Image, ImageBackground, toNativeSource} from './expo-image';
import {SymbolView} from './expo-symbols';
import {Column, Host, List, RNHostView, Row, ScrollView, Spacer, Text as UIText} from './expo-ui';

/** The host image views in the rendered tree (`RCTImageView` on the engine); React Native normalizes their `source` to a list. */
function hostImages(): TestInstance[] {
  const {container} = screen as unknown as {container: {queryAll(predicate: (node: TestInstance) => boolean): TestInstance[]}};
  return container.queryAll(node => typeof node.type === 'string' && /Image/.test(node.type));
}

describe('expo-image (windows)', () => {
  it('draws the source with React Native\'s Image, fitting as asked', async () => {
    const onLoad = vi.fn();
    await render(<Image source="https://x/a.png" contentFit="contain" alt="A" testID="img" onLoad={onLoad}/>);
    const image = screen.getByTestId('img');
    expect(image.props.source).toEqual([{uri: 'https://x/a.png'}]);
    expect(image.props.resizeMode).toBe('contain');
    expect(image.props.accessibilityLabel).toBe('A');
    expect(ExpoImage).toBe(Image);
  });

  it('covers by default, and stretches for fill', async () => {
    await render(
      <>
        <Image source={{uri: 'https://x/b.png', width: 10, height: null}} testID="cover"/>
        <Image source={{uri: 'https://x/c.png'}} contentFit="fill" testID="fill"/>
      </>,
    );
    const cover = screen.getByTestId('cover');
    expect(cover.props.resizeMode).toBe('cover');
    expect(cover.props.source).toEqual([expect.objectContaining({uri: 'https://x/b.png', width: 10})]);
    expect(screen.getByTestId('fill').props.resizeMode).toBe('stretch');
  });

  it('maps every source shape expo-image takes', () => {
    expect(toNativeSource(undefined)).toBeUndefined();
    expect(toNativeSource(null)).toBeUndefined();
    expect(toNativeSource('https://x/a.png')).toEqual({uri: 'https://x/a.png'});
    expect(toNativeSource(7)).toBe(7);
    expect(toNativeSource([{uri: 'https://x/first.png'}, {uri: 'https://x/second.png'}])).toEqual({uri: 'https://x/first.png'});
    expect(toNativeSource([])).toBeUndefined();
    expect(toNativeSource({uri: 'https://x/h.png', headers: {a: 'b'}})).toEqual({uri: 'https://x/h.png', headers: {a: 'b'}});
    expect(toNativeSource({})).toBeUndefined();
  });

  it('draws a background image with its children', async () => {
    await render(
      <ImageBackground source="https://x/bg.png" contentFit="none" testID="bg">
        <Text>Over</Text>
      </ImageBackground>,
    );
    expect(screen.getByText('Over')).toBeOnTheScreen();
    expect(screen.getByTestId('bg')).toBeOnTheScreen();
    const [image] = hostImages();
    expect(image.props.source).toEqual([{uri: 'https://x/bg.png'}]);
    expect(image.props.resizeMode).toBe('center');
  });
});

describe('expo-glass-effect (windows)', () => {
  it('is a plain view with its children, and unavailable', async () => {
    await render(
      <GlassContainer testID="container">
        <GlassView testID="glass"><Text>Inside</Text></GlassView>
      </GlassContainer>,
    );
    expect(screen.getByTestId('container')).toBeOnTheScreen();
    expect(screen.getByTestId('glass')).toBeOnTheScreen();
    expect(screen.getByText('Inside')).toBeOnTheScreen();
    expect(isLiquidGlassAvailable()).toBe(false);
  });
});

describe('@expo/ui layout primitives (windows)', () => {
  it('lays a column and a row out with their spacing and alignment, pressable when asked, gone while hidden', async () => {
    const onPress = vi.fn();
    await render(
      <Column spacing={8} alignment="center" testID="column">
        <Row spacing={4} alignment="end" onPress={onPress} testID="row"><Text>In a row</Text></Row>
        <Row hidden testID="hidden"><Text>Not here</Text></Row>
        <Row testID="plain"><Text>Plain</Text></Row>
      </Column>,
    );
    expect(screen.getByTestId('column')).toHaveStyle({flexDirection: 'column', gap: 8, alignItems: 'center'});
    expect(screen.getByTestId('row')).toHaveStyle({flexDirection: 'row', gap: 4, alignItems: 'flex-end'});
    expect(screen.queryByTestId('hidden')).toBeNull();
    expect(screen.getByTestId('plain').props.onPress).toBeUndefined();
    expect(screen.getByText('In a row')).toBeOnTheScreen();
  });

  it('spaces by a size or fills, draws text in its style, and hosts, lists and scrolls plainly', async () => {
    await render(
      <Host testID="host">
        <List testID="list">
          <Spacer size={12} testID="fixed"/>
          <Spacer flexible testID="flex"/>
          <Spacer hidden testID="gone"/>
          <UIText textStyle={{fontSize: 14, color: '#123456', fontWeight: '600'}} numberOfLines={1} testID="text">Hello</UIText>
          <UIText hidden testID="no-text">Bye</UIText>
          <RNHostView matchContents testID="rn"><Text>Hosted</Text></RNHostView>
          <RNHostView hidden testID="rn-gone"><Text>Not hosted</Text></RNHostView>
        </List>
        <ScrollView testID="vertical"><Text>Down</Text></ScrollView>
        <ScrollView direction="horizontal" showsIndicators={false} testID="horizontal"><Text>Across</Text></ScrollView>
        <ScrollView hidden testID="scroll-gone"><Text>Nowhere</Text></ScrollView>
      </Host>,
    );
    expect(screen.getByTestId('fixed')).toHaveStyle({width: 12, height: 12});
    expect(screen.getByTestId('flex')).toHaveStyle({flex: 1});
    expect(screen.queryByTestId('gone')).toBeNull();
    const text = screen.getByTestId('text');
    expect(text).toHaveStyle({fontSize: 14, color: '#123456', fontWeight: '600'});
    expect(text.props.numberOfLines).toBe(1);
    expect(screen.queryByTestId('no-text')).toBeNull();
    expect(screen.getByText('Hosted')).toBeOnTheScreen();
    expect(screen.queryByTestId('rn-gone')).toBeNull();
    expect(screen.getByTestId('vertical').props.horizontal).toBe(false);
    expect(screen.getByTestId('vertical').props.showsVerticalScrollIndicator).toBe(true);
    expect(screen.getByTestId('horizontal').props.horizontal).toBe(true);
    expect(screen.getByTestId('horizontal').props.showsHorizontalScrollIndicator).toBe(false);
    expect(screen.queryByTestId('scroll-gone')).toBeNull();
    expect(screen.getByTestId('host')).toBeOnTheScreen();
    expect(screen.getByTestId('list')).toBeOnTheScreen();
  });
});

describe('expo-symbols (windows)', () => {
  it('draws nothing', async () => {
    await render(<SymbolView name="star" tintColor="#F00"/>);
    expect(screen.toJSON()).toBeNull();
  });
});

describe('expo-image fit fallback (windows)', () => {
  it('covers when the fit is one React Native has no mode for', async () => {
    await render(
      <>
        <Image source="https://x/a.png" contentFit={'weird' as never} testID="img"/>
        <ImageBackground source="https://x/b.png" contentFit={'weird' as never} testID="bg"><Text>x</Text></ImageBackground>
      </>,
    );
    expect(screen.getByTestId('img').props.resizeMode).toBe('cover');
    expect(hostImages().map(image => image.props.resizeMode)).toEqual(['cover', 'cover']);
  });
});
