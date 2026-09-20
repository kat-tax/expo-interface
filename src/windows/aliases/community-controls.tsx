import type {ReactElement, ReactNode, Ref} from 'react';
import type {StyleProp, ViewProps, ViewStyle} from 'react-native';
import {useImperativeHandle, useRef, useState} from 'react';
import {ScrollView as NativeScrollView, View} from 'react-native';
import {
  Checkbox as KitCheckbox,
  DateTimePicker as KitDateTimePicker,
  Picker as KitPicker,
  SegmentedControl as KitSegmentedControl,
  Slider as KitSlider,
} from '../..';
import {elementsOf} from './ui-kit';

/**
 * The community controls on Windows, under the kit's: what
 * `@react-native-community/slider`, `@react-native-picker/picker`,
 * `@react-native-community/datetimepicker`,
 * `@react-native-segmented-control/segmented-control`, `expo-checkbox`,
 * `react-native-pager-view` and `@react-native-masked-view/masked-view`
 * export — and `@expo/ui/community/*` wraps — resolves here: each package's
 * props, the kit's WinUI control (their own Windows ports are for the old
 * architecture, which react-native-windows 0.84's Fabric does not build).
 */

// @react-native-community/slider

export interface SliderProps {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  lowerLimit?: number;
  upperLimit?: number;
  disabled?: boolean;
  step?: number;
  inverted?: boolean;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  onValueChange?: (value: number) => void;
  onSlidingStart?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  [key: string]: unknown;
}

export function Slider({value = 0, minimumValue = 0, maximumValue = 1, step, disabled, minimumTrackTintColor, onValueChange, onSlidingComplete, style, testID}: SliderProps) {
  return <KitSlider value={value} onValueChange={onValueChange ?? (() => {})} onSlidingComplete={onSlidingComplete} min={minimumValue} max={maximumValue} step={step} disabled={disabled} accentColor={minimumTrackTintColor} style={style} testID={testID}/>;
}

// @react-native-picker/picker

export type PickerItemValue = string | number | null;

export interface PickerItemProps<T extends PickerItemValue = PickerItemValue> {
  label?: string;
  value?: T;
  color?: string;
  fontFamily?: string;
  style?: unknown;
  enabled?: boolean;
  testID?: string;
}

export function PickerItem<T extends PickerItemValue>(_props: PickerItemProps<T>): null {
  return null;
}

export type PickerRef = {focus(): void; blur(): void};

export interface PickerProps<T extends PickerItemValue = PickerItemValue> {
  ref?: Ref<PickerRef>;
  selectedValue?: T;
  onValueChange?: (itemValue: T, itemIndex: number) => void;
  enabled?: boolean;
  mode?: 'dialog' | 'dropdown';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

/** The picker's options as the kit's items: each `Picker.Item` child's label and value. */
export function pickerItems(children: ReactNode): {label: string; value: string | number}[] {
  return elementsOf(children).map((child, index) => {
    const {label, value} = child.props as PickerItemProps;
    return {label: label ?? String(value ?? ''), value: (value ?? label ?? index) as string | number};
  });
}

function PickerBase<T extends PickerItemValue>({ref, selectedValue, onValueChange, enabled = true, style, testID, children}: PickerProps<T>) {
  useImperativeHandle(ref, () => ({focus: () => {}, blur: () => {}}));
  const items = pickerItems(children);
  return (
    <KitPicker selectedValue={selectedValue ?? undefined} onValueChange={value => onValueChange?.(value as T, items.findIndex(item => item.value === value))} disabled={!enabled} style={style} testID={testID}>
      {items.map(item => (
        <KitPicker.Item key={String(item.value)} label={item.label} value={item.value}/>
      ))}
    </KitPicker>
  );
}
export const Picker = Object.assign(PickerBase, {Item: PickerItem});

// @react-native-community/datetimepicker

export type DateTimePickerEvent = {type: 'set' | 'dismissed'; nativeEvent: {timestamp: number; utcOffset: number}};

export interface DateTimePickerProps {
  value: Date;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
  mode?: 'date' | 'time' | 'datetime' | 'countdown';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  accentColor?: string;
  display?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  [key: string]: unknown;
}

export function buildEvent(date: Date): DateTimePickerEvent {
  return {type: 'set', nativeEvent: {timestamp: date.getTime(), utcOffset: -date.getTimezoneOffset()}};
}

export function DateTimePicker({value, onChange, mode = 'date', minimumDate, maximumDate, disabled, accentColor, style, testID}: DateTimePickerProps) {
  return <KitDateTimePicker value={value} onChange={date => onChange?.(buildEvent(date), date)} mode={mode === 'countdown' ? 'time' : mode} minimumDate={minimumDate} maximumDate={maximumDate} disabled={disabled} accentColor={accentColor} style={style} testID={testID}/>;
}

/** Android's imperative picker: a desktop shows the control inline, so opening resolves as dismissed. */
export const DateTimePickerAndroid = {
  open: async (_params: unknown): Promise<void> => {},
  dismiss: async (_mode?: string): Promise<boolean> => false,
};

// @react-native-segmented-control/segmented-control

export type NativeSegmentedControlChangeEvent = {nativeEvent: {selectedSegmentIndex: number; value: string; target?: number}};

export interface SegmentedControlProps {
  values?: string[];
  selectedIndex?: number;
  enabled?: boolean;
  onChange?: (event: NativeSegmentedControlChangeEvent) => void;
  onValueChange?: (value: string) => void;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  [key: string]: unknown;
}

export function SegmentedControl({values = [], selectedIndex, enabled = true, onChange, onValueChange, tintColor, style, testID}: SegmentedControlProps) {
  return (
    <KitSegmentedControl
      selectedValue={selectedIndex}
      onValueChange={index => {
        const selected = Number(index);
        onChange?.({nativeEvent: {selectedSegmentIndex: selected, value: values[selected]}});
        onValueChange?.(values[selected]);
      }}
      disabled={!enabled}
      accentColor={tintColor}
      style={style}
      testID={testID}>
      {values.map((value, index) => (
        <KitSegmentedControl.Item key={index} label={value} value={index}/>
      ))}
    </KitSegmentedControl>
  );
}

// expo-checkbox

export interface CheckboxProps extends ViewProps {
  value?: boolean;
  disabled?: boolean;
  color?: string;
  onChange?: (event: {nativeEvent: {target: number; value: boolean}}) => void;
  onValueChange?: (value: boolean) => void;
}

export function Checkbox({value = false, disabled, color, onChange, onValueChange, style, testID}: CheckboxProps) {
  return (
    <KitCheckbox
      value={value}
      onValueChange={next => {
        onValueChange?.(next);
        onChange?.({nativeEvent: {target: 0, value: next}});
      }}
      disabled={disabled}
      accentColor={color}
      style={style}
      testID={testID}
    />
  );
}
Checkbox.isAvailableAsync = async (): Promise<boolean> => true;

// react-native-pager-view

export type PagerViewRef = {setPage(page: number): void; setPageWithoutAnimation(page: number): void; setScrollEnabled(enabled: boolean): void};

export interface PagerViewProps extends ViewProps {
  ref?: Ref<PagerViewRef>;
  initialPage?: number;
  scrollEnabled?: boolean;
  layoutDirection?: 'ltr' | 'rtl';
  offscreenPageLimit?: number;
  pageMargin?: number;
  onPageScroll?: (event: {nativeEvent: {position: number; offset: number}}) => void;
  onPageSelected?: (event: {nativeEvent: {position: number}}) => void;
  onPageScrollStateChanged?: (event: {nativeEvent: {pageScrollState: 'idle' | 'dragging' | 'settling'}}) => void;
  children?: ReactNode;
}

/** A pager over a paging scroll view: one page a width, the page settled on reported. */
export function PagerView({ref, initialPage = 0, scrollEnabled = true, onPageScroll, onPageSelected, onPageScrollStateChanged, children, style, testID}: PagerViewProps) {
  const scroller = useRef<NativeScrollView>(null);
  const [width, setWidth] = useState(0);
  const [canScroll, setCanScroll] = useState(scrollEnabled);
  const pages = elementsOf(children);
  const go = (page: number, animated: boolean) => {
    scroller.current?.scrollTo({x: page * width, y: 0, animated});
    onPageSelected?.({nativeEvent: {position: page}});
  };
  useImperativeHandle(ref, () => ({
    setPage: page => go(page, true),
    setPageWithoutAnimation: page => go(page, false),
    setScrollEnabled: enabled => setCanScroll(enabled),
  }));
  return (
    <NativeScrollView
      ref={scroller}
      horizontal
      pagingEnabled
      scrollEnabled={canScroll && scrollEnabled}
      showsHorizontalScrollIndicator={false}
      contentOffset={{x: initialPage * width, y: 0}}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      onScroll={event => {
        if (!width) return;
        const x = event.nativeEvent.contentOffset.x / width;
        onPageScroll?.({nativeEvent: {position: Math.floor(x), offset: x - Math.floor(x)}});
      }}
      onScrollBeginDrag={() => onPageScrollStateChanged?.({nativeEvent: {pageScrollState: 'dragging'}})}
      onMomentumScrollEnd={event => {
        onPageScrollStateChanged?.({nativeEvent: {pageScrollState: 'idle'}});
        if (width) onPageSelected?.({nativeEvent: {position: Math.round(event.nativeEvent.contentOffset.x / width)}});
      }}
      scrollEventThrottle={16}
      style={style}
      testID={testID}>
      {pages.map((page, index) => (
        <View key={index} style={{width: width || undefined}}>{page as ReactElement}</View>
      ))}
    </NativeScrollView>
  );
}

// @react-native-masked-view/masked-view

export interface MaskedViewProps extends ViewProps {
  maskElement: ReactElement;
  children?: ReactNode;
}

/** The content without its mask: Windows composition has no alpha mask for a subtree, so the children show whole. */
export function MaskedView({maskElement: _mask, children, ...rest}: MaskedViewProps) {
  return <View {...rest}>{children}</View>;
}
