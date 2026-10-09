import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text, View} from 'react-native';
import {useNativeHost} from '../host';
import {ScrollInsetsContext, useScrollInsets} from '../screen/insets';
import {LayerHost} from '../windows/layer';
import {Sheet} from '.';

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

/** Prints the scroll insets a list or a form at this point pads by. */
function Insets() {
  const {top, bottom, automatic} = useScrollInsets();
  return <Text>{`${top} ${bottom} ${automatic}`}</Text>;
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

  it('gives its content no scroll insets when it draws in place, inside the screen that has them', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 96, bottom: 24, left: 0, right: 0, automatic: true}}>
        <Insets/>
        <Sheet isPresented onDismiss={() => {}} accessory={<Insets/>} footer={<Insets/>} maxHeight={300}>
          <Insets/>
        </Sheet>
      </ScrollInsetsContext.Provider>,
    );
    expect(screen.getByText('96 24 true')).toBeOnTheScreen();
    expect(screen.getAllByText('0 0 false')).toHaveLength(3);
  });

  it('gives its content no scroll insets in a host\'s layer either', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 96, bottom: 24, left: 0, right: 0, automatic: true}}>
        <LayerHost>
          <Sheet isPresented onDismiss={() => {}}>
            <Insets/>
          </Sheet>
        </LayerHost>
      </ScrollInsetsContext.Provider>,
    );
    expect(screen.getByText('0 0 false')).toBeOnTheScreen();
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
