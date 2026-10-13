import type {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen, within} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import {BAR_HEIGHT, BAR_SIDE} from './shared';
import {Sheet} from '.';

describe('Sheet chrome (windows)', () => {
  it('draws the bar the kit draws: the title over the subtitle, back and close at the ends, the menu before close', async () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" subtitle="12 unresolved" onBack={onBack} onClose={onClose} menu={[{label: 'Resolve all'}]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const bar = screen.getByTestId('sheet-bar');
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({minHeight: BAR_HEIGHT});
    expect(screen.getByText('Comments')).toBeOnTheScreen();
    expect(screen.getByText('12 unresolved')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('sheet-bar-back'), 'press');
    await fireEvent(screen.getByTestId('sheet-bar-close'), 'press');
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Resolve all']);
    // The two ends are the same width whichever holds a button, so the title stays centred.
    const [leading, , trailing] = bar.children as unknown as {props: {style: StyleProp<ViewStyle>}}[];
    expect(StyleSheet.flatten(leading.props.style).minWidth).toBe(BAR_SIDE);
    expect(StyleSheet.flatten(trailing.props.style).minWidth).toBe(BAR_SIDE);
  });

  it('draws a bar with a title alone, and the actions, without a test identifier', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Plain" menu={[]} actions={[{label: 'OK'}]}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.getByText('Plain')).toBeOnTheScreen();
    expect(island('ExpoInterfaceButton').props.label).toBe('OK');
  });

  it('draws the bar for a close button alone, with no title in it', async () => {
    const onClose = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}} onClose={onClose} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.getByTestId('sheet-bar')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('sheet-bar-close'), 'press');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('draws no bar and no actions when nothing asks for them', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} menu={[]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.queryByTestId('sheet-bar')).toBeNull();
    expect(screen.queryByTestId('sheet-actions')).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).maxHeight).toBeUndefined();
  });

  it('keeps the bar, the accessory, the footer and the actions outside the scrolling body, which the cap bounds', async () => {
    const onSave = vi.fn();
    await render(
      <Sheet
        isPresented
        onDismiss={() => {}}
        title="Comments"
        accessory={<Text>Filter</Text>}
        footer={<Text>Write</Text>}
        actions={[{label: 'Cancel'}, {label: 'Save', onPress: onSave}]}
        maxHeight={300}
        testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const body = screen.getByTestId('sheet-body');
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({maxHeight: 300});
    expect(within(body).getByText('Body')).toBeOnTheScreen();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('Comments')).toBeLessThan(json.indexOf('Filter'));
    expect(json.indexOf('Filter')).toBeLessThan(json.indexOf('"Body"'));
    expect(json.indexOf('"Body"')).toBeLessThan(json.indexOf('Write'));
    expect(json.indexOf('Write')).toBeLessThan(json.indexOf('Save'));
    await fireEvent(screen.getByTestId('sheet-actions-1'), 'press');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(screen.getByTestId('sheet-actions').props.style).justifyContent).toBe('flex-end');
  });

  it('caps the body at a fraction of the area the layer covers, as it lays out', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} maxHeight={{fraction: 0.5}} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const cap = () => StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).maxHeight;
    // Zero height until the area is measured; the card's entrance fade hides that first frame.
    expect(cap()).toBe(0);
    await fireEvent(screen.getByTestId('sheet-area'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 1000, height: 800}}});
    expect(cap()).toBe(400);
    // A resize lays the area out again, which the window's dimensions do not follow here.
    await fireEvent(screen.getByTestId('sheet-area'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 1000, height: 600}}});
    expect(cap()).toBe(300);
  });

  it('lets the frame shrink to the card, so a large cap gives way in the body and never pushes the footer or the actions out', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" footer={<Text>Write</Text>} actions={[{label: 'Done'}]} maxHeight={{fraction: 0.9}} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    await fireEvent(screen.getByTestId('sheet-area'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 1000, height: 800}}});
    const body = screen.getByTestId('sheet-body');
    // The card stops at 90% of the area less its padding: the frame shrinks to it, and of what it
    // holds only the scrolling body shrinks, so the bar, the footer and the actions keep their height.
    const frame = body.parent!;
    expect(StyleSheet.flatten(frame.props.style)).toMatchObject({flexShrink: 1, width: '100%'});
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({flexShrink: 1, maxHeight: 720});
    expect(within(frame).getByTestId('sheet-bar')).toBeOnTheScreen();
    expect(within(frame).getByText('Write')).toBeOnTheScreen();
    expect(within(frame).getByTestId('sheet-actions')).toBeOnTheScreen();
  });

  it('keeps a cap in points whatever the area', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} maxHeight={300} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    await fireEvent(screen.getByTestId('sheet-area'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 1000, height: 800}}});
    expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).maxHeight).toBe(300);
  });
});

describe('Sheet accessory (windows)', () => {
  type Node = ReturnType<typeof screen.getByTestId>;

  /** The bar, its two ends, and the content of each, which is what reports a width. */
  function parts() {
    const bar = screen.getByTestId('sheet-bar');
    const [leading, , trailing] = bar.children as Node[];
    return {bar, leading, trailing, leadingContent: leading.children[0] as Node, trailingContent: trailing.children[0] as Node};
  }

  /** The least width of each end, leading first. */
  function sides() {
    const {leading, trailing} = parts();
    return [StyleSheet.flatten(leading.props.style).minWidth, StyleSheet.flatten(trailing.props.style).minWidth];
  }

  const layout = (node: Node, width: number) => fireEvent(node, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width, height: 40}}});

  /** Whether the bar holds the accessory. */
  const inBar = () => within(parts().bar).queryByTestId('filter') !== null;

  it('keeps the accessory in a row of its own under the bar unless it is placed in the bar', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={<Text testID="filter">Filter</Text>} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(inBar()).toBe(false);
    expect(screen.getByTestId('filter')).toBeOnTheScreen();
  });

  it('puts the accessory placed in the bar at its leading end, after the back button, and draws the bar for it alone', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onBack={() => {}} onClose={() => {}} accessory={<Text testID="filter">Filter</Text>} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const {leadingContent} = parts();
    expect(leadingContent.children.map(child => (child as Node).props.testID)).toEqual(['sheet-bar-back', 'filter']);
    expect(screen.getAllByTestId('filter')).toHaveLength(1);
    await render(
      <Sheet isPresented onDismiss={() => {}} accessory={<Text testID="filter">Filter</Text>} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(inBar()).toBe(true);
  });

  it('makes both ends as wide as the wider end\'s content, so the title stays centred', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} menu={[{label: 'Resolve all'}]} accessory={<Text testID="filter">Filter</Text>} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(sides()).toEqual([BAR_SIDE, BAR_SIDE]);
    const {bar, leadingContent, trailingContent} = parts();
    await layout(bar, 600);
    await layout(leadingContent, 150);
    await layout(trailingContent, 48);
    expect(sides()).toEqual([150, 150]);
    expect(inBar()).toBe(true);
  });

  it('moves the accessory to a row of its own under a bar too narrow for it, and back once the bar widens', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={<Text testID="filter">Filter</Text>} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const {bar, leadingContent, trailingContent} = parts();
    await layout(leadingContent, 120);
    await layout(trailingContent, 24);
    await layout(bar, 300);
    // 300 less two ends of 120 would leave the title 60, under its 96: the row under the bar, before the body.
    expect(inBar()).toBe(false);
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('Comments')).toBeLessThan(json.indexOf('Filter'));
    expect(json.indexOf('Filter')).toBeLessThan(json.indexOf('"Body"'));
    await layout(parts().leadingContent, 0);
    expect(sides()).toEqual([BAR_SIDE, BAR_SIDE]);
    expect(inBar()).toBe(false);
    await layout(parts().bar, 400);
    expect(inBar()).toBe(true);
  });
});
