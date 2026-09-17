import {createRef} from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import DomDefault, {DomWebView, type DomWebViewRef, WebView as DomWebViewAlias} from './expo-dom-webview';
import RnDefault, {WebView, type WebViewRef} from './react-native-webview';
import {Commands} from '../windows/specs/ExpoWindowsWebViewNativeComponent';

/** The island's host view in the rendered tree. */
function island() {
  return screen.getByTestId('web');
}

beforeEach(() => {
  for (const name of Object.keys(Commands) as (keyof typeof Commands)[]) vi.spyOn(Commands, name).mockImplementation(() => {});
});

describe('@expo/dom-webview (windows)', () => {
  it('renders the page in the island with the bridge object and the scripts, under the same exports', async () => {
    const onMessage = vi.fn();
    await render(
      <DomWebView
        source={{uri: 'http://localhost:8082/_expo/@dom/page.html'}}
        injectedJavaScriptObject={{EXPO_DOM_HOST_OS: 'windows', initialProps: {a: 1}}}
        injectedJavaScript="true;"
        injectedJavaScriptBeforeContentLoaded="before();"
        onMessage={onMessage}
        testID="web"
        scrollEnabled={false}
        originWhitelist={['*']}
      />,
    );
    const view = island();
    expect(view.props.sourceUri).toBe('http://localhost:8082/_expo/@dom/page.html');
    expect(view.props.injectedObjectJson).toBe('{"EXPO_DOM_HOST_OS":"windows","initialProps":{"a":1}}');
    expect(view.props.injectedJavaScript).toBe('true;');
    expect(view.props.injectedJavaScriptBeforeContentLoaded).toBe('before();');
    expect(view.props.webviewDebuggingEnabled).toBe(false);
    expect(view.props).not.toHaveProperty('scrollEnabled');
    expect(view.props).not.toHaveProperty('originWhitelist');
    await fireEvent(view, 'message', {nativeEvent: {url: 'u', title: 't', data: '{"type":"$$dom_ready"}'}});
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({nativeEvent: expect.objectContaining({data: '{"type":"$$dom_ready"}'})}));
    expect(DomDefault).toBe(DomWebView);
    expect(DomWebViewAlias).toBe(DomWebView);
  });

  it('drives the island through its ref: inject, reload, scroll', async () => {
    const ref = createRef<DomWebViewRef>();
    const {unmount} = await render(<DomWebView ref={ref} source={{uri: 'about:blank'}} webviewDebuggingEnabled testID="web"/>);
    expect(island().props.webviewDebuggingEnabled).toBe(true);
    expect(island().props.injectedObjectJson).toBe('{}');
    ref.current?.injectJavaScript('run()');
    ref.current?.reload();
    ref.current?.scrollTo({x: 10, y: 20, animated: true});
    ref.current?.scrollTo({});
    expect(Commands.injectJavaScript).toHaveBeenCalledWith(expect.anything(), 'run()');
    expect(Commands.reload).toHaveBeenCalledTimes(1);
    expect(Commands.scrollTo).toHaveBeenNthCalledWith(1, expect.anything(), 10, 20, true);
    expect(Commands.scrollTo).toHaveBeenNthCalledWith(2, expect.anything(), 0, 0, false);
    const handle = ref.current as DomWebViewRef;
    await unmount();
    handle.injectJavaScript('gone()');
    handle.reload();
    handle.scrollTo({});
    expect(Commands.injectJavaScript).toHaveBeenCalledTimes(1);
  });
});

describe('react-native-webview (windows)', () => {
  it('loads a URL or HTML, with the scripts and settings, and reports the page\'s events', async () => {
    const onMessage = vi.fn();
    const onLoadStart = vi.fn();
    const onLoad = vi.fn();
    const onLoadEnd = vi.fn();
    const onError = vi.fn();
    const onNavigationStateChange = vi.fn();
    const {rerender} = await render(
      <WebView
        source={{uri: 'https://example.com'}}
        injectedJavaScriptObject={{k: 'v'}}
        userAgent="Drops/1"
        javaScriptEnabled={false}
        webviewDebuggingEnabled
        onMessage={onMessage}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onNavigationStateChange={onNavigationStateChange}
        renderLoading={() => <Text>Loading</Text>}
        testID="web"
        allowsInlineMediaPlayback
      />,
    );
    const view = island();
    expect(view.props).toMatchObject({sourceUri: 'https://example.com', injectedObjectJson: '{"k":"v"}', userAgent: 'Drops/1', javaScriptEnabled: false, webviewDebuggingEnabled: true});
    expect(view.props.sourceHtml).toBeUndefined();
    expect(view.props).not.toHaveProperty('allowsInlineMediaPlayback');
    expect(screen.queryByText('Loading')).toBeNull();
    const navigation = {url: 'https://example.com/', title: 'Example', loading: true, canGoBack: false, canGoForward: false};
    await fireEvent(view, 'loadStart', {nativeEvent: navigation});
    expect(onLoadStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Loading')).toBeTruthy();
    await fireEvent(view, 'load', {nativeEvent: {...navigation, loading: false}});
    expect(onLoad).toHaveBeenCalledTimes(1);
    await fireEvent(view, 'loadEnd', {nativeEvent: {...navigation, loading: false}});
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Loading')).toBeNull();
    await fireEvent(view, 'navigationStateChange', {nativeEvent: {...navigation, loading: false}});
    expect(onNavigationStateChange).toHaveBeenCalledWith({...navigation, loading: false});
    await fireEvent(view, 'message', {nativeEvent: {url: 'https://example.com/', title: 'Example', data: 'hello'}});
    expect(onMessage).toHaveBeenCalledTimes(1);
    await fireEvent(view, 'loadStart', {nativeEvent: navigation});
    expect(screen.getByText('Loading')).toBeTruthy();
    await fireEvent(view, 'loadingError', {nativeEvent: {url: 'https://example.com/', title: '', code: 3, description: 'The navigation failed'}});
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({nativeEvent: expect.objectContaining({code: 3})}));
    expect(onLoadEnd).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Loading')).toBeNull();
    await rerender(<WebView source={{html: '<h1>Hi</h1>', baseUrl: 'https://x/'}} startInLoadingState renderLoading={() => <Text>Loading</Text>} testID="web"/>);
    expect(island().props.sourceHtml).toBe('<h1>Hi</h1>');
    expect(island().props.sourceBaseUrl).toBe('https://x/');
    expect(island().props.sourceUri).toBeUndefined();
    expect(island().props.javaScriptEnabled).toBe(true);
    expect(island().props.webviewDebuggingEnabled).toBe(false);
    expect(island().props.injectedObjectJson).toBe('{}');
    expect(RnDefault).toBe(WebView);
  });

  it('is quiet about the events it is not given, and takes no source at all', async () => {
    await render(<WebView testID="web" startInLoadingState/>);
    const view = island();
    expect(view.props.sourceUri).toBeUndefined();
    expect(view.props.sourceHtml).toBeUndefined();
    await fireEvent(view, 'loadStart', {nativeEvent: {}});
    await fireEvent(view, 'loadEnd', {nativeEvent: {}});
    await fireEvent(view, 'loadingError', {nativeEvent: {}});
    await fireEvent(view, 'navigationStateChange', {nativeEvent: {}});
    expect(view.props.testID).toBe('web');
  });

  it('drives the island through its ref, and takes the calls a WebView2 has nothing for', async () => {
    const ref = createRef<WebViewRef>();
    const {unmount} = await render(<WebView ref={ref} source={{uri: 'about:blank'}} testID="web"/>);
    ref.current?.injectJavaScript('run()');
    ref.current?.postMessage('hi');
    ref.current?.reload();
    ref.current?.goBack();
    ref.current?.goForward();
    ref.current?.stopLoading();
    ref.current?.requestFocus();
    ref.current?.clearCache(true);
    ref.current?.clearHistory();
    expect(Commands.injectJavaScript).toHaveBeenCalledWith(expect.anything(), 'run()');
    expect(Commands.postMessage).toHaveBeenCalledWith(expect.anything(), 'hi');
    expect(Commands.reload).toHaveBeenCalledTimes(1);
    expect(Commands.goBack).toHaveBeenCalledTimes(1);
    expect(Commands.goForward).toHaveBeenCalledTimes(1);
    expect(Commands.stopLoading).toHaveBeenCalledTimes(1);
    const handle = ref.current as WebViewRef;
    await unmount();
    handle.reload();
    expect(Commands.reload).toHaveBeenCalledTimes(1);
  });
});
