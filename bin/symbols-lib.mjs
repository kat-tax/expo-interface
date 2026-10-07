/**
 * expo-interface-symbols: the icon assets an app's tokens need, from the
 * names the app's sources use.
 *
 *   npx expo-interface-symbols [paths...] [--out src/symbols] [--font] [--fill name...]
 *
 * It reads every `.ts` and `.tsx` under `paths` (`src` and `app` by default)
 * for the Material names in icon tokens (`android: 'share'`, `web: 'share'`)
 * and for the tokens that ask for `fill`, then writes into `--out`:
 *
 * - `drawables.android.ts`, importing each outlined vector from
 *   `@expo/material-symbols` where the package has it, or from a file
 *   downloaded beside the module where it does not, and each filled vector
 *   downloaded beside it; `drawables.ts`, the stub the other platforms
 *   bundle. The app registers them once: `registerDrawables(drawables,
 *   filledDrawables)`.
 * - with `--font`, `MaterialSymbolsOutlined.woff2`: the variable Material
 *   Symbols font cut down to the names found, with the fill axis kept, for
 *   filled icons on the web. Needs `subset-font` (`npm i -D subset-font`).
 *
 * The downloads come from Google Fonts' CDN and GitHub; nothing here needs
 * a key. Run it again after adding an icon.
 */
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {parseArgs} from 'node:util';

const GSTATIC = 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined';

/** The outlined vector of a Material name, as Google Fonts serves it. */
export const outlinedUrl = name => `${GSTATIC}/${name}/default/24px.xml`;

/** The filled vector of a Material name. */
export const filledUrl = name => `${GSTATIC}/${name}/fill1/24px.xml`;

/** The variable Material Symbols Outlined font, with every axis, from Google's repository. */
export const VARIABLE_FONT_URL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.woff2';

/** The family the kit's stylesheet draws filled icons with. */
export const FONT_FAMILY = 'Material Symbols Outlined';

/**
 * The Material names a source file uses, and the ones its tokens ask the
 * solid form of: every `android: '…'` and `web: '…'` name, and the names in
 * an `icon({...}, ..., {fill: true})` call.
 */
export function scanSource(text) {
  const names = new Set();
  const filled = new Set();
  for (const [, name] of text.matchAll(/\b(?:android|web):\s*'([a-z0-9_]+)'/g)) names.add(name);
  for (const [, token, options] of text.matchAll(/\bicon\(\s*\{([^}]*)\}(?:\s*,\s*[^,{)]*)?(?:\s*,\s*\{([^}]*)\})?\s*,?\s*\)/g)) {
    if (!options || !/\bfill:\s*true\b/.test(options)) continue;
    const name = token.match(/\b(?:android|web):\s*'([a-z0-9_]+)'/)?.[1];
    if (name) filled.add(name);
  }
  return {names, filled};
}

/** Every `.ts` and `.tsx` under `roots`, tests and dependencies left out. */
export function sourceFiles(roots, cwd = process.cwd()) {
  const files = [];
  const visit = dir => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) visit(file);
      } else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        files.push(file);
      }
    }
  };
  for (const root of roots) {
    const dir = path.resolve(cwd, root);
    if (existsSync(dir) && statSync(dir).isDirectory()) visit(dir);
  }
  return files.sort();
}

/**
 * The Material names the kit's own controls draw on Android, written whether
 * or not an app's sources name them: a `Sheet` bar's back and close buttons,
 * a `Composer`'s send and stop buttons, the ellipsis of a `Toolbar`'s
 * overflow, a `Card`'s and a `Sheet`'s menus, and the star of a `Card`'s
 * favorite, filled while set.
 */
export const KIT_NAMES = ['arrow_back', 'arrow_upward', 'close', 'more_horiz', 'star', 'stop'];
export const KIT_FILLED = ['star'];

/** The names across a set of files, merged. */
export function scanFiles(files) {
  const names = new Set();
  const filled = new Set();
  for (const file of files) {
    const found = scanSource(readFileSync(file, 'utf8'));
    for (const name of found.names) names.add(name);
    for (const name of found.filled) filled.add(name);
  }
  return {names: [...names].sort(), filled: [...filled].sort()};
}

/** A Material name as a JavaScript identifier (`delete` is a keyword; `3d_rotation` starts with a digit). */
export function identifier(name) {
  const safe = /^[0-9]/.test(name) ? `icon_${name}` : name;
  return ['delete', 'default', 'export', 'import', 'in', 'new', 'class', 'function', 'var', 'let', 'const', 'switch', 'case', 'do', 'for', 'if', 'else', 'return', 'this', 'with', 'void', 'typeof', 'enum', 'yield', 'await', 'static', 'super', 'try', 'catch', 'finally', 'throw', 'while', 'break', 'continue', 'debugger', 'instanceof', 'package', 'private', 'protected', 'public', 'interface', 'implements', 'extends', 'null', 'true', 'false'].includes(safe)
    ? `${safe}_icon`
    : safe;
}

/**
 * The Android module: an import per outlined name, from the package where
 * it ships the vector and from the file beside the module otherwise, an
 * import per filled name from the file beside the module, and the two maps.
 */
export function drawablesModule({names, filled, packaged}) {
  const lines = [
    '// Written by expo-interface-symbols from the icon names the sources use. Do not edit; run it again.',
    "import type {ImageSourcePropType} from 'react-native';",
    '',
  ];
  for (const name of names) {
    const from = packaged.has(name) ? `@expo/material-symbols/${name}.xml` : `./${name}.xml`;
    lines.push(`import ${identifier(name)} from '${from}';`);
  }
  for (const name of filled) lines.push(`import ${identifier(name)}_fill from './${name}_fill.xml';`);
  lines.push('', '/** The outlined vectors, by Material name. */', 'export const drawables: Record<string, ImageSourcePropType | undefined> = {');
  for (const name of names) lines.push(identifier(name) === name ? `  ${name},` : `  ${name}: ${identifier(name)},`);
  lines.push('};', '', '/** The filled vectors, for the tokens that ask for `fill`. */', 'export const filledDrawables: Record<string, ImageSourcePropType | undefined> = {');
  for (const name of filled) lines.push(`  ${name}: ${identifier(name)}_fill,`);
  lines.push('};', '');
  return lines.join('\n');
}

/** The stub the other platforms bundle: no drawables at all. */
export function stubModule() {
  return [
    '// Written by expo-interface-symbols. iOS, web and Windows draw symbols from their own families; the drawables are Android\'s.',
    "import type {ImageSourcePropType} from 'react-native';",
    '',
    'export const drawables: Record<string, ImageSourcePropType | undefined> = {};',
    'export const filledDrawables: Record<string, ImageSourcePropType | undefined> = {};',
    '',
  ].join('\n');
}

/** The `@font-face` that registers the subset for the kit's stylesheet, for `+html.tsx`. */
export function fontFaceCSS(url, family = FONT_FAMILY) {
  return `@font-face { font-family: '${family}'; src: url('${url}') format('woff2-variations'); font-weight: 100 700; font-display: block; }`;
}

/**
 * The names the installed `@expo/material-symbols` ships vectors for, among
 * `names`: each resolved the way Metro will import it, through the
 * package's exports map, which names the vectors and nothing else.
 */
export function packagedNames(names, resolveFrom = process.cwd()) {
  const packaged = new Set();
  const resolve = createRequire(path.join(resolveFrom, 'package.json')).resolve;
  for (const name of names) {
    try {
      resolve(`@expo/material-symbols/${name}.xml`);
      packaged.add(name);
    } catch {
      // Not in the package: downloaded beside the module instead.
    }
  }
  return packaged;
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * The variable font cut down to `names`, with the fill axis kept and the
 * other axes pinned to the kit's defaults, through `subset-font`.
 */
export async function subsetVariableFont(font, names, subset) {
  const text = [...names, ...names.map(name => name.replaceAll('_', ' '))].join(' ');
  return subset(Buffer.from(font), text, {
    targetFormat: 'woff2',
    variationAxes: {FILL: {min: 0, max: 1}, wght: 400, GRAD: 0, opsz: 24},
  });
}

export async function main(argv = process.argv.slice(2)) {
  const {values, positionals} = parseArgs({
    args: argv,
    options: {
      out: {type: 'string', default: 'src/symbols'},
      font: {type: 'boolean', default: false},
      fill: {type: 'string', multiple: true, default: []},
      help: {type: 'boolean', short: 'h', default: false},
    },
    allowPositionals: true,
  });
  if (values.help) {
    console.log('Usage: expo-interface-symbols [paths...] [--out <dir>] [--font] [--fill <name>...]');
    return;
  }
  const roots = positionals.length > 0 ? positionals : ['src', 'app'];
  const found = scanFiles(sourceFiles(roots));
  if (found.names.length === 0) {
    console.error(`no icon names found under ${roots.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const names = [...new Set([...found.names, ...KIT_NAMES])].sort();
  const filled = [...new Set([...found.filled, ...KIT_FILLED, ...values.fill])].sort();
  const out = path.resolve(values.out);
  mkdirSync(out, {recursive: true});
  const packaged = packagedNames(names);
  for (const name of names) {
    if (packaged.has(name)) continue;
    const file = path.join(out, `${name}.xml`);
    if (!existsSync(file)) {
      writeFileSync(file, await fetchBytes(outlinedUrl(name)));
      console.log(`downloaded ${name}.xml`);
    }
  }
  for (const name of filled) {
    const file = path.join(out, `${name}_fill.xml`);
    if (!existsSync(file)) {
      writeFileSync(file, await fetchBytes(filledUrl(name)));
      console.log(`downloaded ${name}_fill.xml`);
    }
  }
  writeFileSync(path.join(out, 'drawables.android.ts'), drawablesModule({names, filled, packaged}));
  writeFileSync(path.join(out, 'drawables.ts'), stubModule());
  console.log(`wrote ${path.relative(process.cwd(), path.join(out, 'drawables.android.ts'))}: ${names.length} icons, ${filled.length} filled`);
  if (values.font) {
    let subset;
    try {
      // Named at run time: a bundler reading this file must not try to resolve an optional tool.
      const tool = 'subset-font';
      subset = (await import(/* @vite-ignore */ tool)).default;
    } catch {
      console.error('--font needs subset-font: npm i -D subset-font');
      process.exitCode = 1;
      return;
    }
    const cache = path.join(process.cwd(), 'node_modules', '.cache', 'expo-interface');
    mkdirSync(cache, {recursive: true});
    const cached = path.join(cache, 'MaterialSymbolsOutlined.woff2');
    if (!existsSync(cached)) {
      console.log('downloading the variable font once');
      writeFileSync(cached, await fetchBytes(VARIABLE_FONT_URL));
    }
    const woff2 = await subsetVariableFont(readFileSync(cached), names, subset);
    writeFileSync(path.join(out, 'MaterialSymbolsOutlined.woff2'), woff2);
    console.log(`wrote ${path.relative(process.cwd(), path.join(out, 'MaterialSymbolsOutlined.woff2'))} (${Math.round(woff2.length / 1024)} KB), register it with getSymbolFontCSS in +html.tsx`);
  }
}
