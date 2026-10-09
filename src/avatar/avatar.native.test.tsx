import type {ReactNode} from 'react';
import type {HostNode} from 'expo-vitest/native';
import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {byComposeTestID, modifier, nodes} from 'expo-vitest/native';
import {onAccent} from '../accent';
import {hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {colors} from '../theme';
import {colorOf} from './shared';
import {Avatar} from '.';

/** Inside a native host, as a `ListItem`'s leading slot or a `NativeHost` is. */
const inHost = (node: ReactNode) => <NativeHostContext.Provider value={true}>{node}</NativeHostContext.Provider>;

/** The Compose texts in the tree, in order: the initials, then the unseen name. */
const texts = () => nodes().filter(n => typeof n.props.text === 'string');

describe(`Avatar inside a host (${Platform.OS})`, () => {
  if (Platform.OS === 'ios') {
    it('is the drawn circle, which the row around it hosts', async () => {
      await render(inHost(<Avatar name="Ada Lovelace" testID="peer"/>));
      expect(screen.getByTestId('peer').props.accessibilityLabel).toBe('Ada Lovelace');
      expect(screen.getByText('AL')).toBeOnTheScreen();
      expect(hosts()).toHaveLength(0);
    });
    return;
  }

  it('is a Compose circle with the initials, and no React Native view or host of its own', async () => {
    await render(inHost(<Avatar name="Ada Lovelace" testID="peer"/>));
    expect(hosts()).toHaveLength(0);
    expect(screen.queryByLabelText('Ada Lovelace')).toBeNull();
    const face = byComposeTestID('peer');
    expect(face.type.endsWith('BoxView')).toBe(true);
    expect(face.props.contentAlignment).toBe('center');
    expect(modifier(face.props, 'size')).toMatchObject({width: 28, height: 28});
    expect(modifier(face.props, 'clip')?.shape).toEqual({type: 'circle'});
    expect(modifier(face.props, 'background')?.color).toBe(colorOf('Ada Lovelace'));
    expect(modifier(face.props, 'alpha')).toBeUndefined();
    const [letters] = texts();
    expect(letters.props).toMatchObject({text: 'AL', color: onAccent(colorOf('Ada Lovelace')), fontSize: 11, fontWeight: '600', maxLines: 1});
  });

  it('lays the name over the face as unseen text, which TalkBack reads in place of the initials', async () => {
    await render(inHost(<Avatar name="Ada Lovelace" testID="peer"/>));
    const [letters, name] = texts();
    expect(name.props).toMatchObject({text: 'Ada Lovelace', color: '#00000000', maxLines: 1});
    // The size of the face, after the initials in the tree: it covers them,
    // so where nothing merges the two Compose leaves the initials out of
    // TalkBack's tree and the face is read as the name alone.
    expect(modifier(name.props, 'size')).toMatchObject({width: 28, height: 28});
    expect(modifier(letters.props, 'size')).toBeUndefined();
    expect((byComposeTestID('peer').children as HostNode[]).map(n => n.props.text)).toEqual(['AL', 'Ada Lovelace']);
  });

  it('takes initials, a color and a size of its own, and contrasts the letters', async () => {
    await render(inHost(<Avatar name="Ada" initials="A1" color="#FFFFFF" size={40} testID="peer"/>));
    expect(modifier(byComposeTestID('peer').props, 'size')).toMatchObject({width: 40, height: 40});
    expect(modifier(byComposeTestID('peer').props, 'background')?.color).toBe('#FFFFFF');
    expect(texts()[0].props).toMatchObject({text: 'A1', color: '#000000', fontSize: 16});
    expect(modifier(texts()[1].props, 'size')).toMatchObject({width: 40, height: 40});
  });

  it('draws a ring as a circle behind a smaller one, in a palette token or a color, and dims for someone away', async () => {
    await render(
      inHost(
        <>
          <Avatar name="Ada" ring="background" testID="parted"/>
          <Avatar name="Grace" ring="#FF00FF" dimmed testID="typing"/>
        </>,
      ),
    );
    const parted = byComposeTestID('parted');
    expect(modifier(parted.props, 'background')?.color).toBe(colors.light.background);
    expect(modifier(parted.props, 'alpha')).toBeUndefined();
    // The face inside the ring: the ring's width smaller on every side, in
    // the person's color, with the initials in it; a border modifier would
    // draw a square.
    const [inner, name] = parted.children as HostNode[];
    expect(inner.type.endsWith('BoxView')).toBe(true);
    expect(modifier(inner.props, 'size')).toMatchObject({width: 24, height: 24});
    expect(modifier(inner.props, 'clip')?.shape).toEqual({type: 'circle'});
    expect(modifier(inner.props, 'background')?.color).toBe(colorOf('Ada'));
    expect((inner.children as HostNode[])[0].props.text).toBe('AD');
    expect(name.props.text).toBe('Ada');
    const typing = byComposeTestID('typing');
    expect(modifier(typing.props, 'background')?.color).toBe('#FF00FF');
    expect(modifier(typing.props, 'alpha')?.alpha).toBe(0.5);
  });

  it('renders without a testID at all', async () => {
    await render(inHost(<Avatar name="Ada Lovelace"/>));
    expect(texts().map(n => n.props.text)).toEqual(['AL', 'Ada Lovelace']);
  });
});
