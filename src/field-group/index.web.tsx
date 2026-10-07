import './field-group.css';
import type {ReactElement, ReactNode} from 'react';
import type {FieldGroupProps, FieldGroupSectionProps, FieldSectionFooterColor} from './types';
import {useEffect, useEffectEvent} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {FieldGroup as Base} from '@expo/ui';
import {useScrollInsets} from '../screen/insets';
import {Footnote} from '../typography';
import {SectionGroups, useReportSection} from './collect';
import {baseSection} from './shared';

const renderFooter = (footer: string, color: FieldSectionFooterColor) => <Footnote color={color}>{footer}</Footnote>;

/**
 * Web: the universal `FieldGroup.Section` with the `footer` prop as its
 * footer slot, drawn as the kit's `Footnote`.
 */
function Section(props: FieldGroupSectionProps) {
  useReportSection();
  return baseSection(props, renderFooter);
}

const isSection = (child: ReactElement) => child.type === Section;
const implicit = (rows: ReactNode[], key: string) => <Base.Section key={key}>{rows}</Base.Section>;

/**
 * The universal group's scroll view, at its metrics, with the sections found
 * through context (`SectionGroups`) rather than among the direct children
 * alone, and the content padded by the bar it passes under
 * (`useScrollInsets()`). The wrapper is the hook for `field-group.css`,
 * which gives the page the app's palette and recolors the section cards and
 * the row dividers to the kit's tokens.
 */
function FieldGroupBase({style, children, onAppear, onDisappear, hidden = false, testID}: FieldGroupProps) {
  const appear = useEffectEvent(() => onAppear?.());
  const disappear = useEffectEvent(() => onDisappear?.());
  useEffect(() => {
    appear();
    return () => disappear();
  }, []);
  const insets = useScrollInsets();
  return (
    <div className="field-group">
      <ScrollView
        style={[styles.group, style, hidden && styles.hidden]}
        contentContainerStyle={[styles.content, {paddingTop: 16 + insets.top, paddingBottom: 16 + insets.bottom}]}
        testID={testID}>
        <SectionGroups isSection={isSection} implicit={implicit}>{children}</SectionGroups>
      </ScrollView>
    </div>
  );
}

const styles = StyleSheet.create({
  group: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  content: {
    gap: 24,
    paddingHorizontal: 16,
  },
});

export const FieldGroup = Object.assign(FieldGroupBase, {
  Section,
  SectionHeader: Base.SectionHeader,
  SectionFooter: Base.SectionFooter,
});

export type {FieldGroupProps, FieldGroupSectionProps};
