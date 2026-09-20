/**
 * The probe's front page: a route for each part of the runtime, opened by a
 * deep link or from here. `/packages` imports every SDK 57 package, which is
 * what proves a bundle with all of them loads on Windows.
 */
import {router} from 'expo-router';
import {Body, Button, Screen, Title} from '../probe';

const ROUTES = ['packages', 'device', 'data', 'image', 'media', 'capture', 'sensing', 'notify', 'web', 'ports', 'crash'] as const;

export default function Index() {
  return (
    <Screen>
      <Title>expo-windows</Title>
      <Body testID="loaded">The bundle loaded.</Body>
      {ROUTES.map(route => (
        <Button key={route} label={route} onPress={() => router.push(`/${route}`)}/>
      ))}
    </Screen>
  );
}
