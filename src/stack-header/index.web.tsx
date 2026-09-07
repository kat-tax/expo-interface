import {useEffect, useId} from 'react';
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
 * draws this screen's title, back button and trailing slot instead — one bar
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
  const id = useId();

  const title = typeof options.headerTitle === 'string'
    ? options.headerTitle
    : options.title ?? route.name;

  const trailing = options.headerRight?.({});
  const onBack = back ? () => navigation.goBack() : undefined;

  // Published after every render, so a title or a trailing slot that changes
  // reaches the bar; the bar is beside this stack, not above it, so drawing it
  // again does not render the screen again. Cleared when the screen leaves.
  useEffect(() => {
    slot?.set(id, {title, onBack, trailing});
  });
  useEffect(() => () => slot?.set(id, null), [slot, id]);

  if (slot) return null;

  return (
    <ScreenHeader
      title={title}
      onBack={onBack}
      trailing={trailing}
    />
  );
}
