import type {HeaderSlot, WebHeader} from '../tabs/context';
import {useEffect, useId} from 'react';
import {useIsFocused} from 'expo-router';
import {ScreenHeader} from '../screen/header';
import {useHeaderSlot} from '../tabs/context';

interface StackHeaderProps {
  navigation: {goBack: () => void};
  route: {name: string};
  back?: unknown;
  options: {
    title?: string;
    headerTitle?: string | (() => React.ReactNode);
    headerRight?: (props: {tintColor?: string}) => React.ReactNode;
  };
}

/**
 * The stack header on web: a row of the screen's content width, or nothing at
 * all under a `Tabs` bar that takes headers (`webFoldHeader`), where the bar
 * draws this screen's back button, title and trailing slot instead — one bar
 * over the screen rather than two.
 *
 * The navigator calls this as a function rather than rendering it as a
 * component (`options.header(props)`), so its hooks would land in the
 * navigator's own list: the work happens one component down.
 */
export function ConstrainedStackHeader(props: StackHeaderProps) {
  return <StackHeader {...props}/>;
}

function StackHeader({navigation, route, back, options}: StackHeaderProps) {
  const slot = useHeaderSlot();

  const title = typeof options.headerTitle === 'string'
    ? options.headerTitle
    : options.title ?? route.name;

  const trailing = options.headerRight?.({});
  const onBack = back ? () => navigation.goBack() : undefined;

  // Under a bar that takes headers, that bar is this row: nothing is drawn
  // here. Only a pushed screen hands over its title, which the bar shows
  // beside the back button in the logo slot; a tab's own screen keeps its
  // title — the tab next to it in the bar already says it — and folds in its
  // trailing slot alone.
  if (slot) {
    return (
      <FoldedHeader
        slot={slot}
        title={onBack ? title : undefined}
        onBack={onBack}
        trailing={trailing}
      />
    );
  }

  return (
    <ScreenHeader
      title={title}
      onBack={onBack}
      trailing={trailing}
    />
  );
}

/**
 * Hands this screen's header to the bar above and draws nothing itself.
 *
 * Only while the screen is the focused one. A tab whose screen is already
 * mounted does not render again when the tab is returned to, so a header
 * published on render alone would leave the bar drawing the screen the user
 * left — and offering its actions.
 */
function FoldedHeader({slot, title, onBack, trailing}: {slot: HeaderSlot} & WebHeader) {
  const focused = useIsFocused();
  const id = useId();

  // Published after every render, so a title or a trailing slot that changes
  // reaches the bar; the bar is beside this stack, not above it, so drawing it
  // again does not render the screen again. Cleared when the screen blurs, and
  // again on its way out.
  useEffect(() => {
    slot.set(id, focused ? {title, onBack, trailing} : null);
  });
  useEffect(() => () => slot.set(id, null), [slot, id]);

  return null;
}
