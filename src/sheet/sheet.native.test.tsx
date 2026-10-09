import {useContext} from 'react';
import {Platform, Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {AccentProvider, ACCENT_SEED} from '../accent';
import type {HostNode} from 'expo-vitest/native';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {ScrollInsetsContext, useScrollInsets} from '../screen/insets';
import {SheetBodyCapContext} from './cap-context';
import {Sheet} from '.';

/** Prints the cap a list at this point would take as its height. */
function Cap() {
  const cap = useContext(SheetBodyCapContext);
  return <Text>{`cap ${cap}`}</Text>;
}

const isIOS = Platform.OS === 'ios';

/** Prints the scroll insets a list or a form at this point pads by. */
function Insets() {
  const {top, bottom, automatic} = useScrollInsets();
  return <Text>{`${top} ${bottom} ${automatic}`}</Text>;
}

/** iOS: the SwiftUI `Group` wrapping the sheet content carries the presentation modifiers. */
const presentation = () => host(p => modifier(p, 'presentationDragIndicator') != null);
/** Android: the M3 `ModalBottomSheet` host. */
const modal = () => host(p => 'showDragHandle' in p);

describe(`Sheet (${Platform.OS})`, () => {
  it('mounts its own absolute Host and presents the sheet', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} testID="sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    const [root] = nodes();
    expect(root.type).toBe('ViewManagerAdapter_ExpoUI_HostView');
    expect(root.props.style).toEqual({position: 'absolute'});
    expect(root.props.pointerEvents).toBe('none');
    if (isIOS) {
      const {props} = screen.getByTestId('sheet');
      expect(props.isPresented).toBe(true);
      expect(props.fitToContents).toBe(true);
      expect(modifier(presentation().props, 'presentationDragIndicator')).toEqual({
        $type: 'presentationDragIndicator',
        visibility: 'visible',
      });
    } else {
      expect(modal().props.showDragHandle).toBe(true);
      // Without snap points the sheet opens whole, past Material's half-way stop.
      expect(modal().props.skipPartiallyExpanded).toBe(true);
      const {props} = byComposeTestID('sheet');
      expect(modifier(props, 'padding')).toEqual({$type: 'padding', start: 16, top: 0, end: 16, bottom: 0});
      expect(modifier(props, 'fillMaxHeight')).toBeUndefined();
    }
    expect(JSON.stringify(screen.toJSON())).toContain('"Content"');
  });

  it('cascades the default accent seed to the sheet content', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}}>
        <Text>Content</Text>
      </Sheet>,
    );
    if (isIOS) {
      expect(modifier(presentation().props, 'tint')).toEqual({$type: 'tint', tint: {type: 'color', color: ACCENT_SEED}});
    } else {
      // The seeded host is covered in sheet.android.test.tsx; the sheet itself takes no modifiers.
      expect(nodes()[0].props.seedColor).toBe(ACCENT_SEED);
      expect(modal().props.modifiers).toBeUndefined();
    }
  });

  (isIOS ? it : it.skip)('applies a user-supplied seed after the presentation modifiers, before custom ones', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Sheet isPresented onDismiss={() => {}} modifiers={[{$type: 'interactiveDismissDisabled'}]}>
          <Text>Content</Text>
        </Sheet>
      </AccentProvider>,
    );
    const types = (presentation().props.modifiers as {$type: string}[]).map(m => m.$type);
    expect(types).toEqual([
      'frame',
      'padding',
      'presentationDragIndicator',
      'tint',
      'interactiveDismissDisabled',
    ]);
    expect(modifier(presentation().props, 'tint')?.tint.color).toBe('#8959EA');
  });

  (isIOS ? it : it.skip)('stacks the pieces in one SwiftUI column, so the sheet pads and fits them once', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="New drop" actions={[{label: 'Create'}]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    // The group the presentation modifiers sit on has one member.
    const group = presentation();
    expect(group.children).toHaveLength(1);
    const [stack] = group.children as HostNode[];
    expect(stack.type).toBe('ViewManagerAdapter_ExpoUI_VStackView');
    expect(stack.props).toMatchObject({spacing: 0, alignment: 'leading'});
    // It takes the width offered, not its pieces', and reports it for the hosted pieces.
    expect((stack.props.modifiers as {$type: string}[]).map(m => m.$type)).toEqual(['frame', 'onGeometryChange']);
    expect(modifier(stack.props, 'frame')).toEqual({$type: 'frame', minWidth: 0, maxWidth: Infinity, alignment: 'leading'});
    const [bar, body, actions] = stack.children as HostNode[];
    expect(stack.children).toHaveLength(3);
    expect(bar.props.testID).toBe('sheet-bar');
    expect(JSON.stringify(body)).toContain('"Body"');
    expect(actions.props.testID).toBe('sheet-actions');
  });

  (isIOS ? it.skip : it)('stacks the pieces in one Compose column that fills the sheet\'s width', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="New drop" actions={[{label: 'Create'}]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const [column] = byComposeTestID('sheet').children as HostNode[];
    expect(byComposeTestID('sheet').children).toHaveLength(1);
    expect(column.type).toBe('ViewManagerAdapter_ExpoUI_ColumnView');
    expect((column.props.modifiers as {$type: string}[]).map(m => m.$type)).toEqual(['fillMaxWidth', 'onSizeChanged']);
    expect(column.children).toHaveLength(3);
  });

  it('hides the drag indicator on request', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} showDragIndicator={false} testID="sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    if (isIOS) {
      expect(modifier(presentation().props, 'presentationDragIndicator')?.visibility).toBe('hidden');
    } else {
      expect(modal().props.showDragHandle).toBe(false);
      // Without the handle the content gets top padding so it doesn't crop.
      expect(modifier(byComposeTestID('sheet').props, 'padding')?.top).toBe(16);
    }
  });

  it('maps snap points to the platform detents', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} snapPoints={['half', 'full']} testID="sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    if (isIOS) {
      expect(screen.getByTestId('sheet').props.fitToContents).toBe(false);
      expect(modifier(presentation().props, 'presentationDetents')).toEqual({
        $type: 'presentationDetents',
        detents: ['medium', 'large'],
      });
    } else {
      expect(modal().props.skipPartiallyExpanded).toBe(false);
      expect(modifier(byComposeTestID('sheet').props, 'fillMaxHeight')).toEqual({$type: 'fillMaxHeight'});
    }
  });

  it('gives its content no scroll insets, whatever screen it opens from', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 96, bottom: 24, left: 0, right: 0, automatic: true}}>
        <Insets/>
        <Sheet isPresented onDismiss={() => {}} accessory={<Insets/>} footer={<Insets/>} maxHeight={300}>
          <Insets/>
        </Sheet>
      </ScrollInsetsContext.Provider>,
    );
    // The screen's own content keeps the bar's insets; the accessory, the body and the footer get none.
    expect(screen.getByText('96 24 true')).toBeOnTheScreen();
    expect(screen.getAllByText('0 0 false')).toHaveLength(3);
  });

  it('renders nothing while dismissed', async () => {
    await render(
      <Sheet isPresented={false} onDismiss={() => {}} testID="sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    if (isIOS) {
      expect(screen.getByTestId('sheet').props.isPresented).toBe(false);
    } else {
      expect(screen.toJSON()).toBeNull();
    }
  });

  it('tells a capped body its cap in points, for a list to take as its height, and the rest nothing', async () => {
    const {rerender} = await render(
      <Sheet isPresented onDismiss={() => {}} accessory={<Cap/>} footer={<Cap/>} maxHeight={300}>
        <Cap/>
      </Sheet>,
    );
    // The body alone: the accessory and the footer stand outside the capped box.
    expect(screen.getByText('cap 300')).toBeOnTheScreen();
    expect(screen.getAllByText('cap undefined')).toHaveLength(2);
    await rerender(
      <Sheet isPresented onDismiss={() => {}}>
        <Cap/>
      </Sheet>,
    );
    expect(screen.getByText('cap undefined')).toBeOnTheScreen();
  });
});

describe('material', () => {
  const isIOS = Platform.OS === 'ios';

  (isIOS ? it : it.skip)('asks SwiftUI for the real material, not a translucent fill', async () => {
    await render(<Sheet isPresented onDismiss={() => {}} material="regular"><Text>Body</Text></Sheet>);
    const sheet = host(props => Array.isArray(props.modifiers));
    expect(modifier(sheet.props, 'presentationBackground')).toEqual({
      $type: 'presentationBackground',
      style: {type: 'material', material: 'regular'},
    });
  });

  (isIOS ? it : it.skip)('asks for nothing at all for the opaque sheet, which is the default', async () => {
    await render(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    expect(modifier(host(props => Array.isArray(props.modifiers)).props, 'presentationBackground')).toBeUndefined();
    await render(<Sheet isPresented onDismiss={() => {}} material="none"><Text>Body</Text></Sheet>);
    expect(modifier(host(props => Array.isArray(props.modifiers)).props, 'presentationBackground')).toBeUndefined();
  });

  (isIOS ? it.skip : it)('leaves the Android sheet opaque, because Compose has no material for it', async () => {
    await render(<Sheet isPresented onDismiss={() => {}} material="thick"><Text>Body</Text></Sheet>);
    // ModalBottomSheet takes a containerColor and nothing else; the prop is
    // documented as absent here rather than quietly doing nothing.
    expect(nodes().every(node => node.props.presentationBackground === undefined)).toBe(true);
  });
});
