import type {HostNode} from '../../jest/native';
import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {Text} from '@expo/ui';
import {byComposeTestID, host, modifier} from '../../jest/native';
import {Tooltip} from '.';

const isIOS = Platform.OS === 'ios';
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');

describe(`Tooltip (${Platform.OS})`, () => {
  it('renders the content inside the native tooltip container', async () => {
    await render(
      <Tooltip text="Anyone with the link can view" testID="hint">
        <Text>Public</Text>
      </Tooltip>,
    );
    if (isIOS) {
      const group = screen.getByTestId('hint');
      expect(modifier(group.props, 'accessibilityHint')).toEqual({
        $type: 'accessibilityHint',
        hint: 'Anyone with the link can view',
      });
      expect(host(p => p.text === 'Public', group)).toBeTruthy();
    } else {
      const box = byComposeTestID('hint');
      expect(box.props).toMatchObject({isPersistent: false, enableUserInput: true});
      const [slot, content] = children(box);
      expect(slot.props.slotName).toBe('tooltip');
      expect(content.props.text).toBe('Public');
    }
  });

  (isIOS ? it.skip : it)('shows a plain tooltip colored from the theme', async () => {
    await render(
      <Tooltip text="Copied">
        <Text>Copy link</Text>
      </Tooltip>,
    );
    const plain = children(host(p => p.slotName === 'tooltip'))[0];
    expect(plain.props).toEqual({containerColor: '#000000', contentColor: '#ffffff'});
    expect(host(p => p.text === 'Copied', plain).props.color).toBe('#ffffff');
  });

  it('omits the test identifier when none is given', async () => {
    await render(
      <Tooltip text="Copied">
        <Text>Copy link</Text>
      </Tooltip>,
    );
    if (isIOS) {
      expect(screen.queryByTestId('hint')).toBeNull();
      expect(host(p => modifier(p, 'accessibilityHint')?.hint === 'Copied').props.testID).toBeUndefined();
    } else {
      expect(host(p => p.isPersistent === false).props.modifiers).toBeUndefined();
    }
  });
});
