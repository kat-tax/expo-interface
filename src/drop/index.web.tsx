import type {RefObject} from 'react';
import type {DropOptions, DropZoneProps, DroppedFile} from './types';
import {useEffect, useEffectEvent, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Surface} from '../surface';
import {Body} from '../typography';
import {spacing} from '../theme';

/** The files a drag carries, as the kit hands them over. */
function filesOf(transfer: DataTransfer): DroppedFile[] {
  return Array.from(transfer.files, file => ({name: file.name, type: file.type, size: file.size, file}));
}

/** Whether a drag carries files, rather than text or a link from the page. */
function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/** How many drop targets are mounted, which together keep the page from opening a stray drop. */
let targets = 0;

/** The drag events the page's guard refuses a stray file in. */
const GUARDED = ['dragover', 'drop'] as const;

/**
 * Whether the drag is over a file input that takes it, which does as the
 * browser's control; a disabled one takes nothing. The path's first entry is
 * the drag's own target, which the event's `target` is not for an input in a
 * web component's open shadow root: by the time the window hears the drag,
 * that is the component. A closed shadow root hides its input from the path.
 */
function overFileInput(event: DragEvent): boolean {
  const [target] = event.composedPath();
  return target instanceof HTMLInputElement && target.type === 'file' && !target.disabled;
}

/**
 * A file dragged over or dropped on the page where nothing took it is
 * refused, the pointer showing that nothing takes it: left alone, the
 * browser opens the file in place of the app. A target that took the drag
 * has cancelled the event already, and keeps it, its effect as it set it.
 */
function refuseStray(event: DragEvent) {
  if (event.defaultPrevented || !carriesFiles(event) || overFileInput(event)) return;
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'none';
}

/**
 * Puts the refusal behind every other listener of the window, the last stop
 * of a drag's events. It runs as the window captures each drag event, before
 * the event reaches anything else, and the window's own listeners are read
 * afresh when the event comes back up to it. So a page-wide target of the
 * app's, on any element, the document or the window, hears every drag event
 * first, even with a listener it added during the drag, and keeps what it
 * takes.
 */
function refuseLast() {
  for (const type of GUARDED) {
    window.removeEventListener(type, refuseStray);
    window.addEventListener(type, refuseStray);
  }
}

/** Refuses stray file drops on the page while a target is mounted; answers the release. */
function guardPage(): () => void {
  targets += 1;
  if (targets === 1) {
    for (const type of GUARDED) window.addEventListener(type, refuseLast, true);
    refuseLast();
  }
  return () => {
    targets -= 1;
    if (targets === 0) {
      for (const type of GUARDED) {
        window.removeEventListener(type, refuseLast, true);
        window.removeEventListener(type, refuseStray);
      }
    }
  };
}

/**
 * Web: makes the element a drop target for files, through the DOM's drag
 * events. A drag passes over the element's children too, each crossing a
 * leave and an enter of its own, so the hold is counted rather than taken
 * from the last event: `over` is true from the first enter to the last
 * leave or the drop. Drags of anything but files are left to the page.
 * While it is mounted, disabled or not, a file dragged over or dropped on
 * the page where no target takes it is refused, so the browser does not
 * open a stray drop in place of the app; a file input that is not disabled
 * keeps its own drops. The refusal comes after every other listener, so a
 * page-wide target of the app's own, on the document or the window, takes a
 * drag before it. A target takes a drag by cancelling its `dragover`, as the
 * browser asks of every drop target: an editor that takes dropped files in
 * its `drop` alone, leaving `dragover` to the browser, is refused with the
 * page.
 */
export function useDrop(ref: RefObject<View | null>, {onDrop, disabled = false}: DropOptions): {over: boolean} {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const drop = useEffectEvent((files: DroppedFile[]) => onDrop(files));
  // Apart from the target's own listeners, so a disabled target guards the page too.
  useEffect(() => guardPage(), []);
  useEffect(() => {
    // A react-native-web view's ref is its DOM element.
    const element = ref.current as unknown as HTMLElement | null;
    if (!element || disabled) return undefined;
    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setOver(true);
    };
    const hover = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      // Without this the browser refuses the drop, and opens the file instead.
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    };
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    };
    const land = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setOver(false);
      drop(filesOf(event.dataTransfer!));
    };
    element.addEventListener('dragenter', enter);
    element.addEventListener('dragover', hover);
    element.addEventListener('dragleave', leave);
    element.addEventListener('drop', land);
    return () => {
      element.removeEventListener('dragenter', enter);
      element.removeEventListener('dragover', hover);
      element.removeEventListener('dragleave', leave);
      element.removeEventListener('drop', land);
      depth.current = 0;
    };
  }, [ref, disabled]);
  return {over: over && !disabled};
}

/**
 * Web: the children, taking files dropped on them, with a dashed `Surface`
 * over them and the label while files are held over the zone. While it is
 * mounted, a file dropped anywhere else on the page is refused rather than
 * opened by the browser in place of the app, unless a page-wide target of
 * the app's own takes it (see `useDrop`).
 */
export function DropZone({children, onDrop, disabled, label = 'Drop files here', style, testID}: DropZoneProps) {
  const zone = useRef<View>(null);
  const {over} = useDrop(zone, {onDrop, disabled});
  return (
    <View ref={zone} style={style} testID={testID}>
      {children}
      {over ? (
        <Surface border="all" dashed borderColor="tint" color="background" radius={12} style={styles.overlay} testID={testID ? `${testID}-over` : undefined}>
          <Body color="tint">{label}</Body>
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: spacing.two,
    right: spacing.two,
    bottom: spacing.two,
    left: spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    // The children keep the drag: the overlay only shows it.
    pointerEvents: 'none',
  },
});

export type {DropOptions, DropZoneProps, DroppedFile} from './types';
