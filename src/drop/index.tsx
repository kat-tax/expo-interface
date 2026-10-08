import type {RefObject} from 'react';
import type {View} from 'react-native';
import type {DropOptions, DropZoneProps} from './types';
import {View as RNView} from 'react-native';

/**
 * Makes a view a drop target for files, answering whether files are held
 * over it. On the web it takes files dropped on the view, and while it is
 * mounted the page refuses a file dropped where no target takes it, so the
 * browser does not open it in place of the app; a target of the app's own
 * takes a drag by cancelling its `dragover` (`index.web.tsx`). iOS, Android
 * and Windows: files arrive through the share sheet and the pickers, not by
 * dropping them on a view, so nothing is ever held over one and nothing is
 * dropped.
 */
export function useDrop(_ref: RefObject<View | null>, _options: DropOptions): {over: boolean} {
  return {over: false};
}

/** iOS, Android and Windows: the children, as they are. */
export function DropZone({children, style, testID}: DropZoneProps) {
  return <RNView style={style} testID={testID}>{children}</RNView>;
}

export type {DropOptions, DropZoneProps, DroppedFile} from './types';
