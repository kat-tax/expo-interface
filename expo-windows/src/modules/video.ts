import type {EmitterSubscription} from 'react-native';
import type {SharedObject, SharedRef} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {MediaEvent, NativeMedia, PlayerState} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {nativeModuleClass} from './base';
import {type MediaSource, mediaLibrary, sourceUri} from './media';

type Status = PlayerState['status'];

export type VideoPlayerEvents = {
  statusChange(payload: {status: Status; oldStatus?: Status; error?: {message: string}}): void;
  playingChange(payload: {isPlaying: boolean; oldIsPlaying?: boolean}): void;
  playbackRateChange(payload: {playbackRate: number; oldPlaybackRate?: number}): void;
  volumeChange(payload: {volume: number; oldVolume?: number}): void;
  mutedChange(payload: {muted: boolean; oldMuted?: boolean}): void;
  playToEnd(): void;
  timeUpdate(payload: {currentTime: number; currentLiveTimestamp: number | null; currentOffsetFromLive: number | null; bufferedPosition: number}): void;
  sourceChange(payload: {source: MediaSource; oldSource?: MediaSource}): void;
  sourceLoad(payload: {videoSource: MediaSource; duration: number; availableVideoTracks: never[]; availableSubtitleTracks: never[]; availableAudioTracks: never[]}): void;
  availableSubtitleTracksChange(payload: {availableSubtitleTracks: never[]; oldAvailableSubtitleTracks: never[]}): void;
  isExternalPlaybackActiveChange(payload: {isExternalPlaybackActive: boolean; oldIsExternalPlaybackActive?: boolean}): void;
};

const IDLE: PlayerState = {playing: false, buffering: false, currentTime: 0, duration: 0, bufferedPosition: 0, volume: 1, muted: false, loop: false, playbackRate: 1, status: 'idle', loaded: false, isLive: false};

/**
 * `ExpoVideo`, what `expo-video` plays through: `VideoPlayer` over a
 * player of the runtime's media engine (`Windows.Media.Playback`), whose
 * id the `VideoView` island shows; `VideoThumbnail` from a frame the
 * engine renders. The properties read the engine's state as they are
 * read; the engine's events and the setters become the package's events.
 * Picture in picture, caching, subtitle and audio tracks and external
 * playback are other platforms': the first says no, the rest are empty.
 */
export function createVideoModule() {
  const Base = nativeModuleClass();
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;
  const Ref = globalThis.expo.SharedRef as typeof SharedRef;

  class VideoThumbnail extends Ref<'image'> {
    override nativeRefType = 'image';
    constructor(
      readonly uri: string,
      readonly width: number,
      readonly height: number,
      readonly requestedTime: number,
      readonly actualTime: number,
    ) {
      super();
    }
  }

  class VideoPlayer extends Shared<VideoPlayerEvents> {
    /** What `VideoView` passes to the island: the engine's id for this player. */
    readonly __expo_shared_object_id__: number;
    private readonly media: NativeMedia;
    private readonly id: number;
    private source: MediaSource;
    private subscription: EmitterSubscription | null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private interval = 0;
    private last: {status: Status; playing: boolean} = {status: 'idle', playing: false};
    private pitch = true;
    private nowPlaying = false;
    // Accepted and kept, without effect: other platforms' concerns.
    audioMixingMode: 'mixWithOthers' | 'duckOthers' | 'auto' | 'doNotMix' = 'auto';
    allowsExternalPlayback = false;
    staysActiveInBackground = false;
    keepScreenOnWhilePlaying = false;
    targetOffsetFromLive = 0;
    bufferOptions: object = {};
    subtitleTrack: null = null;
    audioTrack: null = null;
    seekTolerance: object = {};
    scrubbingModeOptions: object = {};

    constructor(source: MediaSource = null, _useSynchronousReplace?: boolean, _playerBuilderOptions?: object) {
      super();
      this.media = mediaLibrary('Video', 'VideoPlayer');
      this.source = source;
      this.id = this.media.createPlayer(sourceUri(source));
      if (!this.id) throw new Error('The media engine could not make a player');
      this.__expo_shared_object_id__ = this.id;
      if (sourceUri(source)) this.last.status = 'loading';
      this.subscription = DeviceEventEmitter.addListener('onMediaEvent', (event: MediaEvent) => this.onNative(event));
    }

    private state(): PlayerState {
      return this.media.playerState(this.id) ?? IDLE;
    }

    get playing(): boolean {
      return this.state().playing;
    }
    get currentTime(): number {
      return this.state().currentTime;
    }
    set currentTime(value: number) {
      this.media.control(this.id, 'seek', value);
    }
    get duration(): number {
      return this.state().duration;
    }
    get bufferedPosition(): number {
      return this.state().bufferedPosition;
    }
    get status(): Status {
      return this.last.status;
    }
    get isLive(): boolean {
      return this.state().isLive;
    }
    get currentLiveTimestamp(): null {
      return null;
    }
    get currentOffsetFromLive(): null {
      return null;
    }
    get volume(): number {
      return this.state().volume;
    }
    set volume(value: number) {
      const oldVolume = this.volume;
      this.media.control(this.id, 'volume', value);
      this.emit('volumeChange', {volume: value, oldVolume});
    }
    get muted(): boolean {
      return this.state().muted;
    }
    set muted(value: boolean) {
      const oldMuted = this.muted;
      this.media.control(this.id, 'muted', value ? 1 : 0);
      this.emit('mutedChange', {muted: value, oldMuted});
    }
    get loop(): boolean {
      return this.state().loop;
    }
    set loop(value: boolean) {
      this.media.control(this.id, 'loop', value ? 1 : 0);
    }
    get playbackRate(): number {
      return this.state().playbackRate;
    }
    set playbackRate(value: number) {
      const oldPlaybackRate = this.playbackRate;
      this.media.control(this.id, 'rate', value);
      this.emit('playbackRateChange', {playbackRate: value, oldPlaybackRate});
    }
    get preservesPitch(): boolean {
      return this.pitch;
    }
    set preservesPitch(value: boolean) {
      this.pitch = value;
    }
    get showNowPlayingNotification(): boolean {
      return this.nowPlaying;
    }
    set showNowPlayingNotification(value: boolean) {
      this.nowPlaying = value;
      const metadata = typeof this.source === 'object' && this.source ? (this.source.metadata ?? null) : null;
      this.media.setNowPlaying(this.id, value, metadata && {title: metadata.title, artist: metadata.artist, artworkUrl: metadata.artwork});
    }
    get timeUpdateEventInterval(): number {
      return this.interval;
    }
    set timeUpdateEventInterval(value: number) {
      this.interval = value;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (value > 0) {
        this.timer = setInterval(() => {
          const {currentTime, bufferedPosition} = this.state();
          this.emit('timeUpdate', {currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition});
        }, value * 1000);
      }
    }
    get videoTrack(): null {
      return null;
    }
    get availableVideoTracks(): never[] {
      return [];
    }
    get availableAudioTracks(): never[] {
      return [];
    }
    get availableSubtitleTracks(): never[] {
      return [];
    }
    get isExternalPlaybackActive(): boolean {
      return false;
    }

    play(): void {
      this.media.control(this.id, 'play', 0);
    }
    pause(): void {
      this.media.control(this.id, 'pause', 0);
    }
    replay(): void {
      this.media.control(this.id, 'replay', 0);
    }
    seekBy(seconds: number): void {
      this.media.control(this.id, 'seekBy', seconds);
    }
    replace(source: MediaSource, _disableWarning?: boolean): void {
      const oldSource = this.source;
      this.source = source;
      const uri = sourceUri(source);
      this.setStatus(uri ? 'loading' : 'idle');
      this.media.setSource(this.id, uri);
      this.emit('sourceChange', {source, oldSource});
    }
    async replaceAsync(source: MediaSource): Promise<void> {
      this.replace(source, true);
    }
    async generateThumbnailsAsync(times: number | number[], options: {maxWidth?: number; maxHeight?: number} = {}): Promise<VideoThumbnail[]> {
      const uri = sourceUri(this.source);
      if (!uri) throw new Error('The player has no source to take thumbnails of');
      const list = Array.isArray(times) ? times : [times];
      return Promise.all(
        list.map(async time => {
          const frame = await this.media.thumbnail(uri, time * 1000, options.maxWidth ?? 0, options.maxHeight ?? 0, 1);
          return new VideoThumbnail(frame.uri, frame.width, frame.height, time, frame.actualTime / 1000);
        }),
      );
    }

    private setStatus(status: Status, error?: string): void {
      const oldStatus = this.last.status;
      if (status === oldStatus) return;
      this.last.status = status;
      this.emit('statusChange', error === undefined ? {status, oldStatus} : {status, oldStatus, error: {message: error}});
    }

    private onNative(event: MediaEvent): void {
      if (event.id !== this.id) return;
      switch (event.event) {
        case 'opened':
          this.setStatus('readyToPlay');
          this.emit('sourceLoad', {videoSource: this.source, duration: event.duration, availableVideoTracks: [], availableSubtitleTracks: [], availableAudioTracks: []});
          break;
        case 'failed':
          this.setStatus('error', event.error);
          break;
        case 'ended':
          this.emit('playToEnd');
          break;
        case 'state':
          if (event.buffering) this.setStatus('loading');
          else if (this.last.status === 'loading') this.setStatus('readyToPlay');
          if (event.playing !== this.last.playing) {
            const oldIsPlaying = this.last.playing;
            this.last.playing = event.playing;
            this.emit('playingChange', {isPlaying: event.playing, oldIsPlaying});
          }
          break;
      }
    }

    override release(): void {
      this.timeUpdateEventInterval = 0;
      this.subscription?.remove();
      this.subscription = null;
      this.media.releasePlayer(this.id);
      super.release();
    }
  }

  class Module extends Base {
    readonly VideoPlayer = VideoPlayer;
    readonly VideoThumbnail = VideoThumbnail;
    isPictureInPictureSupported(): boolean {
      return false;
    }
    async setVideoCacheSizeAsync(_sizeBytes: number): Promise<void> {}
    async clearVideoCacheAsync(): Promise<void> {}
    getCurrentVideoCacheSize(): number {
      return 0;
    }
  }
  return new Module();
}
