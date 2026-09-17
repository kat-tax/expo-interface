import type {ReactElement, ReactNode} from 'react';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {useState} from 'react';
import {Pressable, ScrollView as NativeScrollView, Text as NativeText, View} from 'react-native';
import {
  Button as KitButton,
  Checkbox as KitCheckbox,
  Collapsible as KitCollapsible,
  FieldGroup as KitFieldGroup,
  ListItem as KitListItem,
  Picker as KitPicker,
  SEGOE_GLYPHS,
  SegmentedControl as KitSegmentedControl,
  Sheet as KitSheet,
  Slider as KitSlider,
  Switch as KitSwitch,
  TextField as KitTextField,
} from 'expo-interface';
import {charOf, elementsOf, observable, type ObservableState, slotOf, textOf, without} from './ui-kit';

/**
 * `@expo/ui` on Windows: `withWindows` resolves the package to this file.
 * Its universal layout primitives — `Host`, `Column`, `Row`, `Spacer`,
 * `Text`, `List`, `ScrollView`, `RNHostView` — are plain React Native views
 * here, laid out as they ask (a column or row with its spacing and
 * alignment, a spacer that fills, text in its style); its universal
 * controls — `Button`, `Switch`, `Slider`, `Checkbox`, `Picker`,
 * `TextInput`, `BottomSheet`, `Collapsible`, `FieldGroup`, `ListItem`,
 * `Icon` — are the kit's, which draws them as WinUI. `modifiers` are
 * SwiftUI's and Compose's, and are ignored here.
 */

type Alignment = 'start' | 'center' | 'end';

interface BaseProps {
  style?: StyleProp<ViewStyle>;
  modifiers?: unknown[];
  onPress?: () => void;
  onAppear?: () => void;
  onDisappear?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  testID?: string;
}

interface StackProps extends BaseProps {
  children?: ReactNode;
  alignment?: Alignment;
  spacing?: number;
}

const ALIGN: Record<Alignment, ViewStyle['alignItems']> = {start: 'flex-start', center: 'center', end: 'flex-end'};

/** A view that presses when asked to, and is not there while hidden. */
function Box({children, style, onPress, disabled, hidden, testID}: BaseProps & {children?: ReactNode}) {
  if (hidden) return null;
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={style} testID={testID}>
        {children}
      </Pressable>
    );
  }
  return <View style={style} testID={testID}>{children}</View>;
}

function stack(direction: 'row' | 'column', {alignment, spacing, style, ...rest}: StackProps) {
  return <Box {...rest} style={[{flexDirection: direction, gap: spacing, alignItems: alignment && ALIGN[alignment]}, style]}/>;
}

export function Host({children, style, testID}: BaseProps & {children?: ReactNode; matchContents?: boolean | object; useViewportSizeMeasurement?: boolean; colorScheme?: string; seedColor?: string; layoutDirection?: string; ignoreSafeArea?: boolean; onLayoutContent?: unknown}) {
  return <View style={style} testID={testID}>{children}</View>;
}

export function Column(props: StackProps) {
  return stack('column', props);
}

export function Row(props: StackProps) {
  return stack('row', props);
}

export function Spacer({size, flexible, style, hidden, testID}: BaseProps & {size?: number; flexible?: boolean}) {
  if (hidden) return null;
  return <View style={[flexible ? {flex: 1} : {width: size, height: size}, style]} testID={testID}/>;
}

interface UniversalTextStyle {
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'right' | 'center';
}

export function Text({children, textStyle, numberOfLines, style, onPress, disabled, hidden, testID}: BaseProps & {children?: string; textStyle?: UniversalTextStyle; numberOfLines?: number}) {
  if (hidden) return null;
  return (
    <NativeText style={[textStyle, style as StyleProp<TextStyle>]} numberOfLines={numberOfLines} onPress={onPress} disabled={disabled} testID={testID}>
      {children}
    </NativeText>
  );
}

export function List({children, testID}: {children?: ReactNode; onRefresh?: () => Promise<void>; testID?: string}) {
  return <View testID={testID}>{children}</View>;
}

export function ScrollView({children, direction, showsIndicators = true, style, hidden, testID}: BaseProps & {children?: ReactNode; direction?: 'vertical' | 'horizontal'; showsIndicators?: boolean}) {
  if (hidden) return null;
  const horizontal = direction === 'horizontal';
  return (
    <NativeScrollView
      horizontal={horizontal}
      showsHorizontalScrollIndicator={horizontal && showsIndicators}
      showsVerticalScrollIndicator={!horizontal && showsIndicators}
      style={style}
      testID={testID}>
      {children}
    </NativeScrollView>
  );
}

export function RNHostView({children, style, hidden, testID}: BaseProps & {children: ReactElement; matchContents?: boolean}) {
  if (hidden) return null;
  return <View style={style} testID={testID}>{children}</View>;
}

// The controls: the kit's, under the universal props.

type ButtonVariant = 'default' | 'bordered' | 'borderless' | 'borderedProminent' | 'plain' | 'glass' | 'glassProminent';
const BUTTON_VARIANT: Record<ButtonVariant, 'filled' | 'outlined' | 'text'> = {default: 'filled', borderedProminent: 'filled', glassProminent: 'filled', bordered: 'outlined', glass: 'outlined', borderless: 'text', plain: 'text'};

export function Button({children, label, onPress, variant = 'default', disabled, hidden, testID}: BaseProps & {children?: ReactNode; label?: string; variant?: ButtonVariant}) {
  if (hidden) return null;
  return <KitButton label={label ?? textOf(children)} onPress={onPress} variant={BUTTON_VARIANT[variant] ?? 'filled'} disabled={disabled} testID={testID}/>;
}

export function Switch({value, onValueChange, label, disabled, testID}: {value: boolean; onValueChange?: (value: boolean) => void; label?: string; disabled?: boolean; testID?: string; modifiers?: unknown[]}) {
  return <KitSwitch value={value} onValueChange={onValueChange ?? (() => {})} label={label} disabled={disabled} testID={testID}/>;
}

export function Slider({value, onValueChange, min, max, step, disabled, testID}: {value: number; onValueChange?: (value: number) => void; min?: number; max?: number; step?: number; disabled?: boolean; testID?: string; modifiers?: unknown[]}) {
  return <KitSlider value={value} onValueChange={onValueChange ?? (() => {})} min={min} max={max} step={step} disabled={disabled} testID={testID}/>;
}

export function Checkbox({value, onValueChange, label, disabled, testID}: {value: boolean; onValueChange?: (value: boolean) => void; label?: string; disabled?: boolean; testID?: string; modifiers?: unknown[]}) {
  return <KitCheckbox value={value} onValueChange={onValueChange ?? (() => {})} label={label} disabled={disabled} testID={testID}/>;
}

type PickerValue = string | number;
type ItemProps = {label?: string; value?: PickerValue | null; enabled?: boolean; testID?: string};

/** An option of a picker: read by the picker, and nothing on its own. */
export function PickerItem(_props: ItemProps): null {
  return null;
}

/** The options a picker's children name, with the kit's item for each. */
function itemsOf(children: ReactNode): ReactElement[] {
  return elementsOf(children)
    .filter(child => child.type === PickerItem || 'value' in child.props || 'label' in child.props)
    .map((child, index) => {
      const {label, value} = child.props as ItemProps;
      return <KitPicker.Item key={index} label={label ?? String(value ?? '')} value={(value ?? label ?? index) as PickerValue}/>;
    });
}

export function Picker<T extends PickerValue>({selectedValue, onValueChange, appearance, enabled = true, children, testID}: {selectedValue?: T; onValueChange?: (value: T, index: number) => void; appearance?: string; enabled?: boolean; children?: ReactNode; testID?: string; style?: StyleProp<ViewStyle>}) {
  const items = itemsOf(children);
  const change = (value: PickerValue) => onValueChange?.(value as T, items.findIndex(item => (item.props as {value: PickerValue}).value === value));
  if (appearance === 'segmented') {
    return <KitSegmentedControl selectedValue={selectedValue} onValueChange={change} disabled={!enabled} testID={testID}>{items}</KitSegmentedControl>;
  }
  return <KitPicker selectedValue={selectedValue} onValueChange={change} disabled={!enabled} testID={testID}>{items}</KitPicker>;
}
Picker.Item = PickerItem;

type KeyboardType = Parameters<typeof KitTextField>[0]['keyboardType'];

export function TextInput({value, defaultValue, onChangeText, placeholder, autoFocus, editable = true, readOnly, multiline, secureTextEntry, keyboardType, autoCapitalize, autoCorrect, returnKeyType, onSubmitEditing, testID}: {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: string;
  onSubmitEditing?: (event: {nativeEvent: {text: string}}) => void;
  testID?: string;
  [key: string]: unknown;
}) {
  const returnKey = returnKeyType === 'go' || returnKeyType === 'next' || returnKeyType === 'search' || returnKeyType === 'send' ? returnKeyType : 'done';
  return (
    <KitTextField
      value={value ?? defaultValue}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={!editable || readOnly}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType as KeyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      returnKeyType={returnKey}
      onSubmit={text => onSubmitEditing?.({nativeEvent: {text}})}
      testID={testID}
    />
  );
}

export function BottomSheet({children, isPresented, onDismiss}: {children?: ReactNode; isPresented: boolean; onDismiss: () => void; [key: string]: unknown}) {
  return <KitSheet isPresented={isPresented} onDismiss={onDismiss}>{children}</KitSheet>;
}

export function Collapsible({isOpen, onOpenChange, label, children}: {isOpen?: boolean; onOpenChange?: (open: boolean) => void; label: string; labelStyle?: unknown; children?: ReactNode}) {
  return <KitCollapsible label={label} expanded={isOpen} onExpandedChange={onOpenChange}>{children}</KitCollapsible>;
}

function SectionHeader(_props: {children?: ReactNode}): null {
  return null;
}
function SectionFooter(_props: {children?: ReactNode}): null {
  return null;
}
function Section({title, titleUppercase, children, testID}: {title?: string; titleUppercase?: boolean; children?: ReactNode; testID?: string; [key: string]: unknown}) {
  const header = slotOf(children, SectionHeader);
  const footer = slotOf(children, SectionFooter);
  const heading = title ?? (header === undefined ? undefined : textOf(header));
  return (
    <KitFieldGroup.Section title={heading && titleUppercase ? heading.toUpperCase() : heading} footer={footer === undefined ? undefined : textOf(footer)} testID={testID}>
      {without(children, SectionHeader, SectionFooter)}
    </KitFieldGroup.Section>
  );
}
function FieldGroupBase({children, testID}: {children?: ReactNode; testID?: string; [key: string]: unknown}) {
  return <KitFieldGroup testID={testID}>{children}</KitFieldGroup>;
}
export const FieldGroup = Object.assign(FieldGroupBase, {Section, SectionHeader, SectionFooter});

/** Where a field sits in its section: the other platforms' rounding hint, of no use to WinUI. */
export function getFieldItemPosition(index: number, count: number): 'single' | 'first' | 'middle' | 'last' {
  if (count <= 1) return 'single';
  if (index === 0) return 'first';
  return index === count - 1 ? 'last' : 'middle';
}

const GLYPHS = SEGOE_GLYPHS as unknown as Record<string, [string, string?]>;

type IconName = string | {ios?: string; android?: string; web?: string; windows?: string};

/** The glyph an icon name has on Windows: its own `windows` name, or the Segoe glyph the kit keeps for the symbol. */
export function glyphFor(name: IconName | undefined): string | undefined {
  if (typeof name === 'object' && name?.windows) return name.windows;
  const key = typeof name === 'object' && name ? (name.android ?? name.web ?? name.ios) : name;
  if (!key) return undefined;
  const entry = GLYPHS[key];
  if (entry) return entry[0];
  return key.length === 1 ? key : undefined;
}

export function Icon({name, size = 20, color, accessibilityLabel, hidden, testID}: BaseProps & {name?: IconName; size?: number; color?: string; accessibilityLabel?: string}) {
  if (hidden) return null;
  const glyph = glyphFor(name);
  if (!glyph) return null;
  return <NativeText style={{fontFamily: 'Segoe Fluent Icons', fontSize: size, color}} accessibilityLabel={accessibilityLabel} testID={testID}>{charOf(glyph)}</NativeText>;
}
Icon.select = (spec: {ios?: string; android?: string; web?: string; windows?: string}): IconName => spec;

function Leading({children}: {children?: ReactNode}): ReactNode {
  return children;
}
function Trailing({children}: {children?: ReactNode}): ReactNode {
  return children;
}
function Supporting({children}: {children?: ReactNode}): ReactNode {
  return children;
}

function ListItemBase({children, onPress, leading, trailing, supportingText, testID}: {children?: ReactNode; onPress?: () => void; leading?: ReactNode; trailing?: ReactNode; supportingText?: string; testID?: string; modifiers?: unknown[]}) {
  const supporting = slotOf(children, Supporting);
  return (
    <KitListItem leading={slotOf(children, Leading) ?? leading} trailing={slotOf(children, Trailing) ?? trailing} supporting={supporting === undefined ? supportingText : supporting} onPress={onPress} testID={testID}>
      {without(children, Leading, Trailing, Supporting)}
    </KitListItem>
  );
}
export const ListItem = Object.assign(ListItemBase, {Leading, Trailing, Supporting});

/** The packages' observable state, kept in JavaScript: the value, and whoever listens for it. */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  const [state] = useState(() => observable(initialValue));
  return state;
}
