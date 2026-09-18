import {createRef} from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import MapsView, {AppleMapsView, GoogleMapsView, markersOf, serviceToken, type MapsViewRef} from './expo-maps-view';
import {Commands} from '../windows/specs/ExpoWindowsMapViewNativeComponent';

/** The app's config as expo-constants reads it, set by each test. */
let expoConfig: {extra?: Record<string, unknown>} | null = null;
vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return expoConfig;
    },
  },
}));

beforeEach(() => {
  for (const name of Object.keys(Commands) as (keyof typeof Commands)[]) vi.spyOn(Commands, name).mockImplementation(() => {});
});

describe('expo-maps view (windows)', () => {
  it('shows the map in the island at the camera position, with the markers and annotations as icons, and answers clicks and the ref', async () => {
    expoConfig = {extra: {azureMapsKey: 'key-123'}};
    const ref = createRef<MapsViewRef>();
    const onMapLoaded = vi.fn();
    const onMarkerClick = vi.fn();
    const onAnnotationClick = vi.fn();
    const markers = [{id: 'a', coordinates: {latitude: 1, longitude: 2}, title: 'A'}, {coordinates: {latitude: 3, longitude: 4}}, {id: 'nowhere'}];
    const annotations = [{id: 'n', coordinates: {latitude: 5, longitude: 6}, title: 'N'}];
    const {unmount} = await render(
      <GoogleMapsView
        ref={ref}
        testID="map"
        cameraPosition={{coordinates: {latitude: 47.6, longitude: -122.3}, zoom: 11}}
        markers={markers}
        annotations={annotations}
        uiSettings={{zoomControlsEnabled: false}}
        onMapLoaded={onMapLoaded}
        onMarkerClick={onMarkerClick}
        onAnnotationClick={onAnnotationClick}
      />,
    );
    const island = screen.getByTestId('map');
    expect(island.props.latitude).toBe(47.6);
    expect(island.props.longitude).toBe(-122.3);
    expect(island.props.zoom).toBe(11);
    expect(island.props.serviceToken).toBe('key-123');
    expect(island.props.interactive).toBe(false);
    expect(JSON.parse(island.props.markers)).toEqual([
      {id: 'a', latitude: 1, longitude: 2, title: 'A'},
      {id: 'marker-1', latitude: 3, longitude: 4, title: ''},
      {id: 'nowhere', latitude: 0, longitude: 0, title: ''},
      {id: 'n', latitude: 5, longitude: 6, title: 'N'},
    ]);
    await fireEvent(island, 'loaded', {nativeEvent: {}});
    expect(onMapLoaded).toHaveBeenCalledTimes(1);
    await fireEvent(island, 'markerClick', {nativeEvent: {id: 'n'}});
    expect(onMarkerClick).toHaveBeenCalledWith(annotations[0]);
    expect(onAnnotationClick).toHaveBeenCalledWith(annotations[0]);
    await fireEvent(island, 'markerClick', {nativeEvent: {id: 'unknown'}});
    expect(onMarkerClick).toHaveBeenCalledTimes(1);
    const handle = ref.current as MapsViewRef;
    handle.setCameraPosition({coordinates: {latitude: 10, longitude: 20}, zoom: 5});
    expect(Commands.setCamera).toHaveBeenCalledWith(expect.anything(), 10, 20, 5);
    handle.setCameraPosition();
    expect(Commands.setCamera).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 0);
    handle.setCameraPosition({zoom: 3});
    expect(Commands.setCamera).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 3);
    handle.setCameraPosition({coordinates: {latitude: 1}});
    expect(Commands.setCamera).toHaveBeenLastCalledWith(expect.anything(), 1, 0, 0);
    handle.setCameraPosition({coordinates: {longitude: 2}});
    expect(Commands.setCamera).toHaveBeenLastCalledWith(expect.anything(), 0, 2, 0);
    await expect(handle.selectMarker('a')).resolves.toBeUndefined();
    await unmount();
    handle.setCameraPosition({zoom: 1});
    expect(Commands.setCamera).toHaveBeenCalledTimes(5);
  });

  it('is the same view for both platforms, with the defaults, and takes the events without handlers', async () => {
    expoConfig = null;
    expect(AppleMapsView).toBe(GoogleMapsView);
    expect(MapsView).toBe(GoogleMapsView);
    await render(<AppleMapsView testID="bare" />);
    const island = screen.getByTestId('bare');
    expect(island.props.latitude).toBe(0);
    expect(island.props.zoom).toBe(1);
    expect(island.props.serviceToken).toBe('');
    expect(island.props.interactive).toBe(true);
    expect(island.props.markers).toBe('[]');
    await fireEvent(island, 'loaded', {nativeEvent: {}});
    await fireEvent(island, 'markerClick', {nativeEvent: {id: 'x'}});
    expect(serviceToken()).toBe('');
    expect(markersOf(undefined, undefined).json).toBe('[]');
  });
});
