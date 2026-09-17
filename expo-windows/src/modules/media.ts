import type {NativeMedia} from '../native';
import {native} from '../native';
import {UnavailabilityError} from './base';

/** The media engine, or the package's own error naming what was asked without it. */
export function mediaLibrary(pkg: string, method: string): NativeMedia {
  const media = native.media();
  if (!media) throw new UnavailabilityError(pkg, method);
  return media;
}

export type MediaSource = string | number | null | {uri?: string; headers?: Record<string, string>; metadata?: {title?: string; artist?: string; artwork?: string}; [key: string]: unknown};

/** The URI a media source names; '' for none (a module number is the packages' to resolve first). */
export function sourceUri(source: MediaSource | undefined): string {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object' && typeof source.uri === 'string') return source.uri;
  return '';
}

let nextId = 0;

/** An id of the runtime's own for the objects the engine does not number: recorders, playlists. */
export function nextMediaId(): number {
  return ++nextId;
}
