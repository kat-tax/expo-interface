import type {ShareLinkProps} from './types';
import {Share} from 'react-native';
import {Button} from '../button';
import {shareContent} from './shared';

/**
 * Android and web both go through React Native's own `Share`: an
 * `Intent.ACTION_SEND` on Android, and `navigator.share` through
 * react-native-web on the browser. Both are the platform's real sheet, so the
 * kit draws only the button.
 *
 * iOS has its own file, where SwiftUI's `ShareLink` is the button as well as
 * the sheet.
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
        try {
          // `message` carries the link on Android, which has no separate slot
          // for one; web takes both and shows the title in the sheet.
          const result = await Share.share(
            {title: content.title, message: [content.message, content.url].filter(Boolean).join('\n'), url: content.url || undefined},
            {dialogTitle: content.title},
          );
          onShare?.(result.action !== Share.dismissedAction);
        } catch {
          // A sheet that could not open is not an error worth throwing at the
          // app: it is a share that did not happen.
          onShare?.(false);
        }
      }}
    />
  );
}
