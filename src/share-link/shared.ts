import type {ShareLinkProps} from './types';

/**
 * What to hand the platform, from what the caller gave.
 *
 * A share with neither a message nor a link has nothing in it, so the button
 * is disabled rather than opening an empty sheet.
 */
export function shareContent({url, message, title, label}: ShareLinkProps): {
  title: string;
  message: string;
  url: string;
  empty: boolean;
} {
  return {
    title: title ?? label,
    message: message ?? '',
    url: url ?? '',
    empty: !url && !message,
  };
}
