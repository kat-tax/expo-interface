import {nanoid} from 'nanoid';

/** Public host for shareable drop links. */
export const DROP_ORIGIN = 'dropfiles.io';

/** Drop ids are 20-character nanoids, matching the public share URLs. */
export const DROP_ID_SIZE = 20;

/** Create a new drop id. */
export function createDropId(): string {
  return nanoid(DROP_ID_SIZE);
}

/** Generate a shareable drop URL. */
export function dropUrl(id: string): string {
  return `https://${DROP_ORIGIN}/${id}`;
}
