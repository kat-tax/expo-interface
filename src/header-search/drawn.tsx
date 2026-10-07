import type {SearchFieldCommands} from '../search-field/types';
import type {DrawnSearchPlacement, HeaderSearchProps, HeaderSearchSlot} from './types';
import {useContext, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {HeaderAction} from '../header-action';
import {SEARCH_LABEL} from '../search-field/shared';
import {SearchField} from '../search-field';
import {Surface} from '../surface';
import {bound, spacing} from '../theme';
import {Toolbar} from '../toolbar';
import {InlineField} from './inline';
import {DrawnSearchContext, SEARCH_ICON, SHORT, drawnPlacement, placeholderFor} from './shared';

/** What the field is drawn as: one of the header's placements, or the bottom bar's field across the bar. */
export type DrawnSearchMode = DrawnSearchPlacement | 'bar';

export interface DrawnSearchProps extends Omit<HeaderSearchProps, 'placement' | 'integration' | 'hideWhenScrolling' | 'inputType'> {
  mode: DrawnSearchMode;
  /** Told when an `action` expands and collapses: the header gives the field the row. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The search as the kit draws it where the platform has no header search of
 * its own, holding the text the way a native search field does (the kit's
 * commands set it, the app reads it through the events), in one of the
 * header's placements or across a bottom bar. The rows and the bar take
 * `SearchField`'s box; `inline` is the field beside the title as the platform
 * draws one there (frameless on web, the `AutoSuggestBox` on Windows).
 *
 * An `action` is the magnifier until it is pressed, then the field with the
 * focus; it collapses on Escape, through `cancel`, or when it loses the
 * focus with nothing in it. The other modes report the focus coming and
 * going as the search opening and closing.
 */
export function DrawnSearch({mode, placeholder, autoFocus = false, autoCapitalize, onChangeText, onSubmit, onOpen, onClose, onFocus, onBlur, onOpenChange, ref, testID}: DrawnSearchProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(autoFocus);
  const field = useRef<SearchFieldCommands>(null);
  const action = mode === 'action';
  const expanded = !action || open;
  // The full placeholder everywhere; the short one only where a narrow web bar asks for it.
  const full = placeholderFor(placeholder);
  // The header is told whether the action has the row, from the start (an
  // action that opens on mount) and on every change.
  useEffect(() => {
    if (action) onOpenChange?.(open);
  }, [action, open, onOpenChange]);

  const toggle = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    (next ? onOpen : onClose)?.();
  };
  const collapse = () => {
    setText('');
    field.current?.blur();
    toggle(false);
  };

  useImperativeHandle(ref, () => ({
    focus() {
      // The field mounts expanded with the focus; one already drawn is asked for it.
      if (action) toggle(true);
      field.current?.focus();
    },
    blur() {
      field.current?.blur();
    },
    setText,
    clear() {
      setText('');
    },
    cancel() {
      if (action) collapse();
      else {
        setText('');
        field.current?.blur();
      }
    },
  }));

  if (!expanded) {
    return (
      <HeaderAction
        label={full ?? SEARCH_LABEL}
        icon={SEARCH_ICON}
        hideLabel
        tone="label"
        onPress={() => toggle(true)}
        testID={testID ? `${testID}-open` : undefined}
      />
    );
  }

  const fieldProps = {
    ref: field,
    value: text,
    placeholder: full,
    autoCapitalize,
    // An action's field was just opened, by a press or a command, and takes the focus.
    autoFocus: action || autoFocus,
    onChangeText: (next: string) => {
      setText(next);
      onChangeText?.(next);
    },
    onSubmit,
    onFocus: () => {
      onFocus?.();
      if (!action) onOpen?.();
    },
    onBlur: () => {
      onBlur?.();
      if (!action) onClose?.();
      else if (text === '') toggle(false);
    },
    onKeyPress: (key: string) => {
      if (key === 'Escape' && action) collapse();
    },
    testID,
  };

  if (mode === 'inline') return <InlineField {...fieldProps} shortPlaceholder={placeholderFor(placeholder, SHORT)}/>;
  return (
    <View style={styles[mode]}>
      <SearchField {...fieldProps}/>
    </View>
  );
}

/**
 * The element a drawn header holds for a screen's search: it draws the
 * field in the placement the header resolved, and tells the header when an
 * `action` has the row. Outside a header's site (a custom header's trailing
 * slot) the placement asked for is drawn as a header would draw it.
 */
export function SiteSearch({placement, ...props}: Omit<HeaderSearchProps, 'placement'> & {placement: HeaderSearchSlot['placement']}) {
  const site = useContext(DrawnSearchContext);
  const mode = site?.placement ?? drawnPlacement(placement);
  return <DrawnSearch {...props} mode={mode} onOpenChange={site?.setOpen}/>;
}

/**
 * The stacked search where there is no header to put it in (Android): a row
 * in the header's fill with its hairline under the app bar, the field the
 * width of the content.
 */
export function StackedSearchRow(props: HeaderSearchProps) {
  return (
    <Surface color="background" border="bottom" radius={0} style={styles.row} testID={props.testID ? `${props.testID}-stacked` : undefined}>
      <View style={styles.rowInner}>
        <DrawnSearch {...props} mode="stacked"/>
      </View>
    </Surface>
  );
}

/**
 * The integrated search where the platform has no toolbar search: the kit's
 * bottom `Toolbar`, with the field across its field slot.
 */
export function SearchBottomBar(props: HeaderSearchProps) {
  return <Toolbar placement="bottom" field={<DrawnSearch {...props} mode="bar"/>} testID={props.testID ? `${props.testID}-bar` : undefined}/>;
}

const styles = StyleSheet.create({
  stacked: {
    width: '100%',
  },
  bar: {
    width: '100%',
  },
  // The open action takes the row: the header lets go of its title for it.
  action: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    width: '100%',
    alignItems: 'center',
  },
  rowInner: {
    width: '100%',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
  },
});
