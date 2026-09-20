// Vitest 4 only re-exports `Assertion`/`Matchers` from `@vitest/expect`, so
// the `declare module 'vitest'` augmentation shipped by
// `@testing-library/jest-dom/vitest` (see the tsconfig `types` entry) no
// longer merges. Extend the `Matchers` interface at its origin instead;
// `Assertion` and `ExpectStatic` both inherit from it.
import type {TestingLibraryMatchers} from '@testing-library/jest-dom/matchers';

declare module '@vitest/expect' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends TestingLibraryMatchers<any, T> {}
}
