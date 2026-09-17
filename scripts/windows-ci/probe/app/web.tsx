/**
 * The web view on Windows: `react-native-webview` over the WebView2 island
 * with a page that posts to the native side and hears back, and an Expo DOM
 * component (`'use dom'`) rendered through `@expo/dom-webview`.
 */
import {useRef, useState} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import {Body, Screen, Title} from 'expo-interface';
import Hello from '../dom/hello';

const PAGE = `<!doctype html>
<html><body style="font: 16px 'Segoe UI', sans-serif; margin: 12px">
<h2 id="heading" style="margin: 0 0 8px">A page in WebView2</h2>
<p id="echo">waiting for the native side</p>
<script>
  var bridge = window.ReactNativeWebView;
  var body = getComputedStyle(document.body);
  bridge.postMessage(JSON.stringify({injected: JSON.parse(bridge.injectedObjectJson()), dark: matchMedia('(prefers-color-scheme: dark)').matches, bg: body.backgroundColor, color: body.color}));
  window.addEventListener('message', function (event) { document.getElementById('echo').textContent = 'native said: ' + event.data; });
</script>
</body></html>`;

export default function Web() {
  const page = useRef<{postMessage(message: string): void}>(null);
  const [fromPage, setFromPage] = useState('…');
  const [fromDom, setFromDom] = useState('…');
  return (
    <Screen>
      <Title>Web</Title>
      <Body testID="from-page">{`page → native: ${fromPage}`}</Body>
      <View style={{height: 140, borderWidth: 1, borderColor: '#888'}}>
        <WebView
          ref={page}
          source={{html: PAGE}}
          injectedJavaScriptObject={{hello: 'world'}}
          onMessage={event => setFromPage(event.nativeEvent.data)}
          onLoadEnd={() => page.current?.postMessage('hello page')}
        />
      </View>
      <Body testID="from-dom">{`dom → native: ${fromDom}`}</Body>
      <View style={{height: 140, borderWidth: 1, borderColor: '#888'}}>
        <Hello name="Windows" onHello={async from => setFromDom(`hello from ${from}`)} dom={{style: {height: 140}}}/>
      </View>
    </Screen>
  );
}
