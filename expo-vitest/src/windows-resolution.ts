import type {Plugin} from 'vite';
import {existsSync} from 'node:fs';
import path from 'node:path';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/** The path of `file` within `folder`, or `null` when it is not in there. */
function within(file: string, folder: string): string | null {
  const relative = path.relative(folder, file);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative) ? relative : null;
}

/**
 * Where a relative import lands on Windows, or `null` to leave it to the
 * resolver: `../button` to `button.windows.tsx` or `button/index.windows.tsx`
 * when there is one, the way Metro resolves for the `windows` platform.
 */
export function windowsFile(source: string, importer: string): string | null {
  if (!source.startsWith('.')) return null;
  // A specifier that names its extension names its file.
  if (/\.[cm]?[jt]sx?$/.test(source)) return null;
  const base = path.resolve(path.dirname(importer), source);
  for (const extension of EXTENSIONS) {
    for (const candidate of [`${base}.windows${extension}`, path.join(base, `index.windows${extension}`)]) {
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Whether an importer is code under test: in the project and not one of its
 * installed packages, or in a folder named besides.
 */
export function isUnderTest(importer: string, project: string, named: string[]): boolean {
  if (named.some(folder => within(importer, folder) !== null)) return true;
  const relative = within(importer, project);
  return relative !== null && !/(^|[\\/])node_modules[\\/]/.test(relative);
}

/**
 * Resolves `.windows.*` platform files first, ahead of the iOS order the
 * engine gives Vite. The Windows project runs on vitest-native's iOS engine,
 * which has no Windows one, so React Native's own files keep the iOS order
 * (they have no Windows variants outside react-native-windows) and only the
 * code under test is resolved as Metro would for `windows`.
 *
 * That code is the project, leaving out its `node_modules`, and any folder
 * named besides, which is how an app resolves the Windows files of a library
 * it installed (`node_modules/a-kit/src`).
 */
export function windowsResolution(project: string, named: string[] = []): Plugin {
  const root = path.resolve(project);
  const folders = named.map(folder => path.resolve(root, folder));
  return {
    name: 'expo-vitest:windows-resolution',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null;
      const from = path.resolve(importer.split('?')[0]);
      return isUnderTest(from, root, folders) ? windowsFile(source, from) : null;
    },
  };
}
