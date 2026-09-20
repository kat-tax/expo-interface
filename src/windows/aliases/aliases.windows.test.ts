import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..', '..', '..');

/**
 * The table the kit hands the `expo-windows` runtime: `withWindows` finds it
 * through the `expo-windows.aliases` field of the kit's `package.json` and
 * resolves each module named there to the file beside the table. Nothing
 * imports the table, so nothing else would notice an entry that points
 * nowhere, or an entry file nothing points at.
 */
describe('the Windows alias table', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const declared: string = manifest['expo-windows'].aliases;
  const table = path.join(ROOT, declared);
  const entries: Record<string, string> = JSON.parse(readFileSync(table, 'utf8'));

  it('is where the package says it is, and ships with it', () => {
    expect(path.dirname(table)).toBe(__dirname);
    expect(manifest.files).toContain('src');
  });

  it('names a file that exists for every module', () => {
    const missing = Object.entries(entries).filter(([, file]) => !existsSync(path.join(__dirname, file)));
    expect(missing).toEqual([]);
    expect(Object.keys(entries).length).toBeGreaterThan(20);
  });

  it('reaches every entry file in the folder', () => {
    // An entry file re-exports a control as its package's default export, or is an `@expo/ui` subpath.
    const entryFiles = readdirSync(__dirname).filter(file => /^(community-(?!controls|sheet-menu)|expo-)/.test(file) && !/\.test\.tsx?$/.test(file));
    const named = new Set(Object.values(entries).map(file => path.basename(file)));
    expect(entryFiles.filter(file => !named.has(file))).toEqual([]);
  });
});
