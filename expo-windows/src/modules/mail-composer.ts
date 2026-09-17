import {Linking} from 'react-native';

export type MailComposerOptions = {
  recipients?: string[] | string;
  ccRecipients?: string[] | string;
  bccRecipients?: string[] | string;
  subject?: string;
  body?: string;
  isHtml?: boolean;
  attachments?: string[];
};

function list(value: string[] | string | undefined): string {
  if (!value) return '';
  return (Array.isArray(value) ? value : [value]).join(',');
}

/**
 * The `mailto:` link for the options: the recipients as the address, the
 * copies, the subject and the body as its query — what every mail client on
 * Windows takes from the shell. Attachments have no place in a link.
 */
export function mailtoUrl(options: MailComposerOptions): string {
  const query: string[] = [];
  const add = (key: string, value: string | undefined) => {
    if (value) query.push(`${key}=${encodeURIComponent(value)}`);
  };
  add('cc', list(options.ccRecipients));
  add('bcc', list(options.bccRecipients));
  add('subject', options.subject);
  add('body', options.body);
  return `mailto:${list(options.recipients)}${query.length ? `?${query.join('&')}` : ''}`;
}

/**
 * `ExpoMailComposer`, what `expo-mail-composer` composes through: the
 * default mail client, opened on a `mailto:` link through the shell. What
 * the user then does with the draft is not reported back, so the status is
 * `undetermined`, as it is on web; the clients are not enumerable.
 */
export const ExpoMailComposer = {
  getClients(): never[] {
    return [];
  },
  async composeAsync(options: MailComposerOptions): Promise<{status: 'undetermined'}> {
    await Linking.openURL(mailtoUrl(options));
    return {status: 'undetermined'};
  },
  async isAvailableAsync(): Promise<boolean> {
    return true;
  },
};
