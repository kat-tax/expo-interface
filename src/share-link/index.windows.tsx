import type {ShareLinkProps} from './types';
import {Button} from '../button';
import {shareContent} from './shared';
import {shareModule} from './native.windows';

/**
 * Windows opens the system share sheet through the kit's own module over
 * `DataTransferManager`. React Native's `Share` cannot do it: its JavaScript
 * only dispatches on `ios` and `android`, so on this platform it does nothing
 * at all.
 */
export function ShareLink({label, url, message, title, icon, onShare, testID, ...button}: ShareLinkProps) {
  const content = shareContent({label, url, message, title});
  return (
    <Button
      {...button}
      label={label}
      prefixIcon={icon}
      disabled={button.disabled || content.empty}
      testID={testID}
      onPress={async () => {
        const module = shareModule();
        // A bundle without the kit's native library has no sheet to open, and
        // saying so is better than throwing at the app.
        if (typeof module?.share !== 'function') {
          onShare?.(false);
          return;
        }
        onShare?.(await module.share(content.title, content.message, content.url));
      }}
    />
  );
}
