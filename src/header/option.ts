import {useLayoutEffect} from 'react';
import {useNavigation, useRoute} from 'expo-router';

/** The kit's own route options, which a control in a screen's content sets for the drawn header. */
export type HeaderOption = 'headerAccessory' | 'headerSearch';

/**
 * Puts `value` on the screen's route as the option `name` while the caller is
 * mounted, and takes it off again when the caller goes: web and Windows draw
 * the header from the route's options, so a `HeaderAccessory` or a
 * `HeaderSearch` rendered conditionally comes and goes with its element, as
 * the native rows do. Expo Router's `Stack.Screen` sets options and never
 * clears them, and its registry of options that fall back once their element
 * unmounts is internal to its native stack, so the kit clears through
 * `setOptions` itself. The clear writes `undefined`, which also hides a value
 * a layout gave the same option; these options are set from screen content
 * only. Two elements of one option in one screen share it: the first to
 * unmount clears what the other set.
 *
 * A layout effect, not a passive one: when one element unmounts and another
 * mounts in the same commit, the old one's layout cleanup runs before the new
 * one's layout effect, so the new value wins, where a passive cleanup would
 * run after the new set and wipe it.
 *
 * A preloaded route sets nothing, as Expo Router's `Stack.Screen` sets
 * nothing there: its screen's navigation is a placeholder that throws on
 * `setOptions`, and the route is not among the state's routes until it is
 * navigated to. The state may not be ready either, and then nothing is set
 * until it is.
 */
export function useHeaderOption(name: HeaderOption, value: unknown): void {
  const navigation = useNavigation();
  const {key} = useRoute();
  const live = navigation.getState()?.routes.some(route => route.key === key) ?? false;
  useLayoutEffect(() => {
    if (!live) return undefined;
    navigation.setOptions({[name]: value});
    return () => navigation.setOptions({[name]: undefined});
  }, [navigation, live, name, value]);
}
