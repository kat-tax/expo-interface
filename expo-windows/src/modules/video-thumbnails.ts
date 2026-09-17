import {mediaLibrary} from './media';

/**
 * `ExpoVideoThumbnails`, what `expo-video-thumbnails` takes through: a
 * frame of the video at the time asked, from the runtime's media engine,
 * as JPEG at the quality (PNG at 1) in the app's cache. Headers for a
 * remote video are accepted without effect.
 */
export const ExpoVideoThumbnails = {
  async getThumbnail(sourceFilename: string, options: {time?: number; quality?: number; headers?: Record<string, string>} = {}): Promise<{uri: string; width: number; height: number}> {
    const {uri, width, height} = await mediaLibrary('VideoThumbnails', 'getThumbnail').thumbnail(sourceFilename, options.time ?? 0, 0, 0, options.quality ?? 1);
    return {uri, width, height};
  },
};
