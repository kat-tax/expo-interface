import type {ComponentRef} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import Constants from 'expo-constants';
import {forwardRef, useImperativeHandle, useRef} from 'react';
import NativeMapView, {Commands} from '../windows/specs/ExpoWindowsMapViewNativeComponent';

export type Coordinates = {latitude?: number; longitude?: number};
export type CameraPosition = {coordinates?: Coordinates; zoom?: number};
export type Marker = {id?: string; coordinates?: Coordinates; title?: string; snippet?: string} & Record<string, unknown>;

/** What `expo-maps` calls on its views' refs. */
export type MapsViewRef = {
  setCameraPosition(config?: CameraPosition & Record<string, unknown>): void;
  selectMarker(id?: string, options?: unknown): Promise<void>;
};

/**
 * The props `expo-maps`' views take, of both platforms, as far as the map
 * control has counterparts; the rest (shapes, POIs, the user's location,
 * the map's own options) the package may pass and the island never sees.
 */
export interface MapsViewProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  cameraPosition?: CameraPosition;
  markers?: Marker[];
  annotations?: Marker[];
  uiSettings?: {zoomControlsEnabled?: boolean; compassEnabled?: boolean};
  onMapLoaded?: () => void;
  onMarkerClick?: (marker: Marker) => void;
  onAnnotationClick?: (marker: Marker) => void;
}

/** The Azure Maps key the app carries in its config, under `extra.azureMapsKey`. */
export function serviceToken(): string {
  const extra = Constants.expoConfig?.extra as {azureMapsKey?: unknown} | undefined;
  return typeof extra?.azureMapsKey === 'string' ? extra.azureMapsKey : '';
}

/** The markers (and Apple's annotations) as the island reads them, each with an id to answer a click with. */
export function markersOf(markers: Marker[] | undefined, annotations: Marker[] | undefined): {json: string; byId: Map<string, Marker>} {
  const byId = new Map<string, Marker>();
  const rows = [...(markers ?? []), ...(annotations ?? [])].map((marker, index) => {
    const id = marker.id ?? `marker-${index}`;
    byId.set(id, marker);
    return {id, latitude: marker.coordinates?.latitude ?? 0, longitude: marker.coordinates?.longitude ?? 0, title: marker.title ?? ''};
  });
  return {json: JSON.stringify(rows), byId};
}

/**
 * `expo-maps`' views on Windows — `GoogleMaps.View` and `AppleMaps.View`
 * alike: the runtime's `MapControl` island at the camera position given,
 * with the markers and annotations as icons, the zoom controls as the UI
 * settings say, and the Azure Maps key from the app's config as the
 * control's service token. Shapes, POIs, street view and the user's
 * location dot are other platforms', accepted without effect.
 */
const MapsView = forwardRef<MapsViewRef, MapsViewProps>(function MapsView(props, ref) {
  const island = useRef<ComponentRef<typeof NativeMapView>>(null);
  const {style, testID, cameraPosition, markers, annotations, uiSettings, onMapLoaded, onMarkerClick, onAnnotationClick} = props;
  const {json, byId} = markersOf(markers, annotations);

  useImperativeHandle(ref, () => ({
    setCameraPosition(config) {
      if (island.current) Commands.setCamera(island.current, config?.coordinates?.latitude ?? 0, config?.coordinates?.longitude ?? 0, config?.zoom ?? 0);
    },
    async selectMarker() {},
  }));

  return (
    <NativeMapView
      ref={island}
      style={style}
      testID={testID}
      latitude={cameraPosition?.coordinates?.latitude ?? 0}
      longitude={cameraPosition?.coordinates?.longitude ?? 0}
      zoom={cameraPosition?.zoom ?? 1}
      markers={json}
      serviceToken={serviceToken()}
      interactive={uiSettings?.zoomControlsEnabled ?? true}
      onLoaded={() => onMapLoaded?.()}
      onMarkerClick={event => {
        const marker = byId.get(event.nativeEvent.id);
        if (!marker) return;
        onMarkerClick?.(marker);
        onAnnotationClick?.(marker);
      }}
    />
  );
});

export const GoogleMapsView = MapsView;
export const AppleMapsView = MapsView;
export default MapsView;
