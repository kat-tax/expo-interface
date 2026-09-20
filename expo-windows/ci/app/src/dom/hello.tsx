'use dom';

import type {DOMProps} from 'expo/dom';

/**
 * A DOM component: this file renders in a web view (`@expo/dom-webview`,
 * the WebView2 island on Windows) and talks to the native side through
 * Expo's bridge — `name` comes in as a marshalled prop, `onHello` goes out
 * as a native action.
 */
export default function Hello({name, onHello}: {name: string; onHello: (from: string) => Promise<void>; dom?: DOMProps}) {
  return (
    <div style={{fontFamily: 'Segoe UI, sans-serif', padding: 12}}>
      <h2 style={{margin: '0 0 8px'}}>Hello from the DOM, {name}</h2>
      <button id="hello" type="button" onClick={() => onHello('the page')}>
        Say hello to native
      </button>
    </div>
  );
}
