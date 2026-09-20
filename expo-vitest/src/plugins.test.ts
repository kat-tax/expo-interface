import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {forbiddenMessage, forbidModules} from './forbid-modules.ts';
import {isUnderTest, windowsFile, windowsResolution} from './windows-resolution.ts';

const made: string[] = [];

/** A folder on disk holding the files named, each empty. */
function folder(files: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-vitest-'));
  made.push(root);
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), '');
  }
  return root;
}

/** A plugin's hook, called the way Vite calls it. */
function hook<T extends (...args: never[]) => unknown>(handler: unknown): T {
  return (typeof handler === 'function' ? handler : (handler as {handler: T}).handler) as T;
}

afterAll(() => {
  for (const root of made) fs.rmSync(root, {recursive: true, force: true});
});

describe('windowsFile', () => {
  const root = folder([
    'src/button/index.tsx',
    'src/button/index.windows.tsx',
    'src/contrast.ts',
    'src/contrast.windows.ts',
    'src/plain/index.tsx',
    'src/screen.tsx',
  ]);
  const importer = path.join(root, 'src', 'screen.tsx');

  it('lands a relative import on its Windows file, a folder on its Windows index', () => {
    expect(windowsFile('./button', importer)).toBe(path.join(root, 'src', 'button', 'index.windows.tsx'));
    expect(windowsFile('./contrast', importer)).toBe(path.join(root, 'src', 'contrast.windows.ts'));
  });

  it('leaves alone what has no Windows file, a package, and a specifier that names its extension', () => {
    expect(windowsFile('./plain', importer)).toBeNull();
    expect(windowsFile('react-native', importer)).toBeNull();
    expect(windowsFile('./contrast.ts', importer)).toBeNull();
  });
});

describe('isUnderTest', () => {
  const project = path.resolve('/work/app');

  it('takes the project without its installed packages, and the folders named besides', () => {
    expect(isUnderTest(path.join(project, 'src', 'a.tsx'), project, [])).toBe(true);
    expect(isUnderTest(path.join(project, 'node_modules', 'a-kit', 'src', 'a.tsx'), project, [])).toBe(false);
    expect(isUnderTest(path.join(project, 'node_modules', 'a-kit', 'src', 'a.tsx'), project, [path.join(project, 'node_modules', 'a-kit', 'src')])).toBe(true);
    expect(isUnderTest(path.resolve('/work/other/a.tsx'), project, [])).toBe(false);
    expect(isUnderTest(project, project, [])).toBe(false);
  });
});

describe('windowsResolution', () => {
  it('resolves for the code under test and for nothing else', () => {
    const root = folder(['src/button/index.windows.tsx', 'src/screen.tsx', 'node_modules/lib/thing.windows.js', 'node_modules/lib/index.js', 'node_modules/kit/src/switch.windows.tsx', 'node_modules/kit/src/index.ts']);
    const resolveId = hook<(source: string, importer?: string) => string | null>(windowsResolution(root, ['node_modules/kit/src']).resolveId);
    expect(resolveId('./button', `${path.join(root, 'src', 'screen.tsx')}?v=1`)).toBe(path.join(root, 'src', 'button', 'index.windows.tsx'));
    expect(resolveId('./thing', path.join(root, 'node_modules', 'lib', 'index.js'))).toBeNull();
    expect(resolveId('./switch', path.join(root, 'node_modules', 'kit', 'src', 'index.ts'))).toBe(path.join(root, 'node_modules', 'kit', 'src', 'switch.windows.tsx'));
    expect(resolveId('./button')).toBeNull();
  });
});

describe('forbidModules', () => {
  const plugin = forbidModules(['expo-image', '@expo/ui/swift-ui']);
  const resolveId = hook<(source: string) => string | null>(plugin.resolveId);
  const load = hook<(id: string) => string | null>(plugin.load);

  it('resolves a forbidden module to one that throws its name, and leaves the rest', () => {
    const id = resolveId('@expo/ui/swift-ui') as string;
    expect(id).toContain('@expo/ui/swift-ui');
    expect(() => new Function(load(id) as string)()).toThrow(forbiddenMessage('@expo/ui/swift-ui', 'Windows'));
    expect(resolveId('@expo/ui')).toBeNull();
    expect(resolveId('react')).toBeNull();
    expect(load(path.resolve('/work/app/src/a.tsx'))).toBeNull();
  });

  it('names the platform it is for', () => {
    const android = forbidModules(['a'], 'Android');
    const id = hook<(source: string) => string>(android.resolveId)('a');
    expect(hook<(id: string) => string>(android.load)(id)).toContain('a has no Android implementation');
  });
});
