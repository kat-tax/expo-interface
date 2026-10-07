import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {modifier, nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {colors} from '../theme';

const shape = () => nodes().find(n => n.type.includes('RoundedRectangle'))!;

/** The module read at the given iOS version, which it checks once when it loads. */
async function atVersion(version: string) {
  vi.resetModules();
  vi.doMock('react-native', async importOriginal => {
    const actual = await importOriginal<typeof import('react-native')>();
    return {...actual, Platform: {...actual.Platform, Version: version}};
  });
  const module = await import('.');
  vi.doUnmock('react-native');
  return module;
}

describe('Material (ios)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('draws the children over a shape filled with the system material, in a host of its own behind them', async () => {
    const {Material} = await atVersion('18.0');
    await render(
      <Material kind="thick" radius={20} edge="bottom" testID="material">
        <Text>Over</Text>
      </Material>,
    );
    expect(modifier(shape().props, 'foregroundStyle')?.style).toMatchObject({type: 'material', material: 'thick'});
    expect(shape().props.cornerRadius).toBe(20);
    const [host] = hosts();
    expect(StyleSheet.flatten(host.props.style)).toMatchObject({position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none'});
    expect(StyleSheet.flatten(screen.getByTestId('material').props.style)).toMatchObject({
      borderRadius: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.light.separator,
    });
    expect(screen.getByText('Over')).toBeOnTheScreen();
  });

  it('is the regular material with square corners by default, and for glass before iOS 26', async () => {
    const {Material} = await atVersion('18.0');
    await render(
      <>
        <Material testID="plain"/>
        <Material kind="glass" testID="glass"/>
      </>,
    );
    const shapes = nodes().filter(n => n.type.includes('RoundedRectangle'));
    for (const each of shapes) {
      expect(modifier(each.props, 'foregroundStyle')?.style).toMatchObject({type: 'material', material: 'regular'});
      expect(modifier(each.props, 'glassEffect')).toBeUndefined();
      expect(each.props.cornerRadius).toBe(0);
    }
    expect(StyleSheet.flatten(screen.getByTestId('plain').props.style).borderBottomWidth).toBeUndefined();
  });

  it('draws Liquid Glass in the shape from iOS 26, and the materials beside it', async () => {
    const {Material} = await atVersion('26.0');
    await render(<Material kind="glass" radius={24}/>);
    expect(modifier(shape().props, 'glassEffect')).toMatchObject({glass: {variant: 'regular'}, shape: 'roundedRectangle', cornerRadius: 24});
    await render(<Material kind="thin"/>);
    expect(modifier(shape().props, 'foregroundStyle')?.style).toMatchObject({type: 'material', material: 'thin'});
    expect(modifier(shape().props, 'glassEffect')).toBeUndefined();
  });
});
