import {router} from 'expo-router';
import {HeaderMenu, TabStack} from 'expo-interface';
import {demoDropData} from '@/drop/data';
import * as icons from '@/icons';

/**
 * The header's trailing menu: a kit `HeaderMenu`, returned as the element
 * itself, since natively the stack reads the bar's items off it.
 */
function newMenu() {
  const [first] = demoDropData;
  return (
    <HeaderMenu
      label="New"
      icon={icons.fileAdd}
      items={[
        {label: 'Upload files', icon: icons.upload, onPress: () => router.push(`/${first.id}`)},
        {label: 'Take a photo', icon: icons.camera, onPress: () => router.push(`/${first.id}`)},
      ]}
    />
  );
}

export default function DropsLayout() {
  return <TabStack title="Drops" headerRight={newMenu}/>;
}
