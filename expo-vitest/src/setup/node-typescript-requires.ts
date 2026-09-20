/**
 * Node-side `require()` support for Expo packages on the web project.
 *
 * vitest-expo's web preset runs react-native-web in jsdom and keeps the Expo
 * packages in the Vite module graph, but their CommonJS builds (for example
 * `expo-router/build/*.js`) still `require()` through Node — and Expo packages
 * point Node at their TypeScript sources (`expo` → `src/Expo.ts`,
 * `expo-modules-core` → `src/index.ts`), which Node cannot load from
 * node_modules. On native, vitest-native installs equivalent hooks.
 *
 * - A `.ts` source under node_modules is swapped for the package's compiled
 *   `build/*.js` twin when it exists (Expo ships both, mirroring `src/`).
 * - Otherwise `.ts`/`.tsx` is transpiled to CommonJS with TypeScript.
 * - Extensionless relative requires (`require('./setupFastRefresh')`) resolve
 *   `.web.ts`, `.ts`, `.tsx` and `index.*` like Metro would.
 */
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import path from 'node:path';

// Loaded lazily through Node's own require so Vitest never tries to read
// typescript's (absent) source map.
const loadTypeScript = () => createRequire(import.meta.url)('typescript') as typeof import('typescript');

const NODE_MODULES = /[\\/]node_modules[\\/]/;
const EXTENSIONS = ['.web.ts', '.web.tsx', '.web.js', '.ts', '.tsx'];

type Resolver = (request: string, parent: {filename?: string} | undefined, ...rest: unknown[]) => string;
type Loader = (mod: {_compile(code: string, filename: string): void}, filename: string) => void;
const cjs = Module as unknown as {
  _resolveFilename: Resolver;
  _extensions: Record<string, Loader | undefined>;
};

/**
 * Metro's platform resolution for Node requires: prefer a `.web.js` sibling
 * (`NativeSafeAreaProvider.web.js` instead of the native file that deep-imports
 * Flow-typed React Native sources), and swap `node_modules/<pkg>/src/x.ts` for
 * the compiled `node_modules/<pkg>/build/x.js` when it exists.
 */
function compiledTwin(file: string): string {
  if (!NODE_MODULES.test(file)) return file;
  if (/(?<!\.web)\.[cm]?js$/.test(file)) {
    const web = file.replace(/\.([cm]?js)$/, '.web.$1');
    return fs.existsSync(web) ? web : file;
  }
  if (!/\.tsx?$/.test(file)) return file;
  const js = file.replace(/([\\/])src([\\/])/, '$1build$2').replace(/\.tsx?$/, '.js');
  return js !== file && fs.existsSync(js) ? js : file;
}

const resolve = cjs._resolveFilename;
cjs._resolveFilename = function (request, parent, ...rest) {
  try {
    return compiledTwin(resolve.call(this, request, parent, ...rest));
  } catch (error) {
    if (parent?.filename && request.startsWith('.')) {
      const base = path.resolve(path.dirname(parent.filename), request);
      for (const ext of EXTENSIONS) {
        if (fs.existsSync(base + ext)) return compiledTwin(base + ext);
      }
      for (const ext of EXTENSIONS) {
        const index = path.join(base, `index${ext}`);
        if (fs.existsSync(index)) return compiledTwin(index);
      }
    }
    throw error;
  }
};

// Name the file when Node chokes on untranspiled syntax — the bare
// "Unexpected token" Node reports otherwise has no location.
const loadJs = cjs._extensions['.js']!;
cjs._extensions['.js'] = (mod, filename) => {
  try {
    loadJs(mod, filename);
  } catch (error) {
    if (error instanceof SyntaxError && !error.message.includes(filename)) {
      error.message += ` (while loading ${filename})`;
    }
    throw error;
  }
};

for (const ext of ['.ts', '.tsx']) {
  cjs._extensions[ext] ??= (mod, filename) => {
    const ts = loadTypeScript();
    const source = fs.readFileSync(filename, 'utf8');
    const {outputText} = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    mod._compile(outputText, filename);
  };
}
