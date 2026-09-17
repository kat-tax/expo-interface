import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

/** What every navigation event carries: the page, and where the history stands. */
type NavigationEvent = Readonly<{
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}>;

type MessageEvent = Readonly<{
  url: string;
  title: string;
  /** What the page posted through `window.ReactNativeWebView.postMessage`. */
  data: string;
}>;

type ErrorEvent = Readonly<{
  url: string;
  title: string;
  code: CodegenTypes.Int32;
  description: string;
}>;

/**
 * A WinUI 3 `WebView2` hosted in a XAML island: the web view behind
 * `react-native-webview` and `@expo/dom-webview` (Expo's DOM components) on
 * Windows. The page gets `window.ReactNativeWebView` — `postMessage`, which
 * reaches `onMessage`, and `injectedObjectJson` — before any of its own
 * script runs.
 */
export interface NativeProps extends ViewProps {
  /** The page to load; `sourceHtml` is loaded instead when set. */
  sourceUri?: string;
  /** HTML served as the document at `sourceBaseUrl` (a URL of the runtime's own without one), so it is a page and not an `about:blank`. */
  sourceHtml?: string;
  sourceBaseUrl?: string;
  /** JavaScript run before the page's own, at every document. */
  injectedJavaScriptBeforeContentLoaded?: string;
  /** JavaScript run once the page has loaded. */
  injectedJavaScript?: string;
  /** The JSON `window.ReactNativeWebView.injectedObjectJson()` answers with. */
  injectedObjectJson?: string;
  userAgent?: string;
  javaScriptEnabled?: CodegenTypes.WithDefault<boolean, true>;
  /** Lets the developer tools open on the page. */
  webviewDebuggingEnabled?: CodegenTypes.WithDefault<boolean, false>;
  onMessage?: CodegenTypes.DirectEventHandler<MessageEvent>;
  onLoadStart?: CodegenTypes.DirectEventHandler<NavigationEvent>;
  onLoad?: CodegenTypes.DirectEventHandler<NavigationEvent>;
  onLoadEnd?: CodegenTypes.DirectEventHandler<NavigationEvent>;
  onLoadingError?: CodegenTypes.DirectEventHandler<ErrorEvent>;
  onNavigationStateChange?: CodegenTypes.DirectEventHandler<NavigationEvent>;
}

export interface NativeCommands {
  injectJavaScript: (viewRef: React.ElementRef<HostComponent<NativeProps>>, script: string) => void;
  /** Delivers a `message` event to the page's window, with the text as its data. */
  postMessage: (viewRef: React.ElementRef<HostComponent<NativeProps>>, message: string) => void;
  reload: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  goBack: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  goForward: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  stopLoading: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  scrollTo: (viewRef: React.ElementRef<HostComponent<NativeProps>>, x: CodegenTypes.Double, y: CodegenTypes.Double, animated: boolean) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['injectJavaScript', 'postMessage', 'reload', 'goBack', 'goForward', 'stopLoading', 'scrollTo'],
});

export default codegenNativeComponent<NativeProps>('ExpoWindowsWebView');
