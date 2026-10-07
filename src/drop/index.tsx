import type {RefObject} from 'react';
import type {View} from 'react-native';
import type {DropOptions, DropZoneProps} from './types';
import {View as RNView} from 'react-native';

/**
 * iOS, Android and Windows: files arrive through the share sheet and the
 * pickers, not by dropping them on a view, so nothing is ever held over
 * one and nothing is dropped. The web's is `index.web.tsx`.
 */
export function useDrop(_ref: RefObject<View | null>, _options: DropOptions): {over: boolean} {
  return {over: false};
}

/** iOS, Android and Windows: the children, as they are. */
export function DropZone({children, style, testID}: DropZoneProps) {
  return <RNView style={style} testID={testID}>{children}</RNView>;
}

export type {DropOptions, DropZoneProps, DroppedFile} from './types';
