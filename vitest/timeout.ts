/**
 * How long one test may take. Vitest's default is five seconds, which this
 * suite outgrew.
 *
 * Six projects run in parallel over roughly 2,400 tests, and under the v8
 * coverage the slowest of them — the colour picker's saved-swatch test —
 * spends its time inside Testing Library's `getByRole(…, {name})`, which
 * computes an accessible name for every element in a dialog full of swatches.
 * It takes well under a second on its own and over five in a full instrumented
 * run, so the suite failed roughly one run in two on a test with nothing wrong
 * with it. Fifteen seconds is still short enough to catch something genuinely
 * hung, and a test that needs more than this should say so itself.
 *
 * Projects do not inherit the root `test` block, so every one of them sets it.
 */
export const TEST_TIMEOUT = 15_000;
