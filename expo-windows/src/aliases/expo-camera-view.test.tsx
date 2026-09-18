import {createRef} from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {TurboModuleRegistry} from 'react-native';
import CameraView, {type CameraViewRef} from './expo-camera-view';
import {Commands} from '../windows/specs/ExpoWindowsCameraViewNativeComponent';

beforeEach(() => {
  for (const name of Object.keys(Commands) as (keyof typeof Commands)[]) vi.spyOn(Commands, name).mockImplementation(() => {});
});

describe('expo-camera view (windows)', () => {
  it('shows the camera in the island with the props it takes, drops the rest, and relays the ready and error events', async () => {
    const onCameraReady = vi.fn();
    const onMountError = vi.fn();
    await render(<CameraView testID="camera" facing="front" mute zoom={0.5} enableTorch barcodeScannerEnabled ratio="16:9" onCameraReady={onCameraReady} onMountError={onMountError} />);
    const island = screen.getByTestId('camera');
    expect(island.props.facing).toBe('front');
    expect(island.props.mute).toBe(true);
    expect(island.props.zoom).toBe(0.5);
    expect(island.props.enableTorch).toBe(true);
    expect(island.props.active).toBe(true);
    expect(island.props).not.toHaveProperty('barcodeScannerEnabled');
    expect(island.props).not.toHaveProperty('ratio');
    await fireEvent(island, 'cameraReady', {nativeEvent: {}});
    await fireEvent(island, 'mountError', {nativeEvent: {message: 'no camera'}});
    expect(onCameraReady).toHaveBeenCalledTimes(1);
    expect(onMountError).toHaveBeenCalledWith({nativeEvent: {message: 'no camera'}});
    // The defaults, and the events without handlers.
    await render(<CameraView testID="bare" />);
    const bare = screen.getByTestId('bare');
    expect(bare.props.facing).toBe('back');
    expect(bare.props.flashMode).toBe('off');
    await fireEvent(bare, 'cameraReady', {nativeEvent: {}});
    await fireEvent(bare, 'mountError', {nativeEvent: {message: 'x'}});
  });

  it('answers the ref through the island\'s commands and the events that carry each request\'s id', async () => {
    const files = {
      open: vi.fn(() => ({value: 3})),
      handleInfo: vi.fn(() => ({value: {offset: 0, size: 4}})),
      readBytes: vi.fn(() => ({value: 'AQID'})),
      close: vi.fn(() => ({value: null})),
    };
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsFileSystem' ? files : null) as never);
    const ref = createRef<CameraViewRef>();
    const onPictureSaved = vi.fn();
    const {unmount} = await render(<CameraView ref={ref} testID="camera" onPictureSaved={onPictureSaved} />);
    const island = screen.getByTestId('camera');
    const handle = ref.current as CameraViewRef;
    const picture = handle.takePicture({quality: 0.5, base64: true, id: 9});
    expect(Commands.takePicture).toHaveBeenCalledWith(expect.anything(), 1, 0.5);
    await fireEvent(island, 'pictureTaken', {nativeEvent: {requestId: 1, uri: 'file:///C:/cache/Camera/a.jpg', width: 640, height: 480, error: ''}});
    await expect(picture).resolves.toEqual({uri: 'file:///C:/cache/Camera/a.jpg', width: 640, height: 480, format: 'jpg', base64: 'AQID'});
    expect(files.open).toHaveBeenCalledWith('file:///C:/cache/Camera/a.jpg', 'r');
    expect(files.readBytes).toHaveBeenCalledWith(3, 4);
    expect(files.close).toHaveBeenCalledWith(3);
    expect(onPictureSaved).toHaveBeenCalledWith({nativeEvent: {data: expect.objectContaining({base64: 'AQID'}), id: 9}});
    const failed = expect(handle.takePicture({})).rejects.toThrow('The camera is not ready');
    expect(Commands.takePicture).toHaveBeenLastCalledWith(expect.anything(), 2, 1);
    await fireEvent(island, 'pictureTaken', {nativeEvent: {requestId: 2, uri: '', width: 0, height: 0, error: 'The camera is not ready'}});
    await failed;
    // An event for a request no one waits for is dropped.
    await fireEvent(island, 'pictureTaken', {nativeEvent: {requestId: 77, uri: '', width: 0, height: 0, error: ''}});
    const recording = handle.record({maxDuration: 2.5});
    expect(Commands.record).toHaveBeenCalledWith(expect.anything(), 3, 2500);
    await handle.stopRecording();
    expect(Commands.stopRecording).toHaveBeenCalledTimes(1);
    await fireEvent(island, 'recordingFinished', {nativeEvent: {requestId: 3, uri: 'file:///C:/cache/Camera/b.mp4', error: ''}});
    await expect(recording).resolves.toEqual({uri: 'file:///C:/cache/Camera/b.mp4'});
    const untimed = expect(handle.record()).rejects.toThrow('A recording is under way');
    expect(Commands.record).toHaveBeenLastCalledWith(expect.anything(), 4, 0);
    await fireEvent(island, 'recordingFinished', {nativeEvent: {requestId: 4, uri: '', error: 'A recording is under way'}});
    await untimed;
    const sizes = handle.getAvailablePictureSizes();
    expect(Commands.getAvailablePictureSizes).toHaveBeenCalledWith(expect.anything(), 5);
    await fireEvent(island, 'pictureSizes', {nativeEvent: {requestId: 5, sizes: '["1920x1080","640x480"]'}});
    await expect(sizes).resolves.toEqual(['1920x1080', '640x480']);
    await handle.pausePreview();
    await handle.resumePreview();
    expect(Commands.pausePreview).toHaveBeenCalledTimes(1);
    expect(Commands.resumePreview).toHaveBeenCalledTimes(1);
    await expect(handle.getAvailableLenses()).resolves.toEqual([]);
    await expect(handle.toggleRecording()).rejects.toThrow(/CameraView\.toggleRecording/);
    // Without the file system library a picture cannot be read back as base64.
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const noBytes = expect(handle.takePicture({base64: true})).rejects.toThrow(/CameraView\.takePicture/);
    await fireEvent(island, 'pictureTaken', {nativeEvent: {requestId: 6, uri: 'file:///C:/c.jpg', width: 1, height: 1, error: ''}});
    await noBytes;
    // A picture without base64 is the island's answer as it is.
    const plain = handle.takePicture({});
    await fireEvent(island, 'pictureTaken', {nativeEvent: {requestId: 7, uri: 'file:///C:/d.jpg', width: 2, height: 3, error: ''}});
    await expect(plain).resolves.toEqual({uri: 'file:///C:/d.jpg', width: 2, height: 3, format: 'jpg'});
    expect(onPictureSaved).toHaveBeenCalledTimes(1);
    await unmount();
    void handle.takePicture({});
    await handle.stopRecording();
    await handle.pausePreview();
    await handle.resumePreview();
    void handle.record();
    void handle.getAvailablePictureSizes();
    expect(Commands.takePicture).toHaveBeenCalledTimes(4);
    expect(Commands.stopRecording).toHaveBeenCalledTimes(1);
  });
});
