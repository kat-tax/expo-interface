/**
 * The kit's `Collapsible` on Windows: a WinUI Expander island with React
 * Native content inside it through a portal, and a kit Button nested in that
 * content. The ids are what the Windows focus and motion checks look for.
 */
import {useState} from 'react';
import {Text, View} from 'react-native';
import {Body, Button, Collapsible, Screen, Title} from 'expo-interface';

export default function CollapsibleProbe() {
  const [inner, setInner] = useState(0);
  const [expanded, setExpanded] = useState(true);
  return (
    <Screen>
      <Title>Collapsible</Title>
      <Body testID="state">{`inner ${inner} · expanded ${expanded}`}</Body>
      <View style={{width: 320}}>
        <Collapsible label="Details" expanded={expanded} onExpandedChange={setExpanded} testID="details">
          <View style={{padding: 12, gap: 8, backgroundColor: '#FFF3E0'}}>
            <Text testID="portal-text" style={{color: '#3E2723'}}>React content inside a WinUI Expander.</Text>
            <Button testID="inner" label={`Inner button ${inner}`} onPress={() => setInner(count => count + 1)}/>
          </View>
        </Collapsible>
      </View>
    </Screen>
  );
}
