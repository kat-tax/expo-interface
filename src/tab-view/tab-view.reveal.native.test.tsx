import type {RefObject} from 'react';
import {createRef} from 'react';
import {Platform, ScrollView, View} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {useTabPlaces} from './draw';

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A scroller of tabs on the hook, as the strip and the cards are, with the
 * scroller's ref held by the test: `scrollTo` is a property of the scroll
 * view's own instance, which is the one place the scroll can be seen.
 */
function Scroller({ids, selected, axis, shown, scroller}: {
  ids: string[];
  selected: string;
  axis: 'x' | 'y';
  shown: boolean;
  scroller: RefObject<ScrollView | null>;
}) {
  const places = useTabPlaces(selected, axis, shown, scroller);
  return shown ? (
    <ScrollView ref={scroller} horizontal={axis === 'x'} onLayout={places.onFrame} onScroll={places.onScroll} testID="s">
      {ids.map(id => <View key={id} testID={id} onLayout={event => places.onPlace(id, event)}/>)}
    </ScrollView>
  ) : null;
}

const IDS = ['a', 'b', 'c'];

/** A tab, or a card, reports where it is in its scroller. */
async function placed(id: string, layout: Layout) {
  const handler = screen.getByTestId(id).props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout}}));
}

/** The scroller reports its own frame. */
async function framed(width: number, height: number) {
  const handler = screen.getByTestId('s').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {x: 0, y: 0, width, height}}}));
}

/** The scroller reports where it has scrolled to. */
async function scrolled(x: number, y: number) {
  const handler = screen.getByTestId('s').props.onScroll as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {contentOffset: {x, y}}}));
}

/** Three tabs of 120 across the strip, the third past the end of a strip 300 wide. */
async function stripPlaced() {
  await placed('a', {x: 0, y: 0, width: 120, height: 48});
  await placed('b', {x: 120, y: 0, width: 120, height: 48});
  await placed('c', {x: 240, y: 0, width: 120, height: 48});
}

describe(`useTabPlaces keeps the selected tab in view (${Platform.OS})`, () => {
  const scroller = createRef<ScrollView>();
  const watch = () => vi.spyOn(scroller.current!, 'scrollTo').mockImplementation(() => {});

  it('scrolls the strip to a selected tab past its end, once the tabs and the strip have reported, with animation', async () => {
    await render(<Scroller ids={IDS} selected="c" axis="x" shown scroller={scroller}/>);
    const scrollTo = watch();
    await stripPlaced();
    // The tabs alone say nothing about how much of them shows.
    expect(scrollTo).not.toHaveBeenCalled();
    await framed(300, 48);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({x: 60, animated: true});
    // Once in view, a frame reported again moves nothing.
    await framed(300, 48);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('scrolls back to a selected tab before the view, and moves nothing for one in view', async () => {
    const {rerender} = await render(<Scroller ids={IDS} selected="c" axis="x" shown scroller={scroller}/>);
    const scrollTo = watch();
    await framed(300, 48);
    await stripPlaced();
    expect(scrollTo).toHaveBeenCalledWith({x: 60, animated: true});
    await scrolled(60, 0);
    await rerender(<Scroller ids={IDS} selected="b" axis="x" shown scroller={scroller}/>);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await rerender(<Scroller ids={IDS} selected="a" axis="x" shown scroller={scroller}/>);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({x: 0, animated: true});
  });

  it('scrolls to the start of a tab wider than the strip', async () => {
    await render(<Scroller ids={IDS} selected="c" axis="x" shown scroller={scroller}/>);
    const scrollTo = watch();
    await framed(300, 48);
    await placed('c', {x: 240, y: 0, width: 400, height: 48});
    expect(scrollTo).toHaveBeenLastCalledWith({x: 240, animated: true});
  });

  it('waits for a tab added and selected at once to report its layout', async () => {
    const {rerender} = await render(<Scroller ids={IDS.slice(0, 2)} selected="a" axis="x" shown scroller={scroller}/>);
    const scrollTo = watch();
    await framed(300, 48);
    await placed('a', {x: 0, y: 0, width: 120, height: 48});
    await placed('b', {x: 120, y: 0, width: 120, height: 48});
    expect(scrollTo).not.toHaveBeenCalled();
    await rerender(<Scroller ids={IDS} selected="c" axis="x" shown scroller={scroller}/>);
    expect(scrollTo).not.toHaveBeenCalled();
    await placed('c', {x: 240, y: 0, width: 120, height: 48});
    expect(scrollTo).toHaveBeenCalledWith({x: 60, animated: true});
  });

  it('scrolls the selected card into view as the cards open, from places reported afresh each time', async () => {
    const {rerender} = await render(<Scroller ids={IDS} selected="c" axis="y" shown scroller={scroller}/>);
    let scrollTo = watch();
    await framed(400, 100);
    await placed('a', {x: 16, y: 16, width: 160, height: 60});
    await placed('b', {x: 192, y: 16, width: 160, height: 60});
    expect(scrollTo).not.toHaveBeenCalled();
    await placed('c', {x: 16, y: 88, width: 160, height: 60});
    expect(scrollTo).toHaveBeenCalledWith({y: 48, animated: true});
    // Closed and opened again: the old places went with the grid, and the
    // new ones bring the card into view again.
    await rerender(<Scroller ids={IDS} selected="c" axis="y" shown={false} scroller={scroller}/>);
    expect(screen.queryByTestId('s')).toBeNull();
    await rerender(<Scroller ids={IDS} selected="c" axis="y" shown scroller={scroller}/>);
    scrollTo = watch();
    await framed(400, 100);
    expect(scrollTo).not.toHaveBeenCalled();
    await placed('c', {x: 16, y: 88, width: 160, height: 60});
    expect(scrollTo).toHaveBeenCalledWith({y: 48, animated: true});
  });
});
