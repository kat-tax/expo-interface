import type {ReactElement, ReactNode, Ref} from 'react';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {useImperativeHandle, useState} from 'react';
import {Linking, Pressable, ScrollView as NativeScrollView, Share, StyleSheet, Text as NativeText, View} from 'react-native';
import {
  Alert as KitAlert,
  Button as KitButton,
  Collapsible as KitCollapsible,
  ColorPicker as KitColorPicker,
  ContextMenu as KitContextMenu,
  DateTimePicker as KitDateTimePicker,
  Divider as KitDivider,
  FieldGroup as KitFieldGroup,
  Gauge as KitGauge,
  Menu as KitMenu,
  type MenuItem,
  Picker as KitPicker,
  Progress as KitProgress,
  SegmentedControl as KitSegmentedControl,
  Sheet as KitSheet,
  Slider as KitSlider,
  Stepper as KitStepper,
  Switch as KitSwitch,
  TextField as KitTextField,
} from '../..';
import {glyphFor, useNativeState} from './expo-ui';
import {assign, charOf, elementsOf, elsewhere, iconOf, isDisabled, modifier, onTapOf, slotOf, styleOf, tagOf, textOf, valueOf, without} from './ui-kit';

export {useNativeState};

/**
 * `@expo/ui/swift-ui` on Windows: `withWindows` resolves the subpath to
 * this file. Every name the package exports is here. The controls are the
 * kit's, which draws them as WinUI — `Button`, `Toggle`, `Slider`,
 * `Picker`, `DatePicker`, `ProgressView`, `TextField`, `SecureField`,
 * `Stepper`, `Gauge`, `ColorPicker`, `Menu`, `ContextMenu`, `Alert`,
 * `ConfirmationDialog`, `BottomSheet`, `Section`, `Form`, `DisclosureGroup`
 * — the layout views are React Native's laid out as SwiftUI would, and
 * what has no counterpart on a desktop (charts, share links' previews,
 * swipe actions, widgets) renders nothing and says so once.
 */

type Common = {testID?: string; modifiers?: unknown[]; style?: StyleProp<ViewStyle>};
type WithChildren = Common & {children?: ReactNode};

/** A view carrying the layout modifiers, pressable when a tap gesture is on it. */
function Frame({children, modifiers, style, testID, row, gap, align}: WithChildren & {row?: boolean; gap?: number; align?: ViewStyle['alignItems']}) {
  const base: ViewStyle = {flexDirection: row ? 'row' : 'column', gap, alignItems: align};
  const onPress = onTapOf(modifiers);
  const styles = [base, style, styleOf(modifiers)];
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={isDisabled(modifiers)} style={styles} testID={testID}>
        {children}
      </Pressable>
    );
  }
  return <View style={styles} testID={testID}>{children}</View>;
}

/** The text style the type modifiers ask for: bold, italic, a colour, a font, a line limit. */
function textStyleOf(modifiers: unknown): {style: TextStyle; numberOfLines?: number} {
  const style: TextStyle = {};
  if (modifier(modifiers, 'bold')) style.fontWeight = 'bold';
  if (modifier(modifiers, 'italic')) style.fontStyle = 'italic';
  const colour = modifier(modifiers, 'foregroundColor') ?? modifier(modifiers, 'foregroundStyle');
  if (typeof colour?.color === 'string') style.color = colour.color;
  const fontModifier = modifier(modifiers, 'font');
  const font = (fontModifier?.font ?? fontModifier) as {size?: unknown; weight?: unknown} | undefined;
  if (typeof font?.size === 'number') style.fontSize = font.size;
  if (typeof font?.weight === 'string') style.fontWeight = font.weight as TextStyle['fontWeight'];
  const limit = modifier(modifiers, 'lineLimit');
  return {style, numberOfLines: typeof limit?.count === 'number' ? limit.count : undefined};
}

const HORIZONTAL: Record<string, ViewStyle['alignItems']> = {top: 'flex-start', center: 'center', bottom: 'flex-end', firstTextBaseline: 'baseline', lastTextBaseline: 'baseline'};
const VERTICAL: Record<string, ViewStyle['alignItems']> = {leading: 'flex-start', center: 'center', trailing: 'flex-end'};

// Layout

export function Host({children, style, testID, modifiers}: WithChildren & {matchContents?: unknown; useViewportSizeMeasurement?: boolean; onLayoutContent?: unknown; colorScheme?: string; seedColor?: unknown; layoutDirection?: string; ignoreSafeArea?: string; pointerEvents?: string; ref?: Ref<unknown>}) {
  return <Frame modifiers={modifiers} style={style} testID={testID}>{children}</Frame>;
}

export function HStack({children, spacing, alignment, modifiers, testID}: WithChildren & {spacing?: number; alignment?: string}) {
  return <Frame row gap={spacing} align={alignment ? HORIZONTAL[alignment] : 'center'} modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export function VStack({children, spacing, alignment, modifiers, testID}: WithChildren & {spacing?: number; alignment?: string}) {
  return <Frame gap={spacing} align={alignment ? VERTICAL[alignment] : 'center'} modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export function ZStack({children, alignment, modifiers, testID}: WithChildren & {alignment?: string}) {
  const [first, ...rest] = elementsOf(children);
  return (
    <Frame modifiers={modifiers} testID={testID} align={alignment ? VERTICAL[alignment] : 'center'}>
      {first}
      {rest.map((child, index) => (
        <View key={index} style={StyleSheet.absoluteFill}>{child}</View>
      ))}
    </Frame>
  );
}

export const LazyHStack = HStack;
export const LazyVStack = VStack;

export function Group({children}: WithChildren) {
  return <>{children}</>;
}

export function Spacer({minLength, modifiers, testID}: Common & {minLength?: number}) {
  return <View style={[{flex: 1, minWidth: minLength, minHeight: minLength}, styleOf(modifiers)]} testID={testID}/>;
}

export function Divider({testID}: Common) {
  return <KitDivider testID={testID}/>;
}

export function Text({children, modifiers, testID, date, dateStyle}: WithChildren & {markdownEnabled?: boolean; date?: Date; dateStyle?: string; timerInterval?: unknown; countsDown?: boolean; pauseTime?: Date}) {
  const {style, numberOfLines} = textStyleOf(modifiers);
  const content = children ?? (date ? (dateStyle === 'time' ? date.toLocaleTimeString() : date.toLocaleDateString()) : null);
  return (
    <NativeText style={[style, styleOf(modifiers) as TextStyle]} numberOfLines={numberOfLines} onPress={onTapOf(modifiers)} testID={testID}>
      {content}
    </NativeText>
  );
}

/** A symbol's glyph as text: what an `Image` of a system name, a `Label` and a `Button` show. */
function Glyph({name, size = 20, color, testID}: {name?: string; size?: number; color?: string; testID?: string}) {
  const glyph = glyphFor(name);
  if (!glyph) return null;
  return <NativeText style={{fontFamily: 'Segoe Fluent Icons', fontSize: size, color}} testID={testID}>{charOf(glyph)}</NativeText>;
}

export function Image({systemName, size, color, onPress, modifiers, testID}: Common & {systemName?: string; assetName?: string; uiImage?: string; size?: number; color?: string; variableValue?: number; onPress?: () => void}) {
  const glyph = <Glyph name={systemName} size={size} color={typeof color === 'string' ? color : undefined} testID={onPress ? undefined : testID}/>;
  if (!onPress) return glyph;
  return <Pressable onPress={onPress} style={styleOf(modifiers)} testID={testID}>{glyph}</Pressable>;
}

export function Label({title, systemImage, icon, children, color, modifiers, testID}: WithChildren & {title?: string; systemImage?: string; icon?: ReactNode; color?: string}) {
  const tint = typeof color === 'string' ? color : undefined;
  return (
    <Frame row gap={8} align="center" modifiers={modifiers} testID={testID}>
      {icon ?? <Glyph name={systemImage} color={tint}/>}
      <NativeText style={{color: tint}}>{title ?? textOf(children)}</NativeText>
    </Frame>
  );
}

export function Link({label, destination, children, modifiers, testID}: WithChildren & {label?: string; destination: string}) {
  return (
    <Pressable onPress={() => void Linking.openURL(destination)} style={styleOf(modifiers)} testID={testID}>
      <NativeText style={{textDecorationLine: 'underline'}}>{label ?? textOf(children)}</NativeText>
    </Pressable>
  );
}

export function Section({title, header, footer, children, isExpanded, onIsExpandedChange, testID}: WithChildren & {title?: string; header?: ReactNode; footer?: ReactNode; isExpanded?: boolean; onIsExpandedChange?: (isExpanded: boolean) => void}) {
  const heading = title ?? (header === undefined ? undefined : textOf(header));
  if (onIsExpandedChange || isExpanded !== undefined) {
    return <KitCollapsible label={heading ?? ''} expanded={isExpanded} onExpandedChange={onIsExpandedChange} testID={testID}>{children}</KitCollapsible>;
  }
  return <KitFieldGroup.Section title={heading} footer={footer === undefined ? undefined : textOf(footer)} testID={testID}>{children}</KitFieldGroup.Section>;
}

export function Form({children, testID}: WithChildren) {
  return <KitFieldGroup testID={testID}>{children}</KitFieldGroup>;
}

export function ListForEach({children}: WithChildren & {onDelete?: unknown; onMove?: unknown}) {
  return <>{children}</>;
}

function ListBase({children, modifiers, testID}: WithChildren & {selection?: (string | number)[]; onSelectionChange?: unknown}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}
export const List = Object.assign(ListBase, {ForEach: ListForEach});

export function ScrollView({children, axes, showsIndicators = true, modifiers, testID}: WithChildren & {axes?: 'vertical' | 'horizontal' | 'both'; showsIndicators?: boolean}) {
  const horizontal = axes === 'horizontal';
  return (
    <NativeScrollView horizontal={horizontal} showsHorizontalScrollIndicator={horizontal && showsIndicators} showsVerticalScrollIndicator={!horizontal && showsIndicators} style={styleOf(modifiers)} testID={testID}>
      {children}
    </NativeScrollView>
  );
}

function GridRow({children}: WithChildren) {
  return <View style={{flexDirection: 'row'}}>{children}</View>;
}
function GridBase({children, verticalSpacing, horizontalSpacing, modifiers, testID}: WithChildren & {alignment?: string; verticalSpacing?: number; horizontalSpacing?: number}) {
  return (
    <Frame gap={verticalSpacing} modifiers={modifiers} testID={testID}>
      {elementsOf(children).map((row, index) => (
        <View key={index} style={{flexDirection: 'row', gap: horizontalSpacing}}>{row.props.children}</View>
      ))}
    </Frame>
  );
}
export const Grid = Object.assign(GridBase, {Row: GridRow});

export function ControlGroup({label, systemImage, children, modifiers, testID}: WithChildren & {label?: ReactNode; systemImage?: string}) {
  return (
    <Frame row gap={8} align="center" modifiers={modifiers} testID={testID}>
      <Glyph name={systemImage}/>
      {label === undefined ? null : <NativeText>{textOf(label)}</NativeText>}
      {children}
    </Frame>
  );
}

/**
 * SwiftUI's navigation stack (57.0.18): a plain container here, where an
 * app's navigation is Expo Router's and the kit's stack draws it; the path
 * is kept as given and never changes on its own.
 */
export function NavigationStack({children, modifiers, testID}: WithChildren & {path?: string[]; onPathChange?: (path: string[]) => void}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

/** A link pushing a destination on SwiftUI's stack: its label, plainly, since there is no stack to push onto. */
export function NavigationLink({children, modifiers, testID}: WithChildren & {value: string}) {
  return <Frame row align="center" modifiers={modifiers} testID={testID}>{children}</Frame>;
}

/** A destination SwiftUI's stack pushes for a value: nothing to show until it is pushed, and nothing pushes here. */
export function NavigationDestination(_props: WithChildren & {value: string}) {
  return null;
}

function ToolbarContent({children}: WithChildren) {
  return <Frame row gap={8} align="center">{children}</Frame>;
}

function ToolbarBase({children, modifiers, testID}: WithChildren) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

/** SwiftUI's toolbar (57.0.18): the view it belongs to with its `Content` laid out as a row, since there is no navigation bar to put it in. */
export const Toolbar = Object.assign(ToolbarBase, {Content: ToolbarContent});

export function LabeledContent({label, children, modifiers, testID}: WithChildren & {label?: ReactNode}) {
  return (
    <Frame row gap={8} align="center" modifiers={modifiers} testID={testID} style={{justifyContent: 'space-between'}}>
      {typeof label === 'string' ? <NativeText>{label}</NativeText> : label}
      {children}
    </Frame>
  );
}

export function ContentUnavailableView({title, systemImage, description, modifiers, testID}: Common & {title?: string; systemImage?: string; description?: string}) {
  return (
    <Frame gap={8} align="center" modifiers={modifiers} testID={testID}>
      <Glyph name={systemImage} size={40}/>
      {title === undefined ? null : <NativeText style={{fontSize: 20, fontWeight: '600'}}>{title}</NativeText>}
      {description === undefined ? null : <NativeText style={{opacity: 0.7}}>{description}</NativeText>}
    </Frame>
  );
}

function DisclosureLabel({children}: WithChildren): ReactNode {
  return children;
}
function DisclosureGroupBase({label, children, isExpanded, onIsExpandedChange, testID}: WithChildren & {label?: string; isExpanded?: boolean; onIsExpandedChange?: (isExpanded: boolean) => void}) {
  const slot = slotOf(children, DisclosureLabel);
  return (
    <KitCollapsible label={label ?? textOf(slot)} expanded={isExpanded} onExpandedChange={onIsExpandedChange} testID={testID}>
      {without(children, DisclosureLabel)}
    </KitCollapsible>
  );
}
export const DisclosureGroup = Object.assign(DisclosureGroupBase, {Label: DisclosureLabel});

export function Namespace({children}: WithChildren) {
  return <>{children}</>;
}

/** React Native content inside SwiftUI: on Windows it is all one tree, so the content is simply there. */
export function RNHostView({children, modifiers, testID}: WithChildren & {matchContents?: unknown}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export function GlassEffectContainer({children, modifiers, testID}: WithChildren & {spacing?: number}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export const AccessoryWidgetBackground = elsewhere('AccessoryWidgetBackground', "a widget's");
export const Chart = elsewhere('Chart', "Swift Charts'");

// Content slots: the decoration goes under, over or around what is not the slot.

function Content({children}: WithChildren): ReactNode {
  return children;
}
function MaskBase({children, modifiers, testID}: WithChildren) {
  return <Frame modifiers={modifiers} testID={testID}>{without(children, Content)}</Frame>;
}
function OverlayBase({children, alignment, modifiers, testID}: WithChildren & {alignment?: string}) {
  return (
    <Frame modifiers={modifiers} testID={testID} align={alignment ? VERTICAL[alignment] : undefined}>
      {without(children, Content)}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{slotOf(children, Content)}</View>
    </Frame>
  );
}
function BackgroundBase({children, modifiers, testID}: WithChildren & {alignment?: string}) {
  return (
    <Frame modifiers={modifiers} testID={testID}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">{slotOf(children, Content)}</View>
      {without(children, Content)}
    </Frame>
  );
}
export const Mask = Object.assign(MaskBase, {Content});
export const Overlay = Object.assign(OverlayBase, {Content});
export const Background = Object.assign(BackgroundBase, {Content});

// Shapes: views of the shape, filled as the modifiers say.

function shape(radius: number | undefined) {
  return function Shape({cornerRadius, modifiers, testID}: Common & {cornerRadius?: number; style?: unknown; topLeadingRadius?: number; topTrailingRadius?: number; bottomLeadingRadius?: number; bottomTrailingRadius?: number; concentric?: unknown; type?: unknown; fixed?: unknown}) {
    const fill = modifier(modifiers, 'foregroundColor') ?? modifier(modifiers, 'foregroundStyle') ?? modifier(modifiers, 'fill');
    return <View style={[{minWidth: 1, minHeight: 1, flex: 1, borderRadius: cornerRadius ?? radius, backgroundColor: typeof fill?.color === 'string' ? fill.color : undefined}, styleOf(modifiers)]} testID={testID}/>;
  };
}
export const Rectangle = shape(0);
export const RoundedRectangle = shape(undefined);
export const UnevenRoundedRectangle = shape(undefined);
export const ConcentricRectangle = shape(undefined);
export const Ellipse = shape(9999);
export const Capsule = shape(9999);
export const Circle = shape(9999);
export const EdgeCornerStyle = {containerConcentric: 'containerConcentric', fixed: 'fixed'} as const;

// Controls

type ButtonRole = 'default' | 'cancel' | 'destructive';
type ButtonProps = WithChildren & {onPress?: () => void; systemImage?: string; role?: ButtonRole; label?: string; target?: string};

const BUTTON_STYLES: Record<string, 'filled' | 'outlined' | 'text'> = {borderedProminent: 'filled', glassProminent: 'filled', bordered: 'outlined', glass: 'outlined', plain: 'text', borderless: 'text', automatic: 'text'};

function iconFor(systemImage: string | undefined) {
  return iconOf(glyphFor(systemImage));
}

export function Button({label, children, onPress, role, systemImage, modifiers, testID}: ButtonProps) {
  const style = modifier(modifiers, 'buttonStyle');
  return (
    <KitButton
      label={label ?? textOf(children)}
      onPress={onPress}
      variant={BUTTON_STYLES[String(style?.style ?? 'automatic')] ?? 'text'}
      role={role === 'destructive' ? 'destructive' : 'default'}
      prefixIcon={iconFor(systemImage)}
      disabled={isDisabled(modifiers)}
      testID={testID}
    />
  );
}

export function Toggle({isOn = false, label, systemImage, onIsOnChange, children, modifiers, testID}: WithChildren & {isOn?: boolean; label?: string; systemImage?: string; onIsOnChange?: (isOn: boolean) => void}) {
  const text = label ?? textOf(children);
  const style = modifier(modifiers, 'toggleStyle');
  if (style?.style === 'button') {
    return <KitButton label={text} variant={isOn ? 'filled' : 'outlined'} prefixIcon={iconFor(systemImage)} onPress={() => onIsOnChange?.(!isOn)} disabled={isDisabled(modifiers)} testID={testID}/>;
  }
  return <KitSwitch value={isOn} onValueChange={onIsOnChange ?? (() => {})} label={text} disabled={isDisabled(modifiers)} testID={testID}/>;
}

export function SyncToggle({isOn, label, onIsOnChangeSync, modifiers, testID}: Common & {isOn: {value: boolean; set(value: boolean): void}; label?: string; systemImage?: string; onIsOnChangeSync?: (isOn: boolean) => void}) {
  const [, rerender] = useState(0);
  return (
    <KitSwitch
      value={isOn.value}
      onValueChange={value => {
        isOn.set(value);
        onIsOnChangeSync?.(value);
        rerender(count => count + 1);
      }}
      label={label}
      disabled={isDisabled(modifiers)}
      testID={testID}
    />
  );
}

export function Slider({value = 0, step, min, max, label, onValueChange, onEditingChanged, modifiers, testID}: Common & {value?: number; step?: number; min?: number; max?: number; lowerLimit?: number; upperLimit?: number; label?: ReactNode; minimumValueLabel?: ReactNode; maximumValueLabel?: ReactNode; onValueChange?: (value: number) => void; onEditingChanged?: (isEditing: boolean) => void}) {
  return (
    <KitSlider
      value={value}
      onValueChange={onValueChange ?? (() => {})}
      onSlidingComplete={onEditingChanged ? () => onEditingChanged(false) : undefined}
      min={min}
      max={max}
      step={step}
      label={label === undefined ? undefined : textOf(label)}
      disabled={isDisabled(modifiers)}
      testID={testID}
    />
  );
}

type Selection = string | number | null;

/** A picker's options: each child's text, under its `tag` or its place. */
function optionsOf(children: ReactNode): ReactElement[] {
  return elementsOf(children).map((child, index) => <KitPicker.Item key={index} label={textOf(child)} value={tagOf(child) ?? index}/>);
}

export function Picker<T extends Selection>({label, selection, onSelectionChange, children, modifiers, testID}: WithChildren & {systemImage?: string; label?: ReactNode; selection?: T; onSelectionChange?: (selection: T) => void}) {
  const options = optionsOf(children);
  const text = label === undefined ? undefined : textOf(label);
  const change = (value: string | number) => onSelectionChange?.(value as T);
  const style = modifier(modifiers, 'pickerStyle');
  if (style?.style === 'segmented' || style?.style === 'palette') {
    return <KitSegmentedControl label={text} selectedValue={selection ?? undefined} onValueChange={change} disabled={isDisabled(modifiers)} testID={testID}>{options}</KitSegmentedControl>;
  }
  return <KitPicker label={text} selectedValue={selection ?? undefined} onValueChange={change} disabled={isDisabled(modifiers)} testID={testID}>{options}</KitPicker>;
}

export function DatePicker({title, selection, range, displayedComponents = ['date'], onDateChange, modifiers, testID}: WithChildren & {title?: string; selection?: Date; range?: {start?: Date; end?: Date}; displayedComponents?: string[]; onDateChange?: (date: Date) => void}) {
  const date = displayedComponents.includes('date');
  const time = displayedComponents.includes('hourAndMinute');
  return (
    <KitDateTimePicker
      label={title}
      value={selection}
      onChange={onDateChange}
      mode={date && time ? 'datetime' : time ? 'time' : 'date'}
      minimumDate={range?.start}
      maximumDate={range?.end}
      disabled={isDisabled(modifiers)}
      testID={testID}
    />
  );
}

export function ProgressView({value, children, modifiers, testID}: WithChildren & {value?: number | null; timerInterval?: unknown; countsDown?: boolean}) {
  const style = modifier(modifiers, 'progressViewStyle');
  const label = textOf(children);
  const bar = <KitProgress value={value ?? undefined} variant={style?.style === 'circular' ? 'circular' : 'linear'} testID={testID}/>;
  if (!label) return bar;
  return (
    <View style={{gap: 4}}>
      <NativeText>{label}</NativeText>
      {bar}
    </View>
  );
}

const GAUGE_STYLES = new Set(['automatic', 'linear', 'linearCapacity', 'circular', 'circularCapacity']);

export function Gauge({value, min, max, children, currentValueLabel, minimumValueLabel, maximumValueLabel, modifiers, testID}: WithChildren & {value: number; min?: number; max?: number; currentValueLabel?: ReactNode; minimumValueLabel?: ReactNode; maximumValueLabel?: ReactNode}) {
  const style = String(modifier(modifiers, 'gaugeStyle')?.style ?? 'automatic');
  const text = (node: ReactNode) => (node === undefined ? undefined : textOf(node));
  return (
    <KitGauge
      value={value}
      min={min}
      max={max}
      variant={(GAUGE_STYLES.has(style) ? style : 'automatic') as 'automatic'}
      label={text(children) || undefined}
      currentValueLabel={text(currentValueLabel)}
      minimumValueLabel={text(minimumValueLabel)}
      maximumValueLabel={text(maximumValueLabel)}
      testID={testID}
    />
  );
}

export function ColorPicker({selection, label, onSelectionChange, supportsOpacity, modifiers, testID}: Common & {selection: string | null; label?: string; onSelectionChange?: (value: string) => void; supportsOpacity?: boolean}) {
  return <KitColorPicker value={selection ?? '#000000'} onValueChange={onSelectionChange ?? (() => {})} label={label} supportsOpacity={supportsOpacity} disabled={isDisabled(modifiers)} testID={testID}/>;
}

export function Stepper({label, value = 0, step, min, max, onValueChange, modifiers, testID}: Common & {label: string; value?: number; step?: number; min?: number; max?: number; onValueChange: (value: number) => void}) {
  return <KitStepper label={label} value={value} onValueChange={onValueChange} step={step} min={min} max={max} disabled={isDisabled(modifiers)} testID={testID}/>;
}

export type TextFieldRef = {
  setText(text: string): Promise<void>;
  clear(): Promise<void>;
  focus(): Promise<void>;
  blur(): Promise<void>;
  setSelection(start: number, end: number): Promise<void>;
};

type FieldProps = WithChildren & {
  ref?: Ref<TextFieldRef>;
  text?: unknown;
  selection?: unknown;
  maxLength?: number;
  autoFocus?: boolean;
  placeholder?: string;
  onTextChange?: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
  onSelectionChange?: unknown;
  axis?: 'horizontal' | 'vertical';
};

function Placeholder({children}: WithChildren): ReactNode {
  return children;
}

function field(secure: boolean) {
  return function Field({ref, text, maxLength, autoFocus, placeholder, onTextChange, axis, children, modifiers, testID}: FieldProps) {
    const [own, setOwn] = useState(valueOf(text) ?? '');
    const value = valueOf(text) ?? own;
    const change = (next: string) => {
      setOwn(next);
      assign(text, next);
      onTextChange?.(next);
    };
    useImperativeHandle(ref, () => ({
      setText: async next => change(next),
      clear: async () => change(''),
      focus: async () => {},
      blur: async () => {},
      setSelection: async () => {},
    }));
    return (
      <KitTextField
        value={value}
        onChangeText={change}
        placeholder={placeholder ?? (textOf(slotOf(children, Placeholder)) || undefined)}
        maxLength={maxLength}
        autoFocus={autoFocus}
        multiline={axis === 'vertical'}
        secureTextEntry={secure}
        disabled={isDisabled(modifiers)}
        testID={testID}
      />
    );
  };
}
export const TextField = Object.assign(field(false), {Placeholder});
export const SecureField = Object.assign(field(true), {Placeholder});

/** The kit's menu items for what a SwiftUI menu holds: buttons, toggles, sections and submenus, a divider drawn above the item after it. */
function menuItemsOf(children: ReactNode): MenuItem[] {
  const items: MenuItem[] = [];
  let separator = false;
  const add = (...next: MenuItem[]) => {
    if (next.length && separator && items.length) next[0].separator = true;
    if (next.length) separator = false;
    items.push(...next);
  };
  for (const child of elementsOf(children)) {
    const props = child.props as ButtonProps & {isOn?: boolean; onIsOnChange?: (isOn: boolean) => void; title?: string};
    if (child.type === Divider) {
      separator = true;
    } else if (child.type === Toggle) {
      add({label: props.label ?? textOf(props.children), active: !!props.isOn, onPress: () => props.onIsOnChange?.(!props.isOn), disabled: isDisabled(props.modifiers)});
    } else if (child.type === Section || child.type === Menu || child.type === Group || child.type === ControlGroup) {
      separator = separator || child.type !== Group;
      add(...menuItemsOf(props.children));
    } else if (child.type === Picker) {
      const picker = child.props as {selection?: Selection; onSelectionChange?: (selection: Selection) => void; children?: ReactNode};
      add(
        ...elementsOf(picker.children).map((option, index) => {
          const value = tagOf(option) ?? index;
          return {label: textOf(option), active: picker.selection === value, onPress: () => picker.onSelectionChange?.(value)};
        }),
      );
    } else {
      add({label: props.label ?? textOf(props.children), onPress: props.onPress, role: props.role === 'destructive' ? 'destructive' : 'default', disabled: isDisabled(props.modifiers)});
    }
  }
  return items;
}

export function Items({children}: WithChildren): ReactNode {
  return children;
}
export function Trigger({children}: WithChildren): ReactNode {
  return children;
}
export function Preview({children}: WithChildren): ReactNode {
  return children;
}

function ContextMenuBase({children, modifiers, testID}: WithChildren) {
  return (
    <KitContextMenu items={menuItemsOf(slotOf(children, Items))} disabled={isDisabled(modifiers)} testID={testID}>
      <View>{slotOf(children, Trigger)}</View>
    </KitContextMenu>
  );
}
export const ContextMenu = Object.assign(ContextMenuBase, {Items, Trigger, Preview});

export function Menu({label, systemImage, children, modifiers, testID}: WithChildren & {label: ReactNode; systemImage?: string; onPrimaryAction?: () => void}) {
  return <KitMenu label={textOf(label)} icon={iconFor(systemImage)} items={menuItemsOf(children)} variant="text" disabled={isDisabled(modifiers)} testID={testID}/>;
}

export function BottomSheet({children, anchor, isPresented, onIsPresentedChange, onDismiss, testID}: WithChildren & {anchor?: ReactNode; isPresented: boolean; onIsPresentedChange: (isPresented: boolean) => void; onDismiss?: () => void; fitToContents?: boolean}) {
  return (
    <>
      {anchor}
      <KitSheet
        isPresented={isPresented}
        onDismiss={() => {
          onIsPresentedChange(false);
          onDismiss?.();
        }}
        testID={testID}>
        {children}
      </KitSheet>
    </>
  );
}

function Actions({children}: WithChildren): ReactNode {
  return children;
}
function Message({children}: WithChildren): ReactNode {
  return children;
}

type DialogProps = WithChildren & {title: string; isPresented?: boolean; onIsPresentedChange?: (isPresented: boolean) => void; titleVisibility?: string};

function dialog(sheet: boolean) {
  return function Dialog({children, title, isPresented = false, onIsPresentedChange, testID}: DialogProps) {
    const close = () => onIsPresentedChange?.(false);
    const actions = elementsOf(slotOf(children, Actions)).map(button => {
      const props = button.props as ButtonProps;
      // The kit dismisses after an action of its own accord, and says so through onDismiss.
      return {
        label: props.label ?? textOf(props.children),
        role: props.role === 'destructive' ? ('destructive' as const) : props.role === 'cancel' ? ('cancel' as const) : ('default' as const),
        onPress: () => props.onPress?.(),
      };
    });
    const message = slotOf(children, Message);
    return (
      <>
        {slotOf(children, Trigger)}
        <KitAlert title={title} message={message === undefined ? undefined : textOf(message)} visible={isPresented} onDismiss={close} actions={actions.length ? actions : undefined} sheet={sheet} testID={testID}/>
      </>
    );
  };
}
export const Alert = Object.assign(dialog(false), {Trigger, Actions, Message});
export const ConfirmationDialog = Object.assign(dialog(true), {Trigger, Actions, Message});

function PopoverBase({children, isPresented = false, modifiers, testID}: WithChildren & {isPresented?: boolean; onIsPresentedChange?: (isPresented: boolean) => void; attachmentAnchor?: string; arrowEdge?: string}) {
  return (
    <Frame modifiers={modifiers} testID={testID}>
      {slotOf(children, Trigger)}
      {isPresented ? <View style={{padding: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth}}>{slotOf(children, Content)}</View> : null}
    </Frame>
  );
}
export const Popover = Object.assign(PopoverBase, {Trigger, Content});

function Tab({children}: WithChildren & {value: string; label?: string; systemImage?: string}): ReactNode {
  return children;
}
function TabViewBase({selection, defaultSelection, onSelectionChange, children, modifiers, testID}: WithChildren & {selection?: string; defaultSelection?: string; onSelectionChange?: (selection: string) => void}) {
  const tabs = elementsOf(children).filter(child => child.type === Tab) as ReactElement<{value: string; label?: string; systemImage?: string; children?: ReactNode}>[];
  const [own, setOwn] = useState(defaultSelection ?? tabs[0]?.props.value);
  const current = selection ?? own;
  const select = (value: string) => {
    setOwn(value);
    onSelectionChange?.(value);
  };
  return (
    <Frame modifiers={modifiers} testID={testID}>
      <View style={{flexDirection: 'row', gap: 4}}>
        {tabs.map(tab => (
          <KitButton key={tab.props.value} label={tab.props.label ?? tab.props.value} variant={tab.props.value === current ? 'filled' : 'text'} prefixIcon={iconFor(tab.props.systemImage)} onPress={() => select(tab.props.value)}/>
        ))}
      </View>
      {tabs.find(tab => tab.props.value === current)?.props.children}
    </Frame>
  );
}
export const TabView = Object.assign(TabViewBase, {Tab});

function SwipeActionsBase({children, modifiers, testID}: WithChildren & {edge?: string; allowsFullSwipe?: boolean}) {
  return <Frame modifiers={modifiers} testID={testID}>{without(children, Actions)}</Frame>;
}
export const SwipeActions = Object.assign(SwipeActionsBase, {Actions});
export {Actions};

export function ShareLink({item, getItemAsync, subject, message, children, modifiers, testID}: WithChildren & {item?: string; getItemAsync?: () => Promise<string>; subject?: string; message?: string; preview?: unknown}) {
  return (
    <KitButton
      label={textOf(children) || 'Share'}
      variant="text"
      disabled={isDisabled(modifiers)}
      onPress={() => {
        void (async () => {
          const shared = item ?? (getItemAsync ? await getItemAsync() : message ?? '');
          await Share.share({message: message && shared !== message ? `${message}\n${shared}` : shared, title: subject}).catch(() => {});
        })();
      }}
      testID={testID}
    />
  );
}

/** Runs the body now — Windows draws state changes without SwiftUI's animation — and the completion after it. */
export function withAnimation(...args: unknown[]): void {
  const functions = args.filter((arg): arg is () => void => typeof arg === 'function');
  for (const run of functions) run();
}

export type WithAnimationCompletionCriteria = 'logicallyComplete' | 'removed';
export type Alignment = string;
export type CommonViewModifierProps = Common;
