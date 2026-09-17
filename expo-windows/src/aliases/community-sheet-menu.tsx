import type {ComponentType, ReactNode, Ref} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {useImperativeHandle, useRef, useState} from 'react';
import {FlatList, ScrollView, SectionList, TextInput, View} from 'react-native';
import {ContextMenu as KitContextMenu, type MenuItem, Sheet as KitSheet} from 'expo-interface';

/**
 * `@expo/ui/community/bottom-sheet` (and `@gorhom/bottom-sheet`) and
 * `@expo/ui/community/menu` (and `@react-native-menu/menu`) on Windows: the
 * sheet is the kit's `Sheet`, with the snap-point API kept as open or
 * closed; the menu is the kit's `ContextMenu` over the actions given.
 */

// Bottom sheet

export interface BottomSheetMethods {
  snapToIndex(index: number): void;
  snapToPosition(position: string | number): void;
  expand(): void;
  collapse(): void;
  close(): void;
  forceClose(): void;
  present(): void;
  dismiss(): void;
}

export interface BottomSheetProps {
  ref?: Ref<BottomSheetMethods>;
  snapPoints?: (string | number)[];
  index?: number;
  onChange?: (index: number) => void;
  onClose?: () => void;
  onDismiss?: () => void;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  [key: string]: unknown;
}

/** The kit's sheet with the community API: open at any index but -1, closed at -1, told when that changes. */
export function BottomSheet({ref, index = 0, onChange, onClose, onDismiss, children, testID}: BottomSheetProps) {
  const [current, setCurrent] = useState(index);
  const [seen, setSeen] = useState(index);
  if (seen !== index) {
    // The prop moved the sheet: follow it, as the state adjusted during render.
    setSeen(index);
    setCurrent(index);
  }
  const move = (next: number) => {
    setCurrent(next);
    onChange?.(next);
    if (next < 0) {
      onClose?.();
      onDismiss?.();
    }
  };
  useImperativeHandle(ref, () => ({
    snapToIndex: next => move(next),
    snapToPosition: () => move(0),
    expand: () => move(0),
    collapse: () => move(0),
    close: () => move(-1),
    forceClose: () => move(-1),
    present: () => move(0),
    dismiss: () => move(-1),
  }));
  return <KitSheet isPresented={current >= 0} onDismiss={() => move(-1)} testID={testID}>{children}</KitSheet>;
}

export function BottomSheetModal(props: BottomSheetProps) {
  const {index: presentIndex = 0, ref, ...rest} = props;
  const sheet = useRef<BottomSheetMethods>(null);
  useImperativeHandle(ref, () => ({
    snapToIndex: next => sheet.current?.snapToIndex(next),
    snapToPosition: position => sheet.current?.snapToPosition(position),
    expand: () => sheet.current?.expand(),
    collapse: () => sheet.current?.collapse(),
    close: () => sheet.current?.close(),
    forceClose: () => sheet.current?.forceClose(),
    present: () => sheet.current?.snapToIndex(presentIndex),
    dismiss: () => sheet.current?.close(),
  }));
  return <BottomSheet ref={sheet} {...rest} index={-1}/>;
}

export function BottomSheetModalProvider({children}: {children?: ReactNode}) {
  return <>{children}</>;
}

export function BottomSheetView({children, style}: {children?: ReactNode; style?: StyleProp<ViewStyle>}) {
  return <View style={style}>{children}</View>;
}
export const BottomSheetScrollView = ScrollView;
export const BottomSheetFlatList = FlatList;
export const BottomSheetSectionList = SectionList;
export const BottomSheetTextInput = TextInput;
export function BottomSheetBackdrop(): null {
  return null;
}
export function BottomSheetHandle(): null {
  return null;
}
export function BottomSheetFooter({children}: {children?: ReactNode}) {
  return <View>{children}</View>;
}

/** The sheet's own hooks, for content that asks the sheet to move: no motion to make on Windows. */
export function useBottomSheet(): BottomSheetMethods & {animatedIndex: {value: number}; animatedPosition: {value: number}} {
  const nothing = () => {};
  return {snapToIndex: nothing, snapToPosition: nothing, expand: nothing, collapse: nothing, close: nothing, forceClose: nothing, present: nothing, dismiss: nothing, animatedIndex: {value: 0}, animatedPosition: {value: 0}};
}
export const useBottomSheetModal = () => ({dismiss: () => {}, dismissAll: () => {}});

// Menu

export type MenuAction = {
  id?: string;
  title: string;
  titleColor?: string;
  image?: unknown;
  imageColor?: string;
  state?: 'on' | 'off';
  attributes?: {destructive?: boolean; disabled?: boolean; hidden?: boolean};
  subactions?: MenuAction[];
  displayInline?: boolean;
};

export type NativeActionEvent = {nativeEvent: {event: string}};

export interface MenuComponentProps {
  title?: string;
  actions: MenuAction[];
  onPressAction?: (event: NativeActionEvent) => void;
  onOpenMenu?: () => void;
  onCloseMenu?: () => void;
  shouldOpenOnLongPress?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
  ref?: Ref<{show(): void}>;
  [key: string]: unknown;
}

/** The kit's items for the actions: submenus flattened after a separator, hidden ones left out. */
export function menuItemsOf(actions: MenuAction[], onPressAction?: (event: NativeActionEvent) => void): MenuItem[] {
  const items: MenuItem[] = [];
  for (const action of actions) {
    if (action.attributes?.hidden) continue;
    items.push({
      label: action.title,
      active: action.state === 'on',
      role: action.attributes?.destructive ? 'destructive' : 'default',
      disabled: action.attributes?.disabled,
      onPress: () => onPressAction?.({nativeEvent: {event: action.id ?? action.title}}),
    });
    if (action.subactions?.length) {
      const nested = menuItemsOf(action.subactions, onPressAction);
      if (nested.length) nested[0].separator = true;
      items.push(...nested);
    }
  }
  return items;
}

export function MenuView({actions, onPressAction, onOpenMenu, onCloseMenu, children, style, testID, ref}: MenuComponentProps) {
  useImperativeHandle(ref, () => ({show: () => onOpenMenu?.()}));
  return (
    <KitContextMenu
      items={menuItemsOf(actions, onPressAction)}
      onOpenChange={open => (open ? onOpenMenu?.() : onCloseMenu?.())}
      testID={testID}>
      <View style={style}>{children}</View>
    </KitContextMenu>
  );
}

export const MenuComponent: ComponentType<MenuComponentProps> = MenuView;
