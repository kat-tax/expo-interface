import type {ReactNode, Ref} from 'react';
import type {ImageSourcePropType, ImageStyle, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {createContext, useImperativeHandle, useState} from 'react';
import {Image as NativeImage, Pressable, ScrollView as NativeScrollView, StyleSheet, Text as NativeText, View} from 'react-native';
import {
  Alert as KitAlert,
  Button as KitButton,
  Card as KitCard,
  Checkbox as KitCheckbox,
  DateTimePicker as KitDateTimePicker,
  Divider as KitDivider,
  Fab as KitFab,
  ListItem as KitListItem,
  type MenuItem,
  Progress as KitProgress,
  SegmentedControl as KitSegmentedControl,
  Sheet as KitSheet,
  Slider as KitSlider,
  Spinner as KitSpinner,
  Switch as KitSwitch,
  TextField as KitTextField,
  Toast as KitToast,
  Tooltip as KitTooltip,
} from 'expo-interface';
import {useNativeState} from './expo-ui';
import {assign, elementsOf, iconOf, isDisabled, onTapOf, slotOf, styleOf, textOf, valueOf, without} from './ui-kit';

export {useNativeState};

/**
 * `@expo/ui/jetpack-compose` on Windows: `withWindows` resolves the
 * subpath to this file. Every name the package exports is here. The
 * controls are the kit's, which draws them as WinUI — the buttons, `Switch`,
 * `Checkbox`, `Slider`, `DateTimePicker`, the progress indicators, the text
 * fields, the segmented buttons, `ModalBottomSheet`, `DropdownMenu`,
 * `AlertDialog`, `Card`, the chips, `ListItem`, the floating action buttons,
 * `Tooltip`, `Snackbar` — the layout views are React Native's laid out as
 * Compose would, and what has no counterpart on a desktop (carousels, the
 * navigation bar, pull to refresh) renders its content plainly or nothing.
 */

type Common = {testID?: string; modifiers?: unknown[]; style?: StyleProp<ViewStyle>};
type WithChildren = Common & {children?: ReactNode};
type Arrangement = string | {spacedBy: number};

const HORIZONTAL: Record<string, ViewStyle['justifyContent']> = {start: 'flex-start', end: 'flex-end', center: 'center', spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly'};
const VERTICAL: Record<string, ViewStyle['justifyContent']> = {top: 'flex-start', bottom: 'flex-end', center: 'center', spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly'};
const ALIGN: Record<string, ViewStyle['alignItems']> = {start: 'flex-start', end: 'flex-end', center: 'center', top: 'flex-start', bottom: 'flex-end'};

function arranged(arrangement: Arrangement | undefined, table: Record<string, ViewStyle['justifyContent']>): {justifyContent?: ViewStyle['justifyContent']; gap?: number} {
  if (!arrangement) return {};
  if (typeof arrangement === 'object') return {gap: arrangement.spacedBy};
  return {justifyContent: table[arrangement]};
}

/** A view carrying the layout modifiers, pressable when `clickable` is on it. */
function Frame({children, modifiers, style, testID}: WithChildren) {
  const onPress = onTapOf(modifiers);
  const styles = [style, styleOf(modifiers)];
  if (onPress) return <Pressable onPress={onPress} style={styles} testID={testID}>{children}</Pressable>;
  return <View style={styles} testID={testID}>{children}</View>;
}

// Layout

export function Host({children, style, testID, modifiers}: WithChildren & {matchContents?: unknown; onLayoutContent?: unknown; useViewportSizeMeasurement?: boolean; colorScheme?: string; seedColor?: unknown; layoutDirection?: string; ignoreSafeAreaKeyboardInsets?: boolean; pointerEvents?: string; ref?: Ref<unknown>}) {
  return <Frame modifiers={modifiers} style={style} testID={testID}>{children}</Frame>;
}

export function Row({children, horizontalArrangement, verticalAlignment, modifiers, testID}: WithChildren & {horizontalArrangement?: Arrangement; verticalArrangement?: Arrangement; horizontalAlignment?: string; verticalAlignment?: string}) {
  return <Frame modifiers={modifiers} testID={testID} style={{flexDirection: 'row', alignItems: verticalAlignment ? ALIGN[verticalAlignment] : 'center', ...arranged(horizontalArrangement, HORIZONTAL)}}>{children}</Frame>;
}

export function Column({children, verticalArrangement, horizontalAlignment, modifiers, testID}: WithChildren & {horizontalArrangement?: Arrangement; verticalArrangement?: Arrangement; horizontalAlignment?: string; verticalAlignment?: string}) {
  return <Frame modifiers={modifiers} testID={testID} style={{flexDirection: 'column', alignItems: horizontalAlignment ? ALIGN[horizontalAlignment] : 'flex-start', ...arranged(verticalArrangement, VERTICAL)}}>{children}</Frame>;
}

const CONTENT: Record<string, {justifyContent: ViewStyle['justifyContent']; alignItems: ViewStyle['alignItems']}> = {
  topStart: {justifyContent: 'flex-start', alignItems: 'flex-start'},
  topCenter: {justifyContent: 'flex-start', alignItems: 'center'},
  topEnd: {justifyContent: 'flex-start', alignItems: 'flex-end'},
  centerStart: {justifyContent: 'center', alignItems: 'flex-start'},
  center: {justifyContent: 'center', alignItems: 'center'},
  centerEnd: {justifyContent: 'center', alignItems: 'flex-end'},
  bottomStart: {justifyContent: 'flex-end', alignItems: 'flex-start'},
  bottomCenter: {justifyContent: 'flex-end', alignItems: 'center'},
  bottomEnd: {justifyContent: 'flex-end', alignItems: 'flex-end'},
};

export function Box({children, contentAlignment, modifiers, testID}: WithChildren & {contentAlignment?: string; floatingToolbarExitAlwaysScrollBehavior?: string}) {
  const [first, ...rest] = elementsOf(children);
  return (
    <Frame modifiers={modifiers} testID={testID} style={contentAlignment ? CONTENT[contentAlignment] : undefined}>
      {first}
      {rest.map((child, index) => (
        <View key={index} style={StyleSheet.absoluteFill} pointerEvents="box-none">{child}</View>
      ))}
    </Frame>
  );
}

export function FlowRow({children, modifiers, testID}: WithChildren & {horizontalArrangement?: Arrangement; verticalArrangement?: Arrangement; maxItemsInEachRow?: number}) {
  return <Frame modifiers={modifiers} testID={testID} style={{flexDirection: 'row', flexWrap: 'wrap'}}>{children}</Frame>;
}

export function Spacer({modifiers, testID}: Common) {
  return <View style={[{flex: 1}, styleOf(modifiers)]} testID={testID}/>;
}

export function HorizontalDivider({testID}: Common & {thickness?: number; color?: string}) {
  return <KitDivider testID={testID}/>;
}
export function VerticalDivider({testID}: Common & {thickness?: number; color?: string}) {
  return <KitDivider vertical testID={testID}/>;
}

function scroller(horizontal: boolean) {
  return function Lazy({children, contentPadding, modifiers, testID}: WithChildren & {verticalArrangement?: Arrangement; horizontalArrangement?: Arrangement; horizontalAlignment?: string; verticalAlignment?: string; contentPadding?: {start?: number; top?: number; end?: number; bottom?: number}}) {
    return (
      <NativeScrollView horizontal={horizontal} style={styleOf(modifiers)} contentContainerStyle={contentPadding && {paddingLeft: contentPadding.start, paddingTop: contentPadding.top, paddingRight: contentPadding.end, paddingBottom: contentPadding.bottom}} testID={testID}>
        {children}
      </NativeScrollView>
    );
  };
}
export const LazyColumn = scroller(false);
export const LazyRow = scroller(true);

type TextProps = WithChildren & {color?: string; overflow?: string; softWrap?: boolean; maxLines?: number; minLines?: number; style?: {fontSize?: number; fontWeight?: string; fontStyle?: string; fontFamily?: string; textDecoration?: string; letterSpacing?: number; textAlign?: string; lineHeight?: number; typography?: string; background?: string}};

const TYPOGRAPHY: Record<string, number> = {displayLarge: 57, displayMedium: 45, displaySmall: 36, headlineLarge: 32, headlineMedium: 28, headlineSmall: 24, titleLarge: 22, titleMedium: 16, titleSmall: 14, bodyLarge: 16, bodyMedium: 14, bodySmall: 12, labelLarge: 14, labelMedium: 12, labelSmall: 11};

export function Text({children, color, maxLines, style, modifiers, testID}: TextProps) {
  const text: TextStyle = {
    color,
    fontSize: style?.fontSize ?? (style?.typography ? TYPOGRAPHY[style.typography] : undefined),
    fontWeight: style?.fontWeight as TextStyle['fontWeight'],
    fontStyle: style?.fontStyle as TextStyle['fontStyle'],
    fontFamily: style?.fontFamily === 'default' ? undefined : style?.fontFamily,
    textDecorationLine: style?.textDecoration === 'underline' ? 'underline' : style?.textDecoration === 'lineThrough' ? 'line-through' : undefined,
    letterSpacing: style?.letterSpacing,
    textAlign: style?.textAlign === 'start' ? 'left' : style?.textAlign === 'end' ? 'right' : (style?.textAlign as TextStyle['textAlign']),
    lineHeight: style?.lineHeight,
    backgroundColor: style?.background,
  };
  return (
    <NativeText style={[text, styleOf(modifiers) as TextStyle]} numberOfLines={maxLines} onPress={onTapOf(modifiers)} testID={testID}>
      {children}
    </NativeText>
  );
}

export function Icon({source, tint, size = 24, contentDescription, modifiers, testID}: Common & {source: ImageSourcePropType; tint?: string | null; size?: number; contentDescription?: string}) {
  return <NativeImage source={source} style={[{width: size, height: size, tintColor: tint ?? undefined}, styleOf(modifiers) as ImageStyle]} accessibilityLabel={contentDescription} testID={testID}/>;
}

const SCALE: Record<string, 'contain' | 'cover' | 'stretch' | 'center'> = {fit: 'contain', crop: 'cover', fillBounds: 'stretch', fillWidth: 'cover', fillHeight: 'cover', inside: 'contain', none: 'center'};

export function Image({source, contentScale, contentDescription, tint, alpha, onLoad, onError, modifiers, testID}: Common & {source: ImageSourcePropType | {uri?: string}; contentScale?: string; alignment?: string; contentDescription?: string | null; tint?: string; alpha?: number; onLoad?: () => void; onError?: (error: string) => void}) {
  return (
    <NativeImage
      source={source as ImageSourcePropType}
      resizeMode={contentScale ? SCALE[contentScale] : 'contain'}
      style={[{width: '100%', height: '100%', tintColor: tint, opacity: alpha}, styleOf(modifiers) as ImageStyle]}
      accessibilityLabel={contentDescription ?? undefined}
      onLoad={onLoad}
      onError={onError ? event => onError(String(event.nativeEvent.error)) : undefined}
      testID={testID}
    />
  );
}

// Buttons

type ButtonProps = WithChildren & {onClick?: () => void; enabled?: boolean; colors?: {containerColor?: string; contentColor?: string}; contentPadding?: unknown; shape?: unknown};

function button(variant: 'filled' | 'outlined' | 'text') {
  return function Button({children, onClick, enabled = true, colors, modifiers, testID}: ButtonProps) {
    return <KitButton label={textOf(children)} onPress={onClick} variant={variant} color={colors?.containerColor} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
  };
}
export const Button = button('filled');
export const FilledTonalButton = button('filled');
export const ElevatedButton = button('outlined');
export const OutlinedButton = button('outlined');
export const TextButton = button('text');

export function transformButtonProps(props: Omit<ButtonProps, 'children'>): Record<string, unknown> {
  const {onClick, shape, modifiers, ...rest} = props;
  return {...rest, modifiers, enabled: props.enabled ?? true, shape, onButtonPressed: onClick};
}

function iconButton(variant: 'filled' | 'outlined' | 'text') {
  return function IconButton({children, onClick, enabled = true, modifiers, testID}: ButtonProps) {
    return (
      <Pressable onPress={onClick} disabled={!enabled || isDisabled(modifiers)} style={[{padding: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: variant === 'outlined' ? StyleSheet.hairlineWidth : 0}, styleOf(modifiers)]} testID={testID}>
        {children}
      </Pressable>
    );
  };
}
export const IconButton = iconButton('text');
export const FilledIconButton = iconButton('filled');
export const FilledTonalIconButton = iconButton('filled');
export const OutlinedIconButton = iconButton('outlined');

type ToggleButtonProps = WithChildren & {checked: boolean; onCheckedChange?: (checked: boolean) => void; enabled?: boolean; colors?: unknown};

function toggleButton() {
  return function ToggleButton({children, checked, onCheckedChange, enabled = true, modifiers, testID}: ToggleButtonProps) {
    return <KitButton label={textOf(children)} variant={checked ? 'filled' : 'outlined'} onPress={() => onCheckedChange?.(!checked)} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
  };
}
export const ToggleButton = Object.assign(toggleButton(), {DefaultIconSpacing: 8, DefaultIconSize: 18});
export const IconToggleButton = toggleButton();
export const FilledIconToggleButton = toggleButton();
export const OutlinedIconToggleButton = toggleButton();

export function transformToggleButtonProps(props: Omit<ToggleButtonProps, 'children'>): Record<string, unknown> {
  const {onCheckedChange, modifiers, ...rest} = props;
  return {...rest, modifiers, enabled: props.enabled ?? true, onCheckedChange: onCheckedChange ? (event: {nativeEvent: {checked: boolean}}) => onCheckedChange(event.nativeEvent.checked) : undefined};
}

function FabIcon({children}: WithChildren): ReactNode {
  return children;
}
function FabText({children}: WithChildren): ReactNode {
  return children;
}
type FabProps = WithChildren & {containerColor?: string; onClick?: () => void; expanded?: boolean};

function fab(size: 'small' | 'regular' | 'large' | 'extended') {
  return function FloatingActionButton({children, onClick, modifiers, testID}: FabProps) {
    const label = textOf(slotOf(children, FabText)) || textOf(without(children, FabIcon)) || 'Action';
    return <KitFab label={label} icon={iconOf('E710')} onPress={onClick} size={size} disabled={isDisabled(modifiers)} testID={testID}/>;
  };
}
export const SmallFloatingActionButton = Object.assign(fab('small'), {Icon: FabIcon});
export const FloatingActionButton = Object.assign(fab('regular'), {Icon: FabIcon});
export const LargeFloatingActionButton = Object.assign(fab('large'), {Icon: FabIcon});
export const ExtendedFloatingActionButton = Object.assign(fab('extended'), {Icon: FabIcon, Text: FabText});

// Selection controls

function ThumbContent({children}: WithChildren): ReactNode {
  return children;
}
function SwitchBase({value, enabled = true, onCheckedChange, modifiers, testID}: WithChildren & {value: boolean; enabled?: boolean; onCheckedChange?: (value: boolean) => void; colors?: unknown}) {
  return <KitSwitch value={value} onValueChange={onCheckedChange ?? (() => {})} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
}
export const SwitchThumbContent = ThumbContent;
export const Switch = Object.assign(SwitchBase, {ThumbContent, DefaultIconSize: 16});

export function SyncSwitch({isOn, onCheckedChangeSync, enabled = true, testID}: Common & {isOn: {value: boolean; set(value: boolean): void}; onCheckedChangeSync?: (value: boolean) => void; enabled?: boolean; colors?: unknown}) {
  const [, rerender] = useState(0);
  return (
    <KitSwitch
      value={isOn.value}
      onValueChange={value => {
        isOn.set(value);
        onCheckedChangeSync?.(value);
        rerender(count => count + 1);
      }}
      disabled={!enabled}
      testID={testID}
    />
  );
}

export function Checkbox({value, enabled = true, onCheckedChange, modifiers, testID}: Common & {value: boolean; enabled?: boolean; onCheckedChange?: (value: boolean) => void; colors?: unknown}) {
  return <KitCheckbox value={value} onValueChange={onCheckedChange ?? (() => {})} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
}

export function TriStateCheckbox({state, enabled = true, onClick, modifiers, testID}: Common & {state: 'on' | 'off' | 'indeterminate'; enabled?: boolean; onClick?: () => void; colors?: unknown}) {
  return <KitCheckbox value={state === 'on'} onValueChange={() => onClick?.()} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
}

export function RadioButton({selected, onClick, modifiers, testID}: Common & {selected: boolean; onClick?: () => void; enabled?: boolean; colors?: unknown}) {
  return (
    <Pressable onPress={onClick} style={[{width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center'}, styleOf(modifiers)]} accessibilityRole="radio" accessibilityState={{selected}} testID={testID}>
      {selected ? <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f6cbd'}}/> : null}
    </Pressable>
  );
}

function Thumb({children}: WithChildren): ReactNode {
  return children;
}
function Track({children}: WithChildren): ReactNode {
  return children;
}
function SliderBase({value = 0, steps = 0, min = 0, max = 1, enabled = true, onValueChange, onValueChangeFinished, modifiers, testID}: WithChildren & {value?: number; steps?: number; min?: number; max?: number; lowerLimit?: number; upperLimit?: number; enabled?: boolean; colors?: unknown; onValueChange?: (value: number) => void; onValueChangeFinished?: () => void}) {
  return <KitSlider value={value} onValueChange={onValueChange ?? (() => {})} onSlidingComplete={onValueChangeFinished ? () => onValueChangeFinished() : undefined} min={min} max={max} step={steps > 0 ? (max - min) / (steps + 1) : undefined} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
}
export const Slider = Object.assign(SliderBase, {Thumb, Track});

// Pickers and progress

type Components = 'date' | 'hourAndMinute' | 'dateAndTime';
const MODES: Record<Components, 'date' | 'time' | 'datetime'> = {date: 'date', hourAndMinute: 'time', dateAndTime: 'datetime'};

export function DateTimePicker({initialDate, onDateSelected, displayedComponents = 'date', selectableDates, modifiers, testID}: Common & {initialDate?: string | null; onDateSelected?: (date: Date) => void; variant?: string; showVariantToggle?: boolean; displayedComponents?: Components; color?: string; elementColors?: unknown; is24Hour?: boolean; selectableDates?: {start?: Date; end?: Date}}) {
  return <KitDateTimePicker value={initialDate ? new Date(initialDate) : undefined} onChange={onDateSelected} mode={MODES[displayedComponents] ?? 'date'} minimumDate={selectableDates?.start} maximumDate={selectableDates?.end} disabled={isDisabled(modifiers)} testID={testID}/>;
}
export const DatePickerDialog = DateTimePicker;
export function TimePickerDialog(props: Parameters<typeof DateTimePicker>[0]) {
  return <DateTimePicker {...props} displayedComponents="hourAndMinute"/>;
}

type ProgressProps = Common & {progress?: number | null; color?: string; trackColor?: string; strokeWidth?: number; strokeCap?: string; gapSize?: number; drawStopIndicator?: unknown; amplitude?: number; wavelength?: number; waveSpeed?: number; stopSize?: number};
function progress(variant: 'linear' | 'circular') {
  return function Progress({progress: value, color, trackColor, strokeWidth, testID}: ProgressProps) {
    return <KitProgress value={value ?? undefined} variant={variant} color={color} trackColor={trackColor} size={strokeWidth === undefined ? undefined : strokeWidth * 6} testID={testID}/>;
  };
}
export const LinearProgressIndicator = progress('linear');
export const CircularProgressIndicator = progress('circular');
export const LinearWavyProgressIndicator = progress('linear');
export const CircularWavyProgressIndicator = progress('circular');

export function LoadingIndicator({color, testID}: Common & {progress?: unknown; color?: string}) {
  return <KitSpinner color={color} testID={testID}/>;
}
export const ContainedLoadingIndicator = LoadingIndicator;

// Text fields

export type TextFieldRef = {setText(text: string): Promise<void>; clear(): Promise<void>; focus(): Promise<void>; blur(): Promise<void>; setSelection(start: number, end: number): Promise<void>};

type FieldProps = WithChildren & {
  ref?: Ref<TextFieldRef>;
  value?: unknown;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onValueChangeSync?: unknown;
  autoFocus?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  singleLine?: boolean;
  maxLines?: number;
  minLines?: number;
  visualTransformation?: 'password' | 'none';
  maxLength?: number;
  placeholder?: ReactNode;
  label?: ReactNode;
  keyboardOptions?: {capitalization?: 'none' | 'characters' | 'words' | 'sentences'; autoCorrectEnabled?: boolean; keyboardType?: string; imeAction?: string};
  keyboardActions?: Record<string, (value: string) => void>;
  textStyle?: unknown;
  colors?: unknown;
  isError?: boolean;
  supportingText?: ReactNode;
};

const KEYBOARDS: Record<string, string> = {text: 'default', number: 'numeric', decimal: 'decimal-pad', phone: 'phone-pad', email: 'email-address', uri: 'url', password: 'default', numberPassword: 'numeric'};
type KeyboardType = Parameters<typeof KitTextField>[0]['keyboardType'];
type ReturnKey = Parameters<typeof KitTextField>[0]['returnKeyType'];

function field() {
  return function Field({ref, value, defaultValue, onValueChange, autoFocus, enabled = true, readOnly, singleLine, maxLines, visualTransformation, maxLength, placeholder, label, keyboardOptions, keyboardActions, modifiers, testID}: FieldProps) {
    const [own, setOwn] = useState(valueOf(value) ?? defaultValue ?? '');
    const current = valueOf(value) ?? own;
    const change = (next: string) => {
      setOwn(next);
      assign(value, next);
      onValueChange?.(next);
    };
    useImperativeHandle(ref, () => ({
      setText: async next => change(next),
      clear: async () => change(''),
      focus: async () => {},
      blur: async () => {},
      setSelection: async () => {},
    }));
    const action = keyboardOptions?.imeAction;
    const submit = (text: string) => {
      const handler = action ? keyboardActions?.[`on${action[0].toUpperCase()}${action.slice(1)}`] : undefined;
      (handler ?? keyboardActions?.onDone)?.(text);
    };
    return (
      <KitTextField
        value={current}
        onChangeText={change}
        placeholder={placeholder === undefined ? (label === undefined ? undefined : textOf(label)) : textOf(placeholder)}
        autoFocus={autoFocus}
        disabled={!enabled || readOnly || isDisabled(modifiers)}
        multiline={singleLine === false || (maxLines ?? 1) > 1}
        secureTextEntry={visualTransformation === 'password'}
        maxLength={maxLength}
        keyboardType={(keyboardOptions?.keyboardType ? KEYBOARDS[keyboardOptions.keyboardType] : undefined) as KeyboardType}
        autoCapitalize={keyboardOptions?.capitalization}
        autoCorrect={keyboardOptions?.autoCorrectEnabled}
        returnKeyType={(action === 'go' || action === 'next' || action === 'search' || action === 'send' ? action : 'done') as ReturnKey}
        onSubmit={submit}
        testID={testID}
      />
    );
  };
}
export const TextField = field();
export const OutlinedTextField = field();
export const BasicTextField = field();

// Segmented buttons

type SegmentedButtonProps = WithChildren & {selected?: boolean; onClick?: () => void; checked?: boolean; onCheckedChange?: (checked: boolean) => void; enabled?: boolean; colors?: unknown};
function SegmentLabel({children}: WithChildren): ReactNode {
  return children;
}
function SegmentedButtonBase(_props: SegmentedButtonProps): null {
  return null;
}
export const SegmentedButton = Object.assign(SegmentedButtonBase, {Label: SegmentLabel});

/** The row's buttons as the kit's segments: the selected or checked one is the value; a press selects. */
function segmentedRow(multiple: boolean) {
  return function SegmentedRow({children, modifiers, testID}: WithChildren) {
    const buttons = elementsOf(children).map(child => child.props as SegmentedButtonProps);
    const selected = buttons.findIndex(props => props.selected || props.checked);
    return (
      <KitSegmentedControl
        selectedValue={selected >= 0 ? selected : undefined}
        onValueChange={value => {
          const props = buttons[Number(value)];
          if (multiple) props?.onCheckedChange?.(!props.checked);
          else props?.onClick?.();
        }}
        disabled={isDisabled(modifiers)}
        testID={testID}>
        {buttons.map((props, index) => (
          <KitSegmentedControl.Item key={index} label={textOf(slotOf(props.children, SegmentLabel) ?? props.children)} value={index}/>
        ))}
      </KitSegmentedControl>
    );
  };
}
export const SingleChoiceSegmentedButtonRow = segmentedRow(false);
export const MultiChoiceSegmentedButtonRow = segmentedRow(true);

// Sheets, menus and dialogs

export type ModalBottomSheetRef = {hide(): Promise<void>; expand(): Promise<void>; partialExpand(): Promise<void>};

function DragHandle(): null {
  return null;
}
function ModalBottomSheetBase({children, ref, onDismissRequest, testID}: WithChildren & {ref?: Ref<ModalBottomSheetRef>; onDismissRequest: () => void; skipPartiallyExpanded?: boolean; initialFullyExpanded?: boolean; containerColor?: string; contentColor?: string; scrimColor?: string; showDragHandle?: boolean; sheetGesturesEnabled?: boolean; properties?: unknown}) {
  const [hidden, setHidden] = useState(false);
  useImperativeHandle(ref, () => ({
    hide: async () => {
      setHidden(true);
      onDismissRequest();
    },
    expand: async () => setHidden(false),
    partialExpand: async () => setHidden(false),
  }));
  return <KitSheet isPresented={!hidden} onDismiss={onDismissRequest} testID={testID}>{without(children, DragHandle)}</KitSheet>;
}
export const ModalBottomSheet = Object.assign(ModalBottomSheetBase, {DragHandle});

export function Items({children}: WithChildren): ReactNode {
  return children;
}
export function Trigger({children}: WithChildren): ReactNode {
  return children;
}
export function Preview({children}: WithChildren): ReactNode {
  return children;
}

type MenuItemProps = WithChildren & {text?: string; onClick?: () => void; enabled?: boolean; leadingIcon?: ReactNode; trailingIcon?: ReactNode};

export function DropdownMenuItem(_props: MenuItemProps): null {
  return null;
}

/** The kit's menu items for what a dropdown holds: its items, and buttons or text used as items. */
function menuItemsOf(children: ReactNode): MenuItem[] {
  return elementsOf(children).map(child => {
    const props = child.props as MenuItemProps;
    return {label: props.text ?? textOf(props.children), onPress: props.onClick, disabled: props.enabled === false || isDisabled(props.modifiers)};
  });
}

function DropdownMenuBase({children, expanded = false, onDismissRequest, modifiers, testID}: WithChildren & {expanded?: boolean; onDismissRequest?: () => void; color?: string}) {
  const items = menuItemsOf(slotOf(children, Items));
  return (
    <Frame modifiers={modifiers} testID={testID}>
      {slotOf(children, Trigger)}
      {expanded ? (
        <View style={{borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 4}}>
          {items.map((item, index) => (
            <Pressable
              key={index}
              disabled={item.disabled}
              onPress={() => {
                item.onPress?.();
                onDismissRequest?.();
              }}
              style={{paddingHorizontal: 12, paddingVertical: 8, opacity: item.disabled ? 0.5 : 1}}>
              <NativeText>{item.label}</NativeText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Frame>
  );
}
export const DropdownMenu = Object.assign(DropdownMenuBase, {Items, Trigger, Preview});

export function ExposedDropdownMenu({children}: WithChildren & {expanded?: boolean; onDismissRequest?: () => void}) {
  return <>{children}</>;
}
export function ExposedDropdownMenuBox({children, modifiers, testID}: WithChildren & {expanded?: boolean; onExpandedChange?: (expanded: boolean) => void}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

function Title({children}: WithChildren): ReactNode {
  return children;
}
function DialogText({children}: WithChildren): ReactNode {
  return children;
}
function ConfirmButton({children}: WithChildren): ReactNode {
  return children;
}
function DismissButton({children}: WithChildren): ReactNode {
  return children;
}
function DialogIcon({children}: WithChildren): ReactNode {
  return children;
}

/** A dialog's button slot as a kit alert action: the button's text and press; the kit dismisses after either. */
function actionOf(node: ReactNode, role: 'default' | 'cancel') {
  const button = elementsOf(node)[0];
  if (!button) return undefined;
  const props = button.props as ButtonProps;
  return {label: textOf(props.children), role, onPress: () => props.onClick?.()};
}

function AlertDialogBase({children, onDismissRequest, testID}: WithChildren & {colors?: unknown; tonalElevation?: number; properties?: unknown; onDismissRequest?: () => void}) {
  const dismiss = () => onDismissRequest?.();
  const title = slotOf(children, Title);
  const text = slotOf(children, DialogText);
  const actions = [actionOf(slotOf(children, DismissButton), 'cancel'), actionOf(slotOf(children, ConfirmButton), 'default')].filter((action): action is NonNullable<typeof action> => !!action);
  return <KitAlert title={title === undefined ? '' : textOf(title)} message={text === undefined ? undefined : textOf(text)} visible onDismiss={dismiss} actions={actions.length ? actions : undefined} testID={testID}/>;
}
export const AlertDialog = Object.assign(AlertDialogBase, {Title, Text: DialogText, ConfirmButton, DismissButton, Icon: DialogIcon});

export function BasicAlertDialog({children, onDismissRequest, testID}: WithChildren & {onDismissRequest?: () => void; properties?: unknown}) {
  return (
    <KitAlert title="" visible onDismiss={() => onDismissRequest?.()} testID={testID}>
      {children}
    </KitAlert>
  );
}

// Surfaces

function card() {
  return function Card({children, modifiers, testID}: WithChildren & {colors?: unknown; elevation?: number; border?: unknown}) {
    return <KitCard style={styleOf(modifiers)} testID={testID}>{children}</KitCard>;
  };
}
export const Card = card();
export const ElevatedCard = card();
export const OutlinedCard = card();

export function Surface({children, modifiers, testID}: WithChildren & {color?: string; contentColor?: string; tonalElevation?: number; shadowElevation?: number; shape?: unknown; border?: unknown}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export function Badge({children, containerColor = '#b42318', contentColor = '#ffffff', modifiers, testID}: WithChildren & {containerColor?: string; contentColor?: string}) {
  return (
    <View style={[{backgroundColor: containerColor, borderRadius: 8, minWidth: 16, height: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center'}, styleOf(modifiers)]} testID={testID}>
      {children === undefined ? null : <NativeText style={{color: contentColor, fontSize: 11}}>{textOf(children)}</NativeText>}
    </View>
  );
}
function BadgeSlot({children}: WithChildren): ReactNode {
  return children;
}
function BadgedBoxBase({children, modifiers, testID}: WithChildren) {
  return (
    <Frame modifiers={modifiers} testID={testID}>
      {without(children, BadgeSlot)}
      <View style={{position: 'absolute', top: -4, right: -4}}>{slotOf(children, BadgeSlot)}</View>
    </Frame>
  );
}
export const BadgedBox = Object.assign(BadgedBoxBase, {Badge: BadgeSlot});

type ChipProps = WithChildren & {enabled?: boolean; selected?: boolean; onClick?: () => void; colors?: unknown; elevation?: number; border?: unknown};
function ChipLabel({children}: WithChildren): ReactNode {
  return children;
}
function ChipIcon({children}: WithChildren): ReactNode {
  return children;
}
function chip() {
  return function Chip({children, enabled = true, selected, onClick, modifiers, testID}: ChipProps) {
    return <KitButton label={textOf(slotOf(children, ChipLabel) ?? children)} variant={selected ? 'filled' : 'outlined'} size="small" shape="pill" onPress={onClick} disabled={!enabled || isDisabled(modifiers)} testID={testID}/>;
  };
}
export const AssistChip = Object.assign(chip(), {Label: ChipLabel, LeadingIcon: ChipIcon, TrailingIcon: ChipIcon});
export const FilterChip = Object.assign(chip(), {Label: ChipLabel, LeadingIcon: ChipIcon, TrailingIcon: ChipIcon});
export const InputChip = Object.assign(chip(), {Label: ChipLabel, Avatar: ChipIcon, TrailingIcon: ChipIcon});
export const SuggestionChip = Object.assign(chip(), {Label: ChipLabel, Icon: ChipIcon});

function HeadlineContent({children}: WithChildren): ReactNode {
  return children;
}
function OverlineContent({children}: WithChildren): ReactNode {
  return children;
}
function SupportingContent({children}: WithChildren): ReactNode {
  return children;
}
function LeadingContent({children}: WithChildren): ReactNode {
  return children;
}
function TrailingContent({children}: WithChildren): ReactNode {
  return children;
}
function ListItemBase({children, modifiers, testID}: WithChildren & {colors?: unknown; tonalElevation?: number; shadowElevation?: number}) {
  const supporting = slotOf(children, SupportingContent);
  return (
    <KitListItem leading={slotOf(children, LeadingContent)} trailing={slotOf(children, TrailingContent)} supporting={supporting} onPress={onTapOf(modifiers)} testID={testID}>
      {slotOf(children, HeadlineContent) ?? without(children, OverlineContent, SupportingContent, LeadingContent, TrailingContent)}
    </KitListItem>
  );
}
export const ListItem = Object.assign(ListItemBase, {HeadlineContent, OverlineContent, SupportingContent, LeadingContent, TrailingContent});

// Tooltips, snackbars and search

function PlainTooltip({children}: WithChildren): ReactNode {
  return children;
}
function RichTitle({children}: WithChildren): ReactNode {
  return children;
}
function RichText({children}: WithChildren): ReactNode {
  return children;
}
function RichAction({children}: WithChildren): ReactNode {
  return children;
}
const RichTooltip = Object.assign(function RichTooltip({children}: WithChildren): ReactNode {
  return children;
}, {Title: RichTitle, Text: RichText, Action: RichAction});

export type TooltipBoxRef = {show(): Promise<void>; dismiss(): Promise<void>};
function TooltipBoxBase({children, ref, testID}: WithChildren & {ref?: Ref<TooltipBoxRef>; isPersistent?: boolean; hasAction?: boolean; enableUserInput?: boolean; focusable?: boolean}) {
  useImperativeHandle(ref, () => ({show: async () => {}, dismiss: async () => {}}));
  const plain = slotOf(children, PlainTooltip);
  const rich = slotOf(children, RichTooltip);
  const text = textOf(plain ?? slotOf(rich, RichText) ?? slotOf(rich, RichTitle));
  return <KitTooltip text={text} testID={testID}><View>{without(children, PlainTooltip, RichTooltip)}</View></KitTooltip>;
}
export const TooltipBox = Object.assign(TooltipBoxBase, {PlainTooltip, RichTooltip});

export type SnackbarShowOptions = {message: string; actionLabel?: string; withDismissAction?: boolean; duration?: 'short' | 'long' | 'indefinite'};
export type SnackbarHostRef = {showSnackbar(options: SnackbarShowOptions): Promise<'actionPerformed' | 'dismissed'>};

export function Snackbar(_props: Common & {containerColor?: string; contentColor?: string; actionContentColor?: string; dismissActionContentColor?: string; actionOnNewLine?: boolean}): null {
  return null;
}

const DURATIONS = {short: 4000, long: 10000, indefinite: 0};

export function SnackbarHost({ref, children, testID}: WithChildren & {ref?: Ref<SnackbarHostRef>}) {
  const [current, setCurrent] = useState<{options: SnackbarShowOptions; resolve: (result: 'actionPerformed' | 'dismissed') => void} | null>(null);
  useImperativeHandle(ref, () => ({
    showSnackbar: options =>
      new Promise(resolve => {
        setCurrent(previous => {
          previous?.resolve('dismissed');
          return {options, resolve};
        });
      }),
  }));
  const finish = (result: 'actionPerformed' | 'dismissed') => {
    setCurrent(previous => {
      previous?.resolve(result);
      return null;
    });
  };
  return (
    <>
      {children}
      <KitToast
        message={current?.options.message ?? ''}
        visible={current !== null}
        action={current?.options.actionLabel ? {label: current.options.actionLabel, onPress: () => finish('actionPerformed')} : undefined}
        onDismiss={() => finish('dismissed')}
        duration={current ? DURATIONS[current.options.duration ?? 'short'] : undefined}
        testID={testID}
      />
    </>
  );
}

function SearchPlaceholder({children}: WithChildren): ReactNode {
  return children;
}
function ExpandedFullScreenSearchBarSlot({children}: WithChildren): ReactNode {
  return children;
}
function search(handler: 'onSearch' | 'onQueryChange') {
  return function SearchBar({children, modifiers, testID, ...rest}: WithChildren & {onSearch?: (text: string) => void; onQueryChange?: (query: string) => void}) {
    const [query, setQuery] = useState('');
    const notify = rest[handler];
    return (
      <View style={styleOf(modifiers)}>
        <KitTextField
          value={query}
          onChangeText={text => {
            setQuery(text);
            if (handler === 'onQueryChange') notify?.(text);
          }}
          onSubmit={text => notify?.(text)}
          placeholder={textOf(slotOf(children, SearchPlaceholder)) || 'Search'}
          returnKeyType="search"
          testID={testID}
        />
        {without(children, SearchPlaceholder)}
      </View>
    );
  };
}
export const SearchBarPlaceholder = SearchPlaceholder;
export const ExpandedFullScreenSearchBar = ExpandedFullScreenSearchBarSlot;
export const SearchBar = Object.assign(search('onSearch'), {Placeholder: SearchPlaceholder, ExpandedFullScreenSearchBar: ExpandedFullScreenSearchBarSlot});
export const DockedSearchBarPlaceholder = SearchPlaceholder;
export const DockedSearchBarLeadingIcon = ChipIcon;
export const DockedSearchBar = Object.assign(search('onQueryChange'), {Placeholder: SearchPlaceholder, LeadingIcon: ChipIcon});

// Motion, paging and the rest

export const EnterTransition = {fadeIn: () => ({type: 'fadeIn'}), slideIn: () => ({type: 'slideIn'}), expandIn: () => ({type: 'expandIn'}), scaleIn: () => ({type: 'scaleIn'})};
export const ExitTransition = {fadeOut: () => ({type: 'fadeOut'}), slideOut: () => ({type: 'slideOut'}), shrinkOut: () => ({type: 'shrinkOut'}), scaleOut: () => ({type: 'scaleOut'})};

export function AnimatedVisibility({visible = true, children, modifiers, testID}: WithChildren & {visible?: boolean; enterTransition?: unknown; exitTransition?: unknown}) {
  if (!visible) return null;
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

export function Shape({modifiers, testID}: Common & {type?: string; cornerRadius?: number; color?: string}) {
  return <View style={[{minWidth: 1, minHeight: 1}, styleOf(modifiers)]} testID={testID}/>;
}
export function parseJSXShape(shape: unknown): Record<string, unknown> | undefined {
  if (!shape || typeof shape !== 'object') return undefined;
  const element = shape as {props?: Record<string, unknown>};
  return element.props ? {...element.props} : undefined;
}

export type HorizontalPagerHandle = {scrollToPage(page: number): Promise<void>; animateScrollToPage(page: number): Promise<void>};
export function HorizontalPager({children, ref, modifiers, testID}: WithChildren & {ref?: Ref<HorizontalPagerHandle>; position?: number; onPageChanged?: (page: number) => void}) {
  const [page, setPage] = useState(0);
  useImperativeHandle(ref, () => ({scrollToPage: async next => setPage(next), animateScrollToPage: async next => setPage(next)}));
  return <Frame modifiers={modifiers} testID={testID}>{elementsOf(children)[page] ?? null}</Frame>;
}
function carousel() {
  return function Carousel({children, modifiers, testID}: WithChildren & {preferredItemWidth?: number; itemWidth?: number; itemSpacing?: number; minSmallItemWidth?: number; maxSmallItemWidth?: number; contentPadding?: unknown; flingBehavior?: unknown}) {
    return <NativeScrollView horizontal style={styleOf(modifiers)} testID={testID}>{children}</NativeScrollView>;
  };
}
export const HorizontalCenteredHeroCarousel = carousel();
export const HorizontalMultiBrowseCarousel = carousel();
export const HorizontalUncontainedCarousel = carousel();

export function PullToRefreshBox({children, modifiers, testID}: WithChildren & {isRefreshing?: boolean; onRefresh?: () => void; contentAlignment?: string; indicator?: unknown}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}

function ToolbarFab({children, onClick}: WithChildren & {onClick?: () => void}) {
  return <Pressable onPress={onClick} style={{padding: 8}}>{children}</Pressable>;
}
function HorizontalFloatingToolbarBase({children, modifiers, testID}: WithChildren & {expanded?: boolean; onPress?: () => void}) {
  return <Frame modifiers={modifiers} testID={testID} style={{flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 24, padding: 4}}>{children}</Frame>;
}
export const HorizontalFloatingToolbarFloatingActionButton = ToolbarFab;
export const HorizontalFloatingToolbar = Object.assign(HorizontalFloatingToolbarBase, {FloatingActionButton: ToolbarFab});

function NavIcon({children}: WithChildren): ReactNode {
  return children;
}
function NavLabel({children}: WithChildren): ReactNode {
  return children;
}
export const NavigationBarItem = Object.assign(function NavigationBarItem(_props: WithChildren & {onClick?: () => void; selected?: boolean; enabled?: boolean}): null {
  return null;
}, {Icon: NavIcon, SelectedIcon: NavIcon, Label: NavLabel});
export function NavigationBar({children, selected, onClick, modifiers, testID}: WithChildren & {selected?: number; onClick?: (index: number) => void; enabled?: boolean; alwaysShowLabel?: boolean; colors?: unknown}) {
  const items = elementsOf(children);
  return (
    <Frame modifiers={modifiers} testID={testID} style={{flexDirection: 'row', justifyContent: 'space-around'}}>
      {items.map((item, index) => (
        <KitButton key={index} label={textOf(slotOf(item.props.children, NavLabel) ?? item.props.children)} variant={index === selected ? 'filled' : 'text'} onPress={() => onClick?.(index)}/>
      ))}
    </Frame>
  );
}

export const isDynamicColorAvailable = false;
export const HostPaletteContext = createContext<Record<string, string> | null>(null);
/** The Material palette a seed colour gives: Windows keeps the system accent, so the seed is answered back as the primary. */
export function getMaterialColors(options?: {seedColor?: string; scheme?: string}): Record<string, string> {
  const primary = options?.seedColor ?? '#0f6cbd';
  return {primary, onPrimary: '#ffffff', secondary: primary, onSecondary: '#ffffff', surface: '#ffffff', onSurface: '#1b1f27', background: '#ffffff', onBackground: '#1b1f27', error: '#b42318', onError: '#ffffff'};
}
export function useMaterialColors(options?: {seedColor?: string}): Record<string, string> {
  return getMaterialColors(options);
}

/** React Native content inside Compose: on Windows it is all one tree, so the content is simply there. */
export function RNHostView({children, modifiers, testID}: WithChildren & {matchContents?: unknown; layoutRoot?: unknown}) {
  return <Frame modifiers={modifiers} testID={testID}>{children}</Frame>;
}
