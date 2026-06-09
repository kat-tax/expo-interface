import {ScreenHeader} from '@/core/screen-header';

interface StackHeaderProps {
  navigation: {goBack: () => void};
  route: {name: string};
  back?: unknown;
  options: {
    title?: string;
    headerTitle?: string | (() => React.ReactNode);
  };
}

export function ConstrainedStackHeader({
  navigation,
  route,
  back,
  options,
}: StackHeaderProps) {
  const title = typeof options.headerTitle === 'string'
    ? options.headerTitle
    : options.title ?? route.name;

  return (
    <ScreenHeader
      title={title}
      onBack={back ? () => navigation.goBack() : undefined}
    />
  );
}
