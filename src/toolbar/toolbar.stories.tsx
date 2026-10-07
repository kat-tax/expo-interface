import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Divider} from '../divider';
import {Footnote} from '../typography';
import {useColor} from '../theme';
import {Menu} from '../menu';
import {TextField} from '../text-field';
import * as icons from '../__stories__/icons';
import {Toolbar} from '.';

/** Enough tools that the regular spacing would run a narrow bar out of room. */
const TOOLS = [
  {label: 'Add', icon: icons.add},
  {label: 'Star', icon: icons.star},
  {label: 'Share', icon: icons.share},
  {label: 'Delete', icon: icons.trash},
  {label: 'Settings', icon: icons.settings},
  {label: 'Info', icon: icons.info},
];

const meta = {
  title: 'Layout/Toolbar',
  component: Toolbar,
  parameters: {native: false, docs: {description: {component: 'A bar of tools along a canvas. The controls are one native view — a `Row` inside a single host — so a bar of buttons and menus costs one bridge crossing, not one per group. A `field` splits it in two, since a text field is a React Native input.'}}},
  args: {
    placement: 'bottom',
  },
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        leading={
          <>
            <Button label="Bold" prefixIcon={icons.add} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
            <Divider vertical/>
            <Button label="Share" prefixIcon={icons.share} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
          </>
        }
        trailing={
          <Menu
            label="Export"
            icon={icons.chevron}
            variant="text"
            size="small"
            items={[{label: 'PDF'}, {label: 'Markdown'}]}
          />
        }
      />
    </View>
  ),
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tools: Story = {};

export const AtTheTop: Story = {
  args: {placement: 'top'},
};

export const Compact: Story = {
  args: {density: 'compact'},
  parameters: {docs: {description: {story: 'A bar of many icon tools on a narrow screen: the controls sit closer together and the bar\'s ends pull in, without changing its height.'}}},
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        leading={
          <>
            {TOOLS.map(tool => (
              <Button key={tool.label} label={tool.label} prefixIcon={tool.icon} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
            ))}
            <Divider vertical/>
            <Button label="Help" prefixIcon={icons.info} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>
          </>
        }
        trailing={<Button label="Done" variant="text" size="inline" onPress={fn()}/>}
      />
    </View>
  ),
};

export const WithAField: Story = {
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        leading={<Button label="Search" prefixIcon={icons.add} hideLabel variant="text" tone="label" size="inline" onPress={fn()}/>}
        field={<TextField placeholder="Search the document" variant="inline"/>}
        trailing={<Button label="Next" variant="text" size="inline" onPress={fn()}/>}
      />
    </View>
  ),
};

/** An editor's formatting toggles: bold and italic stay down while they are on. */
function useFormatting() {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  return [
    {label: 'Bold', icon: icons.add, hideLabel: true, active: bold, tone: 'label' as const, onPress: () => setBold(on => !on)},
    {label: 'Italic', icon: icons.star, hideLabel: true, active: italic, tone: 'label' as const, onPress: () => setItalic(on => !on)},
    {label: 'Link', icon: icons.share, hideLabel: true, tone: 'label' as const, onPress: fn()},
    {label: 'Clear formatting', secondary: true, onPress: fn()},
  ];
}

/**
 * A floating bar: raised and rounded, the width of its controls. Material's
 * floating toolbar on Android, the kit's capsule on iOS and web, the
 * `CommandBar` in a raised card on Windows. Its toggles are heard as on or off.
 */
export const Floating: Story = {
  render: function Floating(args) {
    const commands = useFormatting();
    return (
      <View style={styles.stage}>
        <Footnote color="tertiaryLabel">A canvas under the bar</Footnote>
        <Toolbar {...args} floating commands={commands}/>
      </View>
    );
  },
};

/**
 * The strip over a selection: centred on the selected words, over them
 * unless there is no room, and drawn only once it is placed.
 */
export const AtASelection: Story = {
  render: function AtASelection(args) {
    const commands = useFormatting();
    const [selected, setSelected] = useState(true);
    const fill = useColor('backgroundSelected');
    return (
      <View style={styles.canvas}>
        <Pressable accessibilityRole="button" accessibilityLabel="Select the words" onPress={() => setSelected(on => !on)} style={[styles.selection, selected ? {backgroundColor: fill} : null]}>
          <Footnote color="label">the selected words</Footnote>
        </Pressable>
        <Toolbar {...args} at={selected ? {x: 60, y: 120, width: 140, height: 22} : null} commands={commands}/>
      </View>
    );
  },
};

/**
 * An editor's status bar with a find field open: the field's commands stay
 * beside it, and on a phone's width the bar folds its other commands behind
 * the overflow, leaving the field the room.
 */
export const FoldingAroundAField: Story = {
  render: args => (
    <View style={styles.stage}>
      <Footnote color="tertiaryLabel">A canvas above the bar</Footnote>
      <Toolbar
        {...args}
        commands={TOOLS.map(tool => ({...tool, hideLabel: true, tone: 'label' as const, onPress: fn()}))}
        field={<TextField placeholder="Find in document" variant="inline"/>}
        fieldCommands={[
          {label: 'Previous match', icon: icons.chevron, hideLabel: true, tone: 'label', onPress: fn()},
          {label: 'Close', icon: icons.trash, hideLabel: true, tone: 'label', onPress: fn()},
        ]}
        foldCommands
      />
    </View>
  ),
};

const styles = StyleSheet.create({
  stage: {gap: 24},
  canvas: {height: 220, alignSelf: 'stretch'},
  selection: {position: 'absolute', left: 60, top: 120, width: 140, height: 22, justifyContent: 'center', paddingHorizontal: 4, borderRadius: 4},
});
