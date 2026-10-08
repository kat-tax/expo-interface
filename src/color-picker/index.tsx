import './color-picker.css';
import type {CSSProperties, ReactNode} from 'react';
import type {ColorPickerProps} from './types';

import {useId, useState} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {MenuList, menuIdent} from '../menu/list';
import {Label} from '../typography';
import {Sheet} from '../sheet';
import {flatten} from '../theme';
import {NO_COLOR, sameColor, swatchMenu, swatchesOf} from './choices';
import {ColorPickerSheet} from './sheet';
import {parseColor, toCss, toHex, useColorValue} from './shared';

/**
 * On web the row is a native `<button>` holding the label and the color
 * well — a conic rainbow ring around the selected color, as on iOS — which
 * opens the iOS picker redrawn in the kit's `Sheet`. With `swatches` (or
 * `allowsNone`) the row is a `<div>` instead, so each preset and the well
 * are buttons of their own (buttons cannot nest). `inline` draws the picker
 * in place, titled only by a `label`; `popover` opens it in a native popover
 * placed against the well by CSS anchor positioning; `menu` opens the
 * swatches in the kit's menu popover from the well.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  presentation = 'automatic',
  allowsNone = false,
  disabled,
  testID,
  style,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  // The popover's element, held in state through its ref callback, so its close button can hide it.
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const none = value === NO_COLOR;
  const presets = swatchesOf(swatches);
  const vars = {
    '--ui-color-picker-value': toCss(current),
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  const className = ['ui-color-picker', disabled && 'ui-color-picker--disabled'].filter(Boolean).join(' ');
  const labelNode = label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null;
  const well = (
    <span className={['ui-color-picker__well', none && 'ui-color-picker__well--none'].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="ui-color-picker__swatch"/>
    </span>
  );
  // A picker in a sheet or a popover is titled; one drawn in place only by a label.
  const title = label ?? 'Colors';
  const panel = (heading: string | undefined, onClose?: () => void) => (
    <ColorPickerSheet
      title={heading}
      value={toHex(current, true)}
      supportsOpacity={supportsOpacity}
      onValueChange={hex => setCurrent(parseColor(hex))}
      onClose={onClose}
      disabled={disabled}
      testID={testID ? `${testID}-sheet` : undefined}
    />
  );
  // The presets: "No color" first when allowed, then the swatches, the selected one ringed.
  const presetButtons: ReactNode[] = [
    ...(allowsNone ? [
      <button
        key="none"
        type="button"
        className={['ui-color-picker__preset', 'ui-color-picker__preset--none', none && 'ui-color-picker__preset--selected'].filter(Boolean).join(' ')}
        aria-label="No color"
        aria-pressed={none}
        disabled={disabled}
        onClick={() => onValueChange(NO_COLOR)}
      />,
    ] : []),
    ...presets.map(({color, name}) => {
      // The ring follows the color held here, which a pick changes at once.
      const selected = !none && sameColor(color, toHex(current, false));
      return (
        <button
          key={color}
          type="button"
          className={['ui-color-picker__preset', selected && 'ui-color-picker__preset--selected'].filter(Boolean).join(' ')}
          style={{'--ui-color-picker-preset': color} as CSSProperties}
          aria-label={`Color ${name}`}
          aria-pressed={selected}
          disabled={disabled}
          onClick={() => setCurrent({...parseColor(color), a: current.a})}
        />
      );
    }),
  ];

  if (presentation === 'inline') {
    return (
      <div className="ui-color-picker-inline" style={vars} data-testid={testID}>
        {presetButtons.length > 0 ? <span className="ui-color-picker__presets ui-color-picker__presets--inline">{presetButtons}</span> : null}
        {panel(label)}
      </div>
    );
  }

  if (presentation === 'menu') {
    return (
      <div className={`${className} ui-color-picker--presets`} style={{...vars, anchorName: anchor} as CSSProperties} data-testid={testID}>
        {labelNode}
        <button
          type="button"
          className="ui-color-picker__open"
          aria-label={label ?? 'Color'}
          aria-haspopup="menu"
          disabled={disabled}
          popoverTarget={ident}>
          {well}
        </button>
        <MenuList id={ident} items={swatchMenu(presets, value, allowsNone, supportsOpacity, onValueChange)} anchor={anchor}/>
      </div>
    );
  }

  const popped = presentation === 'popover';
  // The picker: in a sheet, or in a native popover placed against the well.
  const picker = popped ? (
    <div ref={setPopover} id={ident} popover="auto" className="ui-color-picker__popover" style={{positionAnchor: anchor} as CSSProperties}>
      {panel(title, () => popover?.hidePopover?.())}
    </div>
  ) : (
    <Sheet isPresented={open} onDismiss={() => setOpen(false)}>
      {panel(title, () => setOpen(false))}
    </Sheet>
  );
  // The well opens the picker: a popover's by its `popovertarget`, a sheet's by a press.
  const opener = popped
    ? {popoverTarget: ident, 'aria-haspopup': 'dialog' as const}
    : {onClick: () => setOpen(true), 'aria-haspopup': 'dialog' as const, 'aria-expanded': open};
  const anchored = popped ? {anchorName: anchor} : null;

  if (presetButtons.length > 0) {
    return (
      <>
        <div className={`${className} ui-color-picker--presets`} style={{...vars, ...anchored} as CSSProperties} data-testid={testID}>
          {labelNode}
          <span className="ui-color-picker__presets">
            {presetButtons}
            <button type="button" className="ui-color-picker__open" aria-label={label ?? 'Color'} disabled={disabled} {...opener}>
              {well}
            </button>
          </span>
        </div>
        {picker}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={{...vars, ...anchored} as CSSProperties}
        disabled={disabled}
        aria-label={label == null ? 'Color' : undefined}
        data-testid={testID}
        {...opener}>
        {labelNode}
        {well}
      </button>
      {picker}
    </>
  );
}
