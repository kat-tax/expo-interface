import {Platform, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Pager} from '.';

/** The layout every scroller here gets, so a page has a width to be. */
const WIDTH = 300;

/**
 * Called rather than fired. React Native Testing Library reads a scroll event
 * as disabled when the nearest touch responder answers
 * `onStartShouldSetResponder` with false — which is what Android's horizontal
 * scroller does, so that its children can respond — and then delivers nothing
 * at all. The handler under it is the same one the platform calls.
 */
async function settle(testID: string, x: number, event: 'onMomentumScrollEnd' | 'onScrollEndDrag' = 'onMomentumScrollEnd') {
  const handler = screen.getByTestId(testID).props[event] as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {contentOffset: {x, y: 0}}}));
}

async function layout(testID: string, width = WIDTH) {
  const handler = screen.getByTestId(testID).props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 200}}}));
}

describe(`Pager (${Platform.OS})`, () => {
  it('draws every page and a dot for each, named and with the current one marked', async () => {
    await render(
      <Pager page={1} onPageChange={() => {}} label="Tour" testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.getByText('First')).toBeOnTheScreen();
    expect(screen.getByText('Second')).toBeOnTheScreen();
    expect(screen.getByTestId('p-dots')).toBeOnTheScreen();
    expect(screen.getByLabelText('Page 1 of 2')).toBeOnTheScreen();
    const current = screen.getByLabelText('Page 2 of 2');
    expect(current.props.accessibilityState).toMatchObject({selected: true});
  });

  it('takes a press on a dot as a request for that page', async () => {
    const onPageChange = vi.fn();
    await render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    await fireEvent.press(screen.getByLabelText('Page 2 of 2'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('reports the page a swipe settles on, once, and only when it changes', async () => {
    const onPageChange = vi.fn();
    await render(
      <Pager page={0} onPageChange={onPageChange} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    await layout('p-pages');
    // A drag let go short of the next page snaps back to this one.
    await settle('p-pages', WIDTH / 2 - 1, 'onScrollEndDrag');
    expect(onPageChange).not.toHaveBeenCalled();
    await settle('p-pages', WIDTH);
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
    // Coming to rest where it already is says nothing new, which is also what
    // keeps an animated scroll from being stopped by the pages it crosses.
    await settle('p-pages', WIDTH);
    expect(onPageChange).toHaveBeenCalledOnce();
  });

  it('draws no indicator when it was told not to, or when there is nothing to indicate', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}} indicator={false} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.queryByTestId('p-dots')).toBeNull();

    await render(
      <Pager page={0} onPageChange={() => {}} testID="one">
        <Text>Only</Text>
      </Pager>,
    );
    expect(screen.queryByTestId('one-dots')).toBeNull();
  });

  it('shows the page it can rather than the one asked for, and moves when that changes', async () => {
    const view = await render(
      <Pager page={9} onPageChange={() => {}} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    // Nine pages in is the last one there is.
    expect(screen.getByLabelText('Page 2 of 2').props.accessibilityState).toMatchObject({selected: true});
    await layout('p-pages');
    await view.rerender(
      <Pager page={0} onPageChange={() => {}} testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.getByLabelText('Page 1 of 2').props.accessibilityState).toMatchObject({selected: true});
  });

  it('is named as a whole, since a page is not named on its own', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}} label="Tour" testID="p">
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.getByTestId('p-pages').props.accessibilityLabel).toBe('Tour');
  });

  it('works without a testID, which is what an app usually gives it', async () => {
    await render(
      <Pager page={0} onPageChange={() => {}}>
        <Text>First</Text>
        <Text>Second</Text>
      </Pager>,
    );
    expect(screen.getByLabelText('Page 1 of 2')).toBeOnTheScreen();
  });
});
