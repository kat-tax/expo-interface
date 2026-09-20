import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import type {CaretField} from '../caret/types';
import type {MenuPoint} from '../menu/types';
import {useRef, useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {caretPoint} from '../caret';
import {Footnote} from '../typography';
import {spacing, useColor} from '../theme';
import * as icons from '../__stories__/icons';
import {PopupMenu} from '.';

/**
 * The word being typed after a `/` that starts one, or null when the caret is
 * not in such a word. Story-side on purpose: which character opens a menu,
 * and what ends it, is the app's policy rather than the kit's.
 */
function slashQuery(text: string, caret: number): string | null {
  const before = text.slice(0, caret);
  const slash = before.lastIndexOf('/');
  if (slash < 0) return null;
  if (slash > 0 && !/\s/.test(before[slash - 1]!)) return null;
  const query = before.slice(slash + 1);
  return /\s/.test(query) ? null : query;
}

const items = [
  {label: 'Heading', icon: icons.add},
  {label: 'Bullet list', icon: icons.chevron},
  {label: 'Delete block', icon: icons.trash, role: 'destructive' as const, separator: true},
];

const meta = {
  title: 'Overlays/PopupMenu',
  component: PopupMenu,
  // The menu lays a host of its own over the content.
  parameters: {native: false, docs: {description: {component: 'The platform\'s menu opened at a point over content the kit did not draw — a right click on a canvas, the caret in an editor. A SwiftUI popover on iOS, a Compose `DropdownMenu` on Android, the `popover` element on web.'}}},
  args: {
    items,
    at: {x: 24, y: 24},
    onDismiss: fn(),
  },
  render: args => (
    <View style={styles.canvas}>
      <Footnote color="tertiaryLabel">A canvas the kit did not draw</Footnote>
      <PopupMenu {...args}/>
    </View>
  ),
} satisfies Meta<typeof PopupMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtAPoint: Story = {};

export const Filtered: Story = {
  args: {filter: 'list'},
};

export const Interactive: Story = {
  render: function Interactive(args) {
    const [at, setAt] = useState<{x: number; y: number} | null>(null);
    return (
      <View style={styles.canvas}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the menu where you press"
          style={StyleSheet.absoluteFill}
          onPress={event => setAt({x: event.nativeEvent.locationX, y: event.nativeEvent.locationY})}
        />
        <Footnote color="tertiaryLabel">Press anywhere in the canvas</Footnote>
        <PopupMenu {...args} at={at} onDismiss={() => setAt(null)}/>
      </View>
    );
  },
};

/**
 * A menu typed into, which is what `at` and `filter` were always for. `/`
 * opens it at the caret and every keystroke narrows it.
 *
 * `caretPoint` is the web's answer and nothing else's: on iOS, Android and
 * Windows it returns null, and this story then opens the menu under the field
 * instead — the fallback its own documentation asks for.
 */
export const SlashCommand: Story = {
  render: function SlashCommand(args) {
    const field = useRef<TextInput>(null);
    const canvas = useRef<View>(null);
    const [text, setText] = useState('Type / for the menu');
    const [at, setAt] = useState<MenuPoint | null>(null);
    const [filter, setFilter] = useState('');
    const ink = useColor('label');
    const border = useColor('separator');
    return (
      <View ref={canvas} style={styles.canvas}>
        <TextInput
          ref={field}
          multiline
          value={text}
          accessibilityLabel="Notes"
          style={[styles.editor, {color: ink, borderColor: border}]}
          onChangeText={next => {
            setText(next);
            // On web a TextInput's ref is the DOM element itself; on the
            // other three it is not, and `caretPoint` says so by answering
            // null whatever it is handed.
            const element = field.current as unknown as CaretField | null;
            const query = slashQuery(next, element?.selectionStart ?? next.length);
            setFilter(query ?? '');
            if (query === null) {
              setAt(null);
              return;
            }
            const point = caretPoint(element, canvas.current as unknown as Element);
            setAt(point ? {x: point.x, y: point.y + point.height} : FALLBACK);
          }}
        />
        <PopupMenu {...args} at={at} filter={filter} onDismiss={() => setAt(null)}/>
      </View>
    );
  },
};

/** Under the field, for a platform that cannot say where the caret is. */
const FALLBACK = {x: spacing.three, y: 96};

const styles = StyleSheet.create({
  canvas: {height: 200, padding: 12},
  editor: {
    minHeight: 72,
    padding: spacing.two,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
  },
});
