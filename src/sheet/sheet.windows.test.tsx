import type {TestInstance} from 'test-renderer';
import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {useNativeHost} from '../host';
import {Sheet} from '.';

/** The modal window: the one node asked to close. */
function modal(): TestInstance {
  const container = (screen as unknown as {container: {queryAll(predicate: (node: TestInstance) => boolean): TestInstance[]}}).container;
  return container.queryAll(node => typeof node.props.onRequestClose === 'function')[0];
}

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

describe('Sheet (windows)', () => {
  it('presents the content in a modal window while presented, as hosted content', async () => {
    const onDismiss = vi.fn();
    await render(
      <Sheet isPresented onDismiss={onDismiss}>
        <Hosted/>
      </Sheet>,
    );
    expect(screen.getByText('hosted')).toBeOnTheScreen();
    const window = modal();
    expect(window.props.visible).toBe(true);
    window.props.onRequestClose();
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
