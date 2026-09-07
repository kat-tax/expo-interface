import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {IconToggle} from '.';

const isIOS = Platform.OS === 'ios';
const filled = {...icons.star, symbol: {ios: 'star.fill', android: 'star', web: 'star'}} as typeof icons.star;

describe(`IconToggle (${Platform.OS})`, () => {
  it('draws the off icon in the secondary color and reports the press', async () => {
    const onValueChange = vi.fn();
    await render(
      <IconToggle
        label="Favourite"
        icon={icons.star}
        activeIcon={filled}
        value={false}
        onValueChange={onValueChange}
        testID="star"
      />,
    );
    if (isIOS) {
      const image = host(p => typeof p.systemName === 'string');
      expect(image.props.systemName).toBe('star');
      expect(modifier(image.props, 'foregroundStyle')?.color).toBe(colors.light.secondaryLabel);
      const {props} = screen.getByTestId('star');
      expect(modifier(props, 'accessibilityLabel')?.label).toBe('Favourite');
      expect(modifier(props, 'accessibilityAddTraits')).toBeUndefined();
      await fireEvent(screen.getByTestId('star'), 'buttonPress');
    } else {
      const {props} = byComposeTestID('star');
      expect(props.checked).toBe(false);
      expect(props.colors).toEqual({
        contentColor: colors.light.secondaryLabel,
        checkedContentColor: colors.light.tint,
      });
      expect(host(p => p.contentDescription === 'Favourite').props.size).toBe(24);
      // The Compose view reports through its own event prop.
      await act(async () => {
        byComposeTestID('star').props.onCheckedChange({nativeEvent: {checked: true}});
      });
    }
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('swaps to the on icon and says it is selected', async () => {
    await render(
      <IconToggle
        label="Favourite"
        icon={icons.star}
        activeIcon={filled}
        value
        color="#8959EA"
        size={18}
        onValueChange={vi.fn()}
        testID="star"
      />,
    );
    if (isIOS) {
      const image = host(p => typeof p.systemName === 'string');
      expect(image.props.systemName).toBe('star.fill');
      expect(modifier(image.props, 'foregroundStyle')?.color).toBe('#8959EA');
      expect(modifier(image.props, 'font')?.size).toBe(18);
      expect(modifier(screen.getByTestId('star').props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
    } else {
      const {props} = byComposeTestID('star');
      expect(props.checked).toBe(true);
      expect(props.colors.checkedContentColor).toBe('#8959EA');
      expect(host(p => p.contentDescription === 'Favourite').props.tint).toBe('#8959EA');
    }
  });

  it('falls back to the one icon, dims when disabled and takes an off color', async () => {
    await render(
      <IconToggle
        label="Pin"
        icon={icons.star}
        value
        offColor="#FF9500"
        disabled
        onValueChange={vi.fn()}
        testID="pin"
      />,
    );
    if (isIOS) {
      expect(host(p => typeof p.systemName === 'string').props.systemName).toBe('star');
      const {props} = screen.getByTestId('pin');
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(props, 'opacity')?.value).toBe(0.4);
    } else {
      const {props} = byComposeTestID('pin');
      expect(props.enabled).toBe(false);
      expect(props.colors.contentColor).toBe('#FF9500');
      expect(modifier(props, 'alpha')?.alpha).toBe(0.4);
    }
  });

  (isIOS ? it.skip : it)('draws nothing where an icon has no Android drawable', async () => {
    await render(
      <IconToggle label="Pin" icon={{symbol: 'star'}} value={false} onValueChange={vi.fn()}/>,
    );
    expect(nodes().some(n => n.props.contentDescription === 'Pin')).toBe(false);
  });
});
