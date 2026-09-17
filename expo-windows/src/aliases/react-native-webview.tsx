import type {ComponentRef} from 'react';
import type {StyleProp, ViewProps, ViewStyle} from 'react-native';
import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import NativeWebView, {Commands} from '../windows/specs/ExpoWindowsWebViewNativeComponent';

export type WebViewNavigation = {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
};

export type WebViewMessageEvent = {nativeEvent: {url: string; title: string; data: string}};
export type WebViewNavigationEvent = {nativeEvent: WebViewNavigation};
export type WebViewErrorEvent = {nativeEvent: {url: string; title: string; code: number; description: string}};

export type WebViewSource = {uri: string; headers?: Record<string, string>; method?: string; body?: string} | {html: string; baseUrl?: string};

/** The props of `react-native-webview` a WebView2 answers to; the rest is accepted and ignored. */
export interface WebViewProps extends ViewProps {
  source?: WebViewSource;
  containerStyle?: StyleProp<ViewStyle>;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  injectedJavaScriptObject?: object;
  userAgent?: string;
  javaScriptEnabled?: boolean;
  webviewDebuggingEnabled?: boolean;
  onMessage?: (event: WebViewMessageEvent) => void;
  onLoadStart?: (event: WebViewNavigationEvent) => void;
  onLoad?: (event: WebViewNavigationEvent) => void;
  onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;
  onError?: (event: WebViewErrorEvent) => void;
  onNavigationStateChange?: (navigation: WebViewNavigation) => void;
  renderLoading?: () => React.ReactElement;
  startInLoadingState?: boolean;
  // Accepted without effect: what a WebView2 decides for itself, or has no say in.
  scrollEnabled?: boolean;
  bounces?: boolean;
  decelerationRate?: 'normal' | 'fast' | number;
  nestedScrollEnabled?: boolean;
  contentInsetAdjustmentBehavior?: string;
  automaticallyAdjustsScrollIndicatorInsets?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  allowsAirPlayForMediaPlayback?: boolean;
  allowsFullscreenVideo?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  allowFileAccess?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  allowingReadAccessToURL?: string;
  originWhitelist?: string[];
  domStorageEnabled?: boolean;
  cacheEnabled?: boolean;
  incognito?: boolean;
  onShouldStartLoadWithRequest?: (request: WebViewNavigation) => boolean;
  onContentProcessDidTerminate?: (event: unknown) => void;
  onRenderProcessGone?: (event: unknown) => void;
}

export type WebViewRef = {
  injectJavaScript: (script: string) => void;
  postMessage: (message: string) => void;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  stopLoading: () => void;
  requestFocus: () => void;
  clearCache: (includeDiskFiles: boolean) => void;
  clearHistory: () => void;
};

const NATIVE_PROPS = new Set(['style', 'testID', 'nativeID', 'accessibilityLabel', 'onLayout', 'pointerEvents']);

function nativeProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (NATIVE_PROPS.has(key)) out[key] = props[key];
  }
  return out;
}

const styles = StyleSheet.create({
  container: {flex: 1, overflow: 'hidden'},
  webView: {flex: 1, backgroundColor: '#ffffff'},
  loading: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'},
});

/**
 * `react-native-webview` on Windows: `WebView` over the WebView2 island —
 * a page by URL or HTML, the injected scripts, `postMessage` both ways,
 * the load and navigation events, and the ref's navigation. Its own
 * Windows implementation is for the old architecture, which
 * react-native-windows 0.84's Fabric does not build. What a WebView2 has
 * no say in — the origin whitelist, the media policies, `onShouldStartLoadWithRequest`
 * — is accepted without effect.
 */
export const WebView = forwardRef<WebViewRef, WebViewProps>(function WebView(
  {
    source,
    containerStyle,
    style,
    injectedJavaScript,
    injectedJavaScriptBeforeContentLoaded,
    injectedJavaScriptObject,
    userAgent,
    javaScriptEnabled,
    webviewDebuggingEnabled,
    onMessage,
    onLoadStart,
    onLoad,
    onLoadEnd,
    onError,
    onNavigationStateChange,
    renderLoading,
    startInLoadingState,
    ...rest
  },
  ref,
) {
  const view = useRef<ComponentRef<typeof NativeWebView>>(null);
  const [loading, setLoading] = useState(startInLoadingState ?? false);
  const command = (run: (native: ComponentRef<typeof NativeWebView>) => void) => {
    if (view.current) run(view.current);
  };
  useImperativeHandle(
    ref,
    () => ({
      injectJavaScript: script => command(native => Commands.injectJavaScript(native, script)),
      postMessage: message => command(native => Commands.postMessage(native, message)),
      reload: () => command(native => Commands.reload(native)),
      goBack: () => command(native => Commands.goBack(native)),
      goForward: () => command(native => Commands.goForward(native)),
      stopLoading: () => command(native => Commands.stopLoading(native)),
      requestFocus: () => {},
      clearCache: () => {},
      clearHistory: () => {},
    }),
    [],
  );
  const uri = source && 'uri' in source ? source.uri : undefined;
  const html = source && 'html' in source ? source.html : undefined;
  const baseUrl = source && 'html' in source ? source.baseUrl : undefined;
  return (
    <View style={[styles.container, containerStyle]}>
      <NativeWebView
        {...nativeProps(rest as Record<string, unknown>)}
        ref={view}
        style={[styles.webView, style]}
        sourceUri={uri}
        sourceHtml={html}
        sourceBaseUrl={baseUrl}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedObjectJson={JSON.stringify(injectedJavaScriptObject ?? {})}
        userAgent={userAgent}
        javaScriptEnabled={javaScriptEnabled ?? true}
        webviewDebuggingEnabled={webviewDebuggingEnabled ?? false}
        onMessage={onMessage}
        onLoadStart={event => {
          setLoading(true);
          onLoadStart?.(event);
        }}
        onLoad={onLoad}
        onLoadEnd={event => {
          setLoading(false);
          onLoadEnd?.(event);
        }}
        onLoadingError={event => {
          setLoading(false);
          onError?.(event);
          onLoadEnd?.(event);
        }}
        onNavigationStateChange={event => onNavigationStateChange?.(event.nativeEvent)}
      />
      {loading && renderLoading ? <View style={styles.loading}>{renderLoading()}</View> : null}
    </View>
  );
});

export default WebView;
