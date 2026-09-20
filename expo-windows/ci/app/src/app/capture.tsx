/**
 * The camera, the map and printing over the runtime's islands and C++
 * modules: the camera's preview with a picture taken on request, the map
 * at a place with a marker, and a page printed to a PDF — the route the
 * Windows CI app and the harness carry to prove them on screen.
 */
import {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {Body, Button, Screen, Title} from '../probe';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {GoogleMaps} from 'expo-maps';
import * as Print from 'expo-print';

export default function CaptureRoute() {
  const camera = useRef<CameraView>(null);
  const [permission] = useCameraPermissions();
  const [state, setState] = useState('opening…');
  const [picture, setPicture] = useState('none yet');
  const [map, setMap] = useState('loading…');
  const [marker, setMarker] = useState('none clicked');
  const [printed, setPrinted] = useState('not asked');

  useEffect(() => {
    Print.printToFileAsync({html: '<h1>Probe</h1><p>Printed on Windows by expo-print.</p>', width: 612, height: 792})
      .then(result => setPrinted(`${result.numberOfPages} page · ${result.uri.slice(-40)}`))
      .catch(error => setPrinted(`✕ ${String(error.message ?? error)}`));
  }, []);

  const shoot = () => {
    camera.current
      ?.takePictureAsync({quality: 0.8})
      .then(shot => setPicture(`${shot.width}×${shot.height} ${shot.format} · ${shot.uri.slice(-44)}`))
      .catch(error => setPicture(`✕ ${String(error.message ?? error)}`));
  };

  return (
    <Screen>
      <Title>Capture</Title>
      <Body testID="camera">{`Camera permission ${permission?.status ?? '…'} · ${state}`}</Body>
      <View style={{width: 320, height: 180}}>
        <CameraView ref={camera} style={{flex: 1}} facing="front" onCameraReady={() => setState('ready')} onMountError={event => setState(`✕ ${event.message}`)} />
      </View>
      <Button label="Take a picture" onPress={shoot} />
      <Body testID="picture">{`Picture ${picture}`}</Body>
      <Body testID="map">{`Map ${map} · marker ${marker}`}</Body>
      <View style={{width: 320, height: 160}}>
        <GoogleMaps.View
          style={{flex: 1}}
          cameraPosition={{coordinates: {latitude: 47.6062, longitude: -122.3321}, zoom: 11}}
          markers={[{id: 'seattle', coordinates: {latitude: 47.6062, longitude: -122.3321}, title: 'Seattle'}]}
          onMapLoaded={() => setMap('loaded')}
          onMarkerClick={clicked => setMarker(clicked.title ?? clicked.id ?? '?')}
        />
      </View>
      <Body testID="print">{`Print ${printed}`}</Body>
    </Screen>
  );
}
