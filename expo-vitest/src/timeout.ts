/**
 * How long one test may take. Vitest's default is five seconds, which a suite
 * that runs once per platform outgrows.
 *
 * The projects run in parallel, and under the v8 coverage a test that spends
 * its time inside Testing Library's `getByRole(…, {name})` computes an
 * accessible name for every element on the screen. One such test, a dialog
 * full of colour swatches, takes well under a second on its own and over five
 * in a full instrumented run, so its suite failed roughly one run in two on a
 * test with nothing wrong with it. Fifteen seconds is still short enough to
 * catch something genuinely hung, and a test that needs more than this should
 * say so itself.
 *
 * Projects do not inherit the root `test` block, so every one of them sets it.
 */
export const TEST_TIMEOUT = 15_000;
