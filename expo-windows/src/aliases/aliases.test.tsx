import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {GlassContainer, GlassView, isLiquidGlassAvailable} from './expo-glass-effect';
import {SymbolView} from './expo-symbols';
import {Column, Host, List, RNHostView, Row, ScrollView, Spacer, Text as UIText} from './expo-ui';

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
