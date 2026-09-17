import type {ComponentRef} from 'react';
import type {StyleProp, ViewProps, ViewStyle} from 'react-native';
import {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import NativeWebView, {Commands} from '../windows/specs/ExpoWindowsWebViewNativeComponent';

/** The props `@expo/dom-webview` takes; what a WebView2 cannot do is accepted and ignored. */
export interface DomWebViewProps extends ViewProps {
  source: {uri: string};
  containerStyle?: StyleProp<ViewStyle>;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  injectedJavaScriptObject?: object;
  webviewDebuggingEnabled?: boolean;
  onMessage?: (event: {nativeEvent: {url: string; title: string; data: string}}) => void;
  onContentProcessDidTerminate?: (event: {nativeEvent: {url: string; title: string}}) => void;
  onRenderProcessGone?: (event: {nativeEvent: {url: string; title: string; didCrash: boolean}}) => void;
  // Accepted without effect: scrolling and media policies a WebView2 decides for itself, and the whitelist.
  scrollEnabled?: boolean;
  bounces?: boolean;
  decelerationRate?: 'normal' | 'fast' | number;
  nestedScrollEnabled?: boolean;
  contentInsetAdjustmentBehavior?: string;
  automaticallyAdjustsScrollIndicatorInsets?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  hideKeyboardAccessoryView?: boolean;
  useExpoModulesBridge?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  allowsPictureInPictureMediaPlayback?: boolean;
  allowsAirPlayForMediaPlayback?: boolean;
  allowsFullscreenVideo?: boolean;
  allowFileAccess?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  allowingReadAccessToURL?: string;
  originWhitelist?: string[];
}

export type DomWebViewRef = {
  scrollTo(params: {x?: number; y?: number; animated?: boolean}): void;
  injectJavaScript: (script: string) => void;
  reload: () => void;
};

/** The props the native view knows; the rest — iOS scrolling, Android nesting, the whitelist — is not its business. */
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
});

/**
 * `@expo/dom-webview` on Windows: the WebView2 island under the same props
 * and ref, which is what Expo's DOM components (`'use dom'`) render into.
 * The page gets `window.ReactNativeWebView` with `postMessage` and
 * `injectedObjectJson`, which is how the DOM side of a component and the
 * native side talk.
 */
export const DomWebView = forwardRef<DomWebViewRef, DomWebViewProps>(function DomWebView(
  {source, containerStyle, style, injectedJavaScript, injectedJavaScriptBeforeContentLoaded, injectedJavaScriptObject, webviewDebuggingEnabled, onMessage, ...rest},
  ref,
) {
  const view = useRef<ComponentRef<typeof NativeWebView>>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollTo: ({x = 0, y = 0, animated = false}) => {
        if (view.current) Commands.scrollTo(view.current, x, y, animated);
      },
      injectJavaScript: script => {
        if (view.current) Commands.injectJavaScript(view.current, script);
      },
      reload: () => {
        if (view.current) Commands.reload(view.current);
      },
    }),
    [],
  );
  return (
    <View style={[styles.container, containerStyle]}>
      <NativeWebView
        {...nativeProps(rest as Record<string, unknown>)}
        ref={view}
        style={[styles.webView, style]}
        sourceUri={source.uri}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedObjectJson={JSON.stringify(injectedJavaScriptObject ?? {})}
        webviewDebuggingEnabled={webviewDebuggingEnabled ?? false}
        onMessage={onMessage}
      />
    </View>
  );
});

export {DomWebView as WebView};
export default DomWebView;
