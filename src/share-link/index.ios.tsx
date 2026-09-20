import type {ShareLinkProps} from './types';
import {ShareLink as SwiftUIShareLink} from '@expo/ui/swift-ui';
import {Button} from '../button';
import {NativeHost} from '../host';
import {shareContent} from './shared';

/**
 * iOS uses SwiftUI's own `ShareLink`, so the button *is* the system's share
 * control and the sheet is presented by it rather than by the app. Nothing
 * here decides when the sheet opens or what it offers.
 *
 * Its label is the kit's `Button`, so a share button reads like every other
 * button in the kit; `ShareLink` presents from whatever it wraps.
 */
export function ShareLink({label, url, message, title, icon, onShare, testID, ...button}: ShareLinkProps) {
  const content = shareContent({label, url, message, title});
  if (content.empty) {
    return <Button {...button} label={label} prefixIcon={icon} disabled testID={testID}/>;
  }
  return (
    <NativeHost fit>
      <SwiftUIShareLink
        item={content.url || content.message}
        subject={content.title}
        message={content.url ? content.message || undefined : undefined}>
        <Button
          {...button}
          label={label}
          prefixIcon={icon}
          testID={testID}
          // The press belongs to `ShareLink`, which presents the sheet itself.
          onPress={() => onShare?.(true)}
        />
      </SwiftUIShareLink>
    </NativeHost>
  );
}
