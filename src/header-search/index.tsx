// Web, and any platform without a file of its own: the header is drawn, and
// so is the search. iOS and Android have the platform's search (`native.tsx`,
// through their own index files), and Windows names this same file in
// `index.windows.tsx`, since the test engine's resolver would otherwise
// reach `index.ios.tsx` first there.
export {HeaderSearch} from './sent';
export type {HeaderSearchCommands, HeaderSearchInput, HeaderSearchIntegration, HeaderSearchPlacement, HeaderSearchProps} from './types';
