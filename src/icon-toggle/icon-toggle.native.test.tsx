import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {hostFit, hosts} from '../__tests__/hosts';
import {NativeHostContext} from '../host';
import {TONAL_SIZE} from './shared';
import {IconToggle} from '.';

const isIOS = Platform.OS === 'ios';

describe(`IconToggle (${Platform.OS})`, () => {
  it('mounts a host of its own outside one, sized to itself, and none inside', async () => {
    await render(<IconToggle label="Favourite" icon={icons.star} value={false} onValueChange={vi.fn()} testID="star"/>);
    expect(hosts()).toHaveLength(1);
    expect(hostFit(hosts()[0])).toEqual({vertical: true, horizontal: true});
    await render(
      <NativeHostContext.Provider value={true}>
        <IconToggle label="Favourite" icon={icons.star} value={false} onValueChange={vi.fn()} testID="inside"/>
      </NativeHostContext.Provider>,
    );
    expect(hosts()).toHaveLength(0);
    expect(isIOS ? screen.getByTestId('inside') : byComposeTestID('inside')).toBeTruthy();
  });

  it('draws the off icon in the secondary color and reports the press', async () => {
    const onValueChange = vi.fn();
    await render(
      <IconToggle
        label="Favourite"
        icon={icons.star}
        activeIcon={icons.starFilled}
        value={false}
        onValueChange={onValueChange}
        testID="star"
      />,
    );
    if (isIOS) {
      const image = host(p => typeof p.systemName === 'string');
      expect(image.props.systemName).toBe('star');
      expect(modifier(image.props, 'foregroundStyle')?.style.color).toBe(colors.light.secondaryLabel);
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
        activeIcon={icons.starFilled}
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
      expect(modifier(image.props, 'foregroundStyle')?.style.color).toBe('#8959EA');
      expect(modifier(image.props, 'font')?.size).toBe(18);
      expect(modifier(screen.getByTestId('star').props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
    } else {
      const {props} = byComposeTestID('star');
      expect(props.checked).toBe(true);
      expect(props.colors.checkedContentColor).toBe('#8959EA');
      // Compose draws XML vectors rather than glyphs, so the fill is the
      // `activeIcon`'s own drawable; the host view reports no `source`.
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

  it('hides itself while off with offVisibility hidden, and shows the star that is set', async () => {
    await render(
      <>
        <IconToggle label="Favourite" icon={icons.star} value={false} offVisibility="hidden" onValueChange={vi.fn()} testID="off"/>
        <IconToggle label="Starred" icon={icons.star} activeIcon={icons.starFilled} value offVisibility="hidden" onValueChange={vi.fn()} testID="on"/>
      </>,
    );
    if (isIOS) {
      // SwiftUI's `hidden` keeps the frame and takes the button out of hit testing and VoiceOver.
      expect(modifier(screen.getByTestId('off').props, 'hidden')).toEqual({$type: 'hidden', hidden: true});
      expect(modifier(screen.getByTestId('on').props, 'hidden')).toBeUndefined();
    } else {
      // Compose has nothing that hides a control from TalkBack, so the off one is left out.
      expect(nodes().some(n => n.props.contentDescription === 'Favourite')).toBe(false);
      expect(byComposeTestID('on').props.checked).toBe(true);
    }
  });

  (isIOS ? it : it.skip)('draws the tonal toggle on a circle in the pill fill, as the button\'s label', async () => {
    await render(
      <>
        <IconToggle label="Favourite" icon={icons.star} variant="tonal" value={false} onValueChange={vi.fn()} testID="tonal"/>
        <IconToggle label="Pin" icon={icons.star} value={false} onValueChange={vi.fn()} testID="plain"/>
      </>,
    );
    // The circle is the label of the plain button, so the whole of it presses.
    const circle = host(p => modifier(p, 'background') !== undefined);
    expect(modifier(circle.props, 'frame')).toMatchObject({width: TONAL_SIZE, height: TONAL_SIZE});
    expect(modifier(circle.props, 'background')).toMatchObject({style: {type: 'color', color: colors.light.pillBackground}, shape: 'circle'});
    expect(circle.children?.some(child => typeof child !== 'string' && typeof child.props.systemName === 'string')).toBe(true);
    expect(modifier(screen.getByTestId('tonal').props, 'background')).toBeUndefined();
    // The plain toggle is the bare image.
    expect(nodes().filter(n => modifier(n.props, 'background') !== undefined)).toHaveLength(1);
  });

  (isIOS ? it.skip : it)('draws nothing where an icon has no Android drawable', async () => {
    await render(
      <IconToggle label="Pin" icon={{symbol: 'star'}} value={false} onValueChange={vi.fn()}/>,
    );
    expect(nodes().some(n => n.props.contentDescription === 'Pin')).toBe(false);
  });
});
