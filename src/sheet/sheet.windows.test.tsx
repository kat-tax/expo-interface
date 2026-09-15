import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text, View} from 'react-native';
import {useNativeHost} from '../host';
import {LayerHost} from '../windows/layer';
import {Sheet} from '.';

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

describe('Sheet (windows)', () => {
  it('presents the content in a layer over the host, as hosted content, and dismisses from the smoke and Escape', async () => {
    const onDismiss = vi.fn();
    await render(
      <LayerHost testID="host">
        <View testID="content">
          <Sheet isPresented onDismiss={onDismiss}>
            <Hosted/>
          </Sheet>
        </View>
      </LayerHost>,
    );
    expect(screen.getByText('hosted')).toBeOnTheScreen();
    expect(screen.getByTestId('content').queryAll(node => node.props.testID === 'sheet')).toHaveLength(0);
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // Escape reaches the host from wherever the focus is.
    await fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('draws in place without a host, taking Escape itself', async () => {
    const onDismiss = vi.fn();
    await render(
      <View testID="content">
        <Sheet isPresented onDismiss={onDismiss}>
          <Text>Form</Text>
        </Sheet>
      </View>,
    );
    expect(screen.getByText('Form')).toBeOnTheScreen();
    expect(screen.getByTestId('content').queryAll(node => node.props.testID === 'sheet')).toHaveLength(1);
    await fireEvent(screen.getByTestId('sheet'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows nothing while not presented', async () => {
    await render(
      <Sheet isPresented={false} onDismiss={vi.fn()}>
        <Text>Form</Text>
      </Sheet>,
    );
    expect(screen.queryByText('Form')).toBeNull();
  });
});
