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

/**
 * Web: makes the element a drop target for files, through the DOM's drag
 * events. A drag passes over the element's children too, each crossing a
 * leave and an enter of its own, so the hold is counted rather than taken
 * from the last event: `over` is true from the first enter to the last
 * leave or the drop. Drags of anything but files are left to the page.
 */
export function useDrop(ref: RefObject<View | null>, {onDrop, disabled = false}: DropOptions): {over: boolean} {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const drop = useEffectEvent((files: DroppedFile[]) => onDrop(files));
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
 * over them and the label while files are held over the zone.
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
