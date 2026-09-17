/**
 * The permission response Expo packages return, in the shape
 * `expo-modules-core` declares (`PermissionResponse`).
 */
export type PermissionResponse = {
  status: 'granted' | 'undetermined' | 'denied';
  expires: 'never';
  granted: boolean;
  canAskAgain: boolean;
};

/**
 * What a feature the platform does not have answers when asked for its
 * permission: denied, and asking again cannot change it. Expo's web modules
 * answer `undetermined` with `canAskAgain: true` for the same features, which
 * invites a request that never resolves anything; this is the honest form.
 */
export const DENIED: PermissionResponse = {status: 'denied', expires: 'never', granted: false, canAskAgain: false};

/** What a feature Windows never gates answers. */
export const GRANTED: PermissionResponse = {status: 'granted', expires: 'never', granted: true, canAskAgain: true};
