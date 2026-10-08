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
 *   Symbols font cut down to the glyphs of the names found, the `fill`
 *   names and the names the kit's own controls draw on the web, at both
 *   fills, with the fill axis kept and the other axes pinned, for filled
 *   icons on the web. Needs `harfbuzzjs` 1 and `fontverter`
 *   (`npm i -D harfbuzzjs fontverter`).
 *
 * The downloads come from Google Fonts' CDN and GitHub; nothing here needs
 * a key. Run it again after adding an icon.
 */
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
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
 * a `Composer`'s send and stop buttons, a `FindBar`'s previous and next, the
 * ellipsis of a `Toolbar`'s overflow, a `Card`'s and a `Sheet`'s menus, and
 * the star of a `Card`'s favorite, filled while set.
 */
export const KIT_NAMES = ['arrow_back', 'arrow_upward', 'close', 'keyboard_arrow_down', 'keyboard_arrow_up', 'more_horiz', 'star', 'stop'];
export const KIT_FILLED = ['star'];

/**
 * The Material names the kit's own controls draw on the web through `Icon`,
 * written into the font whether or not an app's sources name them: the
 * chrome glyphs of a `Sheet`'s bar, a `Composer`, a `FindBar` and a
 * `Toolbar`, a `Card`'s menu and star, a `TabView` strip's close, add and
 * switcher buttons, and `HeaderSearch`'s open action.
 */
export const KIT_WEB_NAMES = ['add', 'arrow_back', 'arrow_upward', 'close', 'grid_view', 'keyboard_arrow_down', 'keyboard_arrow_up', 'more_horiz', 'search', 'star', 'stop'];

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

/** The axes the font is pinned at: the weight, grade and optical size the kit draws with. */
export const PINNED_AXES = {wght: 400, GRAD: 0, opsz: 24};

/** The axes the cut keeps: the whole fill range, and the rest pinned. */
export const FONT_AXES = {FILL: {min: 0, max: 1}, ...PINNED_AXES};

/**
 * The fills the kit draws, outline and solid. The font draws most solid
 * icons from a glyph of their own, which it swaps in at `FILL 1` through
 * its layout tables rather than its character map, so each name is shaped
 * at both.
 */
export const FONT_FILLS = [0, 1];

/**
 * What the cut keeps for `names`: their characters, and the glyph each
 * shapes to at every fill. `shape(name, fill)` answers the glyph ids a name
 * shapes to. A name that does not shape to exactly one glyph at every fill
 * is not in the font, and is reported in `missing` and left out.
 *
 * @param {string[]} names
 * @param {(name: string, fill: number) => number[]} shape
 * @returns {{text: string, glyphs: number[], missing: string[]}}
 */
export function fontPlan(names, shape) {
  const glyphs = new Set();
  const missing = [];
  const kept = [];
  for (const name of names) {
    const shaped = FONT_FILLS.map(fill => shape(name, fill));
    if (shaped.some(ids => ids.length !== 1)) {
      missing.push(name);
      continue;
    }
    kept.push(name);
    for (const [id] of shaped) glyphs.add(id);
  }
  return {text: [...new Set(kept.join(''))].sort().join(''), glyphs: [...glyphs].sort((a, b) => a - b), missing};
}

/**
 * @typedef {object} FontTools
 * @property {(font: Uint8Array) => Promise<Uint8Array>} decode The font as a plain sfnt.
 * @property {(sfnt: Uint8Array) => Promise<Uint8Array>} encode An sfnt as WOFF2.
 * @property {(sfnt: Uint8Array) => (name: string, fill: number) => number[]} shaper What each name shapes to at a fill.
 * @property {(sfnt: Uint8Array, text: string, glyphs: number[], axes: typeof FONT_AXES) => Uint8Array} subset The sfnt cut to the text's characters and the glyphs, with no layout closure, at the axes.
 */

/**
 * The variable font cut down to the glyphs `names` shape to at both fills,
 * and their characters, with the fill axis kept and the other axes pinned
 * to the kit's defaults. Only those glyphs: the cut does not take in every
 * ligature its letters could spell, as a cut by text alone would. The names
 * the font does not have come back in `missing`.
 *
 * @param {Uint8Array} font
 * @param {string[]} names
 * @param {FontTools} tools from `loadFontTools`
 * @returns {Promise<{woff2: Uint8Array, missing: string[]}>}
 */
export async function subsetVariableFont(font, names, tools) {
  const sfnt = await tools.decode(font);
  const plan = fontPlan(names, tools.shaper(sfnt));
  const woff2 = await tools.encode(tools.subset(sfnt, plan.text, plan.glyphs, FONT_AXES));
  return {woff2, missing: plan.missing};
}

const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;
const HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE = 0x200;

/** An OpenType tag as the number HarfBuzz takes. */
const tag = name => [...name].reduce((value, char) => (value << 8) + char.charCodeAt(0), 0);

/**
 * Shapes a name with HarfBuzz at a fill, the other axes pinned. Always
 * through the `hb` namespace: its `Buffer` and `Blob` would shadow Node's.
 */
function shaperOf(hb, sfnt) {
  const face = new hb.Face(new hb.Blob(sfnt));
  const fonts = new Map(FONT_FILLS.map(fill => {
    const font = new hb.Font(face);
    font.setVariations([...Object.entries(PINNED_AXES), ['FILL', fill]].map(([axis, value]) => new hb.Variation(axis, value)));
    return [fill, font];
  }));
  return (name, fill) => {
    const buffer = new hb.Buffer();
    buffer.addText(name);
    buffer.guessSegmentProperties();
    hb.shape(fonts.get(fill), buffer);
    return buffer.getGlyphInfos().map(info => info.codepoint);
  };
}

/**
 * Cuts the sfnt with HarfBuzz's subsetter, as `subset-font` drives it but by
 * glyph as well as by character, and without the layout closure that would
 * take in every ligature of the kept letters. Every layout feature stays, so
 * the ligatures and the fill swap still work in the cut.
 */
function cutFont(wasm, sfnt, text, glyphs, axes) {
  // Memory can grow with any call, so the view is taken afresh each time.
  const heap = () => new Uint8Array(wasm.memory.buffer);
  const data = wasm.malloc(sfnt.byteLength);
  heap().set(sfnt, data);
  const blob = wasm.hb_blob_create(data, sfnt.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
  const face = wasm.hb_face_create(blob, 0);
  wasm.hb_blob_destroy(blob);
  const input = wasm.hb_subset_input_create_or_fail();
  try {
    const features = wasm.hb_subset_input_set(input, HB_SUBSET_SETS_LAYOUT_FEATURE_TAG);
    wasm.hb_set_clear(features);
    wasm.hb_set_invert(features);
    wasm.hb_subset_input_set_flags(input, wasm.hb_subset_input_get_flags(input) | HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE);
    const unicodes = wasm.hb_subset_input_unicode_set(input);
    for (const char of text) wasm.hb_set_add(unicodes, char.codePointAt(0));
    const kept = wasm.hb_subset_input_glyph_set(input);
    for (const id of glyphs) wasm.hb_set_add(kept, id);
    for (const [axis, value] of Object.entries(axes)) {
      const ok = typeof value === 'number'
        ? wasm.hb_subset_input_pin_axis_location(input, face, tag(axis), value)
        : wasm.hb_subset_input_set_axis_range(input, face, tag(axis), value.min, value.max, Number.NaN);
      if (!ok) throw new Error(`the font has no ${axis} axis`);
    }
    const subset = wasm.hb_subset_or_fail(face, input);
    if (!subset) throw new Error('harfbuzz could not cut the font');
    const result = wasm.hb_face_reference_blob(subset);
    const offset = wasm.hb_blob_get_data(result, 0);
    const bytes = Buffer.from(heap().slice(offset, offset + wasm.hb_blob_get_length(result)));
    wasm.hb_blob_destroy(result);
    wasm.hb_face_destroy(subset);
    return bytes;
  } finally {
    wasm.hb_subset_input_destroy(input);
    wasm.hb_face_destroy(face);
    wasm.free(data);
  }
}

/**
 * The tools `subsetVariableFont` cuts with: `harfbuzzjs` 1 to shape and
 * subset, and `fontverter` to read and write WOFF2, both resolved from the
 * app's root (the app's dev installs, not the kit's dependencies). Throws
 * where either is missing, or where `harfbuzzjs` is an older line without
 * the subsetter this drives.
 *
 * @param {string} [resolveFrom] the app's root
 * @returns {Promise<FontTools>}
 */
export async function loadFontTools(resolveFrom = process.cwd()) {
  const fromApp = createRequire(path.join(resolveFrom, 'package.json'));
  // First, so an older harfbuzzjs fails here rather than halfway through.
  const subsetWasm = fromApp.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm');
  const hb = await import(/* @vite-ignore */ pathToFileURL(fromApp.resolve('harfbuzzjs')).href);
  const fontverter = fromApp('fontverter');
  const {instance} = await WebAssembly.instantiate(readFileSync(subsetWasm));
  instance.exports._initialize();
  return {
    decode: bytes => fontverter.convert(Buffer.from(bytes), 'truetype'),
    encode: bytes => fontverter.convert(bytes, 'woff2', 'truetype'),
    shaper: sfnt => shaperOf(hb, sfnt),
    subset: (sfnt, text, glyphs, axes) => cutFont(instance.exports, sfnt, text, glyphs, axes),
  };
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
    let tools;
    try {
      tools = await loadFontTools();
    } catch {
      console.error('--font needs harfbuzzjs 1 and fontverter: npm i -D harfbuzzjs fontverter');
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
    // The names found, the ones the kit draws on the web, and the `--fill` names, which need not be among either.
    const fontNames = [...new Set([...names, ...KIT_WEB_NAMES, ...filled])].sort();
    const {woff2, missing} = await subsetVariableFont(readFileSync(cached), fontNames, tools);
    if (missing.length > 0) console.error(`not in the variable font, left out: ${missing.join(', ')}`);
    const file = path.join(out, 'MaterialSymbolsOutlined.woff2');
    writeFileSync(file, woff2);
    console.log(
      `wrote ${path.relative(process.cwd(), file)} (${(woff2.length / 1024).toFixed(1)} KB, ${fontNames.length - missing.length} icons): ` +
        'register it in +html.tsx with getSymbolFontCSS(url), or getSymbolFontCSS(url, {filled: true}) for filled icons alone',
    );
  }
}
