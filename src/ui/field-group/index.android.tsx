import type {ReactNode, ReactElement} from 'react';
import type {
  FieldGroupProps,
  FieldSectionProps,
  FieldSectionHeaderProps,
  FieldSectionFooterProps,
} from '@expo/ui';
import {Children, Fragment, isValidElement} from 'react';
import {Column, LazyColumn, ListItem, Text} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  testID as testIDModifier,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '@/ui/theme';

/**
 * Android `FieldGroup`. Mirrors `@expo/ui`'s Material 3 connected-list
 * layout, with two app-palette deviations for web parity:
 * - the group has no background (the universal one paints the Host palette's
 *   `surface`, a grey panel over the app's screen background);
 * - rows use the `backgroundElement` token instead of the seeded
 *   `surfaceContainer`, matching the web/iOS card color.
 */
function FieldGroupBase({children, style, hidden, testID}: FieldGroupProps) {
  if (hidden) return null;
  const modifiers: ModifierConfig[] = [];
  if (style?.backgroundColor) modifiers.push(background(String(style.backgroundColor)));
  if (testID) modifiers.push(testIDModifier(testID));
  return (
    <LazyColumn
      verticalArrangement={{spacedBy: 24}}
      contentPadding={{start: 16, end: 16, top: 16, bottom: 16}}
      modifiers={modifiers}>
      {groupChildren(children)}
    </LazyColumn>
  );
}

/** Marker component tagging the custom header slot of a `Section`. */
function SectionHeader(props: FieldSectionHeaderProps) {
  return <>{props.children}</>;
}

/** Marker component tagging the footer slot of a `Section`. */
function SectionFooter(props: FieldSectionFooterProps) {
  return <>{props.children}</>;
}

function Section({children, title, titleUppercase = false, hidden}: FieldSectionProps) {
  const card = useColor('backgroundElement');
  const subtle = useColor('secondaryLabel');
  if (hidden) return null;

  const {header, footer, rows} = extractSlots(children);
  const headerNode = header ?? (title ? (
    <Text
      color={subtle}
      style={{typography: 'titleMedium', letterSpacing: titleUppercase ? 0.5 : undefined}}>
      {titleUppercase ? title.toUpperCase() : title}
    </Text>
  ) : null);

  return (
    <Column verticalArrangement={{spacedBy: 4}} modifiers={[fillMaxWidth()]}>
      {headerNode ? (
        <Column modifiers={[padding(16, 0, 16, 8)]}>{headerNode}</Column>
      ) : null}
      {rows.length > 0 ? (
        <Column verticalArrangement={{spacedBy: 2}} modifiers={[fillMaxWidth()]}>
          {rows.map((child, index) => (
            <ListItem
              key={index}
              colors={{containerColor: card}}
              modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(cornerRadii(index, rows.length)))]}>
              <ListItem.HeadlineContent>{child}</ListItem.HeadlineContent>
            </ListItem>
          ))}
        </Column>
      ) : null}
      {footer ? <Column modifiers={[padding(16, 4, 16, 0)]}>{footer}</Column> : null}
    </Column>
  );
}

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader,
  SectionFooter,
});

export type {FieldGroupProps};

/**
 * Per-position corner radii producing the Material 3 grouped-list look:
 * fully rounded at the section's ends, slightly rounded between rows.
 */
function cornerRadii(index: number, total: number) {
  const full = 20;
  const small = 4;
  const top = total <= 1 || index === 0 ? full : small;
  const bottom = total <= 1 || index === total - 1 ? full : small;
  return {topStart: top, topEnd: top, bottomStart: bottom, bottomEnd: bottom};
}

/** Pulls `SectionHeader`/`SectionFooter` slots out of a section's children. */
function extractSlots(children: ReactNode) {
  let header: ReactNode | undefined;
  let footer: ReactNode | undefined;
  const rows: ReactNode[] = [];

  const walk = (node: ReactNode) => {
    Children.forEach(node, child => {
      if (!isValidElement(child)) {
        rows.push(child);
        return;
      }
      const props = child.props as {children?: ReactNode};
      if (child.type === SectionHeader) {
        header = props.children;
        return;
      }
      if (child.type === SectionFooter) {
        footer = props.children;
        return;
      }
      if (child.type === Fragment) {
        walk(props.children);
        return;
      }
      rows.push(child);
    });
  };

  walk(children);
  return {header, footer, rows};
}

/**
 * Mirrors SwiftUI `Form`'s behavior of wrapping consecutive non-`Section`
 * children in an implicit section, like the universal `FieldGroup` does.
 */
function groupChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];
  let buffered: ReactNode[] = [];

  const flush = () => {
    if (buffered.length === 0) return;
    result.push(<Section key={`__implicit-section-${result.length}__`}>{buffered}</Section>);
    buffered = [];
  };

  const isSection = (child: ReactNode): child is ReactElement =>
    isValidElement(child) && child.type === Section;

  Children.forEach(children, child => {
    if (isSection(child)) {
      flush();
      result.push(child);
      return;
    }
    if (isValidElement(child) && child.type === Fragment) {
      for (const nested of groupChildren((child.props as {children?: ReactNode}).children)) {
        if (isSection(nested)) {
          flush();
          result.push(nested);
        } else {
          buffered.push(nested);
        }
      }
      return;
    }
    buffered.push(child);
  });

  flush();
  return result;
}
