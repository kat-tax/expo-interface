import type {ReactNode} from 'react';
import type {FieldGroupProps, FieldGroupSectionProps} from './types';
import {Children, isValidElement} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Surface} from '../surface';
import {Footnote, Headline} from '../typography';
import {spacing, useColor} from '../theme';
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
 * form controls), each inset by the section rather than by itself.
 */
function Section({title, titleUppercase, footer, footerColor = 'secondaryLabel', children, style, testID}: FieldGroupSectionProps) {
  const separator = useColor('separator');
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

function FieldGroupBase({children, style, testID}: FieldGroupProps) {
  return (
    <ScrollView style={[styles.group, style]} contentContainerStyle={styles.content} testID={testID}>
      {children}
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
