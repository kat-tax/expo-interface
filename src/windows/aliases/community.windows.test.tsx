import {createRef} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Text, View} from 'react-native';
import {fireIsland, island} from '../../__tests__/windows';
import {buildEvent, Checkbox, DateTimePicker, DateTimePickerAndroid, MaskedView, PagerView, type PagerViewRef, Picker, pickerItems, SegmentedControl, Slider} from './community-controls';
import {BottomSheet, BottomSheetBackdrop, BottomSheetFlatList, BottomSheetFooter, BottomSheetHandle, type BottomSheetMethods, BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView, BottomSheetSectionList, BottomSheetTextInput, BottomSheetView, MenuComponent, menuItemsOf, MenuView, useBottomSheet, useBottomSheetModal} from './community-sheet-menu';
import BottomSheetDefault from './community-bottom-sheet';
import DateTimePickerDefault from './community-datetime-picker';
import MaskedViewDefault from './community-masked-view';
import MenuDefault from './community-menu';
import PagerViewDefault from './community-pager-view';
import PickerDefault from './community-picker';
import SegmentedControlDefault from './community-segmented-control';
import SliderDefault from './community-slider';
import CheckboxDefault from './expo-checkbox';

const TOGGLE = 'ExpoInterfaceToggleSwitch';
const SLIDER = 'ExpoInterfaceSlider';
const CHECK = 'ExpoInterfaceCheckBox';
const COMBO = 'ExpoInterfaceComboBox';
const BAR = 'ExpoInterfaceSelectorBar';
const DATE = 'ExpoInterfaceDatePicker';
const MENU = 'ExpoInterfaceMenuFlyout';

describe('community entries (windows)', () => {
  it('exports each package\'s control as its default, the way the package does', () => {
    expect(SliderDefault).toBe(Slider);
    expect(PickerDefault).toBe(Picker);
    expect(DateTimePickerDefault).toBe(DateTimePicker);
    expect(SegmentedControlDefault).toBe(SegmentedControl);
    expect(PagerViewDefault).toBe(PagerView);
    expect(MaskedViewDefault).toBe(MaskedView);
    expect(CheckboxDefault).toBe(Checkbox);
    expect(BottomSheetDefault).toBe(BottomSheet);
    expect(MenuDefault).toBe(MenuView);
  });
});

describe('community controls (windows)', () => {
  it('draws the community slider, picker, date picker, segmented control and checkbox as the kit\'s', async () => {
    const onValueChange = vi.fn();
    const onSlidingComplete = vi.fn();
    const onPick = vi.fn();
    const onChange = vi.fn();
    const onSegment = vi.fn();
    const onSegmentValue = vi.fn();
    const onCheck = vi.fn();
    const onCheckEvent = vi.fn();
    const picker = createRef<{focus(): void; blur(): void}>();
    await render(
      <>
        <Slider value={3} minimumValue={1} maximumValue={10} step={1} minimumTrackTintColor="#FF9500" onValueChange={onValueChange} onSlidingComplete={onSlidingComplete} disabled testID="volume"/>
        <Slider/>
        <Picker ref={picker} selectedValue="m" onValueChange={onPick} testID="size">
          <Picker.Item label="Small" value="s"/>
          <Picker.Item label="Medium" value="m"/>
          <Picker.Item value={3}/>
        </Picker>
        <Picker enabled={false}/>
        <DateTimePicker value={new Date(2026, 5, 15)} mode="date" minimumDate={new Date(2026, 0, 1)} onChange={onChange} accentColor="#FF9500" testID="due"/>
        <DateTimePicker value={new Date(2026, 5, 15, 12, 30)} mode="countdown"/>
        <SegmentedControl values={['Day', 'Week']} selectedIndex={1} onChange={onSegment} onValueChange={onSegmentValue} tintColor="#FF9500" testID="range"/>
        <SegmentedControl enabled={false}/>
        <Checkbox value onValueChange={onCheck} onChange={onCheckEvent} color="#123456" testID="agree"/>
        <Checkbox disabled/>
      </>,
    );
    expect(island(SLIDER, 0).props).toMatchObject({value: 3, min: 1, max: 10, step: 1, disabled: true, color: '#FF9500'});
    await fireIsland(island(SLIDER, 0), 'valueChange', {value: 4});
    await fireIsland(island(SLIDER, 0), 'slidingComplete', {value: 4});
    expect(onValueChange).toHaveBeenCalledWith(4);
    expect(onSlidingComplete).toHaveBeenCalledWith(4);
    expect(island(SLIDER, 1).props).toMatchObject({value: 0, min: 0, max: 1});
    await fireIsland(island(SLIDER, 1), 'valueChange', {value: 0.5});
    expect(JSON.parse(island(COMBO, 0).props.options)).toEqual(['Small', 'Medium', '3']);
    expect(island(COMBO, 0).props.selectedIndex).toBe(1);
    await fireIsland(island(COMBO, 0), 'selectionChange', {index: 2});
    expect(onPick).toHaveBeenCalledWith(3, 2);
    await act(async () => picker.current?.focus());
    await act(async () => picker.current?.blur());
    expect(island(COMBO, 1).props.disabled).toBe(true);
    await fireIsland(island(COMBO, 1), 'selectionChange', {index: 0});
    expect(pickerItems([<Picker.Item key="a" label="A"/>, <Picker.Item key="b"/>])).toEqual([{label: 'A', value: 'A'}, {label: '', value: 1}]);
    expect(island(DATE, 0).props).toMatchObject({date: '2026-06-15', minDate: '2026-01-01', accentColor: '#FF9500'});
    await fireIsland(island(DATE, 0), 'dateChange', {date: '2026-07-01'});
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'set'}), expect.any(Date));
    expect(buildEvent(new Date(0))).toEqual({type: 'set', nativeEvent: {timestamp: 0, utcOffset: -new Date(0).getTimezoneOffset()}});
    await expect(DateTimePickerAndroid.open({})).resolves.toBeUndefined();
    await expect(DateTimePickerAndroid.dismiss()).resolves.toBe(false);
    expect(JSON.parse(island(BAR, 0).props.options)).toEqual(['Day', 'Week']);
    expect(island(BAR, 0).props).toMatchObject({selectedIndex: 1, accentColor: '#FF9500'});
    await fireIsland(island(BAR, 0), 'selectionChange', {index: 0});
    expect(onSegment).toHaveBeenCalledWith({nativeEvent: {selectedSegmentIndex: 0, value: 'Day'}});
    expect(onSegmentValue).toHaveBeenCalledWith('Day');
    expect(island(BAR, 1).props.disabled).toBe(true);
    expect(island(CHECK, 0).props.value).toBe(true);
    await fireIsland(island(CHECK, 0), 'valueChange', {value: false});
    expect(onCheck).toHaveBeenCalledWith(false);
    expect(onCheckEvent).toHaveBeenCalledWith({nativeEvent: {target: 0, value: false}});
    expect(island(CHECK, 1).props).toMatchObject({value: false, disabled: true});
    await fireIsland(island(CHECK, 1), 'valueChange', {value: true});
    await expect(Checkbox.isAvailableAsync()).resolves.toBe(true);
  });

  it('pages through a paging scroll view, reporting the page and answering the ref, and shows a masked view whole', async () => {
    const ref = createRef<PagerViewRef>();
    const onPageSelected = vi.fn();
    const onPageScroll = vi.fn();
    const onPageScrollStateChanged = vi.fn();
    await render(
      <>
        <PagerView ref={ref} initialPage={1} onPageSelected={onPageSelected} onPageScroll={onPageScroll} onPageScrollStateChanged={onPageScrollStateChanged} testID="pager">
          <View>
            <Text>one</Text>
          </View>
          <View>
            <Text>two</Text>
          </View>
        </PagerView>
        <PagerView scrollEnabled={false}/>
        <MaskedView maskElement={<View/>} testID="masked">
          <Text>content</Text>
        </MaskedView>
      </>,
    );
    const pager = screen.getByTestId('pager');
    await fireEvent(pager, 'scroll', {nativeEvent: {contentOffset: {x: 50, y: 0}}});
    expect(onPageScroll).not.toHaveBeenCalled();
    await fireEvent(pager, 'layout', {nativeEvent: {layout: {width: 100, height: 50}}});
    await fireEvent(pager, 'scroll', {nativeEvent: {contentOffset: {x: 150, y: 0}}});
    expect(onPageScroll).toHaveBeenCalledWith({nativeEvent: {position: 1, offset: 0.5}});
    await fireEvent(pager, 'scrollBeginDrag');
    expect(onPageScrollStateChanged).toHaveBeenCalledWith({nativeEvent: {pageScrollState: 'dragging'}});
    await fireEvent(pager, 'momentumScrollEnd', {nativeEvent: {contentOffset: {x: 200, y: 0}}});
    expect(onPageScrollStateChanged).toHaveBeenCalledWith({nativeEvent: {pageScrollState: 'idle'}});
    expect(onPageSelected).toHaveBeenCalledWith({nativeEvent: {position: 2}});
    await act(async () => ref.current?.setPage(0));
    await act(async () => ref.current?.setPageWithoutAnimation(1));
    await act(async () => ref.current?.setScrollEnabled(false));
    expect(onPageSelected).toHaveBeenCalledWith({nativeEvent: {position: 0}});
    expect(screen.getByText('one')).toBeOnTheScreen();
    expect(screen.getByText('two')).toBeOnTheScreen();
    expect(screen.getByText('content')).toBeOnTheScreen();
  });
});

describe('community sheet and menu (windows)', () => {
  it('shows the sheet at any index but -1, follows the ref and the prop, and tells the changes', async () => {
    const ref = createRef<BottomSheetMethods>();
    const onChange = vi.fn();
    const onClose = vi.fn();
    const onDismiss = vi.fn();
    const {rerender} = await render(
      <BottomSheet ref={ref} index={0} onChange={onChange} onClose={onClose} onDismiss={onDismiss}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    await act(async () => ref.current?.close());
    expect(screen.queryByText('Sheet body')).toBeNull();
    expect(onChange).toHaveBeenCalledWith(-1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await act(async () => ref.current?.snapToIndex(1));
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    await act(async () => ref.current?.forceClose());
    await act(async () => ref.current?.expand());
    await act(async () => ref.current?.collapse());
    await act(async () => ref.current?.snapToPosition('50%'));
    await act(async () => ref.current?.present());
    await act(async () => ref.current?.dismiss());
    expect(screen.queryByText('Sheet body')).toBeNull();
    await rerender(
      <BottomSheet ref={ref} index={2} onChange={onChange}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('sheet'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(screen.queryByText('Sheet body')).toBeNull();
  });

  it('presents the modal sheet on demand, with the provider, views and hooks that come with it', async () => {
    const ref = createRef<BottomSheetMethods>();
    await render(
      <BottomSheetModalProvider>
        <BottomSheetModal ref={ref} index={1}>
          <BottomSheetView>
            <Text>Modal body</Text>
          </BottomSheetView>
          <BottomSheetFooter>
            <Text>Footer</Text>
          </BottomSheetFooter>
          <BottomSheetBackdrop/>
          <BottomSheetHandle/>
        </BottomSheetModal>
      </BottomSheetModalProvider>,
    );
    expect(screen.queryByText('Modal body')).toBeNull();
    await act(async () => ref.current?.present());
    expect(screen.getByText('Modal body')).toBeOnTheScreen();
    expect(screen.getByText('Footer')).toBeOnTheScreen();
    await act(async () => ref.current?.snapToIndex(0));
    await act(async () => ref.current?.snapToPosition(1));
    await act(async () => ref.current?.expand());
    await act(async () => ref.current?.collapse());
    await act(async () => ref.current?.forceClose());
    await act(async () => ref.current?.present());
    await act(async () => ref.current?.close());
    await act(async () => ref.current?.dismiss());
    expect(screen.queryByText('Modal body')).toBeNull();
    expect(BottomSheetScrollView).toBeDefined();
    expect(BottomSheetFlatList).toBeDefined();
    expect(BottomSheetSectionList).toBeDefined();
    expect(BottomSheetTextInput).toBeDefined();
    const sheet = useBottomSheet();
    sheet.snapToIndex(0);
    sheet.close();
    expect(sheet.animatedIndex.value).toBe(0);
    useBottomSheetModal().dismiss();
    useBottomSheetModal().dismissAll();
  });

  it('turns the menu actions into the kit\'s context menu items and answers the presses and open state', async () => {
    const onPressAction = vi.fn();
    const onOpenMenu = vi.fn();
    const onCloseMenu = vi.fn();
    const ref = createRef<{show(): void}>();
    const actions = [
      {id: 'copy', title: 'Copy'},
      {title: 'Delete', attributes: {destructive: true, disabled: true}, state: 'on' as const},
      {title: 'Hidden', attributes: {hidden: true}},
      {title: 'More', subactions: [{id: 'nested', title: 'Nested'}]},
    ];
    await render(
      <MenuView ref={ref} actions={actions} onPressAction={onPressAction} onOpenMenu={onOpenMenu} onCloseMenu={onCloseMenu} testID="menu">
        <Text>Target</Text>
      </MenuView>,
    );
    expect(screen.getByText('Target')).toBeOnTheScreen();
    const items = menuItemsOf(actions, onPressAction);
    expect(items.map(item => item.label)).toEqual(['Copy', 'Delete', 'More', 'Nested']);
    expect(items[1]).toMatchObject({role: 'destructive', disabled: true, active: true});
    expect(items[3].separator).toBe(true);
    items[0].onPress?.();
    items[1].onPress?.();
    expect(onPressAction.mock.calls.map(call => call[0].nativeEvent.event)).toEqual(['copy', 'Delete']);
    expect(JSON.parse(island(MENU).props.items)).toHaveLength(4);
    await act(async () => ref.current?.show());
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(MenuComponent).toBe(MenuView);
    expect(onCloseMenu).not.toHaveBeenCalled();
    expect(TOGGLE).toBeDefined();
  });
});
