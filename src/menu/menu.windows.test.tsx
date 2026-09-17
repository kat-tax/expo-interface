import type {MenuItem} from './types';
import {fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {fireIsland, island} from '../__tests__/windows';
import {Menu} from '.';

const FLYOUT = 'ExpoInterfaceMenuFlyout';
const BUTTON = 'ExpoInterfaceButton';

const items = (onDuplicate = vi.fn()): MenuItem[] => [
  {label: 'Rename', icon: icons.settings},
  {label: 'Red', swatch: '#FF0000', active: true, separator: true},
  {label: 'Duplicate', onPress: onDuplicate, disabled: true},
  {label: 'Delete', role: 'destructive'},
];

describe('Menu (windows)', () => {
  it('renders the trigger button with a closed MenuFlyout island over it', async () => {
    await render(<Menu label="More" icon={icons.share} items={items()} testID="more"/>);
    expect(island(BUTTON).props).toMatchObject({label: 'More', glyph: 'E72D', variant: 'filled', testID: 'more'});
    const flyout = island(FLYOUT);
    expect(flyout.props.open).toBe(false);
    expect(flyout.props.style).toMatchObject({position: 'absolute', pointerEvents: 'none'});
    expect(JSON.parse(flyout.props.items)).toEqual([
      {label: 'Rename', glyph: 'E713', swatch: null, shortcut: null, active: false, destructive: false, disabled: false, separator: false},
      {label: 'Red', glyph: null, swatch: '#FF0000', shortcut: null, active: true, destructive: false, disabled: false, separator: true},
      {label: 'Duplicate', glyph: null, swatch: null, shortcut: null, active: false, destructive: false, disabled: true, separator: false},
      {label: 'Delete', glyph: null, swatch: null, shortcut: null, active: false, destructive: true, disabled: false, separator: false},
    ]);
  });

  it('opens the flyout from a press and reports the change', async () => {
    const onOpenChange = vi.fn();
    await render(<Menu label="More" items={items()} onOpenChange={onOpenChange} testID="more"/>);
    await fireEvent(screen.getByTestId('more'), 'press');
    expect(island(FLYOUT).props.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // The same state again is not a change.
    await fireEvent(screen.getByTestId('more'), 'press');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(island(FLYOUT).props.open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('calls the picked entry, and nothing for an index without one', async () => {
    const onDuplicate = vi.fn();
    await render(<Menu label="More" items={items(onDuplicate)}/>);
    await fireIsland(island(FLYOUT), 'select', {index: 2});
    await fireIsland(island(FLYOUT), 'select', {index: 0});
    await fireIsland(island(FLYOUT), 'select', {index: 9});
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('draws the link trigger as the text variant', async () => {
    await render(<Menu label="More" items={items()} trigger="link" variant="outlined"/>);
    expect(island(BUTTON).props.variant).toBe('text');
  });
});

describe('Menu shortcuts (windows)', () => {
  it('draws an item shortcut and binds it while the menu is mounted, except for a disabled item', async () => {
    const {LayerHost} = await import('../windows/layer');
    const onSave = vi.fn();
    const onNew = vi.fn();
    const shortcuts: MenuItem[] = [
      {label: 'Save', shortcut: 'Ctrl+S', onPress: onSave},
      {label: 'New', shortcut: 'Ctrl+N', onPress: onNew, disabled: true},
    ];
    const {unmount} = await render(
      <LayerHost testID="host">
        <Menu label="File" items={shortcuts}/>
      </LayerHost>,
    );
    expect(JSON.parse(island(FLYOUT).props.items).map((item: {shortcut: string | null}) => item.shortcut)).toEqual(['Ctrl+S', 'Ctrl+N']);
    const press = (key: string) => fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key, ctrlKey: true, shiftKey: false, altKey: false, metaKey: false}});
    await press('s');
    expect(onSave).toHaveBeenCalledTimes(1);
    await press('n');
    expect(onNew).not.toHaveBeenCalled();
    unmount();
    const {dispatchShortcut} = await import('../windows/shortcuts');
    expect(dispatchShortcut({nativeEvent: {key: 's', code: 's', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false}})).toBe(false);
  });
});
