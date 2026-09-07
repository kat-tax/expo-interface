import {render, screen as dom} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {View} from 'react-native';
import {Button} from './button';
import {Card} from './card';
import {NativeHost} from './host';
import {Popover} from './popover';
import {Screen} from './screen';
import {Toast} from './toast';
import {Body} from './typography';

/**
 * The kit's own overlays let presses through to what is under them — a fab
 * slot, a card's overlay row, a popover's measured box, a toast's strip, a
 * host that only presents something. That is `pointerEvents`, which React
 * Native has taken in `style` since 0.71 and deprecated as a prop:
 * react-native-web warns once per key on the first render that passes it,
 * which on a dev server means every kit screen.
 *
 * One test for all of them, since the warning fires only once: the whole set
 * is rendered here, and the mounted DOM has to carry the pass-through with
 * the console saying nothing.
 */
describe('pointerEvents (web)', () => {
  it('puts pass-through in the style, not the deprecated prop', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SafeAreaProvider>
        <Screen fab={<Button label="New" onPress={() => {}}/>}>
          <Card overlay={<Button label="Star" onPress={() => {}}/>} testID="card">
            <Body>A document</Body>
          </Card>
          <Popover at={{x: 10, y: 10}} title="Spelling" testID="popover"/>
          <Toast message="Copied" visible testID="toast"/>
          <View testID="host-slot">
            <NativeHost pointerEvents="none"/>
          </View>
        </Screen>
      </SafeAreaProvider>,
    );

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('props.pointerEvents is deprecated'),
    );
    warn.mockRestore();

    // The pass-through itself survives the move. react-native-web writes
    // `box-none` as `none` on the box with `auto` back on its children, which
    // is what tells it apart from a box that swallows presses whole.
    for (const box of [
      dom.getByTestId('screen-fab'),
      dom.getByTestId('card-overlay'),
      dom.getByTestId('popover-bounds'),
      dom.getByTestId('toast').parentElement!,
    ]) {
      expect(getComputedStyle(box).pointerEvents).toBe('none');
      expect(getComputedStyle(box.firstElementChild!).pointerEvents).toBe('auto');
    }

    // A host that only presents takes no presses at all, children included.
    const host = dom.getByTestId('host-slot').firstElementChild!;
    expect(getComputedStyle(host).pointerEvents).toBe('none');
  });
});
