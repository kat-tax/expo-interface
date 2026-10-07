import type {SearchBarCommands} from 'react-native-screens';
import type {HeaderSearchProps} from './types';
import {useImperativeHandle, useRef} from 'react';
import {Platform} from 'react-native';
import {Stack} from 'expo-router';
import {useHeaderTints} from '../header/toolbar';
import {ScreenBar} from '../screen/bars';
import {useColor} from '../theme';
import {SearchBottomBar, StackedSearchRow} from './drawn';
import {iosPlacement, placeholderFor} from './shared';

/**
 * iOS and Android: the platform's own header search, through Expo Router's
 * `Stack.SearchBar`, rendered in the screen's content like the other header
 * controls and sent to the header from there. On iOS it is the navigation
 * item's `UISearchController`, placed as asked: under the title, in the
 * bottom toolbar's glass on iOS 26, as the bar's search button, or beside
 * the title. On Android it is the toolbar's `SearchView`, a magnifier among
 * the actions that opens across the bar, and the two placements the toolbar
 * has no form for are drawn: `stacked` as a row under the app bar and
 * `integrated` as a bottom `Toolbar`, both the `Screen`'s when the search
 * is rendered inside one.
 *
 * The native field holds its own text, so the commands on the `ref` are
 * forwarded to react-native-screens' (`focus`, `blur`, `setText`,
 * `clearText`, `cancelSearch`) rather than reading a `value`.
 */
export const HeaderSearch = Object.assign(
  function HeaderSearch(props: HeaderSearchProps) {
    if (Platform.OS === 'android') {
      if (props.placement === 'stacked') return <ScreenBar edge="top"><StackedSearchRow {...props}/></ScreenBar>;
      if (props.placement === 'integrated') return <ScreenBar edge="bottom"><SearchBottomBar {...props}/></ScreenBar>;
    }
    return <NativeSearch {...props}/>;
  },
  // What the native slot reads this element as: not an item of the bar, but the bar's search.
  {item: 'search' as const},
);

function NativeSearch({
  placement = 'automatic',
  placeholder,
  autoFocus,
  autoCapitalize,
  inputType,
  hideWhenScrolling,
  integration = 'field',
  onChangeText,
  onSubmit,
  onOpen,
  onClose,
  onFocus,
  onBlur,
  ref,
}: HeaderSearchProps) {
  const bar = useRef<SearchBarCommands>(null);
  const tints = useHeaderTints();
  const hint = useColor('tertiaryLabel');
  const ios = Platform.OS === 'ios';
  useImperativeHandle(ref, () => ({
    focus: () => bar.current?.focus(),
    blur: () => bar.current?.blur(),
    setText: text => bar.current?.setText(text),
    clear: () => bar.current?.clearText(),
    cancel: () => bar.current?.cancelSearch(),
  }));
  return (
    <Stack.SearchBar
      ref={bar}
      placeholder={placeholderFor(placeholder)}
      // Android's field opens from the start for `inline`, the one open form the toolbar has.
      autoFocus={autoFocus || (!ios && placement === 'inline')}
      autoCapitalize={autoCapitalize}
      inputType={inputType}
      hideWhenScrolling={hideWhenScrolling}
      placement={iosPlacement(placement, integration)}
      allowToolbarIntegration={placement !== 'action'}
      tintColor={tints.accent}
      textColor={tints.label}
      hintTextColor={hint}
      headerIconColor={tints.label}
      onChangeText={event => onChangeText?.(event.nativeEvent.text)}
      onSearchButtonPress={event => onSubmit?.(event.nativeEvent.text)}
      // iOS has no open and close of its own: the controller is open while its field has the focus.
      onFocus={() => {
        onFocus?.();
        if (ios) onOpen?.();
      }}
      onBlur={() => {
        onBlur?.();
        if (ios) onClose?.();
      }}
      onOpen={onOpen}
      onClose={() => {
        onClose?.();
        // Kept open: Android's `SearchView` iconifies itself on its close button, and `inline` has no closed form.
        if (!ios && placement === 'inline') bar.current?.focus();
      }}
    />
  );
}

export type {HeaderSearchCommands, HeaderSearchInput, HeaderSearchIntegration, HeaderSearchPlacement, HeaderSearchProps} from './types';
