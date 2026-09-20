import {render} from '@testing-library/react-native';
import {nodes} from 'expo-vitest/native';
import * as icons from '../__stories__/icons';
import {Chip} from '.';

/** The label, which sits in a Compose text slot rather than an RN `Text`. */
function labelOf() {
  return nodes().find(node => node.type.endsWith('ExpoUI_TextView'))?.props.text;
}

/** The Compose chip in the tree, by which of Material's four it is. */
function chip(kind: 'Filter' | 'Assist' | 'Suggestion') {
  return nodes().find(node => node.type.endsWith(`ExpoUI_${kind}ChipView`));
}

describe('Chip (android)', () => {
  it('is a FilterChip when it has a state — the one that draws its own check', async () => {
    await render(<Chip label="Unread" selected onPress={() => {}} testID="c"/>);
    expect(chip('Filter')?.props).toMatchObject({selected: true, enabled: true});
    expect(labelOf()).toBe('Unread');
  });

  it('is an AssistChip when it has an icon and no state', async () => {
    await render(<Chip label="Add tag" icon={icons.add} onPress={() => {}} testID="c"/>);
    expect(chip('Assist')).toBeDefined();
    expect(chip('Filter')).toBeUndefined();
    expect(nodes().some(node => node.type.endsWith('ExpoUI_IconView'))).toBe(true);
  });

  it('is a SuggestionChip when it is only a word', async () => {
    await render(<Chip label="Later" onPress={() => {}} testID="c"/>);
    expect(chip('Suggestion')).toBeDefined();
    expect(nodes().some(node => node.type.endsWith('ExpoUI_IconView'))).toBe(false);
  });

  it('reports the state a press moves it to, from each of the three', async () => {
    const onPress = vi.fn();
    await render(<Chip label="Unread" selected onPress={onPress} testID="c"/>);
    chip('Filter')?.props.onNativeClick();
    expect(onPress).toHaveBeenLastCalledWith(false);

    await render(<Chip label="Add tag" icon={icons.add} onPress={onPress} testID="c"/>);
    chip('Assist')?.props.onNativeClick();
    expect(onPress).toHaveBeenLastCalledWith(true);

    await render(<Chip label="Later" onPress={onPress} testID="c"/>);
    chip('Suggestion')?.props.onNativeClick();
    expect(onPress).toHaveBeenLastCalledWith(true);
  });

  it('is disabled through Compose\'s own prop, and survives having nobody listening', async () => {
    await render(<Chip label="Unread" selected disabled testID="c"/>);
    expect(chip('Filter')?.props.enabled).toBe(false);
    // Compose wires the handler whether or not the kit was given one.
    chip('Filter')?.props.onNativeClick();
    expect(chip('Filter')).toBeDefined();
  });

  it('gives a filter chip its own leading icon, with or without a testID', async () => {
    await render(<Chip label="Starred" icon={icons.add} selected onPress={() => {}}/>);
    expect(chip('Filter')).toBeDefined();
    expect(nodes().some(node => node.type.endsWith('ExpoUI_IconView'))).toBe(true);
    // No testID: nothing to hang a Compose modifier on, and nothing breaks.
    expect(chip('Filter')?.props.modifiers).toBeUndefined();
  });
});
