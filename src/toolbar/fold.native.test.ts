import type {LayoutChangeEvent} from 'react-native';
import type {ToolbarCommand} from './types';
import {act, renderHook} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {shapeOf, useFold} from './fold';

const layout = (width: number) => ({nativeEvent: {layout: {x: 0, y: 0, width, height: 44}}}) as LayoutChangeEvent;
const tools: ToolbarCommand[] = [{label: 'Bold'}, {label: 'Italic'}, {label: 'Link'}, {label: 'Export', secondary: true}];
const labels = (commands: readonly ToolbarCommand[] | undefined) => commands?.map(command => command.label);

describe('useFold', () => {
  it('folds one trailing primary command per layout wider than the room, first among the overflow\'s entries, until the bar fits', async () => {
    const {result} = await renderHook(() => useFold(tools, 184));
    // Not measured yet: nothing folds, and nothing is known to fit.
    expect(labels(result.current.split!.primary)).toEqual(['Bold', 'Italic', 'Link']);
    expect(labels(result.current.split!.secondary)).toEqual(['Export']);
    expect(result.current).toMatchObject({fits: false, key: '0'});
    await act(async () => result.current.onLayout(layout(240)));
    expect(labels(result.current.split!.primary)).toEqual(['Bold', 'Italic']);
    expect(labels(result.current.split!.secondary)).toEqual(['Link', 'Export']);
    expect(result.current).toMatchObject({fits: false, key: '1'});
    // The first fold swapped Link for the More button and gained nothing: the next one does.
    await act(async () => result.current.onLayout(layout(240)));
    expect(labels(result.current.split!.primary)).toEqual(['Bold']);
    expect(labels(result.current.split!.secondary)).toEqual(['Italic', 'Link', 'Export']);
    expect(result.current).toMatchObject({fits: false, key: '2'});
    await act(async () => result.current.onLayout(layout(170)));
    expect(result.current).toMatchObject({fits: true, key: '2'});
    // The same width again changes nothing.
    await act(async () => result.current.onLayout(layout(170)));
    expect(result.current).toMatchObject({fits: true, key: '2'});
  });

  it('folds no further than every primary command, and the bar then fits as it is', async () => {
    const {result} = await renderHook(() => useFold(tools, 84));
    for (let fold = 0; fold < 3; fold++) await act(async () => result.current.onLayout(layout(240)));
    expect(result.current.split!.primary).toEqual([]);
    expect(labels(result.current.split!.secondary)).toEqual(['Bold', 'Italic', 'Link', 'Export']);
    expect(result.current).toMatchObject({fits: true, key: '3'});
    await act(async () => result.current.onLayout(layout(240)));
    expect(result.current).toMatchObject({fits: true, key: '3'});
  });

  it('folds on from where it is with less room, and starts over with more', async () => {
    let room = 184;
    const {result, rerender} = await renderHook(() => useFold(tools, room));
    await act(async () => result.current.onLayout(layout(240)));
    await act(async () => result.current.onLayout(layout(240)));
    await act(async () => result.current.onLayout(layout(170)));
    expect(result.current).toMatchObject({fits: true, key: '2'});
    // Less room: the bar it measured no longer fits, and the next command folds without a new layout.
    room = 150;
    await rerender({});
    expect(labels(result.current.split!.primary)).toEqual([]);
    expect(result.current).toMatchObject({fits: true, key: '3'});
    // More room: fewer may fit now, so every command comes back and the bar is measured afresh.
    room = 400;
    await rerender({});
    expect(labels(result.current.split!.primary)).toEqual(['Bold', 'Italic', 'Link']);
    expect(result.current).toMatchObject({fits: false, key: '4'});
    await act(async () => result.current.onLayout(layout(240)));
    expect(result.current).toMatchObject({fits: true, key: '4'});
    // More room still, with nothing folded: the width it has is good, and nothing starts over.
    room = 500;
    await rerender({});
    expect(result.current).toMatchObject({fits: true, key: '4'});
  });

  it('starts over when the commands take another shape, not when the array is rebuilt or a state changes', async () => {
    let commands: ToolbarCommand[] = tools;
    const {result, rerender} = await renderHook(() => useFold(commands, 184));
    await act(async () => result.current.onLayout(layout(240)));
    expect(result.current.key).toBe('1');
    commands = tools.map(command => ({...command, active: command.label === 'Bold', disabled: true, color: '#FF9500'}));
    await rerender({});
    expect(labels(result.current.split!.secondary)).toEqual(['Link', 'Export']);
    expect(result.current.key).toBe('1');
    commands = [{label: 'Bold'}, {label: 'Italic'}, {label: 'Unlink'}, {label: 'Export', secondary: true}];
    await rerender({});
    expect(labels(result.current.split!.primary)).toEqual(['Bold', 'Italic', 'Unlink']);
    expect(result.current).toMatchObject({fits: false, key: '2'});
  });

  it('ignores a layout of a view a fold has unmounted', async () => {
    const {result} = await renderHook(() => useFold(tools, 184));
    const stale = result.current.onLayout;
    await act(async () => stale(layout(240)));
    expect(result.current.key).toBe('1');
    await act(async () => stale(layout(999)));
    expect(result.current).toMatchObject({fits: false, key: '1'});
  });

  it('has nothing to fold for a bar given no commands, and folds nothing before the room is known', async () => {
    const none = await renderHook(() => useFold(undefined, 184));
    expect(none.result.current).toMatchObject({split: undefined, fits: true});
    const empty = await renderHook(() => useFold([], 184));
    expect(empty.result.current).toMatchObject({split: undefined, fits: true});
    const unmeasured = await renderHook(() => useFold(tools, 0));
    await act(async () => unmeasured.result.current.onLayout(layout(240)));
    expect(labels(unmeasured.result.current.split!.primary)).toEqual(['Bold', 'Italic', 'Link']);
    expect(unmeasured.result.current).toMatchObject({fits: true, key: '0'});
  });
});

describe('shapeOf', () => {
  it('tells the commands apart by their count, labels, hidden labels, icons, overflow and rules, not by state or identity', () => {
    const shape = shapeOf(tools);
    expect(shapeOf(tools.map(command => ({...command, active: true, disabled: true, color: '#FF9500', onPress: () => {}})))).toBe(shape);
    expect(shapeOf(tools.slice(0, 3))).not.toBe(shape);
    expect(shapeOf([{label: 'Bold', icon: icons.add}, ...tools.slice(1)])).not.toBe(shape);
    expect(shapeOf([{label: 'Bold', hideLabel: true}, ...tools.slice(1)])).not.toBe(shape);
    expect(shapeOf([{label: 'Bold', separator: true}, ...tools.slice(1)])).not.toBe(shape);
    expect(shapeOf([{label: 'Bold', secondary: true}, ...tools.slice(1)])).not.toBe(shape);
    expect(shapeOf([{label: 'Bolder'}, ...tools.slice(1)])).not.toBe(shape);
    expect(shapeOf(undefined)).toBe('');
  });
});
