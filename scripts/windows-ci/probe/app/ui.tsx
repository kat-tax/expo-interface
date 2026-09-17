/**
 * `@expo/ui`'s platform subpaths and the community controls at work on
 * Windows: SwiftUI's and Compose's components drawn by the kit as WinUI,
 * the community slider, date picker and segmented control the same, and
 * `expo-checkbox` and `expo-blur` beside them.
 */
import {useState} from 'react';
import {View} from 'react-native';
import {Body, Screen, Title} from 'expo-interface';
import * as Swift from '@expo/ui/swift-ui';
import {pickerStyle, progressViewStyle} from '@expo/ui/swift-ui/modifiers';
import * as Compose from '@expo/ui/jetpack-compose';
import {paddingAll} from '@expo/ui/jetpack-compose/modifiers';
import {Slider as CommunitySlider} from '@expo/ui/community/slider';
import {DateTimePicker as CommunityDatePicker} from '@expo/ui/community/datetime-picker';
import CommunitySegmentedControl from '@expo/ui/community/segmented-control';
import ExpoCheckbox from 'expo-checkbox';
import {BlurView} from 'expo-blur';

export default function Ui() {
  const [on, setOn] = useState(true);
  const [level, setLevel] = useState(0.4);
  const [range, setRange] = useState<number | null>(1);
  const [checked, setChecked] = useState(false);
  const [segment, setSegment] = useState(0);
  const [presses, setPresses] = useState(0);
  return (
    <Screen>
      <Title>@expo/ui</Title>
      <Body testID="state">{`swift toggle ${on} · slider ${level.toFixed(2)} · picker ${range} · compose checkbox ${checked} · segment ${segment} · presses ${presses}`}</Body>
      <Swift.Host style={{gap: 8}}>
        <Swift.HStack spacing={8}>
          <Swift.Button label="SwiftUI button" modifiers={[]} onPress={() => setPresses(count => count + 1)} testID="swift-button"/>
          <Swift.Toggle isOn={on} onIsOnChange={setOn} label="Toggle" testID="swift-toggle"/>
        </Swift.HStack>
        <Swift.Slider value={level} onValueChange={setLevel} label={<Swift.Text>Level</Swift.Text>} testID="swift-slider"/>
        <Swift.Picker label="Range" selection={range} onSelectionChange={setRange} modifiers={[pickerStyle('segmented')]} testID="swift-picker">
          <Swift.Text>Day</Swift.Text>
          <Swift.Text>Week</Swift.Text>
          <Swift.Text>Month</Swift.Text>
        </Swift.Picker>
        <Swift.DatePicker title="Due" selection={new Date(2026, 8, 17)} testID="swift-date"/>
        <Swift.ProgressView value={level} modifiers={[progressViewStyle('linear')]} testID="swift-progress"/>
      </Swift.Host>
      <Compose.Host modifiers={[paddingAll(0)]}>
        <Compose.Column verticalArrangement={{spacedBy: 8}}>
          <Compose.Row horizontalArrangement={{spacedBy: 8}} verticalAlignment="center">
            <Compose.Button onClick={() => setPresses(count => count + 1)} testID="compose-button">
              <Compose.Text>Compose button</Compose.Text>
            </Compose.Button>
            <Compose.Switch value={on} onCheckedChange={setOn} testID="compose-switch"/>
            <Compose.Checkbox value={checked} onCheckedChange={setChecked} testID="compose-checkbox"/>
          </Compose.Row>
          <Compose.LinearProgressIndicator progress={level} testID="compose-progress"/>
          <Compose.SingleChoiceSegmentedButtonRow testID="compose-segments">
            <Compose.SegmentedButton selected={segment === 0} onClick={() => setSegment(0)}>
              <Compose.Text>Left</Compose.Text>
            </Compose.SegmentedButton>
            <Compose.SegmentedButton selected={segment === 1} onClick={() => setSegment(1)}>
              <Compose.Text>Right</Compose.Text>
            </Compose.SegmentedButton>
          </Compose.SingleChoiceSegmentedButtonRow>
        </Compose.Column>
      </Compose.Host>
      <CommunitySlider value={level} minimumValue={0} maximumValue={1} onValueChange={setLevel} testID="community-slider"/>
      <CommunityDatePicker value={new Date(2026, 8, 17, 9, 30)} mode="time" testID="community-time"/>
      <CommunitySegmentedControl values={['One', 'Two', 'Three']} selectedIndex={segment} onChange={event => setSegment(event.nativeEvent.selectedSegmentIndex)} testID="community-segments"/>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <ExpoCheckbox value={checked} onValueChange={setChecked} testID="expo-checkbox"/>
        <Body>expo-checkbox</Body>
      </View>
      <BlurView tint="dark" intensity={60} style={{padding: 8, borderRadius: 8}} testID="blur">
        <Body>expo-blur stands in as a tinted surface</Body>
      </BlurView>
    </Screen>
  );
}
