import type {EmitterSubscription} from 'react-native';
import type {SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {MediaEvent, NativeMedia, PlayerState, RecorderState} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';
import {childUri} from './file-system';
import {type MediaSource, mediaLibrary, nextMediaId, sourceUri} from './media';
import {GRANTED, type PermissionResponse} from './permissions';
import {uuidv4} from '../uuid';

export type AudioStatus = {
  id: string;
  currentTime: number;
  playbackState: string;
  timeControlStatus: string;
  reasonForWaitingToPlay: string;
  mute: boolean;
  duration: number;
  playing: boolean;
  loop: boolean;
  didJustFinish: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  playbackRate: number;
  shouldCorrectPitch: boolean;
  isLive: boolean;
  currentOffsetFromLive: number | null;
  error: string | null;
};

export type RecordingStatus = {id: string; isFinished: boolean; hasError: boolean; error: string | null; url: string | null};

export type RecorderStatus = RecorderState & {mediaServicesDidReset: boolean; metering?: number};

export type RecordingInput = {name: string; type: string; uid: string};

export type RecordingOptions = {directory?: 'cache' | 'document'; extension?: string; isMeteringEnabled?: boolean; [key: string]: unknown};

export type AudioMetadata = {title?: string; artist?: string; albumTitle?: string; artworkUrl?: string};

type AudioEvents = {playbackStatusUpdate(status: AudioStatus): void; audioSampleUpdate(data: {channels: {frames: number[]}[]; timestamp: number}): void};
type RecordingEvents = {recordingStatusUpdate(status: RecordingStatus): void};
type PlaylistEvents = {playlistStatusUpdate(status: AudioPlaylistStatus): void; trackChanged(data: {previousIndex: number; currentIndex: number}): void};

export type AudioPlaylistStatus = {
  id: string;
  currentIndex: number;
  trackCount: number;
  currentTime: number;
  duration: number;
  playing: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  playbackRate: number;
  muted: boolean;
  volume: number;
  loop: 'none' | 'single' | 'all';
};

const IDLE: PlayerState = {playing: false, buffering: false, currentTime: 0, duration: 0, bufferedPosition: 0, volume: 1, muted: false, loop: false, playbackRate: 1, status: 'idle', loaded: false, isLive: false};

/** The recording's file: `recording-<uuid><extension>` in the app's cache or documents. */
export function recordingUri(options: RecordingOptions): string {
  const constants = native.fileSystem()?.getConstants();
  const base = (options.directory === 'document' ? constants?.documentDirectory : constants?.cacheDirectory) ?? '';
  if (!base) throw new UnavailabilityError('Audio', 'AudioRecorder.prepareToRecordAsync');
  const extension = options.extension ?? '.m4a';
  return childUri(base, `recording-${uuidv4()}${extension.startsWith('.') ? extension : `.${extension}`}`);
}

/**
 * `ExpoAudio`, what `expo-audio` plays and records through: `AudioPlayer`
 * over a player of the runtime's media engine with the package's status
 * on the interval asked for, `AudioRecorder` over the engine's capture
 * into the app's cache or documents, `AudioPlaylist` here over one player
 * at a time, and the shell's transport controls for the lock-screen
 * calls. Windows gates the microphone in its privacy settings, so the
 * permissions are granted and a refused capture fails at prepare. The
 * audio mode and activity, sampling and `AudioStream` are other
 * platforms'.
 */
export function createAudioModule() {
  const Base = nativeModuleClass();
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;
  const preloaded = new Set<string>();

  class AudioPlayer extends Shared<AudioEvents> {
    readonly id: string;
    private readonly media: NativeMedia;
    private readonly nativeId: number;
    private source: MediaSource;
    private subscription: EmitterSubscription | null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private finished = false;
    readonly isAudioSamplingSupported = false;
    shouldCorrectPitch = false;

    constructor(source: MediaSource = null, updateInterval = 500, _keepAudioSessionActive = false, _preferredForwardBufferDuration = 0) {
      super();
      this.media = mediaLibrary('Audio', 'AudioPlayer');
      this.source = source;
      this.nativeId = this.media.createPlayer(sourceUri(source));
      if (!this.nativeId) throw new Error('The media engine could not make a player');
      this.id = String(this.nativeId);
      this.subscription = DeviceEventEmitter.addListener('onMediaEvent', (event: MediaEvent) => this.onNative(event));
      if (updateInterval > 0) this.timer = setInterval(() => this.report(), updateInterval);
    }

    private state(): PlayerState {
      return this.media.playerState(this.nativeId) ?? IDLE;
    }

    get playing(): boolean {
      return this.state().playing;
    }
    get paused(): boolean {
      return !this.state().playing;
    }
    get muted(): boolean {
      return this.state().muted;
    }
    set muted(value: boolean) {
      this.media.control(this.nativeId, 'muted', value ? 1 : 0);
    }
    get loop(): boolean {
      return this.state().loop;
    }
    set loop(value: boolean) {
      this.media.control(this.nativeId, 'loop', value ? 1 : 0);
    }
    get duration(): number {
      return this.state().duration;
    }
    get currentTime(): number {
      return this.state().currentTime;
    }
    get isLoaded(): boolean {
      return this.state().loaded;
    }
    get isBuffering(): boolean {
      return this.state().buffering;
    }
    get playbackRate(): number {
      return this.state().playbackRate;
    }
    set playbackRate(value: number) {
      this.media.control(this.nativeId, 'rate', value);
    }
    get volume(): number {
      return this.state().volume;
    }
    set volume(value: number) {
      this.media.control(this.nativeId, 'volume', value);
    }
    get currentStatus(): AudioStatus {
      return this.status(this.finished);
    }

    private status(didJustFinish: boolean): AudioStatus {
      const state = this.state();
      return {
        id: this.id,
        currentTime: state.currentTime,
        playbackState: state.playing ? 'playing' : state.buffering ? 'buffering' : state.loaded ? 'paused' : 'idle',
        timeControlStatus: state.playing ? 'playing' : state.buffering ? 'waitingToPlayAtSpecifiedRate' : 'paused',
        reasonForWaitingToPlay: '',
        mute: state.muted,
        duration: state.duration,
        playing: state.playing,
        loop: state.loop,
        didJustFinish,
        isBuffering: state.buffering,
        isLoaded: state.loaded,
        playbackRate: state.playbackRate,
        shouldCorrectPitch: this.shouldCorrectPitch,
        isLive: state.isLive,
        currentOffsetFromLive: null,
        error: state.error ?? null,
      };
    }

    private report(didJustFinish = false): void {
      this.emit('playbackStatusUpdate', this.status(didJustFinish));
    }

    private onNative(event: MediaEvent): void {
      if (event.id !== this.nativeId) return;
      this.finished = event.event === 'ended';
      this.report(this.finished);
    }

    play(): void {
      this.finished = false;
      this.media.control(this.nativeId, 'play', 0);
    }
    pause(): void {
      this.media.control(this.nativeId, 'pause', 0);
    }
    replace(source: MediaSource): void {
      this.source = source;
      this.finished = false;
      this.media.setSource(this.nativeId, sourceUri(source));
    }
    async seekTo(seconds: number, _toleranceMillisBefore?: number, _toleranceMillisAfter?: number): Promise<void> {
      this.media.control(this.nativeId, 'seek', seconds);
    }
    setPlaybackRate(rate: number, pitchCorrectionQuality?: 'low' | 'medium' | 'high'): void {
      this.shouldCorrectPitch = pitchCorrectionQuality !== undefined;
      this.playbackRate = rate;
    }
    setAudioSamplingEnabled(_enabled: boolean): void {}
    setActiveForLockScreen(active: boolean, metadata?: AudioMetadata): void {
      this.media.setNowPlaying(this.nativeId, active, metadata ?? null);
    }
    updateLockScreenMetadata(metadata: AudioMetadata): void {
      this.media.setNowPlaying(this.nativeId, true, metadata);
    }
    clearLockScreenControls(): void {
      this.media.setNowPlaying(this.nativeId, false, null);
    }
    remove(): void {
      this.release();
    }
    override release(): void {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.subscription?.remove();
      this.subscription = null;
      this.media.releasePlayer(this.nativeId);
      super.release();
    }
  }

  class AudioRecorder extends Shared<RecordingEvents> {
    readonly id: string;
    private readonly media: NativeMedia;
    private readonly nativeId = nextMediaId();
    private options: RecordingOptions;
    private inputs: RecordingInput[] = [];
    private input: string | null = null;
    private timeouts: ReturnType<typeof setTimeout>[] = [];

    constructor(options: RecordingOptions = {}) {
      super();
      this.media = mediaLibrary('Audio', 'AudioRecorder');
      this.options = options;
      this.id = String(this.nativeId);
      this.media
        .recordingInputs()
        .then(inputs => {
          this.inputs = inputs;
        })
        .catch(() => {});
    }

    get currentTime(): number {
      return this.media.recorderState(this.nativeId).durationMillis / 1000;
    }
    get isRecording(): boolean {
      return this.media.recorderState(this.nativeId).isRecording;
    }
    get uri(): string | null {
      return this.media.recorderState(this.nativeId).url;
    }

    async prepareToRecordAsync(options?: RecordingOptions): Promise<void> {
      if (options) this.options = {...this.options, ...options};
      await this.media.prepareRecorder(this.nativeId, recordingUri(this.options), this.input ?? '');
    }
    record(options: {forDuration?: number; atTime?: number} = {}): void {
      const start = () => {
        this.media.recorderControl(this.nativeId, 'record').catch(error => this.fail(error));
        if (options.forDuration) this.later(() => this.stop().catch(() => {}), options.forDuration);
      };
      if (options.atTime) this.later(start, options.atTime);
      else start();
    }
    recordForDuration(seconds: number): void {
      this.record({forDuration: seconds});
    }
    startRecordingAtTime(seconds: number): void {
      this.record({atTime: seconds});
    }
    pause(): void {
      this.media.recorderControl(this.nativeId, 'pause').catch(error => this.fail(error));
    }
    async stop(): Promise<void> {
      this.clearTimeouts();
      try {
        const {url} = await this.media.recorderControl(this.nativeId, 'stop');
        this.emit('recordingStatusUpdate', {id: this.id, isFinished: true, hasError: false, error: null, url});
      } catch (error) {
        this.fail(error);
        throw error;
      }
    }
    getStatus(): RecorderStatus {
      const status: RecorderStatus = {...this.media.recorderState(this.nativeId), mediaServicesDidReset: false};
      if (this.options.isMeteringEnabled) status.metering = -160;
      return status;
    }
    getAvailableInputs(): RecordingInput[] {
      return this.inputs;
    }
    async getCurrentInput(): Promise<RecordingInput> {
      const inputs = this.inputs.length ? this.inputs : (this.inputs = await this.media.recordingInputs());
      const current = inputs.find(input => input.uid === this.input) ?? inputs[0];
      if (!current) throw new Error('No audio input is available');
      return current;
    }
    setInput(inputUid: string): void {
      this.input = inputUid;
    }

    private later(action: () => void, seconds: number): void {
      this.timeouts.push(setTimeout(action, seconds * 1000));
    }
    private clearTimeouts(): void {
      for (const timeout of this.timeouts) clearTimeout(timeout);
      this.timeouts = [];
    }
    private fail(error: unknown): void {
      this.emit('recordingStatusUpdate', {id: this.id, isFinished: true, hasError: true, error: error instanceof Error ? error.message : String(error), url: null});
    }
    override release(): void {
      this.clearTimeouts();
      this.media.releaseRecorder(this.nativeId);
      super.release();
    }
  }

  class AudioPlaylist extends Shared<PlaylistEvents> {
    readonly id = String(nextMediaId());
    private list: MediaSource[];
    private index = 0;
    private player: AudioPlayer | null = null;
    private subscription: {remove(): void} | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private settings = {muted: false, volume: 1, playbackRate: 1};
    loop: 'none' | 'single' | 'all';

    constructor(sources: MediaSource[] = [], updateInterval = 500, loop: 'none' | 'single' | 'all' = 'none') {
      super();
      mediaLibrary('Audio', 'AudioPlaylist');
      this.list = [...sources];
      this.loop = loop;
      if (updateInterval > 0) this.timer = setInterval(() => this.emit('playlistStatusUpdate', this.status()), updateInterval);
    }

    get currentIndex(): number {
      return this.index;
    }
    get trackCount(): number {
      return this.list.length;
    }
    get sources(): {uri?: string; name?: string}[] {
      return this.list.map(source => (typeof source === 'object' && source ? {uri: source.uri} : {uri: sourceUri(source) || undefined}));
    }
    get playing(): boolean {
      return this.player?.playing ?? false;
    }
    get currentTime(): number {
      return this.player?.currentTime ?? 0;
    }
    get duration(): number {
      return this.player?.duration ?? 0;
    }
    get isLoaded(): boolean {
      return this.player?.isLoaded ?? false;
    }
    get isBuffering(): boolean {
      return this.player?.isBuffering ?? false;
    }
    get muted(): boolean {
      return this.settings.muted;
    }
    set muted(value: boolean) {
      this.settings.muted = value;
      if (this.player) this.player.muted = value;
    }
    get volume(): number {
      return this.settings.volume;
    }
    set volume(value: number) {
      this.settings.volume = value;
      if (this.player) this.player.volume = value;
    }
    get playbackRate(): number {
      return this.settings.playbackRate;
    }
    set playbackRate(value: number) {
      this.settings.playbackRate = value;
      if (this.player) this.player.playbackRate = value;
    }

    private status(): AudioPlaylistStatus {
      return {
        id: this.id,
        currentIndex: this.index,
        trackCount: this.list.length,
        currentTime: this.currentTime,
        duration: this.duration,
        playing: this.playing,
        isBuffering: this.isBuffering,
        isLoaded: this.isLoaded,
        playbackRate: this.playbackRate,
        muted: this.muted,
        volume: this.volume,
        loop: this.loop,
      };
    }

    /** The player for the current track, made when the track changes; nothing without tracks. */
    private current(): AudioPlayer | null {
      if (!this.list.length) return null;
      if (this.player) return this.player;
      const player = new AudioPlayer(this.list[this.index], 0);
      player.muted = this.settings.muted;
      player.volume = this.settings.volume;
      player.playbackRate = this.settings.playbackRate;
      this.subscription = player.addListener('playbackStatusUpdate', status => {
        if (status.didJustFinish) this.ended();
      });
      this.player = player;
      return player;
    }
    private drop(): void {
      this.subscription?.remove();
      this.subscription = null;
      this.player?.release();
      this.player = null;
    }
    private ended(): void {
      if (this.loop === 'single') this.player?.play();
      else if (this.index + 1 < this.list.length) this.skipTo(this.index + 1, true);
      else if (this.loop === 'all' && this.list.length) this.skipTo(0, true);
    }

    play(): void {
      this.current()?.play();
    }
    pause(): void {
      this.player?.pause();
    }
    next(): void {
      if (this.index + 1 < this.list.length) this.skipTo(this.index + 1, this.playing);
      else if (this.loop === 'all' && this.list.length) this.skipTo(0, this.playing);
    }
    previous(): void {
      if (this.index > 0) this.skipTo(this.index - 1, this.playing);
      else if (this.loop === 'all' && this.list.length) this.skipTo(this.list.length - 1, this.playing);
    }
    skipTo(index: number, play = this.playing): void {
      if (index < 0 || index >= this.list.length) throw new RangeError(`No track ${index} in a playlist of ${this.list.length}`);
      const previousIndex = this.index;
      this.drop();
      this.index = index;
      if (play) this.current()?.play();
      this.emit('trackChanged', {previousIndex, currentIndex: index});
    }
    async seekTo(seconds: number): Promise<void> {
      await this.current()?.seekTo(seconds);
    }
    add(source: MediaSource | MediaSource[]): void {
      this.list.push(...(Array.isArray(source) ? source : [source]));
    }
    insert(source: MediaSource, index: number): void {
      this.list.splice(index, 0, source);
      if (index <= this.index && this.list.length > 1) this.index += 1;
    }
    remove(index: number): void {
      if (index < 0 || index >= this.list.length) return;
      this.list.splice(index, 1);
      if (index === this.index) {
        const wasPlaying = this.playing;
        this.drop();
        if (this.index >= this.list.length) this.index = Math.max(0, this.list.length - 1);
        if (wasPlaying) this.current()?.play();
      } else if (index < this.index) this.index -= 1;
    }
    clear(): void {
      this.drop();
      this.list = [];
      this.index = 0;
    }
    destroy(): void {
      this.release();
    }
    override release(): void {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.drop();
      super.release();
    }
  }

  class AudioStream extends Shared {
    constructor(_options?: object) {
      super();
      throw new UnavailabilityError('Audio', 'AudioStream');
    }
  }

  class Module extends Base {
    readonly AudioPlayer = AudioPlayer;
    readonly AudioRecorder = AudioRecorder;
    readonly AudioPlaylist = AudioPlaylist;
    readonly AudioStream = AudioStream;
    async setIsAudioActiveAsync(_active: boolean): Promise<void> {}
    async setAudioModeAsync(_mode: object): Promise<void> {}
    async requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
      return GRANTED;
    }
    async getRecordingPermissionsAsync(): Promise<PermissionResponse> {
      return GRANTED;
    }
    async requestNotificationPermissionsAsync(): Promise<PermissionResponse> {
      return GRANTED;
    }
    async preload(source: MediaSource, _preferredForwardBufferDuration?: number): Promise<void> {
      const uri = sourceUri(source);
      if (uri) preloaded.add(uri);
    }
    async clearPreloadedSource(source: MediaSource): Promise<void> {
      preloaded.delete(sourceUri(source));
    }
    async clearAllPreloadedSources(): Promise<void> {
      preloaded.clear();
    }
    async getPreloadedSources(): Promise<string[]> {
      return [...preloaded];
    }
  }
  return new Module();
}
