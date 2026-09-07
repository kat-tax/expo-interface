import {NativeHost, useNativeHost} from '../host';
import {Progress} from '../progress';

export interface SpinnerProps {
  /**
   * Diameter in points/dp. Ignored on iOS, where the system spinner keeps
   * its own size.
   * @default 24
   */
  size?: number;
  /** Color of the ring. Defaults to the theme tint. */
  color?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

/**
 * The platform's activity indicator, while something is on its way: an
 * indeterminate `Progress` ring, in a host of its own when it sits in a
 * React Native layout (a screen waiting for its record) and bare when it is
 * already inside one.
 */
export function Spinner({size, color, testID}: SpinnerProps) {
  const hosted = useNativeHost();
  const ring = <Progress variant="circular" size={size} color={color} testID={testID}/>;
  return hosted ? ring : <NativeHost fit>{ring}</NativeHost>;
}
