import type {EmitterSubscription} from 'react-native';
import type {SpeechEvent} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass} from './base';
import {mediaLibrary} from './media';

type SpeechEvents = {
  'Exponent.speakingStarted'(event: {id: string}): void;
  'Exponent.speakingDone'(event: {id: string}): void;
  'Exponent.speakingStopped'(event: {id: string}): void;
  'Exponent.speakingError'(event: {id: string; error: string}): void;
};

export type Voice = {identifier: string; name: string; quality: string; language: string};

export type SpeechOptions = {language?: string; pitch?: number; rate?: number; volume?: number; voice?: string; [key: string]: unknown};

const EVENTS = {started: 'Exponent.speakingStarted', done: 'Exponent.speakingDone', stopped: 'Exponent.speakingStopped', error: 'Exponent.speakingError'} as const;

/**
 * `ExpoSpeech`, what `expo-speech` speaks through: the system's
 * `SpeechSynthesizer` voices, played by the runtime's media engine one
 * utterance after another; `stop` empties the queue, `pause` and `resume`
 * hold the current one. The engine's events become the package's
 * `Exponent.speaking…` events; the word boundary is another platform's.
 */
export function createSpeechModule() {
  const Base = nativeModuleClass();
  class Module extends Base<SpeechEvents> {
    private subscription: EmitterSubscription | null = null;
    readonly maxSpeechInputLength = 32767;

    async speak(id: string, text: string, options: SpeechOptions = {}): Promise<void> {
      const {language, pitch, rate, volume, voice} = options;
      mediaLibrary('Speech', 'speak').speak(id, text, {language, pitch, rate, volume, voice});
    }
    async getVoices(): Promise<Voice[]> {
      return mediaLibrary('Speech', 'getVoices').voices();
    }
    async isSpeaking(): Promise<boolean> {
      return native.media()?.isSpeaking() ?? false;
    }
    async stop(): Promise<void> {
      native.media()?.speechControl('stop');
    }
    async pause(): Promise<void> {
      mediaLibrary('Speech', 'pause').speechControl('pause');
    }
    async resume(): Promise<void> {
      mediaLibrary('Speech', 'resume').speechControl('resume');
    }
    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onSpeechEvent', (event: SpeechEvent) => {
        if (event.event === 'error') this.emit('Exponent.speakingError', {id: event.id, error: event.error ?? 'The speech failed'});
        else this.emit(EVENTS[event.event], {id: event.id});
      });
    }
    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}
