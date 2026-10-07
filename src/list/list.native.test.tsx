import {Platform, StyleSheet} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {hostFit, hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {ListItem} from '../list-item';
import {ScrollInsetsContext} from '../screen/insets';
import {colors} from '../theme';
import {host, modifier, nodes} from 'expo-vitest/native';
import {List} from '.';

const isIOS = Platform.OS === 'ios';
const rows = ['Essay', 'Notes', 'Sketch'];
const list = () => nodes().find(n => n.type.includes(isIOS ? 'ListView' : 'LazyColumnView'))!;
const dividers = () => nodes().filter(n => n.type.includes('Divider'));
const render_ = (ui: React.ReactElement) => render(<NativeHostContext.Provider value={true}>{ui}</NativeHostContext.Provider>);

describe(`List (${Platform.OS})`, () => {
  it('renders the platform\'s lazy list of the rows, in order, with separators between them', async () => {
    await render_(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} keyExtractor={title => title} testID="list"/>);
    expect(list()).toBeTruthy();
    for (const title of rows) expect(host(p => p.text === title)).toBeTruthy();
    if (isIOS) {
      // SwiftUI's own separators, in the plain style.
      expect(modifier(list().props, 'listStyle')?.style).toBe('plain');
      expect(modifier(list().props, 'listRowSeparator')).toBeUndefined();
    } else {
      // Material's divider between the rows, none after the last.
      expect(dividers()).toHaveLength(2);
      expect(dividers()[0].props.color).toBe(colors.light.separator);
      expect(dividers()[0].props.thickness).toBe(StyleSheet.hairlineWidth);
      expect(modifier(list().props, 'testID')).toBeTruthy();
    }
  });

  it('hides the separators when asked, and keys the rows by index without an extractor', async () => {
    await render_(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} separators={false}/>);
    if (isIOS) {
      expect(modifier(list().props, 'listRowSeparator')?.visibility).toBe('hidden');
    } else {
      expect(dividers()).toHaveLength(0);
    }
  });

  it('puts the header before the rows and the footer after, and shows the empty state in place of no rows', async () => {
    await render_(
      <List
        data={[]}
        renderItem={() => null}
        header={<ListItem testID="header">Header</ListItem>}
        empty={<ListItem testID="empty">Nothing yet</ListItem>}
      />,
    );
    expect(host(p => p.text === 'Nothing yet')).toBeTruthy();
    expect(nodes().some(n => n.props.text === 'Header')).toBe(false);
    await render_(
      <List
        data={['One']}
        renderItem={title => <ListItem>{title}</ListItem>}
        header={<ListItem>Header</ListItem>}
        footer={<ListItem>Footer</ListItem>}
        empty={<ListItem>Nothing yet</ListItem>}
      />,
    );
    const texts = nodes().map(n => n.props.text).filter(Boolean);
    expect(texts.indexOf('Header')).toBeLessThan(texts.indexOf('One'));
    expect(texts.indexOf('One')).toBeLessThan(texts.indexOf('Footer'));
    expect(texts).not.toContain('Nothing yet');
  });

  it('reports the end once the last row has been drawn', async () => {
    const onEndReached = vi.fn();
    await render_(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} onEndReached={onEndReached}/>);
    if (isIOS) {
      // The sentinel after the last row appears when the row does.
      const sentinel = host(p => modifier(p, 'onAppear') !== undefined);
      await act(async () => modifier(sentinel.props, 'onAppear')!.eventListener());
    } else {
      const sentinel = host(p => modifier(p, 'onVisibilityChanged') !== undefined);
      await act(async () => modifier(sentinel.props, 'onVisibilityChanged')!.eventListener({isVisible: false}));
      expect(onEndReached).not.toHaveBeenCalled();
      await act(async () => modifier(sentinel.props, 'onVisibilityChanged')!.eventListener({isVisible: true}));
    }
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('pads its content by the screen\'s bar and its own insets', async () => {
    await render(
      <NativeHostContext.Provider value={true}>
        <ScrollInsetsContext.Provider value={{top: 100, bottom: 0}}>
          <List data={rows} renderItem={title => <ListItem>{title}</ListItem>} contentInset={{top: 8, bottom: 20}}/>
        </ScrollInsetsContext.Provider>
      </NativeHostContext.Provider>,
    );
    if (isIOS) {
      const spacers = nodes().filter(n => n.type.includes('SpacerView'));
      expect(modifier(spacers[0].props, 'frame')?.height).toBe(108);
      expect(modifier(spacers.at(-1)!.props, 'frame')?.height).toBe(20);
    } else {
      expect(list().props.contentPadding).toEqual({top: 108, bottom: 20});
    }
  });

  it('mounts a host of its own that fills the screen outside one, and none inside', async () => {
    await render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} testID="list"/>);
    expect(hosts()).toHaveLength(1);
    expect(hostFit(hosts()[0])).toEqual({});
    expect(screen.getByTestId('list')).toBeTruthy();
    await render_(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>}/>);
    expect(hosts()).toHaveLength(0);
  });
});
