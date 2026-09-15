/**
 * Every platform but Windows: nothing to install. iOS and Android have the
 * `expo` global from their native host, web from Expo Modules Core's own
 * polyfill. `install.windows.ts` is the file that does the work.
 */
export {};
