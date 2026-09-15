import {fireEvent, render, screen} from '@testing-library/react-native';
import {PlatformColor, Text} from 'react-native';
import {Surface} from '.';
import {StatePressable} from './pressable';
import {pressFeedback} from './shared';

const HOVER = {backgroundColor: PlatformColor('ControlFillColorSecondary')};
const PRESS = {backgroundColor: PlatformColor('ControlFillColorTertiary')};
const SUBTLE_HOVER = {backgroundColor: PlatformColor('SubtleFillColorSecondary')};

describe('Surface (windows)', () => {
  it('takes the control fill under the pointer and drops it when the pointer leaves', async () => {
    await render(<Surface onPress={vi.fn()} testID="card"><Text>Drop</Text></Surface>);
    const card = screen.getByTestId('card');
    expect(card).not.toHaveStyle(HOVER);
    await fireEvent(card, 'hoverIn');
    expect(card).toHaveStyle(HOVER);
    await fireEvent(card, 'hoverOut');
    expect(card).not.toHaveStyle(HOVER);
  });

  it('takes the subtle fill when it has no fill of its own', async () => {
    await render(<Surface color="background" onPress={vi.fn()} testID="bar"><Text>Bar</Text></Surface>);
    const bar = screen.getByTestId('bar');
    await fireEvent(bar, 'hoverIn');
    expect(bar).toHaveStyle(SUBTLE_HOVER);
  });

  it('draws a plain box, with no pointer to track, without a press handler', async () => {
    await render(<Surface testID="box"><Text>Box</Text></Surface>);
    expect(screen.getByTestId('box').props.onHoverIn).toBeUndefined();
  });
});

describe('StatePressable (windows)', () => {
  it('passes the hover events on after tracking them', async () => {
    const onHoverIn = vi.fn();
    const onHoverOut = vi.fn();
    await render(
      <StatePressable onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={state => pressFeedback(state, 'subtle')} testID="row">
        <Text>Row</Text>
      </StatePressable>,
    );
    const row = screen.getByTestId('row');
    await fireEvent(row, 'hoverIn');
    expect(row).toHaveStyle(SUBTLE_HOVER);
    expect(onHoverIn).toHaveBeenCalledTimes(1);
    await fireEvent(row, 'hoverOut');
    expect(row).not.toHaveStyle(SUBTLE_HOVER);
    expect(onHoverOut).toHaveBeenCalledTimes(1);
  });

  it('reads the pointer from the pointer events react-native-windows dispatches, passing them on', async () => {
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    await render(
      <StatePressable onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} style={state => pressFeedback(state, 'subtle')} testID="row">
        <Text>Row</Text>
      </StatePressable>,
    );
    const row = screen.getByTestId('row');
    await fireEvent(row, 'pointerEnter', {nativeEvent: {}});
    expect(row).toHaveStyle(SUBTLE_HOVER);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    await fireEvent(row, 'pointerLeave', {nativeEvent: {}});
    expect(row).not.toHaveStyle(SUBTLE_HOVER);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });
});

describe('pressFeedback (windows)', () => {
  it('draws the fill of the kind: control for a filled box, subtle for a bare row', () => {
    expect(pressFeedback({pressed: false})).toBeNull();
    expect(pressFeedback({pressed: false, hovered: false}, 'control')).toBeNull();
    expect(pressFeedback({pressed: false, hovered: true}, 'control')).toEqual(HOVER);
    expect(pressFeedback({pressed: true, hovered: true}, 'control')).toEqual(PRESS);
    expect(pressFeedback({pressed: false, hovered: true}, 'subtle')).toEqual(SUBTLE_HOVER);
    expect(pressFeedback({pressed: true}, 'subtle')).toEqual({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
  });

  it('dims an accent surface instead of filling it', () => {
    expect(pressFeedback({pressed: false, hovered: false}, 'accent')).toBeNull();
    expect(pressFeedback({pressed: false, hovered: true}, 'accent')).toEqual({opacity: 0.9});
    expect(pressFeedback({pressed: true, hovered: true}, 'accent')).toEqual({opacity: 0.7});
  });
});
