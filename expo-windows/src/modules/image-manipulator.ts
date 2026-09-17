import type {NativeModule, SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {ImageAction, NativeImages} from '../native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';

function library(method: string): NativeImages {
  const images = native.images();
  if (!images) throw new UnavailabilityError('ImageManipulator', method);
  return images;
}

export interface ImageRef {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly nativeRefType: 'image';
  saveAsync(options?: {format?: 'jpeg' | 'png' | 'webp'; compress?: number; base64?: boolean}): Promise<{uri: string; width: number; height: number; base64?: string}>;
}

export interface ImageManipulatorContext {
  resize(size: {width?: number | null; height?: number | null}): ImageManipulatorContext;
  rotate(degrees: number): ImageManipulatorContext;
  flip(flipType: 'vertical' | 'horizontal'): ImageManipulatorContext;
  crop(rect: {originX: number; originY: number; width: number; height: number}): ImageManipulatorContext;
  extent(options: object): ImageManipulatorContext;
  reset(): ImageManipulatorContext;
  renderAsync(): Promise<ImageRef>;
}

export interface ExpoImageManipulatorModule extends InstanceType<NativeModule> {
  Context: new (source: string) => ImageManipulatorContext;
  Image: new (uri: string, width: number, height: number) => ImageRef;
  manipulate(source: string | {uri?: string}): ImageManipulatorContext;
}

/** The URI a source names: a string, or an image reference that carries one. */
export function sourceUri(source: string | {uri?: string}): string {
  if (typeof source === 'string') return source;
  if (source && typeof source.uri === 'string') return source.uri;
  throw new Error('ImageManipulator.manipulate on Windows takes a file URI, or an image with one');
}

/**
 * `ExpoImageManipulator`, what `expo-image-manipulator` transforms through:
 * a context that collects resize, crop, rotate and flip, rendered in one
 * pass by the runtime's library (the system's codecs) into the app's
 * cache, and an image reference that saves as JPEG or PNG at the quality
 * asked, with the bytes as base64 when wanted. Rotation is by quarter
 * turns and `extent` is web's; both say so.
 */
export function createImageManipulatorModule(): ExpoImageManipulatorModule {
  const Base = nativeModuleClass();
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;

  class Image extends Shared implements ImageRef {
    readonly nativeRefType = 'image' as const;
    constructor(
      readonly uri: string,
      readonly width: number,
      readonly height: number,
    ) {
      super();
    }
    async saveAsync(options: {format?: 'jpeg' | 'png' | 'webp'; compress?: number; base64?: boolean} = {}): Promise<{uri: string; width: number; height: number; base64?: string}> {
      return library('saveAsync').manipulate(this.uri, [], options.format ?? 'jpeg', options.compress ?? 1, options.base64 ?? false);
    }
  }

  class Context extends Shared implements ImageManipulatorContext {
    private actions: ImageAction[] = [];
    constructor(private readonly source: string) {
      super();
    }
    resize(size: {width?: number | null; height?: number | null}): this {
      this.actions.push({resize: size});
      return this;
    }
    rotate(degrees: number): this {
      this.actions.push({rotate: degrees});
      return this;
    }
    flip(flipType: 'vertical' | 'horizontal'): this {
      this.actions.push({flip: flipType});
      return this;
    }
    crop(rect: {originX: number; originY: number; width: number; height: number}): this {
      this.actions.push({crop: rect});
      return this;
    }
    extent(options: object): this {
      this.actions.push({extent: options});
      return this;
    }
    reset(): this {
      this.actions = [];
      return this;
    }
    async renderAsync(): Promise<ImageRef> {
      const rendered = await library('renderAsync').manipulate(this.source, this.actions, 'png', 1, false);
      return new Image(rendered.uri, rendered.width, rendered.height);
    }
  }

  class Module extends Base implements ExpoImageManipulatorModule {
    readonly Context = Context;
    readonly Image = Image;
    manipulate(source: string | {uri?: string}): ImageManipulatorContext {
      return new Context(sourceUri(source));
    }
  }
  return new Module();
}
