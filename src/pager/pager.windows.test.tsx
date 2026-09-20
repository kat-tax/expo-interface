import {StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../__tests__/windows';
import {Pager} from '.';

const PIPS = 'ExpoInterfacePipsPager';

describe('Pager (windows)', () => {
  it('puts a real PipsPager under a paging scroller', async () => {
    await render(
      <Pager page={1} onPageChange={() => {}} label="Tour" testID="p">
        <Text>First</Text>
        <Text>Second</Text>
        <Text>Third</Text>
      </Pager>,
    );
    expect(island(PIPS).props).toMatchObject({
      count: 3,
      selectedIndex: 1,
      label: 'Tour',
      theme: 'light',
      testID: 'p-dots',
    });
    // A floor under the width, because a WinUI control measures short of what
    // it draws inside an island and clipped pips would be worse than spare
    // room around them.
    expect(StyleSheet.flatten(island(PIPS).props.style)).toMatchObject({minWidth: 108, height: 32});
    // React Native drops `pagingEnabled` on the way to a Windows view, so the
    // snap is asked for by interval instead — which is the prop
    // react-native-windows actually reads.
    expect(screen.getByTestId('p-pages').props.pagingEnabled).toBeUndefined();
  });

  it('takes a pip as a request for that page', async () => {
    const onPageChange = vi.fn();
    await render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    await fireIsland(island(PIPS), 'selectionChange', {index: 1});
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('snaps by interval once it knows how wide a page is', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    // Nothing to snap to before the scroller has been measured.
    expect(screen.getByTestId('p-pages').props.snapToInterval).toBeUndefined();
    await fireEvent(screen.getByTestId('p-pages'), 'layout', {nativeEvent: {layout: {width: 300, height: 200}}});
    expect(screen.getByTestId('p-pages').props).toMatchObject({snapToInterval: 300, snapToAlignment: 'start'});
  });

  it('reports the page the scroller settles on', async () => {
    const onPageChange = vi.fn();
    await render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    await fireEvent(screen.getByTestId('p-pages'), 'layout', {nativeEvent: {layout: {width: 300, height: 200}}});
    await fireEvent(screen.getByTestId('p-pages'), 'momentumScrollEnd', {nativeEvent: {contentOffset: {x: 300, y: 0}}});
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('draws no indicator when it was told not to, or when there is one page', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}} indicator={false} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.queryByTestId('p-dots')).toBeNull();

    await render(
      <Pager page={0} onPageChange={() => {}}>
        <Text>Only</Text>
      </Pager>,
    );
    expect(screen.queryByTestId('one-dots')).toBeNull();
  });

  it('works without a testID, which is what an app usually gives it', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}}>
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(island(PIPS).props).toMatchObject({count: 2, testID: undefined});
  });
});
