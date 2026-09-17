import {createRef} from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import VideoView, {NativeTextureVideoView, type VideoViewRef} from './expo-video-view';
import {Commands} from '../windows/specs/ExpoWindowsVideoViewNativeComponent';

beforeEach(() => {
  for (const name of Object.keys(Commands) as (keyof typeof Commands)[]) vi.spyOn(Commands, name).mockImplementation(() => {});
});

describe('expo-video view (windows)', () => {
  it('shows the player in the island with the props it takes, drops the rest, relays the events and answers the ref', async () => {
    const ref = createRef<VideoViewRef>();
    const onFullscreenEnter = vi.fn();
    const onFullscreenExit = vi.fn();
    const onFirstFrameRender = vi.fn();
    const {unmount} = await render(
      <VideoView
        ref={ref}
        player={7}
        testID="video"
        contentFit="cover"
        allowsPictureInPicture
        fullscreenOptions={{enable: true}}
        onFullscreenEnter={onFullscreenEnter}
        onFullscreenExit={onFullscreenExit}
        onFirstFrameRender={onFirstFrameRender}
      />,
    );
    const island = screen.getByTestId('video');
    expect(island.props.player).toBe(7);
    expect(island.props.nativeControls).toBe(true);
    expect(island.props.contentFit).toBe('cover');
    expect(island.props).not.toHaveProperty('allowsPictureInPicture');
    expect(island.props).not.toHaveProperty('fullscreenOptions');
    await fireEvent(island, 'fullscreenEnter', {nativeEvent: {}});
    await fireEvent(island, 'fullscreenExit', {nativeEvent: {}});
    await fireEvent(island, 'firstFrameRender', {nativeEvent: {}});
    expect(onFullscreenEnter).toHaveBeenCalledTimes(1);
    expect(onFullscreenExit).toHaveBeenCalledTimes(1);
    expect(onFirstFrameRender).toHaveBeenCalledTimes(1);
    const handle = ref.current as VideoViewRef;
    await handle.enterFullscreen();
    await handle.exitFullscreen();
    expect(Commands.enterFullscreen).toHaveBeenCalledTimes(1);
    expect(Commands.exitFullscreen).toHaveBeenCalledTimes(1);
    await expect(handle.startPictureInPicture()).rejects.toThrow(/VideoView\.startPictureInPicture/);
    await expect(handle.stopPictureInPicture()).rejects.toThrow(/VideoView\.stopPictureInPicture/);
    await unmount();
    await handle.enterFullscreen();
    await handle.exitFullscreen();
    expect(Commands.enterFullscreen).toHaveBeenCalledTimes(1);
    expect(Commands.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(NativeTextureVideoView).toBeNull();
  });

  it('shows nothing for no player, and takes the events without handlers', async () => {
    await render(<VideoView testID="bare" nativeControls={false} />);
    const island = screen.getByTestId('bare');
    expect(island.props.player).toBe(0);
    expect(island.props.nativeControls).toBe(false);
    expect(island.props.contentFit).toBe('contain');
    await fireEvent(island, 'fullscreenEnter', {nativeEvent: {}});
    await fireEvent(island, 'fullscreenExit', {nativeEvent: {}});
    await fireEvent(island, 'firstFrameRender', {nativeEvent: {}});
  });
});
