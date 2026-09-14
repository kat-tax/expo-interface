import type {TestInstance} from 'test-renderer';
import {fireEvent, screen} from '@testing-library/react-native';

/**
 * The kit's XAML islands render as host views named after their native
 * components (`ExpoInterfaceButton`, `ExpoInterfaceToggleSwitch`, ...) whose
 * props are the payload handed to `windows/ExpoInterface`. These helpers find
 * them and fire the events the C++ side would.
 */

/**
 * The rendered tree's container: above the root, so a root island is found
 * too. The harness's renderer walks a tree with `queryAll` rather than
 * react-test-renderer's `findAll`.
 */
function container(): {queryAll(predicate: (node: TestInstance) => boolean): TestInstance[]} {
  return (screen as unknown as {container: ReturnType<typeof container>}).container;
}

/** The `index`th island of `name` in the rendered tree. Throws when there is none. */
export function island(name: string, index = 0): TestInstance {
  const all = islands(name);
  const found = all[index];
  if (!found) throw new Error(`No ${name} island (${all.length} rendered)`);
  return found;
}

/** Every island of `name`, in order. */
export function islands(name: string): TestInstance[] {
  return container().queryAll(node => node.type === name);
}

/**
 * Fires a native event on an island, as the C++ side dispatches it. The
 * harness's `fireEvent` flushes React in an async act: always awaited, or
 * the update lands in the next test.
 */
export async function fireIsland(instance: TestInstance, event: string, payload: object = {}): Promise<void> {
  await fireEvent(instance, event, {nativeEvent: payload});
}
