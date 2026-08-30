import {Platform, Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {AccentProvider, ACCENT_SEED} from '../accent';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {Sheet} from '.';

const isIOS = Platform.OS === 'ios';

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
      expect(modal().props.skipPartiallyExpanded).toBe(false);
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
      expect(modifier(presentation().props, 'tint')).toEqual({$type: 'tint', color: ACCENT_SEED});
    } else {
      // Palette overlay is covered in sheet.android.test.tsx; the sheet itself takes no modifiers.
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
    expect(modifier(presentation().props, 'tint')?.color).toBe('#8959EA');
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
});
