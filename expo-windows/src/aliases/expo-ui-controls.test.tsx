import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {SEGOE_GLYPHS} from 'expo-interface';
import {fireIsland, island} from '../../../src/__tests__/windows';
import {BottomSheet, Button, Checkbox, Collapsible, FieldGroup, getFieldItemPosition, glyphFor, Icon, ListItem, Picker, Slider, Switch, TextInput, useNativeState} from './expo-ui';

const BUTTON = 'ExpoInterfaceButton';
const TOGGLE = 'ExpoInterfaceToggleSwitch';
const SLIDER = 'ExpoInterfaceSlider';
const CHECK = 'ExpoInterfaceCheckBox';
const COMBO = 'ExpoInterfaceComboBox';
const BAR = 'ExpoInterfaceSelectorBar';
const BOX = 'ExpoInterfaceTextBox';

describe('@expo/ui universal controls (windows)', () => {
  it('draws the button as the kit\'s, with the label from its children and the variant mapped', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <Button onPress={onPress} testID="a">
          <Text>Save</Text>
        </Button>
        <Button label="Cancel" variant="bordered" testID="b"/>
        <Button label="More" variant="plain" disabled testID="c"/>
        <Button label="Gone" hidden testID="d"/>
      </>,
    );
    expect(island(BUTTON, 0).props).toMatchObject({label: 'Save', variant: 'filled'});
    expect(island(BUTTON, 1).props).toMatchObject({label: 'Cancel', variant: 'outlined'});
    expect(island(BUTTON, 2).props).toMatchObject({label: 'More', variant: 'text', disabled: true});
    expect(screen.queryByTestId('d')).toBeNull();
    await fireEvent(screen.getByTestId('a'), 'press');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the switch, the slider and the checkbox as the kit\'s, reporting their changes', async () => {
    const onSwitch = vi.fn();
    const onSlide = vi.fn();
    const onCheck = vi.fn();
    await render(
      <>
        <Switch value label="Wi-Fi" onValueChange={onSwitch} testID="s"/>
        <Slider value={0.4} min={0} max={2} step={0.1} onValueChange={onSlide} disabled testID="l"/>
        <Checkbox value={false} label="Agree" onValueChange={onCheck} testID="c"/>
        <Switch value={false}/>
        <Slider value={1}/>
        <Checkbox value/>
      </>,
    );
    expect(island(TOGGLE).props.value).toBe(true);
    expect(screen.getByText('Wi-Fi')).toBeOnTheScreen();
    expect(island(SLIDER).props).toMatchObject({value: 0.4, min: 0, max: 2, step: 0.1, disabled: true});
    expect(island(CHECK).props.value).toBe(false);
    await fireIsland(island(TOGGLE), 'valueChange', {value: false});
    await fireIsland(island(SLIDER), 'valueChange', {value: 0.5});
    await fireIsland(island(CHECK), 'valueChange', {value: true});
    expect(onSwitch).toHaveBeenCalledWith(false);
    expect(onSlide).toHaveBeenCalledWith(0.5);
    expect(onCheck).toHaveBeenCalledWith(true);
    await fireIsland(island(TOGGLE, 1), 'valueChange', {value: true});
    await fireIsland(island(SLIDER, 1), 'valueChange', {value: 2});
    await fireIsland(island(CHECK, 1), 'valueChange', {value: false});
  });

  it('draws the picker as the kit\'s combo box or, segmented, its selector bar, answering the value and its index', async () => {
    const onValueChange = vi.fn();
    await render(
      <>
        <Picker selectedValue="m" onValueChange={onValueChange} testID="size">
          <Picker.Item label="Small" value="s"/>
          <Picker.Item label="Medium" value="m"/>
          <Picker.Item value={3}/>
        </Picker>
        <Picker selectedValue={1} appearance="segmented" enabled={false} testID="range">
          <Picker.Item label="Day" value={0}/>
          <Picker.Item label="Week" value={1}/>
        </Picker>
      </>,
    );
    expect(JSON.parse(island(COMBO).props.options)).toEqual(['Small', 'Medium', '3']);
    expect(island(COMBO).props.selectedIndex).toBe(1);
    await fireIsland(island(COMBO), 'selectionChange', {index: 2});
    expect(onValueChange).toHaveBeenCalledWith(3, 2);
    expect(JSON.parse(island(BAR).props.options)).toEqual(['Day', 'Week']);
    expect(island(BAR).props).toMatchObject({selectedIndex: 1, disabled: true});
    await fireIsland(island(BAR), 'selectionChange', {index: 0});
  });

  it('draws the text input as the kit\'s text box under React Native\'s props', async () => {
    const onChangeText = vi.fn();
    const onSubmitEditing = vi.fn();
    await render(
      <>
        <TextInput value="hi" placeholder="Name" onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} returnKeyType="search" autoCapitalize="words" testID="name"/>
        <TextInput defaultValue="d" editable={false} secureTextEntry multiline returnKeyType="done" testID="pin"/>
        <TextInput readOnly/>
      </>,
    );
    expect(island(BOX).props).toMatchObject({value: 'hi', placeholder: 'Name'});
    await fireIsland(island(BOX), 'changeText', {text: 'hip'});
    expect(onChangeText).toHaveBeenCalledWith('hip');
    await fireIsland(island(BOX), 'submit', {text: 'hip'});
    expect(onSubmitEditing).toHaveBeenCalledWith({nativeEvent: {text: 'hip'}});
    expect(island(BOX, 1).props).toMatchObject({value: 'd', disabled: true});
  });

  it('shows the sheet, the collapsible and the field group through the kit', async () => {
    const onDismiss = vi.fn();
    const onOpenChange = vi.fn();
    await render(
      <>
        <BottomSheet isPresented onDismiss={onDismiss}>
          <Text>Sheet body</Text>
        </BottomSheet>
        <Collapsible label="Advanced" isOpen onOpenChange={onOpenChange}>
          <Text>Inside</Text>
        </Collapsible>
        <FieldGroup testID="form">
          <FieldGroup.Section title="General" titleUppercase>
            <FieldGroup.SectionFooter>Runs every hour.</FieldGroup.SectionFooter>
            <Text>Row</Text>
          </FieldGroup.Section>
          <FieldGroup.Section>
            <FieldGroup.SectionHeader>Custom header</FieldGroup.SectionHeader>
            <Text>Second</Text>
          </FieldGroup.Section>
        </FieldGroup>
      </>,
    );
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
    expect(screen.getByText('Advanced')).toBeOnTheScreen();
    expect(screen.getByText('Inside')).toBeOnTheScreen();
    expect(screen.getByText('GENERAL')).toBeOnTheScreen();
    expect(screen.getByText('Runs every hour.')).toBeOnTheScreen();
    expect(screen.getByText('Custom header')).toBeOnTheScreen();
    expect(screen.getByText('Row')).toBeOnTheScreen();
    expect(getFieldItemPosition(0, 1)).toBe('single');
    expect(getFieldItemPosition(0, 3)).toBe('first');
    expect(getFieldItemPosition(1, 3)).toBe('middle');
    expect(getFieldItemPosition(2, 3)).toBe('last');
  });

  it('draws an icon as a Segoe glyph when the name has one, and picks the Windows name of a spec', async () => {
    const [name, [code]] = Object.entries(SEGOE_GLYPHS as unknown as Record<string, [string, string?]>)[0];
    expect(glyphFor(name)).toBe(code);
    expect(glyphFor({android: name})).toBe(code);
    expect(glyphFor({windows: 'E710'})).toBe('E710');
    expect(glyphFor({ios: name})).toBe(code);
    expect(glyphFor('★')).toBe('★');
    expect(glyphFor('no.such.symbol')).toBeUndefined();
    expect(glyphFor(undefined)).toBeUndefined();
    expect(Icon.select({ios: 'a', android: 'b', windows: 'c'})).toEqual({ios: 'a', android: 'b', windows: 'c'});
    await render(
      <>
        <Icon name={name} size={24} color="red" accessibilityLabel="first" testID="icon"/>
        <Icon name="no.such.symbol" testID="none"/>
        <Icon name={name} hidden testID="hidden"/>
      </>,
    );
    expect(screen.getByTestId('icon')).toHaveStyle({fontFamily: 'Segoe Fluent Icons', fontSize: 24, color: 'red'});
    expect(screen.queryByTestId('none')).toBeNull();
    expect(screen.queryByTestId('hidden')).toBeNull();
  });

  it('draws a list item with its slots as the kit\'s row', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <ListItem onPress={onPress} testID="row">
          <ListItem.Leading>
            <Text>L</Text>
          </ListItem.Leading>
          <Text>Sync</Text>
          <ListItem.Supporting>
            <Text>Every hour</Text>
          </ListItem.Supporting>
          <ListItem.Trailing>
            <Text>T</Text>
          </ListItem.Trailing>
        </ListItem>
        <ListItem supportingText="Detail" leading={<Text>lead</Text>} trailing={<Text>trail</Text>}>
          <Text>Plain</Text>
        </ListItem>
      </>,
    );
    for (const text of ['L', 'Sync', 'Every hour', 'T', 'Plain', 'Detail', 'lead', 'trail']) expect(screen.getByText(text)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps native state in JavaScript, the same object across renders', async () => {
    const seen: unknown[] = [];
    function Probe() {
      const state = useNativeState('a');
      seen.push(state);
      return <Text testID="v">{state.value}</Text>;
    }
    const {rerender} = await render(<Probe/>);
    await rerender(<Probe/>);
    expect(seen[0]).toBe(seen[1]);
    (seen[0] as {set(value: string): void}).set('b');
    expect((seen[0] as {value: string}).value).toBe('b');
  });
});
