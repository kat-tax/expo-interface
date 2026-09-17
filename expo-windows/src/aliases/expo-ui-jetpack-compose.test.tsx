import {createRef} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {fireIsland, island} from '../../../src/__tests__/windows';
import * as ui from './expo-ui-jetpack-compose';
import {clickable, paddingAll} from './expo-ui-jetpack-compose-modifiers';
import {disabled} from './expo-ui-swift-ui-modifiers';

const BUTTON = 'ExpoInterfaceButton';
const TOGGLE = 'ExpoInterfaceToggleSwitch';
const SLIDER = 'ExpoInterfaceSlider';
const CHECK = 'ExpoInterfaceCheckBox';
const BAR = 'ExpoInterfaceSelectorBar';
const DATE = 'ExpoInterfaceDatePicker';
const TIME = 'ExpoInterfaceTimePicker';
const PROGRESS = 'ExpoInterfaceProgress';
const BOX = 'ExpoInterfaceTextBox';
const DIALOG = 'ExpoInterfaceContentDialog';
const INFO = 'ExpoInterfaceInfoBar';

describe('@expo/ui/jetpack-compose layout (windows)', () => {
  it('lays rows, columns, boxes and flow rows out as flex, with the arrangements and modifiers', async () => {
    const onClick = vi.fn();
    await render(
      <ui.Host testID="host" modifiers={[paddingAll(4)]}>
        <ui.Row horizontalArrangement="spaceBetween" verticalAlignment="bottom" testID="row">
          <ui.Text>a</ui.Text>
          <ui.Spacer testID="sp"/>
        </ui.Row>
        <ui.Column verticalArrangement={{spacedBy: 6}} horizontalAlignment="center" modifiers={[clickable(onClick)]} testID="col">
          <ui.Text>b</ui.Text>
        </ui.Column>
        <ui.Box contentAlignment="bottomEnd" testID="box">
          <ui.Text>under</ui.Text>
          <ui.Text>over</ui.Text>
        </ui.Box>
        <ui.FlowRow testID="flow">
          <ui.Text>f</ui.Text>
        </ui.FlowRow>
        <ui.HorizontalDivider testID="hd"/>
        <ui.VerticalDivider testID="vd"/>
        <ui.LazyColumn contentPadding={{start: 1, top: 2, end: 3, bottom: 4}} testID="lc">
          <ui.Text>lc</ui.Text>
        </ui.LazyColumn>
        <ui.LazyRow testID="lr">
          <ui.Text>lr</ui.Text>
        </ui.LazyRow>
        <ui.Surface testID="surface">
          <ui.RNHostView testID="rn">
            <ui.Text>rn</ui.Text>
          </ui.RNHostView>
        </ui.Surface>
        <ui.AnimatedVisibility visible={false}>
          <ui.Text>gone</ui.Text>
        </ui.AnimatedVisibility>
        <ui.AnimatedVisibility>
          <ui.Text>here</ui.Text>
        </ui.AnimatedVisibility>
        <ui.PullToRefreshBox testID="ptr">
          <ui.Text>ptr</ui.Text>
        </ui.PullToRefreshBox>
      </ui.Host>,
    );
    expect(screen.getByTestId('host')).toHaveStyle({padding: 4});
    expect(screen.getByTestId('row')).toHaveStyle({flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'});
    expect(screen.getByTestId('col')).toHaveStyle({flexDirection: 'column', gap: 6, alignItems: 'center'});
    expect(screen.getByTestId('box')).toHaveStyle({justifyContent: 'flex-end', alignItems: 'flex-end'});
    expect(screen.getByTestId('flow')).toHaveStyle({flexWrap: 'wrap'});
    expect(screen.getByTestId('lc').props.contentContainerStyle).toEqual({paddingLeft: 1, paddingTop: 2, paddingRight: 3, paddingBottom: 4});
    expect(screen.getByTestId('lr').props.horizontal).toBe(true);
    await fireEvent.press(screen.getByTestId('col'));
    expect(onClick).toHaveBeenCalledTimes(1);
    for (const text of ['under', 'over', 'f', 'lc', 'lr', 'rn', 'here', 'ptr']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.queryByText('gone')).toBeNull();
    for (const [name, make] of Object.entries(ui.EnterTransition)) expect(make()).toEqual({type: name});
    for (const [name, make] of Object.entries(ui.ExitTransition)) expect(make()).toEqual({type: name});
  });

  it('draws text with its style, icons and images', async () => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    await render(
      <>
        <ui.Text color="red" maxLines={1} style={{typography: 'titleLarge', fontWeight: '700', fontStyle: 'italic', fontFamily: 'default', textDecoration: 'underline', letterSpacing: 1, textAlign: 'start', lineHeight: 20, background: '#eee'}} testID="t">
          styled
        </ui.Text>
        <ui.Text style={{fontSize: 9, textDecoration: 'lineThrough', textAlign: 'end', fontFamily: 'serif'}} testID="u">
          more
        </ui.Text>
        <ui.Text style={{textAlign: 'center'}} testID="v">
          plain
        </ui.Text>
        <ui.Icon source={{uri: 'https://x/i.png'}} tint="blue" size={32} contentDescription="icon" testID="icon"/>
        <ui.Image source={{uri: 'https://x/p.png'}} contentScale="crop" tint="red" alpha={0.5} contentDescription="pic" onLoad={onLoad} onError={onError} testID="img"/>
        <ui.Image source={{uri: 'https://x/q.png'}} testID="img2"/>
      </>,
    );
    expect(screen.getByTestId('t')).toHaveStyle({color: 'red', fontSize: 22, fontWeight: '700', fontStyle: 'italic', textDecorationLine: 'underline', letterSpacing: 1, textAlign: 'left', lineHeight: 20, backgroundColor: '#eee'});
    expect(screen.getByTestId('t').props.numberOfLines).toBe(1);
    expect(screen.getByTestId('u')).toHaveStyle({fontSize: 9, textDecorationLine: 'line-through', textAlign: 'right', fontFamily: 'serif'});
    expect(screen.getByTestId('v')).toHaveStyle({textAlign: 'center'});
    expect(screen.getByTestId('icon')).toHaveStyle({width: 32, height: 32, tintColor: 'blue'});
    expect(screen.getByTestId('img').props.resizeMode).toBe('cover');
    await fireEvent(screen.getByTestId('img'), 'load');
    await fireEvent(screen.getByTestId('img'), 'error', {nativeEvent: {error: 'nope'}});
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('nope');
    expect(screen.getByTestId('img2').props.resizeMode).toBe('contain');
  });
});

describe('@expo/ui/jetpack-compose controls (windows)', () => {
  it('draws the buttons as the kit\'s, plain and toggling, and the icon and floating action buttons', async () => {
    const onClick = vi.fn();
    const onCheckedChange = vi.fn();
    await render(
      <>
        <ui.Button onClick={onClick} colors={{containerColor: '#123456'}} testID="b">
          <ui.Text>Save</ui.Text>
        </ui.Button>
        <ui.FilledTonalButton enabled={false}>
          <ui.Text>Tonal</ui.Text>
        </ui.FilledTonalButton>
        <ui.OutlinedButton modifiers={[disabled()]}>
          <ui.Text>Outlined</ui.Text>
        </ui.OutlinedButton>
        <ui.ElevatedButton>
          <ui.Text>Elevated</ui.Text>
        </ui.ElevatedButton>
        <ui.TextButton>
          <ui.Text>Text</ui.Text>
        </ui.TextButton>
        <ui.ToggleButton checked onCheckedChange={onCheckedChange} testID="tb">
          <ui.Text>Bold</ui.Text>
        </ui.ToggleButton>
        <ui.IconToggleButton checked={false}>
          <ui.Text>I</ui.Text>
        </ui.IconToggleButton>
        <ui.FilledIconToggleButton checked>
          <ui.Text>F</ui.Text>
        </ui.FilledIconToggleButton>
        <ui.OutlinedIconToggleButton checked>
          <ui.Text>O</ui.Text>
        </ui.OutlinedIconToggleButton>
        <ui.IconButton onClick={onClick} testID="ib">
          <ui.Text>icon</ui.Text>
        </ui.IconButton>
        <ui.FilledIconButton enabled={false}>
          <ui.Text>fi</ui.Text>
        </ui.FilledIconButton>
        <ui.FilledTonalIconButton>
          <ui.Text>ft</ui.Text>
        </ui.FilledTonalIconButton>
        <ui.OutlinedIconButton testID="oib">
          <ui.Text>oi</ui.Text>
        </ui.OutlinedIconButton>
        <ui.FloatingActionButton onClick={onClick} testID="fab">
          <ui.FloatingActionButton.Icon>
            <ui.Text>+</ui.Text>
          </ui.FloatingActionButton.Icon>
        </ui.FloatingActionButton>
        <ui.ExtendedFloatingActionButton expanded>
          <ui.ExtendedFloatingActionButton.Icon>
            <ui.Text>+</ui.Text>
          </ui.ExtendedFloatingActionButton.Icon>
          <ui.ExtendedFloatingActionButton.Text>Compose</ui.ExtendedFloatingActionButton.Text>
        </ui.ExtendedFloatingActionButton>
        <ui.SmallFloatingActionButton>
          <ui.Text>s</ui.Text>
        </ui.SmallFloatingActionButton>
        <ui.LargeFloatingActionButton/>
      </>,
    );
    expect(island(BUTTON, 0).props).toMatchObject({label: 'Save', variant: 'filled'});
    expect(island(BUTTON, 1).props).toMatchObject({label: 'Tonal', disabled: true});
    expect(island(BUTTON, 2).props).toMatchObject({label: 'Outlined', variant: 'outlined', disabled: true});
    expect(island(BUTTON, 3).props.variant).toBe('outlined');
    expect(island(BUTTON, 4).props.variant).toBe('text');
    expect(island(BUTTON, 5).props).toMatchObject({label: 'Bold', variant: 'filled'});
    expect(island(BUTTON, 6).props.variant).toBe('outlined');
    await fireEvent(screen.getByTestId('b'), 'press');
    await fireEvent(screen.getByTestId('tb'), 'press');
    await fireEvent.press(screen.getByTestId('ib'));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('oib')).toHaveStyle({borderWidth: expect.any(Number)});
    expect(screen.getByText('Compose')).toBeOnTheScreen();
    expect(screen.getByTestId('fab')).toBeOnTheScreen();
    expect(ui.ToggleButton.DefaultIconSize).toBe(18);
    expect(ui.transformButtonProps({onClick, enabled: false})).toMatchObject({enabled: false, onButtonPressed: onClick});
    expect(ui.transformButtonProps({})).toMatchObject({enabled: true});
    const transformed = ui.transformToggleButtonProps({checked: true, onCheckedChange});
    (transformed.onCheckedChange as (event: {nativeEvent: {checked: boolean}}) => void)({nativeEvent: {checked: true}});
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(ui.transformToggleButtonProps({checked: false}).onCheckedChange).toBeUndefined();
  });

  it('draws switches, checkboxes, radio buttons and sliders as the kit\'s', async () => {
    const onCheckedChange = vi.fn();
    const onClick = vi.fn();
    const onValueChange = vi.fn();
    const onValueChangeFinished = vi.fn();
    const onCheckedChangeSync = vi.fn();
    function Probe() {
      const isOn = ui.useNativeState(true);
      return <ui.SyncSwitch isOn={isOn} onCheckedChangeSync={onCheckedChangeSync} testID="sync"/>;
    }
    await render(
      <>
        <ui.Switch value onCheckedChange={onCheckedChange} testID="sw">
          <ui.Switch.ThumbContent>
            <ui.Text>t</ui.Text>
          </ui.Switch.ThumbContent>
        </ui.Switch>
        <ui.Switch value={false} enabled={false}/>
        <Probe/>
        <ui.Checkbox value onCheckedChange={onCheckedChange} testID="cb"/>
        <ui.Checkbox value={false} enabled={false}/>
        <ui.TriStateCheckbox state="on" onClick={onClick} testID="tri"/>
        <ui.TriStateCheckbox state="indeterminate"/>
        <ui.RadioButton selected onClick={onClick} testID="radio"/>
        <ui.RadioButton selected={false}/>
        <ui.Slider value={0.5} steps={4} min={0} max={10} onValueChange={onValueChange} onValueChangeFinished={onValueChangeFinished} testID="sl">
          <ui.Slider.Thumb>
            <ui.Text>o</ui.Text>
          </ui.Slider.Thumb>
          <ui.Slider.Track>
            <ui.Text>-</ui.Text>
          </ui.Slider.Track>
        </ui.Slider>
        <ui.Slider enabled={false}/>
      </>,
    );
    expect(island(TOGGLE, 0).props.value).toBe(true);
    expect(island(TOGGLE, 1).props).toMatchObject({value: false, disabled: true});
    expect(island(TOGGLE, 2).props.value).toBe(true);
    await fireIsland(island(TOGGLE, 0), 'valueChange', {value: false});
    await fireIsland(island(TOGGLE, 2), 'valueChange', {value: false});
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(onCheckedChangeSync).toHaveBeenCalledWith(false);
    expect(island(TOGGLE, 2).props.value).toBe(false);
    await fireIsland(island(TOGGLE, 1), 'valueChange', {value: true});
    expect(island(CHECK, 0).props.value).toBe(true);
    expect(island(CHECK, 1).props.disabled).toBe(true);
    expect(island(CHECK, 2).props.value).toBe(true);
    expect(island(CHECK, 3).props.value).toBe(false);
    await fireIsland(island(CHECK, 0), 'valueChange', {value: false});
    await fireIsland(island(CHECK, 1), 'valueChange', {value: true});
    await fireIsland(island(CHECK, 2), 'valueChange', {value: false});
    await fireIsland(island(CHECK, 3), 'valueChange', {value: true});
    expect(onClick).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('radio'));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('radio').props.accessibilityState).toEqual({selected: true});
    expect(island(SLIDER, 0).props).toMatchObject({value: 0.5, min: 0, max: 10, step: 2});
    await fireIsland(island(SLIDER, 0), 'valueChange', {value: 4});
    await fireIsland(island(SLIDER, 0), 'slidingComplete', {value: 4});
    expect(onValueChange).toHaveBeenCalledWith(4);
    expect(onValueChangeFinished).toHaveBeenCalledTimes(1);
    expect(island(SLIDER, 1).props).toMatchObject({disabled: true, step: 0});
    await fireIsland(island(SLIDER, 1), 'valueChange', {value: 0.1});
  });

  it('draws the date pickers, progress indicators, loading indicators and text fields as the kit\'s', async () => {
    const onDateSelected = vi.fn();
    const onValueChange = vi.fn();
    const onDone = vi.fn();
    const onSearch = vi.fn();
    const ref = createRef<ui.TextFieldRef>();
    function Probe() {
      const value = ui.useNativeState('typed');
      return <ui.TextField ref={ref} value={value} onValueChange={onValueChange} label={<ui.Text>Name</ui.Text>} keyboardOptions={{keyboardType: 'email', capitalization: 'none', imeAction: 'search'}} keyboardActions={{onSearch, onDone}} testID="field"/>;
    }
    await render(
      <>
        <ui.DateTimePicker initialDate="2026-06-15T12:30:00" onDateSelected={onDateSelected} displayedComponents="dateAndTime" selectableDates={{start: new Date(2026, 0, 1)}} testID="dt"/>
        <ui.DatePickerDialog displayedComponents={"unknown" as never} testID="dd"/>
        <ui.TimePickerDialog initialDate={null} testID="td"/>
        <ui.LinearProgressIndicator progress={0.4} color="red" trackColor="pink" testID="lp"/>
        <ui.CircularProgressIndicator strokeWidth={4} testID="cp"/>
        <ui.LinearWavyProgressIndicator progress={null}/>
        <ui.CircularWavyProgressIndicator progress={0.1}/>
        <ui.LoadingIndicator color="green" testID="li"/>
        <ui.ContainedLoadingIndicator/>
        <Probe/>
        <ui.OutlinedTextField defaultValue="d" enabled={false} placeholder="P" visualTransformation="password" singleLine={false} maxLength={3} keyboardOptions={{keyboardType: 'mystery', imeAction: 'go'}} keyboardActions={{onDone}} testID="outlined"/>
        <ui.BasicTextField readOnly maxLines={3} keyboardOptions={{imeAction: 'done'}} keyboardActions={{onDone}} testID="basic"/>
        <ui.BasicTextField keyboardActions={{}}/>
      </>,
    );
    expect(island(DATE, 0).props).toMatchObject({date: '2026-06-15', minDate: '2026-01-01'});
    expect(island(TIME, 0).props.time).toBe('12:30');
    await fireIsland(island(DATE, 0), 'dateChange', {date: '2026-07-01'});
    expect(onDateSelected).toHaveBeenCalled();
    expect(screen.getByTestId('dd')).toBeOnTheScreen();
    expect(screen.getByTestId('td')).toBeOnTheScreen();
    expect(island(PROGRESS, 0).props).toMatchObject({value: 0.4});
    expect(island(PROGRESS, 1).props.value).toBe(-1);
    expect(island(PROGRESS, 2).props.value).toBe(-1);
    expect(screen.getByTestId('li')).toBeOnTheScreen();
    expect(island(BOX, 0).props).toMatchObject({value: 'typed', placeholder: 'Name'});
    await fireIsland(island(BOX, 0), 'changeText', {text: 'typed!'});
    expect(onValueChange).toHaveBeenCalledWith('typed!');
    await fireIsland(island(BOX, 0), 'submit', {text: 'typed!'});
    expect(onSearch).toHaveBeenCalledWith('typed!');
    await act(async () => ref.current?.setText('again'));
    expect(island(BOX, 0).props.value).toBe('again');
    await act(async () => ref.current?.clear());
    await act(async () => ref.current?.focus());
    await act(async () => ref.current?.blur());
    await act(async () => ref.current?.setSelection(0, 1));
    expect(island(BOX, 1).props).toMatchObject({value: 'd', disabled: true, placeholder: 'P', maxLength: 3});
    await fireIsland(island(BOX, 1), 'submit', {text: 'd'});
    expect(onDone).toHaveBeenCalledWith('d');
    expect(island(BOX, 2).props.disabled).toBe(true);
    await fireIsland(island(BOX, 2), 'submit', {text: ''});
    await fireIsland(island(BOX, 3), 'submit', {text: ''});
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it('draws segmented button rows as the kit\'s selector bar, single and multiple choice', async () => {
    const onClick = vi.fn();
    const onCheckedChange = vi.fn();
    await render(
      <>
        <ui.SingleChoiceSegmentedButtonRow testID="single">
          <ui.SegmentedButton selected={false} onClick={onClick}>
            <ui.SegmentedButton.Label>
              <ui.Text>Day</ui.Text>
            </ui.SegmentedButton.Label>
          </ui.SegmentedButton>
          <ui.SegmentedButton selected onClick={onClick}>
            <ui.Text>Week</ui.Text>
          </ui.SegmentedButton>
        </ui.SingleChoiceSegmentedButtonRow>
        <ui.MultiChoiceSegmentedButtonRow modifiers={[disabled()]} testID="multi">
          <ui.SegmentedButton checked onCheckedChange={onCheckedChange}>
            <ui.Text>Bold</ui.Text>
          </ui.SegmentedButton>
        </ui.MultiChoiceSegmentedButtonRow>
        <ui.SegmentedButton/>
      </>,
    );
    expect(JSON.parse(island(BAR, 0).props.options)).toEqual(['Day', 'Week']);
    expect(island(BAR, 0).props.selectedIndex).toBe(1);
    await fireIsland(island(BAR, 0), 'selectionChange', {index: 0});
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(island(BAR, 1).props.disabled).toBe(true);
    await fireIsland(island(BAR, 1), 'selectionChange', {index: 0});
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    await fireIsland(island(BAR, 1), 'selectionChange', {index: 5});
  });

  it('presents sheets, dropdown menus and dialogs through the kit', async () => {
    const onDismissRequest = vi.fn();
    const onItem = vi.fn();
    const onConfirm = vi.fn();
    const sheet = createRef<ui.ModalBottomSheetRef>();
    await render(
      <>
        <ui.ModalBottomSheet ref={sheet} onDismissRequest={onDismissRequest} testID="sheet">
          <ui.ModalBottomSheet.DragHandle/>
          <ui.Text>Sheet body</ui.Text>
        </ui.ModalBottomSheet>
        <ui.DropdownMenu expanded onDismissRequest={onDismissRequest} testID="menu">
          <ui.DropdownMenu.Trigger>
            <ui.Text>Open</ui.Text>
          </ui.DropdownMenu.Trigger>
          <ui.DropdownMenu.Items>
            <ui.DropdownMenuItem text="First" onClick={onItem}/>
            <ui.DropdownMenuItem enabled={false}>
              <ui.Text>Second</ui.Text>
            </ui.DropdownMenuItem>
          </ui.DropdownMenu.Items>
          <ui.DropdownMenu.Preview>
            <ui.Text>Preview</ui.Text>
          </ui.DropdownMenu.Preview>
        </ui.DropdownMenu>
        <ui.DropdownMenu>
          <ui.DropdownMenu.Items>
            <ui.DropdownMenuItem text="Hidden"/>
          </ui.DropdownMenu.Items>
        </ui.DropdownMenu>
        <ui.ExposedDropdownMenuBox testID="exposed">
          <ui.ExposedDropdownMenu>
            <ui.Text>exposed</ui.Text>
          </ui.ExposedDropdownMenu>
        </ui.ExposedDropdownMenuBox>
        <ui.AlertDialog onDismissRequest={onDismissRequest} testID="dialog">
          <ui.AlertDialog.Icon>
            <ui.Text>!</ui.Text>
          </ui.AlertDialog.Icon>
          <ui.AlertDialog.Title>
            <ui.Text>Delete?</ui.Text>
          </ui.AlertDialog.Title>
          <ui.AlertDialog.Text>
            <ui.Text>Gone for good.</ui.Text>
          </ui.AlertDialog.Text>
          <ui.AlertDialog.ConfirmButton>
            <ui.TextButton onClick={onConfirm}>
              <ui.Text>Delete</ui.Text>
            </ui.TextButton>
          </ui.AlertDialog.ConfirmButton>
          <ui.AlertDialog.DismissButton>
            <ui.TextButton>
              <ui.Text>Keep</ui.Text>
            </ui.TextButton>
          </ui.AlertDialog.DismissButton>
        </ui.AlertDialog>
        <ui.AlertDialog/>
        <ui.BasicAlertDialog onDismissRequest={onDismissRequest}>
          <ui.Text>Basic</ui.Text>
        </ui.BasicAlertDialog>
        <ui.BasicAlertDialog/>
      </>,
    );
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    await act(async () => sheet.current?.hide());
    expect(onDismissRequest).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Sheet body')).toBeNull();
    await act(async () => sheet.current?.expand());
    await act(async () => sheet.current?.partialExpand());
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    expect(screen.getByText('Open')).toBeOnTheScreen();
    expect(screen.getByText('First')).toBeOnTheScreen();
    expect(screen.queryByText('Hidden')).toBeNull();
    await fireEvent.press(screen.getByText('First'));
    expect(onItem).toHaveBeenCalledTimes(1);
    expect(onDismissRequest).toHaveBeenCalledTimes(2);
    expect(screen.getByText('exposed')).toBeOnTheScreen();
    const actions = JSON.parse(island(DIALOG, 0).props.actions) as {label: string; role: string}[];
    expect(actions).toEqual([{label: 'Keep', role: 'cancel'}, {label: 'Delete', role: 'default'}]);
    await fireIsland(island(DIALOG, 0), 'close', {index: 1});
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDismissRequest).toHaveBeenCalledTimes(3);
    expect(island(DIALOG, 1).props.open).toBe(true);
    expect(screen.getByText('Basic')).toBeOnTheScreen();
    await fireIsland(island(DIALOG, 2), 'close', {index: -1});
    await fireIsland(island(DIALOG, 3), 'close', {index: -1});
  });

  it('draws cards, chips, badges, list items, tooltips, snackbars, search bars and the rest', async () => {
    const onClick = vi.fn();
    const onSearch = vi.fn();
    const onQueryChange = vi.fn();
    const host = createRef<ui.SnackbarHostRef>();
    const tooltip = createRef<ui.TooltipBoxRef>();
    const pager = createRef<ui.HorizontalPagerHandle>();
    await render(
      <>
        <ui.Card testID="card">
          <ui.Text>Card</ui.Text>
        </ui.Card>
        <ui.ElevatedCard>
          <ui.Text>E</ui.Text>
        </ui.ElevatedCard>
        <ui.OutlinedCard>
          <ui.Text>O</ui.Text>
        </ui.OutlinedCard>
        <ui.AssistChip onClick={onClick} testID="assist">
          <ui.AssistChip.Label>
            <ui.Text>Assist</ui.Text>
          </ui.AssistChip.Label>
          <ui.AssistChip.LeadingIcon>
            <ui.Text>i</ui.Text>
          </ui.AssistChip.LeadingIcon>
        </ui.AssistChip>
        <ui.FilterChip selected>
          <ui.Text>Filter</ui.Text>
        </ui.FilterChip>
        <ui.InputChip enabled={false}>
          <ui.InputChip.Label>
            <ui.Text>Input</ui.Text>
          </ui.InputChip.Label>
        </ui.InputChip>
        <ui.SuggestionChip>
          <ui.Text>Suggest</ui.Text>
        </ui.SuggestionChip>
        <ui.Badge testID="badge">3</ui.Badge>
        <ui.Badge/>
        <ui.BadgedBox testID="bb">
          <ui.Text>Mail</ui.Text>
          <ui.BadgedBox.Badge>
            <ui.Badge>9</ui.Badge>
          </ui.BadgedBox.Badge>
        </ui.BadgedBox>
        <ui.ListItem modifiers={[clickable(onClick)]} testID="li">
          <ui.ListItem.OverlineContent>
            <ui.Text>Over</ui.Text>
          </ui.ListItem.OverlineContent>
          <ui.ListItem.HeadlineContent>
            <ui.Text>Head</ui.Text>
          </ui.ListItem.HeadlineContent>
          <ui.ListItem.SupportingContent>
            <ui.Text>Support</ui.Text>
          </ui.ListItem.SupportingContent>
          <ui.ListItem.LeadingContent>
            <ui.Text>L</ui.Text>
          </ui.ListItem.LeadingContent>
          <ui.ListItem.TrailingContent>
            <ui.Text>T</ui.Text>
          </ui.ListItem.TrailingContent>
        </ui.ListItem>
        <ui.ListItem>
          <ui.Text>Bare</ui.Text>
        </ui.ListItem>
        <ui.TooltipBox ref={tooltip} testID="tip">
          <ui.TooltipBox.PlainTooltip>
            <ui.Text>Plain tip</ui.Text>
          </ui.TooltipBox.PlainTooltip>
          <ui.Text>Hover me</ui.Text>
        </ui.TooltipBox>
        <ui.TooltipBox>
          <ui.TooltipBox.RichTooltip>
            <ui.TooltipBox.RichTooltip.Title>
              <ui.Text>Rich</ui.Text>
            </ui.TooltipBox.RichTooltip.Title>
            <ui.TooltipBox.RichTooltip.Text>
              <ui.Text>Rich tip</ui.Text>
            </ui.TooltipBox.RichTooltip.Text>
            <ui.TooltipBox.RichTooltip.Action>
              <ui.Text>Go</ui.Text>
            </ui.TooltipBox.RichTooltip.Action>
          </ui.TooltipBox.RichTooltip>
          <ui.Text>Rich target</ui.Text>
        </ui.TooltipBox>
        <ui.SnackbarHost ref={host} testID="snack">
          <ui.Text>Page</ui.Text>
        </ui.SnackbarHost>
        <ui.Snackbar/>
        <ui.SearchBar onSearch={onSearch} testID="search">
          <ui.SearchBar.Placeholder>
            <ui.Text>Find</ui.Text>
          </ui.SearchBar.Placeholder>
          <ui.SearchBar.ExpandedFullScreenSearchBar>
            <ui.Text>Results</ui.Text>
          </ui.SearchBar.ExpandedFullScreenSearchBar>
        </ui.SearchBar>
        <ui.DockedSearchBar onQueryChange={onQueryChange} testID="docked">
          <ui.DockedSearchBar.LeadingIcon>
            <ui.Text>q</ui.Text>
          </ui.DockedSearchBar.LeadingIcon>
          <ui.DockedSearchBar.Placeholder>
            <ui.Text>Docked</ui.Text>
          </ui.DockedSearchBar.Placeholder>
        </ui.DockedSearchBar>
        <ui.HorizontalPager ref={pager} testID="pager">
          <ui.Text>Page one</ui.Text>
          <ui.Text>Page two</ui.Text>
        </ui.HorizontalPager>
        <ui.HorizontalCenteredHeroCarousel testID="c1">
          <ui.Text>c1</ui.Text>
        </ui.HorizontalCenteredHeroCarousel>
        <ui.HorizontalMultiBrowseCarousel>
          <ui.Text>c2</ui.Text>
        </ui.HorizontalMultiBrowseCarousel>
        <ui.HorizontalUncontainedCarousel>
          <ui.Text>c3</ui.Text>
        </ui.HorizontalUncontainedCarousel>
        <ui.HorizontalFloatingToolbar testID="toolbar">
          <ui.HorizontalFloatingToolbar.FloatingActionButton onClick={onClick}>
            <ui.Text>fab</ui.Text>
          </ui.HorizontalFloatingToolbar.FloatingActionButton>
        </ui.HorizontalFloatingToolbar>
        <ui.NavigationBar selected={0} onClick={onClick} testID="nav">
          <ui.NavigationBarItem>
            <ui.NavigationBarItem.Icon>
              <ui.Text>h</ui.Text>
            </ui.NavigationBarItem.Icon>
            <ui.NavigationBarItem.Label>Home</ui.NavigationBarItem.Label>
          </ui.NavigationBarItem>
          <ui.NavigationBarItem>
            <ui.Text>Away</ui.Text>
          </ui.NavigationBarItem>
        </ui.NavigationBar>
        <ui.Shape type="circle" testID="shape"/>
      </>,
    );
    for (const text of ['Card', 'E', 'O', 'Mail', 'Head', 'Support', 'L', 'T', 'Bare', 'Hover me', 'Rich target', 'Page', 'Results', 'q', 'Page one']) expect(screen.getByText(text)).toBeOnTheScreen();
    expect(screen.queryByText('Page two')).toBeNull();
    expect(island(BUTTON, 0).props).toMatchObject({label: 'Assist', variant: 'outlined', size: 'small'});
    expect(island(BUTTON, 1).props.variant).toBe('filled');
    expect(island(BUTTON, 2).props).toMatchObject({label: 'Input', disabled: true});
    expect(island(BUTTON, 3).props.label).toBe('Suggest');
    await fireEvent(screen.getByTestId('assist'), 'press');
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('9')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('li'));
    await fireEvent.press(screen.getByText('fab'));
    expect(onClick).toHaveBeenCalledTimes(3);
    await act(async () => tooltip.current?.show());
    await act(async () => tooltip.current?.dismiss());
    let shown!: Promise<string>;
    let replaced!: Promise<string>;
    await act(async () => {
      shown = host.current!.showSnackbar({message: 'Saved', actionLabel: 'Undo', duration: 'long'});
    });
    await act(async () => {
      replaced = host.current!.showSnackbar({message: 'Again'});
    });
    await expect(shown).resolves.toBe('dismissed');
    expect(island(INFO).props.message).toBe('Again');
    await fireIsland(island(INFO), 'close');
    await expect(replaced).resolves.toBe('dismissed');
    let last!: Promise<string>;
    await act(async () => {
      last = host.current!.showSnackbar({message: 'Last', actionLabel: 'Go', duration: 'indefinite'});
    });
    await fireIsland(island(INFO), 'action');
    await expect(last).resolves.toBe('actionPerformed');
    await fireIsland(island(BOX, 0), 'submit', {text: 'find me'});
    expect(onSearch).toHaveBeenCalledWith('find me');
    expect(island(BOX, 0).props.placeholder).toBe('Find');
    await fireIsland(island(BOX, 1), 'changeText', {text: 'q1'});
    expect(onQueryChange).toHaveBeenCalledWith('q1');
    expect(island(BOX, 1).props.placeholder).toBe('Docked');
    await act(async () => pager.current?.scrollToPage(1));
    expect(screen.getByText('Page two')).toBeOnTheScreen();
    await act(async () => pager.current?.animateScrollToPage(0));
    expect(island(BUTTON, 4).props).toMatchObject({label: 'Home', variant: 'filled'});
    expect(island(BUTTON, 5).props).toMatchObject({label: 'Away', variant: 'text'});
    await fireEvent(island(BUTTON, 5), 'press');
    expect(onClick).toHaveBeenCalledWith(1);
    expect(ui.parseJSXShape(<ui.Shape type="circle"/>)).toEqual({type: 'circle'});
    expect(ui.parseJSXShape(null)).toBeUndefined();
    expect(ui.parseJSXShape({})).toBeUndefined();
    expect(ui.isDynamicColorAvailable).toBe(false);
    expect(ui.getMaterialColors({seedColor: '#abcdef'}).primary).toBe('#abcdef');
    expect(ui.useMaterialColors().primary).toBe('#0f6cbd');
    expect(ui.HostPaletteContext).toBeDefined();
  });
});
