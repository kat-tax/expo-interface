import {Animated, StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import {colors} from '../theme';
import {Badge} from '.';

const BADGE = 'ExpoInterfaceInfoBadge';

describe('Badge (windows)', () => {
  it('renders an InfoBadge island holding the number, sized before XAML has measured anything', async () => {
    await render(<Badge count={3} testID="unread"/>);
    expect(island(BADGE).props).toMatchObject({
      value: 3,
      label: '3 new',
      theme: 'light',
      testID: 'unread',
    });
    expect(StyleSheet.flatten(island(BADGE).props.style)).toMatchObject({minWidth: 16, height: 16});
  });

  it('clamps an overflowing count, because InfoBadge holds a number and cannot draw a plus', async () => {
    await render(<Badge count={150}/>);
    // The number is what the control can show; the label is what is true.
    expect(island(BADGE).props).toMatchObject({value: 99, label: '99+ new'});
  });

  it('asks for the dot form with a negative value, and for the dot size', async () => {
    await render(<Badge dot label="Unsaved"/>);
    expect(island(BADGE).props).toMatchObject({value: -1, label: 'Unsaved'});
    expect(StyleSheet.flatten(island(BADGE).props.style)).toMatchObject({minWidth: 8, height: 8});
  });

  it('hands its colors to the island as the hex it parses, and leaves them to the control when there are none', async () => {
    await render(<Badge count={1} color="#0A84FF" textColor="black"/>);
    expect(island(BADGE).props).toMatchObject({color: '#0A84FFFF', textColor: '#000000FF'});
    await render(<Badge count={1}/>);
    expect(island(BADGE).props.color).toBeUndefined();
    expect(island(BADGE).props.textColor).toBeUndefined();
  });

  it('writes a color that is not hex as hex, rather than letting the island fall back to its red', async () => {
    await render(<Badge count={1} color="rgb(0, 122, 255)"/>);
    expect(island(BADGE).props.color).toBe('#007AFFFF');
    await render(<Badge count={1} color="rebeccapurple"/>);
    expect(island(BADGE).props.color).toBe('#663399FF');
  });

  it('resolves a palette token for its fill, translucent ones included, and leaves the number\'s color to the control', async () => {
    await render(<Badge count={1} color="highlight"/>);
    expect(island(BADGE).props.color).toBe(`${colors.light.highlight}FF`);
    expect(island(BADGE).props.textColor).toBeUndefined();
    // rgba(60, 60, 67, 0.29)
    await render(<Badge count={1} color="separator"/>);
    expect(island(BADGE).props.color).toBe('#3C3C434A');
  });

  it('draws nothing for a count of zero', async () => {
    const {toJSON} = await render(<Badge count={0}/>);
    expect(toJSON()).toBeNull();
  });

  it('pulses the island through the view around it', async () => {
    const start = vi.fn();
    const stop = vi.fn();
    const loop = vi.spyOn(Animated, 'loop').mockReturnValue({start, stop, reset: vi.fn()} as never);
    const timing = vi.spyOn(Animated, 'timing');
    const {rerender} = await render(<Badge dot pulse testID="typing"/>);
    expect(start).toHaveBeenCalledTimes(1);
    // React Native for Windows animates on the JavaScript side.
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({toValue: 0.35, duration: 450, useNativeDriver: false}));
    expect(island(BADGE).props.testID).toBe('typing');
    await rerender(<Badge dot testID="typing"/>);
    expect(stop).toHaveBeenCalledTimes(1);
    loop.mockRestore();
    timing.mockRestore();
  });
});
