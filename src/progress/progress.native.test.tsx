import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {colors} from '../theme';
import {byComposeTestID, modifier} from '../__tests__/native';
import {Progress} from '.';

const isIOS = Platform.OS === 'ios';
const progress = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`Progress (${Platform.OS})`, () => {
  it('renders a determinate linear indicator tinted with the theme accent', async () => {
    await render(<Progress value={0.5} testID="bar"/>);
    const {props} = progress('bar');
    if (isIOS) {
      expect(props.value).toBe(0.5);
      expect(modifier(props, 'progressViewStyle')).toEqual({$type: 'progressViewStyle', style: 'linear'});
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: colors.light.tint});
    } else {
      expect(props.progress).toBe(0.5);
      expect(props.color).toBe(colors.light.tint);
      expect(props.trackColor).toBe(colors.light.backgroundSelected);
      expect(modifier(props, 'fillMaxWidth')).toEqual({$type: 'fillMaxWidth'});
      expect(props.strokeWidth).toBeUndefined();
    }
  });

  it('becomes indeterminate without a value', async () => {
    await render(<Progress testID="bar"/>);
    const {props} = progress('bar');
    if (isIOS) {
      expect(props.value).toBeNull();
    } else {
      expect(props.progress).toBeNull();
    }
  });

  it('renders the circular variant', async () => {
    await render(<Progress variant="circular" value={0.75} size={40} testID="ring"/>);
    const {props} = progress('ring');
    if (isIOS) {
      expect(props.value).toBe(0.75);
      expect(modifier(props, 'progressViewStyle')).toEqual({$type: 'progressViewStyle', style: 'circular'});
    } else {
      expect(props.progress).toBe(0.75);
      expect(props.strokeWidth).toBe(3);
      expect(modifier(props, 'size')).toEqual({$type: 'size', width: 40, height: 40});
      expect(modifier(props, 'fillMaxWidth')).toBeUndefined();
    }
  });

  (isIOS ? it.skip : it)('sizes the ring to 24dp by default', async () => {
    await render(<Progress variant="circular" testID="ring"/>);
    const {props} = progress('ring');
    expect(modifier(props, 'size')).toEqual({$type: 'size', width: 24, height: 24});
  });

  it('applies custom colors', async () => {
    await render(<Progress value={0.2} color="#FF9500" trackColor="#FFE5B4" testID="bar"/>);
    const {props} = progress('bar');
    if (isIOS) {
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
    } else {
      expect(props.color).toBe('#FF9500');
      expect(props.trackColor).toBe('#FFE5B4');
    }
  });

  it('follows the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Progress value={0.4} testID="bar"/>
      </AccentProvider>,
    );
    const {props} = progress('bar');
    if (isIOS) {
      expect(modifier(props, 'tint')?.color).toBe('#8959EA');
    } else {
      expect(props.color).toBe('#8959EA');
    }
  });
});
