import {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {Pressable, Text, View} from 'react-native';
import {Layer, LayerHost, useLayerDismiss} from './layer';
import {ModalLayer} from './modal-layer';

function Toggle({label}: {label: string}) {
  const [shown, setShown] = useState(true);
  const [count, setCount] = useState(0);
  return (
    <View>
      <Pressable testID="toggle" onPress={() => setShown(!shown)}><Text>toggle</Text></Pressable>
      <Pressable testID="bump" onPress={() => setCount(count + 1)}><Text>bump</Text></Pressable>
      {shown ? (
        <Layer>
          <Text testID="layered">{label} {count}</Text>
        </Layer>
      ) : null}
    </View>
  );
}

describe('LayerHost and Layer (windows)', () => {
  it('draws a layer in the host, over the content, and follows its updates and its unmount', async () => {
    await render(
      <LayerHost>
        <View testID="content"><Toggle label="sheet"/></View>
      </LayerHost>,
    );
    const layered = screen.getByTestId('layered');
    expect(layered).toBeOnTheScreen();
    expect(screen.getByText('sheet 0')).toBeOnTheScreen();
    // The layer sits beside the content in the host, not inside the content.
    expect(screen.getByTestId('content').queryAll(node => node.props.testID === 'layered')).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('bump'));
    expect(screen.getByText('sheet 1')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('toggle'));
    expect(screen.queryByTestId('layered')).toBeNull();
    await fireEvent.press(screen.getByTestId('toggle'));
    expect(screen.getByTestId('layered')).toBeOnTheScreen();
  });

  it('draws in place without a host', async () => {
    await render(<View testID="content"><Toggle label="alone"/></View>);
    expect(screen.getByTestId('content').queryAll(node => node.props.testID === 'layered')).toHaveLength(1);
  });

  it('takes the back keys and the mouse back button for onBack, wherever the focus is', async () => {
    const onBack = vi.fn();
    await render(
      <LayerHost onBack={onBack} testID="host">
        <Text>Content</Text>
      </LayerHost>,
    );
    const host = screen.getByTestId('host');
    await fireEvent(host, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: false}});
    await fireEvent(host, 'keyDown', {nativeEvent: {key: 'Enter', altKey: true}});
    expect(onBack).not.toHaveBeenCalled();
    await fireEvent(host, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    await fireEvent(host, 'keyDown', {nativeEvent: {key: 'BrowserBack', altKey: false}});
    await fireEvent(host, 'keyDown', {nativeEvent: {key: 'GoBack', altKey: false}});
    expect(onBack).toHaveBeenCalledTimes(3);
    await fireEvent(host, 'pointerDown', {nativeEvent: {button: 0}});
    expect(onBack).toHaveBeenCalledTimes(3);
    await fireEvent(host, 'pointerDown', {nativeEvent: {button: 3}});
    expect(onBack).toHaveBeenCalledTimes(4);
  });

  it('stops a handled key and the mouse back button at the host, and lets the rest bubble on', async () => {
    const onBack = vi.fn();
    const dismiss = vi.fn();
    function Dismissable() {
      useLayerDismiss(dismiss);
      return null;
    }
    await render(
      <LayerHost onBack={onBack} testID="host">
        <Dismissable/>
      </LayerHost>,
    );
    const host = screen.getByTestId('host');
    const handled = {nativeEvent: {key: 'ArrowLeft', altKey: true}, stopPropagation: vi.fn()};
    await fireEvent(host, 'keyDown', handled);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(handled.stopPropagation).toHaveBeenCalledTimes(1);
    const escape = {nativeEvent: {key: 'Escape', altKey: false}, stopPropagation: vi.fn()};
    await fireEvent(host, 'keyDown', escape);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(escape.stopPropagation).toHaveBeenCalledTimes(1);
    const other = {nativeEvent: {key: 'x', altKey: false}, stopPropagation: vi.fn()};
    await fireEvent(host, 'keyDown', other);
    expect(other.stopPropagation).not.toHaveBeenCalled();
    const back = {nativeEvent: {button: 3}, stopPropagation: vi.fn()};
    await fireEvent(host, 'pointerDown', back);
    expect(onBack).toHaveBeenCalledTimes(2);
    expect(back.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('takes the focus on request, without a ring, and leaves it alone otherwise', async () => {
    await render(
      <>
        <LayerHost takesFocus testID="root"><Text>Root</Text></LayerHost>
        <LayerHost testID="nested"><Text>Nested</Text></LayerHost>
      </>,
    );
    expect(screen.getByTestId('root').props).toMatchObject({focusable: true, enableFocusRing: false});
    expect(screen.getByTestId('nested').props.focusable).toBeUndefined();
  });

  it('is unbothered by the back keys without onBack', async () => {
    await render(<LayerHost testID="host"><Text>Content</Text></LayerHost>);
    await fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    await fireEvent(screen.getByTestId('host'), 'pointerDown', {nativeEvent: {button: 3}});
    await fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(screen.getByText('Content')).toBeOnTheScreen();
  });
});

describe('ModalLayer (windows)', () => {
  it('draws smoke and a card, and dismisses on the smoke and on Escape when there is no host', async () => {
    const onDismiss = vi.fn();
    await render(
      <ModalLayer onDismiss={onDismiss} testID="modal">
        <Text>Form</Text>
      </ModalLayer>,
    );
    expect(screen.getByText('Form')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireEvent(screen.getByTestId('modal'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(onDismiss).toHaveBeenCalledTimes(2);
    await fireEvent(screen.getByTestId('modal'), 'keyDown', {nativeEvent: {key: 'Enter'}});
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('hands Escape to the host, which dismisses the topmost layer only, in order', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const {rerender} = await render(
      <LayerHost testID="host">
        <ModalLayer onDismiss={first} testID="first"><Text>First</Text></ModalLayer>
        <ModalLayer onDismiss={second} testID="second"><Text>Second</Text></ModalLayer>
        <ModalLayer testID="quiet"><Text>Quiet</Text></ModalLayer>
      </LayerHost>,
    );
    // The modal's own Escape handler is off under a host: the key bubbles to the host once.
    expect(screen.getByTestId('first').props.onKeyDown).toBeUndefined();
    await fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    await rerender(
      <LayerHost testID="host">
        <ModalLayer onDismiss={first} testID="first"><Text>First</Text></ModalLayer>
      </LayerHost>,
    );
    await fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('lays transparent content over the window with no smoke, and is tall on request', async () => {
    await render(
      <>
        <ModalLayer transparent testID="clear"><Text>Over</Text></ModalLayer>
        <ModalLayer tall testID="tall"><Text>Fill</Text></ModalLayer>
      </>,
    );
    expect(screen.getByText('Over')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Dismiss')).not.toBeNull();
    expect(screen.getByTestId('clear').queryAll(node => node.props.accessibilityLabel === 'Dismiss')).toHaveLength(0);
    const card = screen.getByText('Fill').parent!;
    expect(card).toHaveStyle({height: '85%'});
    await fireEvent(screen.getByTestId('clear'), 'keyDown', {nativeEvent: {key: 'Escape'}});
  });
});
