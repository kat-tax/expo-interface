import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

// The event carries nothing; codegen wants an object type all the same.
// oxlint-disable-next-line typescript/no-empty-object-type
type EmptyEvent = Readonly<{}>;

type MarkerEvent = Readonly<{id: string}>;

/**
 * A WinUI 3 `MapControl` hosted in a XAML island: the view behind
 * `expo-maps` on Windows. It shows the map at the centre and zoom given,
 * with markers as icons, and needs an Azure Maps key as its service token.
 */
export interface NativeProps extends ViewProps {
  latitude?: CodegenTypes.Double;
  longitude?: CodegenTypes.Double;
  zoom?: CodegenTypes.Double;
  /** The markers as JSON: `[{id, latitude, longitude, title}]`. */
  markers?: string;
  /** The Azure Maps key the control shows tiles with. */
  serviceToken?: string;
  interactive?: CodegenTypes.WithDefault<boolean, true>;
  onMarkerClick?: CodegenTypes.DirectEventHandler<MarkerEvent>;
  onLoaded?: CodegenTypes.DirectEventHandler<EmptyEvent>;
}

export interface NativeCommands {
  setCamera: (viewRef: React.ElementRef<HostComponent<NativeProps>>, latitude: CodegenTypes.Double, longitude: CodegenTypes.Double, zoom: CodegenTypes.Double) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setCamera'],
});

export default codegenNativeComponent<NativeProps>('ExpoWindowsMapView');
