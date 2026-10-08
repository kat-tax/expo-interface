import type {SheetHostedProps} from './shared';

/**
 * Web: React Native content in the sheet as it is. The drawer is the DOM's,
 * where a React Native box takes its width and its presses without help.
 */
export function SheetHosted({children}: SheetHostedProps) {
  return <>{children}</>;
}
