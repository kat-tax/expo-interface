import type {ReactElement, ReactNode} from 'react';
import type {FieldGroupProps, FieldGroupSectionProps} from './types';
import {Children, isValidElement} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {Surface} from '../surface';
import {Footnote, Headline} from '../typography';
import {spacing, useColor} from '../theme';
import {SectionGroups, useReportSection} from './collect';
import {flushRow} from './rows';

/** Slot marker: content for a section's header, in place of `title`. */
function SectionHeader(_props: {children?: ReactNode}): null {
  return null;
}

/** Slot marker: content for a section's footer, in place of `footer`. */
function SectionFooter(_props: {children?: ReactNode}): null {
  return null;
}

/**
 * Windows draws the form itself, the way the Settings app lays a page out:
 * a section is a body-strong heading over a card of rows divided by
 * hairlines, with a note under it. The rows are the kit's (`ListItem`, the
 * form controls), each inset by the section rather than by itself. A
 * hidden section, like a hidden group, draws nothing.
 */
function Section({title, titleUppercase, footer, footerColor = 'secondaryLabel', hidden, children, style, testID}: FieldGroupSectionProps) {
  useReportSection();
  const separator = useColor('separator');
  if (hidden) return null;
  const rows: ReactNode[] = [];
  let header: ReactNode;
  let note: ReactNode;
  Children.forEach(children, child => {
    if (isValidElement<{children?: ReactNode}>(child) && child.type === SectionHeader) header = child.props.children;
    else if (isValidElement<{children?: ReactNode}>(child) && child.type === SectionFooter) note = child.props.children;
    else if (child != null && child !== false) rows.push(flushRow(child));
  });
  return (
    <View style={[styles.section, style]} testID={testID}>
      {header ?? (title != null ? (
        <Headline color="label">{titleUppercase ? title.toUpperCase() : title}</Headline>
      ) : null)}
      <Surface border="all" radius={4}>
        {rows.map((row, index) => (
          <View key={index} style={[styles.row, index > 0 && {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: separator}]}>
            {row}
          </View>
        ))}
      </Surface>
      {note ?? (footer != null ? <Footnote color={footerColor}>{footer}</Footnote> : null)}
    </View>
  );
}

const isSection = (child: ReactElement) => child.type === Section;
const implicit = (rows: ReactNode[], key: string) => <Section key={key}>{rows}</Section>;

/**
 * The group's scroll view. Rows outside a section are a card of their own,
 * an implicit section, as a SwiftUI `Form` groups them and the other
 * platforms follow; a section is found by its type or, inside a component
 * of the app's own, through context (`SectionGroups`).
 */
function FieldGroupBase({children, hidden, style, testID}: FieldGroupProps) {
  const insets = useScrollInsets();
  if (hidden) return null;
  return (
    <ScrollView
      style={[styles.group, style]}
      contentContainerStyle={[styles.content, {paddingTop: spacing.three + insets.top, paddingBottom: spacing.three + insets.bottom}]}
      testID={testID}>
      <SectionGroups isSection={isSection} implicit={implicit}>{children}</SectionGroups>
    </ScrollView>
  );
}

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader,
  SectionFooter,
});

const styles = StyleSheet.create({
  group: {
    flex: 1,
  },
  content: {
    padding: spacing.three,
    gap: spacing.four,
  },
  section: {
    gap: spacing.two,
  },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
  },
});

export type {FieldGroupProps, FieldGroupSectionProps};
