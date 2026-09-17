import type {NativeMedia, PlayerState, RecorderState} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createAudioModule, recordingUri} from './audio';
import {nextMediaId, sourceUri} from './media';
import {createSpeechModule} from './speech';
import {createVideoModule} from './video';
import {ExpoVideoThumbnails} from './video-thumbnails';

const CACHE = 'file:///C:/Users/me/AppData/Local/Drops/cache/';
const DOCS = 'file:///C:/Users/me/AppData/Local/Drops/documents/';
const IDLE: PlayerState = {playing: false, buffering: false, currentTime: 0, duration: 0, bufferedPosition: 0, volume: 1, muted: false, loop: false, playbackRate: 1, status: 'idle', loaded: false, isLive: false};

/** The engine over maps: players with a state the controls change, recorders with a state, a speech queue that only records. */
function withMedia({refuse = false, fileSystem = true}: {refuse?: boolean; fileSystem?: boolean} = {}) {
  const calls: unknown[][] = [];
  const players = new Map<number, PlayerState>();
  const recorders = new Map<number, RecorderState>();
  let next = 0;
  const media: NativeMedia = {
    createPlayer: vi.fn((uri: string) => {
      if (refuse) return 0;
      const id = ++next;
      players.set(id, {...IDLE, status: uri ? 'loading' : 'idle', duration: uri ? 12 : 0});
      calls.push(['createPlayer', uri]);
      return id;
    }),
    releasePlayer: vi.fn((id: number) => {
      calls.push(['releasePlayer', id]);
      return players.delete(id);
    }),
    setSource: vi.fn((id: number, uri: string) => {
      calls.push(['setSource', id, uri]);
      const state = players.get(id);
      if (state) state.duration = uri ? 12 : 0;
      return players.has(id);
    }),
    control: vi.fn((id: number, action: string, value: number) => {
      const state = players.get(id);
      if (!state) return false;
      calls.push(['control', id, action, value]);
      if (action === 'play') Object.assign(state, {playing: true, loaded: true});
      else if (action === 'pause') state.playing = false;
      else if (action === 'seek') state.currentTime = value;
      else if (action === 'seekBy') state.currentTime += value;
      else if (action === 'replay') Object.assign(state, {currentTime: 0, playing: true});
      else if (action === 'loop') state.loop = value !== 0;
      else if (action === 'muted') state.muted = value !== 0;
      else if (action === 'volume') state.volume = value;
      else if (action === 'rate') state.playbackRate = value;
      return true;
    }),
    playerState: vi.fn((id: number) => players.get(id) ?? null),
    setNowPlaying: vi.fn((id: number, active: boolean, metadata: object | null) => {
      calls.push(['setNowPlaying', id, active, metadata]);
      return true;
    }),
    thumbnail: vi.fn(async (uri: string, timeMs: number, maxWidth: number, maxHeight: number, quality: number) => {
      if (uri.includes('bad')) throw new Error('The file has no video');
      calls.push(['thumbnail', uri, timeMs, maxWidth, maxHeight, quality]);
      return {uri: `${uri}#${timeMs}`, width: maxWidth || 640, height: maxHeight || 360, actualTime: timeMs + 1};
    }),
    speak: vi.fn((id: string, text: string, options: object) => {
      calls.push(['speak', id, text, options]);
    }),
    speechControl: vi.fn((action: string) => {
      calls.push(['speechControl', action]);
      return true;
    }),
    isSpeaking: vi.fn(() => true),
    voices: vi.fn(async () => [{identifier: 'v1', name: 'Zira', quality: 'Default', language: 'en-US'}]),
    prepareRecorder: vi.fn(async (id: number, uri: string, inputId: string) => {
      calls.push(['prepareRecorder', id, uri, inputId]);
      if (inputId === 'bad') throw new Error('No microphone');
      recorders.set(id, {canRecord: true, isRecording: false, durationMillis: 0, url: uri});
      return true;
    }),
    recorderControl: vi.fn(async (id: number, action: string) => {
      const recorder = recorders.get(id);
      if (!recorder) throw new Error('The recorder is not prepared');
      calls.push(['recorderControl', id, action]);
      if (action === 'record') recorder.isRecording = true;
      else if (action === 'pause') recorder.isRecording = false;
      else if (action === 'stop') Object.assign(recorder, {isRecording: false, canRecord: false, durationMillis: 1500});
      return {url: recorder.url as string, durationMillis: recorder.durationMillis};
    }),
    recorderState: vi.fn((id: number) => recorders.get(id) ?? {canRecord: false, isRecording: false, durationMillis: 0, url: null}),
    releaseRecorder: vi.fn((id: number) => recorders.delete(id)),
    recordingInputs: vi.fn(async () => [
      {name: 'Mic', type: 'Microphone', uid: 'mic-1'},
      {name: 'Line', type: 'Microphone', uid: 'line-1'},
    ]),
  };
  const files = {getConstants: () => ({cacheDirectory: CACHE, documentDirectory: DOCS, bundleDirectory: '', totalDiskSpace: 0, availableDiskSpace: 0})};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsMedia' ? media : name === 'ExpoWindowsFileSystem' && fileSystem ? files : null) as never);
  return {media, players, recorders, calls};
}

/** Every event a shared object emits, in order. */
function listen<T extends {addListener(name: never, listener: never): unknown}>(target: T, names: string[]): [string, unknown][] {
  const heard: [string, unknown][] = [];
  for (const name of names) target.addListener(name as never, ((payload?: unknown) => heard.push([name, payload])) as never);
  return heard;
}

const VIDEO_EVENTS = ['statusChange', 'playingChange', 'playbackRateChange', 'volumeChange', 'mutedChange', 'playToEnd', 'sourceChange', 'sourceLoad'];

describe('media helpers (windows)', () => {
  it('names a source and numbers what the engine does not', () => {
    expect(sourceUri('file:///C:/a.mp4')).toBe('file:///C:/a.mp4');
    expect(sourceUri({uri: 'https://x/a.mp4'})).toBe('https://x/a.mp4');
    expect(sourceUri({assetId: 3})).toBe('');
    expect(sourceUri(7)).toBe('');
    expect(sourceUri(null)).toBe('');
    expect(sourceUri(undefined)).toBe('');
    const first = nextMediaId();
    expect(nextMediaId()).toBe(first + 1);
  });
});

describe('video (windows)', () => {
  it('plays through the engine: the state, the setters with their events, the engine events, and release', async () => {
    const {media, players, calls} = withMedia();
    const module = createVideoModule();
    const player = new module.VideoPlayer({uri: 'https://x/clip.mp4'}, false, {});
    expect(player.__expo_shared_object_id__).toBe(1);
    expect(player.status).toBe('loading');
    expect(player.playing).toBe(false);
    expect(player.duration).toBe(12);
    const heard = listen(player, VIDEO_EVENTS);
    player.play();
    expect(player.playing).toBe(true);
    player.volume = 0.5;
    player.muted = true;
    player.playbackRate = 1.5;
    player.loop = true;
    player.currentTime = 4;
    player.seekBy(2);
    expect(player.currentTime).toBe(6);
    expect(player.bufferedPosition).toBe(0);
    expect(player.isLive).toBe(false);
    expect([player.volume, player.muted, player.playbackRate, player.loop]).toEqual([0.5, true, 1.5, true]);
    player.pause();
    player.replay();
    expect(player.currentTime).toBe(0);
    expect(heard).toEqual([
      ['volumeChange', {volume: 0.5, oldVolume: 1}],
      ['mutedChange', {muted: true, oldMuted: false}],
      ['playbackRateChange', {playbackRate: 1.5, oldPlaybackRate: 1}],
    ]);
    expect(calls.filter(call => call[0] === 'control').map(call => call.slice(2))).toEqual([['play', 0], ['volume', 0.5], ['muted', 1], ['rate', 1.5], ['loop', 1], ['seek', 4], ['seekBy', 2], ['pause', 0], ['replay', 0]]);
    heard.length = 0;
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'opened', duration: 12});
    DeviceEventEmitter.emit('onMediaEvent', {id: 2, event: 'ended'});
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'state', playing: true, buffering: false});
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'state', playing: true, buffering: true});
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'state', playing: false, buffering: false});
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'ended'});
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'failed', error: 'No codec'});
    expect(heard).toEqual([
      ['statusChange', {status: 'readyToPlay', oldStatus: 'loading'}],
      ['sourceLoad', {videoSource: {uri: 'https://x/clip.mp4'}, duration: 12, availableVideoTracks: [], availableSubtitleTracks: [], availableAudioTracks: []}],
      ['playingChange', {isPlaying: true, oldIsPlaying: false}],
      ['statusChange', {status: 'loading', oldStatus: 'readyToPlay'}],
      ['statusChange', {status: 'readyToPlay', oldStatus: 'loading'}],
      ['playingChange', {isPlaying: false, oldIsPlaying: true}],
      ['playToEnd', undefined],
      ['statusChange', {status: 'error', oldStatus: 'readyToPlay', error: {message: 'No codec'}}],
    ]);
    expect(player.status).toBe('error');
    heard.length = 0;
    player.replace('https://x/other.mp4');
    expect(heard).toEqual([
      ['statusChange', {status: 'loading', oldStatus: 'error'}],
      ['sourceChange', {source: 'https://x/other.mp4', oldSource: {uri: 'https://x/clip.mp4'}}],
    ]);
    await player.replaceAsync(null);
    expect(player.status).toBe('idle');
    expect(media.setSource).toHaveBeenLastCalledWith(1, '');
    player.replace({uri: 'https://x/song.mp4', metadata: {title: 'T', artist: 'A', artwork: 'https://x/art.png'}});
    player.showNowPlayingNotification = true;
    expect(player.showNowPlayingNotification).toBe(true);
    expect(media.setNowPlaying).toHaveBeenLastCalledWith(1, true, {title: 'T', artist: 'A', artworkUrl: 'https://x/art.png'});
    player.replace('https://x/plain.mp4');
    player.showNowPlayingNotification = false;
    expect(media.setNowPlaying).toHaveBeenLastCalledWith(1, false, null);
    player.replace({uri: 'https://x/bare.mp4'});
    player.showNowPlayingNotification = true;
    expect(media.setNowPlaying).toHaveBeenLastCalledWith(1, true, null);
    player.muted = false;
    player.loop = false;
    expect([player.muted, player.loop]).toEqual([false, false]);
    player.preservesPitch = false;
    expect(player.preservesPitch).toBe(false);
    expect([player.currentLiveTimestamp, player.currentOffsetFromLive, player.videoTrack, player.isExternalPlaybackActive]).toEqual([null, null, null, false]);
    expect([player.availableVideoTracks, player.availableAudioTracks, player.availableSubtitleTracks]).toEqual([[], [], []]);
    player.release();
    expect(media.releasePlayer).toHaveBeenCalledWith(1);
    expect(players.has(1)).toBe(false);
    expect(player.playing).toBe(false);
    heard.length = 0;
    DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'ended'});
    expect(heard).toEqual([]);
  });

  it('emits time updates on the interval asked, and takes thumbnails of its source', async () => {
    vi.useFakeTimers();
    try {
      const {calls} = withMedia();
      const module = createVideoModule();
      const player = new module.VideoPlayer('https://x/clip.mp4');
      const heard = listen(player, ['timeUpdate']);
      player.timeUpdateEventInterval = 0.5;
      expect(player.timeUpdateEventInterval).toBe(0.5);
      player.currentTime = 3;
      vi.advanceTimersByTime(500);
      expect(heard).toEqual([['timeUpdate', {currentTime: 3, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0}]]);
      player.timeUpdateEventInterval = 0;
      vi.advanceTimersByTime(1000);
      expect(heard).toHaveLength(1);
      const [first, second] = await player.generateThumbnailsAsync([1, 2.5], {maxWidth: 100});
      expect(first).toBeInstanceOf(module.VideoThumbnail);
      expect(first).toMatchObject({uri: 'https://x/clip.mp4#1000', width: 100, height: 360, requestedTime: 1, actualTime: 1.001, nativeRefType: 'image'});
      expect(second.requestedTime).toBe(2.5);
      expect((await player.generateThumbnailsAsync(3)).length).toBe(1);
      expect(calls.filter(call => call[0] === 'thumbnail')).toEqual([
        ['thumbnail', 'https://x/clip.mp4', 1000, 100, 0, 1],
        ['thumbnail', 'https://x/clip.mp4', 2500, 100, 0, 1],
        ['thumbnail', 'https://x/clip.mp4', 3000, 0, 0, 1],
      ]);
      player.replace(null);
      await expect(player.generateThumbnailsAsync(1)).rejects.toThrow(/no source/);
      player.release();
    } finally {
      vi.useRealTimers();
    }
  });

  it('says no to picture in picture, keeps no cache, and refuses without an engine', async () => {
    withMedia();
    const module = createVideoModule();
    expect(module.isPictureInPictureSupported()).toBe(false);
    await expect(module.setVideoCacheSizeAsync(1)).resolves.toBeUndefined();
    await expect(module.clearVideoCacheAsync()).resolves.toBeUndefined();
    expect(module.getCurrentVideoCacheSize()).toBe(0);
    expect(new module.VideoPlayer().status).toBe('idle');
    withMedia({refuse: true});
    expect(() => new module.VideoPlayer('https://x/clip.mp4')).toThrow(/could not make a player/);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(() => new module.VideoPlayer('https://x/clip.mp4')).toThrow(/Video\.VideoPlayer/);
  });
});

describe('audio (windows)', () => {
  it('plays through the engine with the package status on the interval and at the engine events', () => {
    vi.useFakeTimers();
    try {
      const {media, players, calls} = withMedia();
      const module = createAudioModule();
      const player = new module.AudioPlayer({uri: 'https://x/song.mp3'}, 250);
      expect(player.id).toBe('1');
      const heard = listen(player, ['playbackStatusUpdate']);
      expect(player.currentStatus).toMatchObject({id: '1', playing: false, isLoaded: false, playbackState: 'idle', timeControlStatus: 'paused', duration: 12, didJustFinish: false, error: null});
      player.play();
      expect(player.playing).toBe(true);
      expect(player.paused).toBe(false);
      expect(player.currentStatus.playbackState).toBe('playing');
      vi.advanceTimersByTime(250);
      expect(heard).toHaveLength(1);
      expect(heard[0][1]).toMatchObject({playing: true, isLoaded: true, playbackState: 'playing', timeControlStatus: 'playing'});
      player.muted = true;
      player.loop = true;
      player.volume = 0.2;
      player.playbackRate = 2;
      player.muted = false;
      player.loop = false;
      expect([player.muted, player.loop]).toEqual([false, false]);
      player.muted = true;
      player.loop = true;
      expect([player.muted, player.loop, player.volume, player.playbackRate, player.isBuffering, player.isAudioSamplingSupported]).toEqual([true, true, 0.2, 2, false, false]);
      player.setPlaybackRate(1.5, 'high');
      expect(player.shouldCorrectPitch).toBe(true);
      player.setPlaybackRate(1);
      expect(player.shouldCorrectPitch).toBe(false);
      player.setAudioSamplingEnabled(true);
      DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'ended'});
      expect(heard[1][1]).toMatchObject({didJustFinish: true});
      expect(player.currentStatus.didJustFinish).toBe(true);
      DeviceEventEmitter.emit('onMediaEvent', {id: 9, event: 'ended'});
      expect(heard).toHaveLength(2);
      player.play();
      expect(player.currentStatus.didJustFinish).toBe(false);
      player.pause();
      expect(player.currentStatus.playbackState).toBe('paused');
      player.replace('https://x/next.mp3');
      expect(media.setSource).toHaveBeenLastCalledWith(1, 'https://x/next.mp3');
      void player.seekTo(4);
      expect(player.currentTime).toBe(4);
      player.setActiveForLockScreen(true, {title: 'T'});
      player.updateLockScreenMetadata({artist: 'A'});
      player.clearLockScreenControls();
      player.setActiveForLockScreen(false);
      expect(calls.filter(call => call[0] === 'setNowPlaying')).toEqual([
        ['setNowPlaying', 1, true, {title: 'T'}],
        ['setNowPlaying', 1, true, {artist: 'A'}],
        ['setNowPlaying', 1, false, null],
        ['setNowPlaying', 1, false, null],
      ]);
      players.get(1)!.buffering = true;
      DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'state', playing: false, buffering: true});
      expect(heard[heard.length - 1][1]).toMatchObject({playbackState: 'buffering', timeControlStatus: 'waitingToPlayAtSpecifiedRate', isBuffering: true});
      expect(player.isBuffering).toBe(true);
      Object.assign(players.get(1)!, {buffering: false, loaded: false});
      expect(player.currentStatus.playbackState).toBe('idle');
      player.remove();
      expect(media.releasePlayer).toHaveBeenCalledWith(1);
      vi.advanceTimersByTime(1000);
      const count = heard.length;
      DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'ended'});
      expect(heard).toHaveLength(count);
      expect(player.currentStatus).toMatchObject({playbackState: 'idle', isLoaded: false});
      expect(new module.AudioPlayer(null, 0).duration).toBe(0);
      withMedia({refuse: true});
      expect(() => new module.AudioPlayer('https://x/song.mp3')).toThrow(/could not make a player/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('records through the engine into the cache or the documents, on the input chosen', async () => {
    vi.useFakeTimers();
    try {
      const {media, calls} = withMedia();
      const module = createAudioModule();
      vi.mocked(media.recordingInputs).mockRejectedValueOnce(new Error('No devices'));
      const deaf = new module.AudioRecorder();
      await vi.advanceTimersByTimeAsync(0);
      expect(deaf.getAvailableInputs()).toEqual([]);
      const recorder = new module.AudioRecorder({extension: '.wav'});
      const heard = listen(recorder, ['recordingStatusUpdate']);
      await vi.advanceTimersByTimeAsync(0);
      expect(recorder.getAvailableInputs()).toHaveLength(2);
      await expect(recorder.getCurrentInput()).resolves.toMatchObject({uid: 'mic-1'});
      recorder.setInput('line-1');
      await expect(recorder.getCurrentInput()).resolves.toMatchObject({uid: 'line-1'});
      expect(recorder.getStatus()).toEqual({canRecord: false, isRecording: false, durationMillis: 0, url: null, mediaServicesDidReset: false});
      expect([recorder.currentTime, recorder.isRecording, recorder.uri]).toEqual([0, false, null]);
      await recorder.prepareToRecordAsync({directory: 'document', isMeteringEnabled: true});
      const prepared = calls.find(call => call[0] === 'prepareRecorder') as unknown[];
      expect(prepared[2]).toMatch(new RegExp(`^${DOCS}recording-[0-9a-f-]{36}\\.wav$`));
      expect(prepared[3]).toBe('line-1');
      expect(recorder.getStatus()).toMatchObject({canRecord: true, metering: -160, url: prepared[2]});
      recorder.record();
      await vi.advanceTimersByTimeAsync(0);
      expect(recorder.isRecording).toBe(true);
      recorder.pause();
      await vi.advanceTimersByTimeAsync(0);
      expect(recorder.isRecording).toBe(false);
      recorder.record({atTime: 1, forDuration: 2});
      await vi.advanceTimersByTimeAsync(1000);
      expect(recorder.isRecording).toBe(true);
      await vi.advanceTimersByTimeAsync(2000);
      expect(recorder.isRecording).toBe(false);
      expect(recorder.currentTime).toBe(1.5);
      expect(heard).toEqual([['recordingStatusUpdate', {id: recorder.id, isFinished: true, hasError: false, error: null, url: prepared[2]}]]);
      expect(calls.filter(call => call[0] === 'recorderControl').map(call => call[2])).toEqual(['record', 'pause', 'record', 'stop']);
      recorder.startRecordingAtTime(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(recorder.isRecording).toBe(true);
      vi.mocked(media.recorderControl).mockRejectedValueOnce(new Error('Gone'));
      recorder.recordForDuration(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(heard).toHaveLength(3);
      expect(heard[1][1]).toMatchObject({hasError: true, error: 'Gone'});
      expect(heard[2][1]).toMatchObject({hasError: false, isFinished: true});
      recorder.recordForDuration(1);
      vi.mocked(media.recorderControl).mockRejectedValueOnce('Lost');
      await vi.advanceTimersByTimeAsync(1000);
      expect(heard).toHaveLength(4);
      expect(heard[3][1]).toMatchObject({hasError: true, error: 'Lost'});
      recorder.recordForDuration(1);
      recorder.release();
      expect(media.releaseRecorder).toHaveBeenCalledWith(Number(recorder.id));
      await vi.advanceTimersByTimeAsync(5000);
      expect(heard).toHaveLength(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a failed capture, a missing input, and the file system it needs', async () => {
    const {media} = withMedia();
    const module = createAudioModule();
    const recorder = new module.AudioRecorder();
    const heard = listen(recorder, ['recordingStatusUpdate']);
    recorder.setInput('bad');
    await expect(recorder.prepareToRecordAsync()).rejects.toThrow('No microphone');
    recorder.record();
    recorder.pause();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(heard).toEqual([
      ['recordingStatusUpdate', {id: recorder.id, isFinished: true, hasError: true, error: 'The recorder is not prepared', url: null}],
      ['recordingStatusUpdate', {id: recorder.id, isFinished: true, hasError: true, error: 'The recorder is not prepared', url: null}],
    ]);
    await expect(recorder.stop()).rejects.toThrow('not prepared');
    expect(heard).toHaveLength(3);
    vi.mocked(media.recordingInputs).mockResolvedValue([]);
    const bare = new module.AudioRecorder();
    await expect(bare.getCurrentInput()).rejects.toThrow(/No audio input/);
    await bare.prepareToRecordAsync();
    expect(media.prepareRecorder).toHaveBeenLastCalledWith(Number(bare.id), expect.stringMatching(/recording-/), '');
    expect(recordingUri({})).toMatch(new RegExp(`^${CACHE}recording-[0-9a-f-]{36}\\.m4a$`));
    expect(recordingUri({extension: 'mp3'})).toMatch(/\.mp3$/);
    withMedia({fileSystem: false});
    expect(() => recordingUri({})).toThrow(/AudioRecorder\.prepareToRecordAsync/);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(() => new module.AudioRecorder()).toThrow(/Audio\.AudioRecorder/);
  });

  it('runs a playlist over one player at a time, with the loop modes and the edits', () => {
    vi.useFakeTimers();
    try {
      const {media} = withMedia();
      const module = createAudioModule();
      const playlist = new module.AudioPlaylist(['https://x/1.mp3', {uri: 'https://x/2.mp3'}], 100, 'none');
      const heard = listen(playlist, ['playlistStatusUpdate', 'trackChanged']);
      expect(playlist.sources).toEqual([{uri: 'https://x/1.mp3'}, {uri: 'https://x/2.mp3'}]);
      expect([playlist.currentIndex, playlist.trackCount, playlist.playing, playlist.isLoaded, playlist.isBuffering, playlist.currentTime, playlist.duration]).toEqual([0, 2, false, false, false, 0, 0]);
      playlist.muted = true;
      playlist.volume = 0.5;
      playlist.playbackRate = 1.25;
      playlist.play();
      playlist.muted = true;
      playlist.volume = 0.5;
      playlist.playbackRate = 1.25;
      DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'state', playing: true, buffering: false});
      expect(playlist.currentIndex).toBe(0);
      expect(playlist.playing).toBe(true);
      expect([playlist.muted, playlist.volume, playlist.playbackRate, playlist.isLoaded, playlist.duration]).toEqual([true, 0.5, 1.25, true, 12]);
      expect(media.createPlayer).toHaveBeenLastCalledWith('https://x/1.mp3');
      vi.advanceTimersByTime(100);
      expect(heard[0]).toEqual(['playlistStatusUpdate', {id: playlist.id, currentIndex: 0, trackCount: 2, currentTime: 0, duration: 12, playing: true, isBuffering: false, isLoaded: true, playbackRate: 1.25, muted: true, volume: 0.5, loop: 'none'}]);
      void playlist.seekTo(3);
      expect(playlist.currentTime).toBe(3);
      DeviceEventEmitter.emit('onMediaEvent', {id: 1, event: 'ended'});
      expect(playlist.currentIndex).toBe(1);
      expect(playlist.playing).toBe(true);
      expect(heard.filter(([name]) => name === 'trackChanged')).toEqual([['trackChanged', {previousIndex: 0, currentIndex: 1}]]);
      DeviceEventEmitter.emit('onMediaEvent', {id: 2, event: 'ended'});
      expect(playlist.currentIndex).toBe(1);
      playlist.loop = 'all';
      DeviceEventEmitter.emit('onMediaEvent', {id: 2, event: 'ended'});
      expect(playlist.currentIndex).toBe(0);
      playlist.loop = 'single';
      DeviceEventEmitter.emit('onMediaEvent', {id: 3, event: 'ended'});
      expect(playlist.currentIndex).toBe(0);
      expect(playlist.playing).toBe(true);
      playlist.pause();
      expect(playlist.playing).toBe(false);
      playlist.loop = 'all';
      playlist.next();
      expect(playlist.currentIndex).toBe(1);
      expect(playlist.playing).toBe(false);
      playlist.next();
      expect(playlist.currentIndex).toBe(0);
      playlist.previous();
      expect(playlist.currentIndex).toBe(1);
      playlist.previous();
      expect(playlist.currentIndex).toBe(0);
      playlist.loop = 'none';
      playlist.previous();
      expect(playlist.currentIndex).toBe(0);
      playlist.skipTo(1);
      playlist.next();
      expect(playlist.currentIndex).toBe(1);
      expect(() => playlist.skipTo(5)).toThrow(RangeError);
      playlist.add('https://x/3.mp3');
      playlist.add([{uri: 'https://x/4.mp3'}, null]);
      expect(playlist.sources[playlist.sources.length - 1]).toEqual({uri: undefined});
      playlist.remove(playlist.trackCount - 1);
      playlist.insert('https://x/0.mp3', 0);
      expect(playlist.currentIndex).toBe(2);
      expect(playlist.trackCount).toBe(5);
      playlist.remove(0);
      expect(playlist.currentIndex).toBe(1);
      playlist.remove(9);
      playlist.play();
      playlist.remove(1);
      expect(playlist.currentIndex).toBe(1);
      expect(playlist.playing).toBe(true);
      playlist.remove(2);
      playlist.pause();
      playlist.remove(1);
      expect(playlist.currentIndex).toBe(0);
      expect(playlist.playing).toBe(false);
      playlist.clear();
      expect([playlist.trackCount, playlist.currentIndex, playlist.playing]).toEqual([0, 0, false]);
      playlist.play();
      playlist.next();
      playlist.previous();
      playlist.destroy();
      vi.advanceTimersByTime(500);
      const silent = new module.AudioPlaylist([], 0);
      silent.insert('https://x/a.mp3', 0);
      expect(silent.currentIndex).toBe(0);
      silent.release();
      vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
      expect(() => new module.AudioPlaylist()).toThrow(/Audio\.AudioPlaylist/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers the module functions, and says the stream is another platform\'s', async () => {
    withMedia();
    const module = createAudioModule();
    await expect(module.setIsAudioActiveAsync(true)).resolves.toBeUndefined();
    await expect(module.setAudioModeAsync({})).resolves.toBeUndefined();
    await expect(module.requestRecordingPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(module.getRecordingPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(module.requestNotificationPermissionsAsync()).resolves.toMatchObject({granted: true});
    await module.preload('https://x/a.mp3');
    await module.preload({uri: 'https://x/b.mp3'}, 5);
    await module.preload(null);
    await expect(module.getPreloadedSources()).resolves.toEqual(['https://x/a.mp3', 'https://x/b.mp3']);
    await module.clearPreloadedSource('https://x/a.mp3');
    await expect(module.getPreloadedSources()).resolves.toEqual(['https://x/b.mp3']);
    await module.clearAllPreloadedSources();
    await expect(module.getPreloadedSources()).resolves.toEqual([]);
    expect(() => new module.AudioStream({})).toThrow(/Audio\.AudioStream/);
  });
});

describe('speech (windows)', () => {
  it('speaks through the engine with the options it takes, relays its events, and drives the queue', async () => {
    const {media, calls} = withMedia();
    const module = createSpeechModule();
    expect(module.maxSpeechInputLength).toBe(32767);
    await module.speak('1', 'Hello', {language: 'en-US', pitch: 1.2, rate: 0.9, volume: 0.8, voice: 'v1', onDone: () => {}});
    expect(calls).toEqual([['speak', '1', 'Hello', {language: 'en-US', pitch: 1.2, rate: 0.9, volume: 0.8, voice: 'v1'}]]);
    await module.speak('2', 'Again');
    await expect(module.getVoices()).resolves.toEqual([{identifier: 'v1', name: 'Zira', quality: 'Default', language: 'en-US'}]);
    await expect(module.isSpeaking()).resolves.toBe(true);
    await module.pause();
    await module.resume();
    await module.stop();
    expect(vi.mocked(media.speechControl).mock.calls.map(call => call[0])).toEqual(['pause', 'resume', 'stop']);
    const heard = listen(module, ['Exponent.speakingStarted', 'Exponent.speakingDone', 'Exponent.speakingStopped', 'Exponent.speakingError']);
    module.startObserving();
    module.startObserving();
    DeviceEventEmitter.emit('onSpeechEvent', {id: '1', event: 'started'});
    DeviceEventEmitter.emit('onSpeechEvent', {id: '1', event: 'done'});
    DeviceEventEmitter.emit('onSpeechEvent', {id: '2', event: 'stopped'});
    DeviceEventEmitter.emit('onSpeechEvent', {id: '3', event: 'error', error: 'No voice'});
    DeviceEventEmitter.emit('onSpeechEvent', {id: '4', event: 'error'});
    module.stopObserving();
    DeviceEventEmitter.emit('onSpeechEvent', {id: '5', event: 'started'});
    expect(heard).toEqual([
      ['Exponent.speakingStarted', {id: '1'}],
      ['Exponent.speakingDone', {id: '1'}],
      ['Exponent.speakingStopped', {id: '2'}],
      ['Exponent.speakingError', {id: '3', error: 'No voice'}],
      ['Exponent.speakingError', {id: '4', error: 'The speech failed'}],
    ]);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(module.isSpeaking()).resolves.toBe(false);
    await expect(module.stop()).resolves.toBeUndefined();
    await expect(module.speak('1', 'x')).rejects.toThrow(/Speech\.speak/);
    await expect(module.getVoices()).rejects.toThrow(/Speech\.getVoices/);
    await expect(module.pause()).rejects.toThrow(/Speech\.pause/);
    await expect(module.resume()).rejects.toThrow(/Speech\.resume/);
  });
});

describe('video thumbnails (windows)', () => {
  it('takes a frame at the time and quality asked, and says when there is no engine', async () => {
    const {calls} = withMedia();
    await expect(ExpoVideoThumbnails.getThumbnail('https://x/clip.mp4', {time: 1500, quality: 0.5, headers: {a: 'b'}})).resolves.toEqual({uri: 'https://x/clip.mp4#1500', width: 640, height: 360});
    await ExpoVideoThumbnails.getThumbnail('file:///C:/clip.mp4');
    expect(calls).toEqual([
      ['thumbnail', 'https://x/clip.mp4', 1500, 0, 0, 0.5],
      ['thumbnail', 'file:///C:/clip.mp4', 0, 0, 0, 1],
    ]);
    await expect(ExpoVideoThumbnails.getThumbnail('https://x/bad.mp4')).rejects.toThrow(/no video/);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoVideoThumbnails.getThumbnail('https://x/clip.mp4')).rejects.toThrow(/VideoThumbnails\.getThumbnail/);
  });
});
