import {Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {useMaterialColors} from '@expo/ui/jetpack-compose';
import {alpha} from '@expo/ui/jetpack-compose/modifiers';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {AccentProvider, ACCENT_SEED} from '../accent';
import {Sheet} from '.';

/**
 * The sheet's `hide()` is a native command; the stub gives the mocked view
 * one whose promise a test settles with `finishHide()`, so a dismissal can
 * be seen to unmount the sheet only once its animation has run.
 */
let finishHide: (() => void) | undefined;
vi.mock('@expo/ui/jetpack-compose', async importOriginal => {
  const compose = await importOriginal<typeof import('@expo/ui/jetpack-compose')>();
  const {forwardRef, useImperativeHandle} = await import('react');
  const ModalBottomSheet = forwardRef<{hide: () => Promise<void>}, Parameters<typeof compose.ModalBottomSheet>[0]>(
    function ModalBottomSheetStub(props, ref) {
      useImperativeHandle(ref, () => ({
        hide: () => new Promise<void>(resolve => {
          finishHide = resolve;
        }),
      }));
      return <compose.ModalBottomSheet {...props}/>;
    },
  );
  return {...compose, ModalBottomSheet};
});

/** Reads the palette exactly like a Compose control inside the sheet would. */
function Probe({onPalette}: {onPalette: (palette: unknown) => void}) {
  onPalette(useMaterialColors());
  return <Text>probe</Text>;
}

/** The M3 `ModalBottomSheet` host view. */
const modal = () => host(p => 'showDragHandle' in p);
const sheets = () => nodes().filter(n => n.type.endsWith('ModalBottomSheetView'));

describe('Sheet (android palette)', () => {
  // expo-vitest's `getMaterialColors` answers the baseline palette with the
  // seed as `primary`, which tells a seeded host from an unseeded one.
  it('seeds its host with the accent, so the content reads the seeded Material palette', async () => {
    const onPalette = vi.fn();
    await render(
      <AccentProvider seed="#8959EA">
        <Sheet isPresented onDismiss={() => {}}>
          <Probe onPalette={onPalette}/>
        </Sheet>
      </AccentProvider>,
    );
    expect(nodes()[0].props.seedColor).toBe('#8959EA');
    expect(onPalette).toHaveBeenLastCalledWith(expect.objectContaining({primary: '#8959EA'}));
  });

  it('falls back to the default accent seed', async () => {
    const onPalette = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}}>
        <Probe onPalette={onPalette}/>
      </Sheet>,
    );
    expect(nodes()[0].props.seedColor).toBe(ACCENT_SEED);
    expect(onPalette).toHaveBeenLastCalledWith(expect.objectContaining({primary: ACCENT_SEED}));
  });
});

describe('Sheet (android presentation)', () => {
  it('opens a sheet without snap points whole, past Material\'s half-way stop, with the handle and the dismissals Material gives by default', async () => {
    await render(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    expect(modal().props).toMatchObject({
      skipPartiallyExpanded: true,
      showDragHandle: true,
      properties: {shouldDismissOnBackPress: true, shouldDismissOnClickOutside: true},
    });
  });

  it('keeps the half-way stop for a snap point that asks for one', async () => {
    await render(<Sheet isPresented onDismiss={() => {}} snapPoints={['half']}><Text>Body</Text></Sheet>);
    expect(modal().props.skipPartiallyExpanded).toBe(false);
  });

  it('passes the handle, the dismissals, the colors and the modifiers through to Material\'s sheet, and its dismissal back', async () => {
    const onDismiss = vi.fn();
    await render(
      <Sheet
        isPresented
        onDismiss={onDismiss}
        showDragIndicator={false}
        shouldDismissOnBackPress={false}
        shouldDismissOnClickOutside={false}
        scrimColor="#00000080"
        containerColor="#FFFFFF"
        contentColor="#111111"
        modifiers={[alpha(0.5)]}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(modal().props).toMatchObject({
      showDragHandle: false,
      properties: {shouldDismissOnBackPress: false, shouldDismissOnClickOutside: false},
      scrimColor: '#00000080',
      containerColor: '#FFFFFF',
      contentColor: '#111111',
    });
    expect(modifier(modal().props, 'alpha')).toEqual({$type: 'alpha', alpha: 0.5});
    await act(async () => modal().props.onDismissRequest());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('pads the content as asked: a number on every edge, or an object\'s edges with 0 for one left out', async () => {
    const {rerender} = await render(<Sheet isPresented onDismiss={() => {}} contentPadding={8} testID="sheet"><Text>Body</Text></Sheet>);
    expect(modifier(byComposeTestID('sheet').props, 'padding')).toEqual({$type: 'padding', start: 8, top: 8, end: 8, bottom: 8});
    await rerender(<Sheet isPresented onDismiss={() => {}} contentPadding={{top: 4, left: 2}} testID="sheet"><Text>Body</Text></Sheet>);
    expect(modifier(byComposeTestID('sheet').props, 'padding')).toEqual({$type: 'padding', start: 2, top: 4, end: 0, bottom: 0});
  });

  it('hides with its animation when dismissed, and unmounts once that has run', async () => {
    const {rerender} = await render(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    expect(sheets()).toHaveLength(1);
    await rerender(<Sheet isPresented={false} onDismiss={() => {}}><Text>Body</Text></Sheet>);
    // Still there while Material animates it away.
    expect(sheets()).toHaveLength(1);
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(0);
    expect(screen.toJSON()).toBeNull();
  });

  it('stays mounted when presented again before the hide animation has run', async () => {
    const {rerender} = await render(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    await rerender(<Sheet isPresented={false} onDismiss={() => {}}><Text>Body</Text></Sheet>);
    await rerender(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    await act(async () => finishHide?.());
    expect(sheets()).toHaveLength(1);
  });

  it('mounts when presented after rendering dismissed', async () => {
    const {rerender} = await render(<Sheet isPresented={false} onDismiss={() => {}}><Text>Body</Text></Sheet>);
    expect(screen.toJSON()).toBeNull();
    await rerender(<Sheet isPresented onDismiss={() => {}}><Text>Body</Text></Sheet>);
    expect(sheets()).toHaveLength(1);
  });
});
