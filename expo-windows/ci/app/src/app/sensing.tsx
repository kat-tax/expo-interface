/**
 * The sensors and location over the runtime's C++ modules, each asked what
 * the machine has and, where it has it, for a reading: the route the
 * Windows CI app and the harness carry to prove them on screen. A desktop
 * has few sensors; the honest answer is the point.
 */
import {useEffect, useState} from 'react';
import {Body, Screen, Title} from '../probe';
import * as Location from 'expo-location';
import {Accelerometer, Barometer, DeviceMotion, Gyroscope, LightSensor, Magnetometer, MagnetometerUncalibrated, Pedometer} from 'expo-sensors';

const SENSORS = [
  ['accelerometer', Accelerometer],
  ['gyroscope', Gyroscope],
  ['magnetometer', Magnetometer],
  ['magnetometer (uncalibrated)', MagnetometerUncalibrated],
  ['barometer', Barometer],
  ['light', LightSensor],
  ['device motion', DeviceMotion],
] as const;

export default function SensingRoute() {
  const [sensors, setSensors] = useState('…');
  const [reading, setReading] = useState('no accelerometer to read');
  const [steps, setSteps] = useState('…');
  const [permission, setPermission] = useState('…');
  const [position, setPosition] = useState('…');
  const [heading, setHeading] = useState('…');

  useEffect(() => {
    Promise.all(SENSORS.map(async ([name, sensor]) => `${name} ${(await sensor.isAvailableAsync()) ? 'yes' : 'no'}`))
      .then(answers => setSensors(answers.join(' · ')))
      .catch(error => setSensors(`✕ ${String(error)}`));
    let subscription: {remove(): void} | null = null;
    Accelerometer.isAvailableAsync()
      .then(available => {
        if (!available) return;
        Accelerometer.setUpdateInterval(500);
        subscription = Accelerometer.addListener(({x, y, z}) => setReading(`accelerometer x ${x.toFixed(2)} y ${y.toFixed(2)} z ${z.toFixed(2)}`));
      })
      .catch(error => setReading(`✕ ${String(error)}`));
    Pedometer.isAvailableAsync()
      .then(async available => {
        if (!available) {
          setSteps('no pedometer');
          return;
        }
        const now = new Date();
        const {steps: count} = await Pedometer.getStepCountAsync(new Date(now.getTime() - 86_400_000), now);
        setSteps(`${count} steps in the last day`);
      })
      .catch(error => setSteps(`✕ ${String(error)}`));
    Location.requestForegroundPermissionsAsync()
      .then(async response => {
        const enabled = await Location.hasServicesEnabledAsync();
        setPermission(`${response.status} · services ${enabled ? 'on' : 'off'}`);
        if (!response.granted) {
          setPosition('not asked');
          return;
        }
        const {coords} = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
        setPosition(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)} ± ${Math.round(coords.accuracy ?? 0)} m`);
      })
      .catch(error => setPosition(`✕ ${String(error)}`));
    Location.watchHeadingAsync(({magHeading}) => setHeading(`${Math.round(magHeading)}°`))
      .then(watch => {
        setHeading('watching');
        return watch;
      })
      .catch(error => setHeading(`✕ ${String(error.message ?? error)}`));
    return () => subscription?.remove();
  }, []);

  return (
    <Screen>
      <Title>Sensing</Title>
      <Body testID="sensors">{`Sensors ${sensors}`}</Body>
      <Body testID="reading">{`Reading ${reading}`}</Body>
      <Body testID="steps">{`Pedometer ${steps}`}</Body>
      <Body testID="permission">{`Location ${permission}`}</Body>
      <Body testID="position">{`Position ${position}`}</Body>
      <Body testID="heading">{`Heading ${heading}`}</Body>
    </Screen>
  );
}
