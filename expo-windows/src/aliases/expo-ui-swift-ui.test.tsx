import {createRef} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Linking, Share} from 'react-native';
import {fireIsland, island} from '../../../src/__tests__/windows';
import {bold, buttonStyle, disabled, font, foregroundColor, frame, gaugeStyle, lineLimit, onTapGesture, pickerStyle, progressViewStyle, tag, toggleStyle} from './expo-ui-swift-ui-modifiers';
import * as ui from './expo-ui-swift-ui';
import {forgetWarnings} from './ui-kit';

const BUTTON = 'ExpoInterfaceButton';
const TOGGLE = 'ExpoInterfaceToggleSwitch';
const SLIDER = 'ExpoInterfaceSlider';
const COMBO = 'ExpoInterfaceComboBox';
const BAR = 'ExpoInterfaceSelectorBar';
const DATE = 'ExpoInterfaceDatePicker';
const TIME = 'ExpoInterfaceTimePicker';
const PROGRESS = 'ExpoInterfaceProgress';
const COLOR = 'ExpoInterfaceColorPicker';
const BOX = 'ExpoInterfaceTextBox';
const NUMBER = 'ExpoInterfaceNumberBox';
const DIALOG = 'ExpoInterfaceContentDialog';
const MENU = 'ExpoInterfaceMenuFlyout';

describe('@expo/ui/swift-ui layout (windows)', () => {
  it('lays the stacks out as flex rows and columns carrying the modifiers, pressable on a tap gesture', async () => {
    const onTap = vi.fn();
    await render(
      <ui.Host testID="host" modifiers={[frame({width: 100})]}>
        <ui.HStack spacing={4} alignment="top" testID="h">
          <ui.Text>a</ui.Text>
          <ui.Spacer minLength={2} testID="sp"/>
        </ui.HStack>
        <ui.VStack alignment="trailing" modifiers={[onTapGesture(onTap)]} testID="v">
          <ui.Text>b</ui.Text>
        </ui.VStack>
        <ui.ZStack testID="z">
          <ui.Text>under</ui.Text>
          <ui.Text>over</ui.Text>
        </ui.ZStack>
        <ui.LazyVStack testID="lv">
          <ui.LazyHStack testID="lh">
            <ui.Group>
              <ui.Text>g</ui.Text>
            </ui.Group>
          </ui.LazyHStack>
        </ui.LazyVStack>
        <ui.Divider testID="d"/>
        <ui.Namespace>
          <ui.GlassEffectContainer testID="glass">
            <ui.RNHostView testID="rn">
              <ui.Text>rn</ui.Text>
            </ui.RNHostView>
          </ui.GlassEffectContainer>
        </ui.Namespace>
      </ui.Host>,
    );
    expect(screen.getByTestId('host')).toHaveStyle({width: 100});
    expect(screen.getByTestId('h')).toHaveStyle({flexDirection: 'row', gap: 4, alignItems: 'flex-start'});
    expect(screen.getByTestId('v')).toHaveStyle({flexDirection: 'column', alignItems: 'flex-end'});
    expect(screen.getByTestId('sp')).toHaveStyle({flex: 1, minWidth: 2});
    await fireEvent.press(screen.getByTestId('v'));
    expect(onTap).toHaveBeenCalledTimes(1);
    for (const text of ['under', 'over', 'g', 'rn']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.getByTestId('d')).toBeOnTheScreen();
  });

  it('draws text with the type modifiers, dates, symbols, labels and links', async () => {
    const onPress = vi.fn();
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(
      <>
        <ui.Text modifiers={[bold(), foregroundColor('red'), font({size: 20, weight: 'semibold'}), lineLimit(2)]} testID="t">
          styled
        </ui.Text>
        <ui.Text date={new Date(2026, 0, 2)} testID="date"/>
        <ui.Text date={new Date(2026, 0, 2, 13, 5)} dateStyle="time" testID="time"/>
        <ui.Image systemName="★" size={30} color="blue" testID="img"/>
        <ui.Image systemName="★" onPress={onPress} testID="press"/>
        <ui.Image assetName="photo" testID="asset"/>
        <ui.Label title="Settings" systemImage="★" color="green" testID="label"/>
        <ui.Label icon={<ui.Text>i</ui.Text>}>Child</ui.Label>
        <ui.Link destination="https://expo.dev" label="Expo" testID="link"/>
        <ui.Link destination="https://expo.dev">
          <ui.Text>Docs</ui.Text>
        </ui.Link>
      </>,
    );
    expect(screen.getByTestId('t')).toHaveStyle({fontWeight: 'semibold', color: 'red', fontSize: 20});
    expect(screen.getByTestId('t').props.numberOfLines).toBe(2);
    expect(screen.getByTestId('date').props.children).toBe(new Date(2026, 0, 2).toLocaleDateString());
    expect(screen.getByTestId('time').props.children).toBe(new Date(2026, 0, 2, 13, 5).toLocaleTimeString());
    expect(screen.getByTestId('img')).toHaveStyle({fontSize: 30, color: 'blue'});
    await fireEvent.press(screen.getByTestId('press'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('asset')).toBeNull();
    expect(screen.getByText('Settings')).toBeOnTheScreen();
    expect(screen.getByText('Child')).toBeOnTheScreen();
    expect(screen.getByText('i')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('link'));
    expect(openURL).toHaveBeenCalledWith('https://expo.dev');
    expect(screen.getByText('Docs')).toBeOnTheScreen();
    openURL.mockRestore();
  });

  it('draws sections, forms, lists, grids and the grouping views', async () => {
    const onIsExpandedChange = vi.fn();
    await render(
      <ui.Form testID="form">
        <ui.Section title="General" footer={<ui.Text>Note</ui.Text>}>
          <ui.Text>Row</ui.Text>
        </ui.Section>
        <ui.Section header={<ui.Text>Advanced</ui.Text>} isExpanded={false} onIsExpandedChange={onIsExpandedChange}>
          <ui.Text>Hidden</ui.Text>
        </ui.Section>
        <ui.List selection={[1]} testID="list">
          <ui.List.ForEach>
            <ui.Text>Item</ui.Text>
          </ui.List.ForEach>
        </ui.List>
        <ui.ScrollView axes="horizontal" showsIndicators={false} testID="scroll">
          <ui.Grid verticalSpacing={2} horizontalSpacing={3} testID="grid">
            <ui.Grid.Row>
              <ui.Text>cell</ui.Text>
            </ui.Grid.Row>
          </ui.Grid>
        </ui.ScrollView>
        <ui.ScrollView testID="vertical">
          <ui.ControlGroup label="Group" systemImage="★" testID="cg">
            <ui.Text>c</ui.Text>
          </ui.ControlGroup>
        </ui.ScrollView>
        <ui.LabeledContent label="Key" testID="lc">
          <ui.Text>Value</ui.Text>
        </ui.LabeledContent>
        <ui.LabeledContent label={<ui.Text>Node</ui.Text>}>
          <ui.Text>V2</ui.Text>
        </ui.LabeledContent>
        <ui.ContentUnavailableView title="Nothing" systemImage="★" description="Add something" testID="empty"/>
        <ui.ContentUnavailableView/>
        <ui.DisclosureGroup label="More" isExpanded testID="dg">
          <ui.Text>Details</ui.Text>
        </ui.DisclosureGroup>
        <ui.DisclosureGroup>
          <ui.DisclosureGroup.Label>Labelled</ui.DisclosureGroup.Label>
          <ui.Text>D2</ui.Text>
        </ui.DisclosureGroup>
        <ui.NavigationStack path={['a']} onPathChange={() => {}} testID="stack">
          <ui.NavigationLink value="a" testID="link">
            <ui.Text>Go</ui.Text>
          </ui.NavigationLink>
          <ui.NavigationDestination value="a">
            <ui.Text>Pushed</ui.Text>
          </ui.NavigationDestination>
          <ui.Toolbar testID="toolbar">
            <ui.Text>Page</ui.Text>
            <ui.Toolbar.Content>
              <ui.Text>Tool</ui.Text>
            </ui.Toolbar.Content>
          </ui.Toolbar>
        </ui.NavigationStack>
      </ui.Form>,
    );
    for (const text of ['General', 'Row', 'Note', 'Advanced', 'Item', 'cell', 'Group', 'c', 'Key', 'Value', 'Node', 'V2', 'Nothing', 'Add something', 'More', 'Details', 'Labelled', 'Go', 'Page', 'Tool']) expect(screen.getByText(text)).toBeOnTheScreen();
    // A destination is pushed by SwiftUI's stack; nothing pushes here.
    expect(screen.queryByText('Pushed')).toBeNull();
    expect(screen.getByTestId('stack')).toBeOnTheScreen();
    expect(screen.getByTestId('link')).toHaveStyle({flexDirection: 'row'});
    expect(screen.getByTestId('toolbar')).toBeOnTheScreen();
    expect(screen.getByTestId('scroll').props.horizontal).toBe(true);
    expect(screen.getByTestId('vertical').props.horizontal).toBe(false);
    expect(screen.getByTestId('grid')).toHaveStyle({gap: 2});
  });

  it('decorates with masks, overlays, backgrounds and shapes, and says what is another platform\'s', async () => {
    forgetWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <>
        <ui.Mask testID="mask">
          <ui.Mask.Content>
            <ui.Circle/>
          </ui.Mask.Content>
          <ui.Text>masked</ui.Text>
        </ui.Mask>
        <ui.Overlay alignment="center" testID="overlay">
          <ui.Text>base</ui.Text>
          <ui.Overlay.Content>
            <ui.Text>top</ui.Text>
          </ui.Overlay.Content>
        </ui.Overlay>
        <ui.Background testID="bg">
          <ui.Background.Content>
            <ui.Rectangle modifiers={[foregroundColor('#123456')]} testID="rect"/>
          </ui.Background.Content>
          <ui.Text>front</ui.Text>
        </ui.Background>
        <ui.RoundedRectangle cornerRadius={6} testID="rounded"/>
        <ui.UnevenRoundedRectangle topLeadingRadius={1}/>
        <ui.ConcentricRectangle/>
        <ui.Ellipse testID="ellipse"/>
        <ui.Capsule/>
        <ui.Chart data={[]}/>
        <ui.AccessoryWidgetBackground/>
      </>,
    );
    for (const text of ['masked', 'base', 'top', 'front']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.getByTestId('rect')).toHaveStyle({backgroundColor: '#123456', borderRadius: 0});
    expect(screen.getByTestId('rounded')).toHaveStyle({borderRadius: 6});
    expect(screen.getByTestId('ellipse')).toHaveStyle({borderRadius: 9999});
    expect(ui.EdgeCornerStyle.fixed).toBe('fixed');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe('@expo/ui/swift-ui controls (windows)', () => {
  it('draws buttons and toggles as the kit\'s, with the style modifiers, roles, symbols and disabled state', async () => {
    const onPress = vi.fn();
    const onIsOnChange = vi.fn();
    await render(
      <>
        <ui.Button onPress={onPress} testID="plain">
          <ui.Text>Plain</ui.Text>
        </ui.Button>
        <ui.Button label="Delete" role="destructive" systemImage="★" modifiers={[buttonStyle('borderedProminent'), disabled()]} testID="delete"/>
        <ui.Button label="Edge" modifiers={[buttonStyle('bordered')]}/>
        <ui.Button label="Odd" modifiers={[buttonStyle('mystery')]}/>
        <ui.Toggle isOn label="Wi-Fi" onIsOnChange={onIsOnChange} testID="wifi"/>
        <ui.Toggle onIsOnChange={onIsOnChange} modifiers={[toggleStyle('button')]} testID="bold">
          <ui.Text>Bold</ui.Text>
        </ui.Toggle>
        <ui.Toggle/>
      </>,
    );
    expect(island(BUTTON, 0).props).toMatchObject({label: 'Plain', variant: 'text', buttonRole: 'default'});
    expect(island(BUTTON, 1).props).toMatchObject({label: 'Delete', variant: 'filled', buttonRole: 'destructive', disabled: true, glyph: '2605'});
    expect(island(BUTTON, 2).props.variant).toBe('outlined');
    expect(island(BUTTON, 3).props.variant).toBe('text');
    await fireEvent(screen.getByTestId('plain'), 'press');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(island(TOGGLE).props.value).toBe(true);
    await fireIsland(island(TOGGLE), 'valueChange', {value: false});
    expect(onIsOnChange).toHaveBeenCalledWith(false);
    expect(island(BUTTON, 4).props).toMatchObject({label: 'Bold', variant: 'outlined'});
    await fireEvent(screen.getByTestId('bold'), 'press');
    expect(onIsOnChange).toHaveBeenCalledWith(true);
    await fireIsland(island(TOGGLE, 1), 'valueChange', {value: true});
  });

  it('keeps a sync toggle\'s observable state, and draws sliders, pickers and steppers as the kit\'s', async () => {
    const onIsOnChangeSync = vi.fn();
    const onValueChange = vi.fn();
    const onEditingChanged = vi.fn();
    const onSelectionChange = vi.fn();
    const onStep = vi.fn();
    function Probe() {
      const isOn = ui.useNativeState(false);
      return <ui.SyncToggle isOn={isOn} label="Sync" onIsOnChangeSync={onIsOnChangeSync} testID="sync"/>;
    }
    await render(
      <>
        <Probe/>
        <ui.Slider value={0.3} min={0} max={1} step={0.1} label={<ui.Text>Volume</ui.Text>} onValueChange={onValueChange} onEditingChanged={onEditingChanged} testID="volume"/>
        <ui.Slider/>
        <ui.Picker label="Size" selection="m" onSelectionChange={onSelectionChange} testID="size">
          <ui.Text modifiers={[tag('s')]}>Small</ui.Text>
          <ui.Text modifiers={[tag('m')]}>Medium</ui.Text>
          <ui.Text>Large</ui.Text>
        </ui.Picker>
        <ui.Picker label={<ui.Text>Range</ui.Text>} selection={1} modifiers={[pickerStyle('segmented')]} testID="range">
          <ui.Text>Day</ui.Text>
          <ui.Text>Week</ui.Text>
        </ui.Picker>
        <ui.Stepper label="Copies" value={2} step={1} min={1} max={9} onValueChange={onStep} testID="copies"/>
      </>,
    );
    expect(island(TOGGLE).props.value).toBe(false);
    await fireIsland(island(TOGGLE), 'valueChange', {value: true});
    expect(onIsOnChangeSync).toHaveBeenCalledWith(true);
    expect(island(TOGGLE).props.value).toBe(true);
    expect(island(SLIDER).props).toMatchObject({value: 0.3, min: 0, max: 1, step: 0.1, label: 'Volume'});
    await fireIsland(island(SLIDER), 'valueChange', {value: 0.5});
    await fireIsland(island(SLIDER), 'slidingComplete', {value: 0.5});
    expect(onValueChange).toHaveBeenCalledWith(0.5);
    expect(onEditingChanged).toHaveBeenCalledWith(false);
    expect(island(SLIDER, 1).props.value).toBe(0);
    expect(JSON.parse(island(COMBO).props.options)).toEqual(['Small', 'Medium', 'Large']);
    expect(island(COMBO).props).toMatchObject({selectedIndex: 1, label: 'Size'});
    await fireIsland(island(COMBO), 'selectionChange', {index: 2});
    expect(onSelectionChange).toHaveBeenCalledWith(2);
    expect(JSON.parse(island(BAR).props.options)).toEqual(['Day', 'Week']);
    expect(island(BAR).props).toMatchObject({selectedIndex: 1, label: 'Range'});
    await fireIsland(island(BAR), 'selectionChange', {index: 0});
    expect(island(NUMBER).props.value).toBe(2);
    await fireIsland(island(NUMBER), 'valueChange', {value: 3});
    expect(onStep).toHaveBeenCalledWith(3);
  });

  it('draws the date picker, progress, gauge and colour picker as the kit\'s', async () => {
    const onDateChange = vi.fn();
    const onSelectionChange = vi.fn();
    await render(
      <>
        <ui.DatePicker title="Due" selection={new Date(2026, 5, 15, 12, 30)} range={{start: new Date(2026, 0, 1), end: new Date(2026, 11, 31)}} displayedComponents={['date', 'hourAndMinute']} onDateChange={onDateChange} testID="due"/>
        <ui.DatePicker displayedComponents={['hourAndMinute']} testID="at"/>
        <ui.DatePicker testID="on"/>
        <ui.ProgressView value={0.4} testID="bar"/>
        <ui.ProgressView modifiers={[progressViewStyle('circular')]} testID="ring">
          <ui.Text>Loading</ui.Text>
        </ui.ProgressView>
        <ui.Gauge value={0.4} min={0} max={1} currentValueLabel={<ui.Text>40%</ui.Text>} minimumValueLabel={<ui.Text>0</ui.Text>} maximumValueLabel={<ui.Text>1</ui.Text>} modifiers={[gaugeStyle('circularCapacity')]} testID="battery">
          <ui.Text>Battery</ui.Text>
        </ui.Gauge>
        <ui.Gauge value={0.5} modifiers={[gaugeStyle('mystery')]} testID="bare"/>
        <ui.ColorPicker selection="#ff0000" label="Color" onSelectionChange={onSelectionChange} supportsOpacity testID="accent"/>
        <ui.ColorPicker selection={null}/>
      </>,
    );
    expect(island(DATE).props).toMatchObject({date: '2026-06-15', minDate: '2026-01-01', maxDate: '2026-12-31', label: 'Due'});
    expect(island(TIME).props.time).toBe('12:30');
    expect(screen.getByTestId('at')).toBeOnTheScreen();
    expect(screen.getByTestId('on')).toBeOnTheScreen();
    expect(island(PROGRESS).props.value).toBe(0.4);
    expect(island(PROGRESS, 1).props.value).toBe(-1);
    expect(screen.getByText('Loading')).toBeOnTheScreen();
    expect(screen.getByTestId('battery').props.accessibilityValue).toMatchObject({now: 0.4, text: '40%'});
    expect(screen.getByTestId('bare')).toBeOnTheScreen();
    expect(island(COLOR).props).toMatchObject({label: 'Color', alpha: true});
    await fireIsland(island(DATE), 'dateChange', {date: '2026-07-01'});
    expect(onDateChange).toHaveBeenCalled();
  });

  it('draws text and secure fields as the kit\'s text box, over observable or plain text, with the ref', async () => {
    const onTextChange = vi.fn();
    const ref = createRef<ui.TextFieldRef>();
    function Probe() {
      const text = ui.useNativeState('hello');
      return <ui.TextField ref={ref} text={text} onTextChange={onTextChange} maxLength={20} axis="vertical" testID="field"/>;
    }
    await render(
      <>
        <Probe/>
        <ui.SecureField placeholder="PIN" testID="pin"/>
        <ui.SecureField>
          <ui.SecureField.Placeholder>Secret</ui.SecureField.Placeholder>
        </ui.SecureField>
        <ui.TextField>
          <ui.TextField.Placeholder>Type</ui.TextField.Placeholder>
        </ui.TextField>
      </>,
    );
    expect(island(BOX).props).toMatchObject({value: 'hello', maxLength: 20});
    await fireIsland(island(BOX), 'changeText', {text: 'hello!'});
    expect(onTextChange).toHaveBeenCalledWith('hello!');
    expect(island(BOX).props.value).toBe('hello!');
    await act(async () => ref.current?.setText('set'));
    expect(island(BOX).props.value).toBe('set');
    await act(async () => ref.current?.clear());
    expect(island(BOX).props.value).toBe('');
    await act(async () => ref.current?.focus());
    await act(async () => ref.current?.blur());
    await act(async () => ref.current?.setSelection(0, 0));
    expect(island(BOX, 1).props).toMatchObject({placeholder: 'PIN'});
    expect(island(BOX, 2).props.placeholder).toBe('Secret');
    expect(island(BOX, 3).props.placeholder).toBe('Type');
  });

  it('turns menu content into the kit\'s items: context menus and menus over buttons, toggles, dividers, sections, pickers', async () => {
    const onPress = vi.fn();
    const onToggle = vi.fn();
    const onSelectionChange = vi.fn();
    await render(
      <>
        <ui.ContextMenu testID="ctx">
          <ui.ContextMenu.Items>
            <ui.Button label="Copy" onPress={onPress}/>
            <ui.Button role="destructive" modifiers={[disabled()]}>
              <ui.Text>Delete</ui.Text>
            </ui.Button>
            <ui.Divider/>
            <ui.Toggle isOn label="Pinned" onIsOnChange={onToggle}/>
            <ui.Section title="More">
              <ui.Button label="Nested"/>
            </ui.Section>
            <ui.Picker selection="b" onSelectionChange={onSelectionChange}>
              <ui.Text modifiers={[tag('a')]}>A</ui.Text>
              <ui.Text modifiers={[tag('b')]}>B</ui.Text>
            </ui.Picker>
          </ui.ContextMenu.Items>
          <ui.ContextMenu.Trigger>
            <ui.Text>Target</ui.Text>
          </ui.ContextMenu.Trigger>
          <ui.ContextMenu.Preview>
            <ui.Text>Preview</ui.Text>
          </ui.ContextMenu.Preview>
        </ui.ContextMenu>
        <ui.Menu label="Actions" systemImage="★" testID="menu">
          <ui.Button label="One"/>
          <ui.Menu label="Sub">
            <ui.Button label="Two"/>
          </ui.Menu>
        </ui.Menu>
      </>,
    );
    expect(screen.getByText('Target')).toBeOnTheScreen();
    const items = JSON.parse(island(MENU).props.items) as {label: string; separator?: boolean; active?: boolean; destructive?: boolean; disabled?: boolean}[];
    expect(items.map(item => item.label)).toEqual(['Copy', 'Delete', 'Pinned', 'Nested', 'A', 'B']);
    expect(items[1]).toMatchObject({destructive: true, disabled: true, separator: false});
    expect(items[2]).toMatchObject({separator: true, active: true});
    expect(items[3].separator).toBe(true);
    expect(items[4].separator).toBe(false);
    expect(items[5].active).toBe(true);
    await fireIsland(island(MENU), 'select', {index: 2});
    expect(onToggle).toHaveBeenCalledWith(false);
    await fireIsland(island(MENU), 'select', {index: 4});
    expect(onSelectionChange).toHaveBeenCalledWith('a');
    await fireIsland(island(MENU), 'select', {index: 0});
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(island(BUTTON).props.label).toBe('Actions');
  });

  it('presents sheets, alerts, confirmation dialogs, popovers and tabs through the kit', async () => {
    const onIsPresentedChange = vi.fn();
    const onDismiss = vi.fn();
    const onOk = vi.fn();
    const onSelectionChange = vi.fn();
    await render(
      <>
        <ui.BottomSheet isPresented onIsPresentedChange={onIsPresentedChange} onDismiss={onDismiss} anchor={<ui.Text>Anchor</ui.Text>} testID="sheet">
          <ui.Text>Sheet body</ui.Text>
        </ui.BottomSheet>
        <ui.Alert title="Delete?" isPresented onIsPresentedChange={onIsPresentedChange} testID="alert">
          <ui.Alert.Trigger>
            <ui.Text>Open</ui.Text>
          </ui.Alert.Trigger>
          <ui.Alert.Message>
            <ui.Text>Gone for good.</ui.Text>
          </ui.Alert.Message>
          <ui.Alert.Actions>
            <ui.Button label="Cancel" role="cancel"/>
            <ui.Button label="Delete" role="destructive" onPress={onOk}/>
            <ui.Button label="Later"/>
          </ui.Alert.Actions>
        </ui.Alert>
        <ui.ConfirmationDialog title="Sure?">
          <ui.ConfirmationDialog.Actions>
            <ui.Button label="Yes"/>
          </ui.ConfirmationDialog.Actions>
        </ui.ConfirmationDialog>
        <ui.Popover isPresented testID="pop">
          <ui.Popover.Trigger>
            <ui.Text>Info</ui.Text>
          </ui.Popover.Trigger>
          <ui.Popover.Content>
            <ui.Text>Shown</ui.Text>
          </ui.Popover.Content>
        </ui.Popover>
        <ui.Popover>
          <ui.Popover.Content>
            <ui.Text>Hidden</ui.Text>
          </ui.Popover.Content>
        </ui.Popover>
        <ui.TabView defaultSelection="b" onSelectionChange={onSelectionChange} testID="tabs">
          <ui.TabView.Tab value="a" label="First">
            <ui.Text>Tab A</ui.Text>
          </ui.TabView.Tab>
          <ui.TabView.Tab value="b" systemImage="★">
            <ui.Text>Tab B</ui.Text>
          </ui.TabView.Tab>
        </ui.TabView>
        <ui.SwipeActions edge="trailing" testID="swipe">
          <ui.Text>Row</ui.Text>
          <ui.SwipeActions.Actions>
            <ui.Button label="Archive"/>
          </ui.SwipeActions.Actions>
        </ui.SwipeActions>
      </>,
    );
    for (const text of ['Anchor', 'Sheet body', 'Open', 'Info', 'Shown', 'Tab B', 'Row']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.queryByText('Tab A')).toBeNull();
    expect(screen.queryByText('Archive')).toBeNull();
    const actions = JSON.parse(island(DIALOG).props.actions) as {label: string; role: string}[];
    expect(actions).toEqual([{label: 'Cancel', role: 'cancel'}, {label: 'Delete', role: 'destructive'}, {label: 'Later', role: 'default'}]);
    expect(island(DIALOG).props.open).toBe(true);
    await fireIsland(island(DIALOG), 'close', {index: 1});
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onIsPresentedChange).toHaveBeenCalledWith(false);
    await fireEvent(screen.getByTestId('sheet'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireEvent(island(BUTTON, 0), 'press');
    expect(onSelectionChange).toHaveBeenCalledWith('a');
    expect(screen.getByText('Tab A')).toBeOnTheScreen();
  });

  it('shares through the system share sheet, and runs an animation\'s body at once', async () => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    await render(
      <>
        <ui.ShareLink item="https://expo.dev" subject="Expo" testID="share">
          <ui.Text>Share it</ui.Text>
        </ui.ShareLink>
        <ui.ShareLink getItemAsync={async () => 'later'} message="Look" testID="later"/>
        <ui.ShareLink message="Only" testID="only"/>
      </>,
    );
    expect(island(BUTTON, 0).props.label).toBe('Share it');
    expect(island(BUTTON, 1).props.label).toBe('Share');
    await fireEvent(screen.getByTestId('share'), 'press');
    await fireEvent(screen.getByTestId('later'), 'press');
    await fireEvent(screen.getByTestId('only'), 'press');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(share.mock.calls.map(call => call[0])).toEqual([
      {message: 'https://expo.dev', title: 'Expo'},
      {message: 'Look\nlater', title: undefined},
      {message: 'Only', title: undefined},
    ]);
    share.mockRejectedValueOnce(new Error('no'));
    await fireEvent(screen.getByTestId('share'), 'press');
    share.mockRestore();
    const body = vi.fn();
    const done = vi.fn();
    ui.withAnimation({type: 'default'}, body, 'removed', done);
    ui.withAnimation(body);
    expect(body).toHaveBeenCalledTimes(2);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
