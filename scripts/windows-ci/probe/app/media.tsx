/**
 * The media packages at work on Windows: a video playing in `expo-video`'s
 * view, a frame of it from `expo-video-thumbnails`, `expo-audio` loading
 * the same clip, and `expo-speech` saying a line with the voices it has.
 */
import {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import {useEvent} from 'expo';
import {Body, Screen, Title} from 'expo-interface';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import * as Speech from 'expo-speech';
import {useVideoPlayer, VideoView} from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';

const CLIP = 'https://www.w3schools.com/html/mov_bbb.mp4';

export default function Media() {
  const player = useVideoPlayer(CLIP, video => {
    video.muted = true;
    video.loop = true;
    video.play();
  });
  const {status} = useEvent(player, 'statusChange', {status: player.status});
  const {isPlaying} = useEvent(player, 'playingChange', {isPlaying: player.playing});
  const audio = useAudioPlayer(CLIP);
  const audioStatus = useAudioPlayerStatus(audio);
  const [thumbnail, setThumbnail] = useState<{uri: string; width: number; height: number} | string>('…');
  const [speech, setSpeech] = useState('…');
  const [voices, setVoices] = useState('…');
  useEffect(() => {
    VideoThumbnails.getThumbnailAsync(CLIP, {time: 1000, quality: 0.8})
      .then(setThumbnail)
      .catch((error: Error) => setThumbnail(`✕ ${error.message}`));
    Speech.getAvailableVoicesAsync()
      .then(list => setVoices(`${list.length} voices · first ${list[0]?.name ?? 'none'} (${list[0]?.language ?? ''})`))
      .catch((error: Error) => setVoices(`✕ ${error.message}`));
    Speech.speak('Windows says hello', {
      onStart: () => setSpeech('started'),
      onDone: () => setSpeech('done'),
      onError: error => setSpeech(`✕ ${error.message}`),
    });
  }, []);
  return (
    <Screen>
      <Title>Media</Title>
      <View style={{width: 320, height: 180, backgroundColor: '#000'}}>
        <VideoView player={player} style={{width: 320, height: 180}} nativeControls testID="video" />
      </View>
      <Body testID="video-status">{`Video ${status} · playing ${isPlaying} · ${Math.round(player.duration)} s`}</Body>
      {typeof thumbnail === 'string' ? (
        <Body testID="thumbnail">{`Thumbnail ${thumbnail}`}</Body>
      ) : (
        <View>
          <Body testID="thumbnail">{`Thumbnail ${thumbnail.width}×${thumbnail.height} at 1 s`}</Body>
          <Image source={{uri: thumbnail.uri}} style={{width: 160, height: 90}} />
        </View>
      )}
      <Body testID="audio">{`Audio loaded ${audioStatus.isLoaded} · ${Math.round(audioStatus.duration)} s · state ${audioStatus.playbackState}`}</Body>
      <Body testID="speech">{`Speech ${speech}`}</Body>
      <Body testID="voices">{`Voices ${voices}`}</Body>
    </Screen>
  );
}
