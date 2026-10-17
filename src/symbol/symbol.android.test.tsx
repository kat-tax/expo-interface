import {createElement} from 'react';
import {View} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {byComposeTestID, modifier, nodes} from 'expo-vitest/native';
import * as icons from '../__stories__/icons';
import {hosts} from '../__tests__/hosts';
import {EmptyState} from '../empty-state';
import {NativeHost} from '../host';
import {icon, registerDrawables} from '../icons';
import {List} from '../list';
import {ListItem} from '../list-item';
import {SheetHosted} from '../sheet/hosted';
import {colors} from '../theme';
import {Icon} from '.';

// `SymbolView` as a host view carrying its props, as the shared test has it.
vi.mock('expo-symbols', () => ({SymbolView: (props: object) => createElement('SymbolView', props)}));

/** The Compose icons in the rendered tree. */
const composeIcons = () => nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_IconView');
/** The `SymbolView`s in the rendered tree. */
const symbolViews = () => nodes().filter(n => n.type === 'SymbolView');

/** A token whose drawable is a file, which React Native resolves to its URI in a test. */
const pin = icon({ios: 'pin', android: 'push_pin', web: 'push_pin'}, {uri: 'file:///push_pin.xml'});

describe('Icon (android)', () => {
  it('is a SymbolView in a React Native layout, where a Compose view has no composition', async () => {
    await render(<View><Icon icon={icons.star} testID="star"/></View>);
    expect(screen.getByTestId('star').type).toBe('SymbolView');
    expect(composeIcons()).toHaveLength(0);
    expect(hosts()).toHaveLength(0);
  });

  it('is Compose content inside a host: the drawable at its size and tone, the testID a modifier', async () => {
    await render(
      <NativeHost>
        <Icon icon={pin} testID="pin"/>
        <Icon icon={icons.share} size={16} tone="success" testID="toned"/>
        <Icon icon={icons.share} tone="success" tintColor="#123456" testID="own"/>
      </NativeHost>,
    );
    expect(symbolViews()).toHaveLength(0);
    // No host of its own: the icon is a direct child of the one above.
    expect(hosts()).toHaveLength(1);
    const glyph = byComposeTestID('pin');
    expect(glyph.type).toBe('ViewManagerAdapter_ExpoUI_IconView');
    expect(hosts()[0].children).toContainEqual(glyph);
    expect(glyph.props).toMatchObject({size: 24, tint: colors.light.label, source: {uri: 'file:///push_pin.xml'}});
    expect(byComposeTestID('toned').props).toMatchObject({size: 16, tint: colors.light.success});
    expect(byComposeTestID('own').props.tint).toBe('#123456');
  });

  it('draws the filled vector for a filled token inside a host', async () => {
    registerDrawables({heart_plus: {uri: 'file:///heart_plus.xml'}}, {heart_plus: {uri: 'file:///heart_plus_fill.xml'}});
    const heart = icon({ios: 'heart', android: 'heart_plus', web: 'heart_plus'});
    await render(
      <NativeHost>
        <Icon icon={heart} testID="outline"/>
        <Icon icon={{...heart, fill: true}} testID="filled"/>
      </NativeHost>,
    );
    expect(byComposeTestID('outline').props.source).toMatchObject({uri: 'file:///heart_plus.xml'});
    expect(byComposeTestID('filled').props.source).toMatchObject({uri: 'file:///heart_plus_fill.xml'});
  });

  it('stays out of TalkBack inside a host: no content description', async () => {
    await render(<NativeHost><Icon icon={icons.star}/></NativeHost>);
    const [glyph] = composeIcons();
    expect(glyph.props.contentDescription).toBeUndefined();
    // No testID, no modifiers to hang it on.
    expect(glyph.props.modifiers).toBeUndefined();
  });

  it('draws nothing inside a host for a token with no drawable, as a chip\'s icon does', async () => {
    await render(
      <NativeHost>
        <Icon icon={icon({ios: 'questionmark', android: 'help', web: 'help'})} testID="unregistered"/>
      </NativeHost>,
    );
    expect(composeIcons()).toHaveLength(0);
    expect(symbolViews()).toHaveLength(0);
  });

  it('stands at either end of a row, in a List as well, as Compose content', async () => {
    await render(
      <List
        data={['Essay']}
        renderItem={title => (
          <ListItem leading={<Icon icon={icons.share} testID="lead"/>} trailing={<Icon icon={icons.starFilled} tone="accent" testID="trail"/>} testID="row">
            {title}
          </ListItem>
        )}
      />,
    );
    expect(symbolViews()).toHaveLength(0);
    const slot = (name: string) => nodes().find(n => n.props?.slotName === name)!;
    expect(nodes(slot('leadingContent'))).toContainEqual(byComposeTestID('lead'));
    expect(nodes(slot('trailingContent'))).toContainEqual(byComposeTestID('trail'));
    expect(byComposeTestID('trail').props.tint).toBe(colors.light.tint);
    expect(modifier(byComposeTestID('trail').props, 'testID')).toEqual({$type: 'testID', testID: 'trail'});
  });

  it('is a SymbolView again in the kit\'s own React Native content inside a host', async () => {
    await render(
      <NativeHost>
        <EmptyState title="Nothing here" action={<Icon icon={icons.star} testID="node"/>}/>
        <SheetHosted><Icon icon={icons.share} testID="body"/></SheetHosted>
      </NativeHost>,
    );
    // An `RNHostView` puts React Native content back in the tree, and the kit
    // says so below it: a Compose icon there would be outside a composition.
    expect(screen.getByTestId('node').type).toBe('SymbolView');
    expect(screen.getByTestId('body').type).toBe('SymbolView');
    expect(composeIcons()).toHaveLength(0);
  });
});
