import {Platform, Share} from 'react-native';

/**
 * Opens the native share sheet (iOS/Android) or the Web Share API.
 * Falls back silently if the user cancels or sharing is unavailable.
 */
export async function shareUrl(url: string, message?: string) {
  try {
    if (Platform.OS === 'ios') {
      await Share.share({url, message});
    } else {
      await Share.share({message: message ? `${message}\n${url}` : url});
    }
  } catch {
    // Cancelled or unsupported — nothing to do.
  }
}

/**
 * Copies text to the clipboard. Uses the Web Clipboard API on web; on native,
 * where no clipboard module is linked, falls back to the share sheet.
 * Resolves to `true` when copied to the clipboard.
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = globalThis.navigator?.clipboard;
  if (Platform.OS === 'web' && clipboard) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  await shareUrl(text);
  return false;
}
