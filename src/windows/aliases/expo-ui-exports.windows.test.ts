import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import * as compose from './expo-ui-jetpack-compose';
import * as composeModifiers from './expo-ui-jetpack-compose-modifiers';
import * as universal from './expo-ui';
import * as swift from './expo-ui-swift-ui';
import * as swiftModifiers from './expo-ui-swift-ui-modifiers';

const ROOT = path.join(__dirname, '..', '..', '..', 'node_modules', '@expo', 'ui', 'src');

function file(base: string): string | null {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every value a module exports, following `export *`, with the statics assigned onto components as `Owner.Member`. */
function exportsOf(entry: string | null, seen = new Set<string>()): string[] {
  if (!entry || seen.has(entry)) return [];
  seen.add(entry);
  const source = readFileSync(entry, 'utf8');
  const names: string[] = [];
  for (const match of source.matchAll(/export \* from '([^']+)'/g)) names.push(...exportsOf(file(path.resolve(path.dirname(entry), match[1])), seen));
  for (const match of source.matchAll(/export (?:async )?(?:function|const|class|let) ([A-Za-z_$][\w$]*)/g)) names.push(match[1]);
  for (const match of source.matchAll(/export \{([^}]+)\}/g)) {
    for (const part of match[1].split(',')) {
      const entry = part.trim();
      if (!entry || entry.startsWith('type ')) continue;
      const [, alias] = entry.split(/\s+as\s+/);
      names.push((alias ?? entry).trim());
    }
  }
  for (const match of source.matchAll(/^([A-Z]\w*)\.([A-Z]\w*) = /gm)) names.push(`${match[1]}.${match[2]}`);
  return names;
}

/** The component a static belongs to: exported under its own or an aliased name, or as a static of another. */
function ownerOf(alias: Record<string, unknown>, owner: string): Record<string, unknown> | undefined {
  const base = owner.replace(/(Component|Base)$/, '');
  for (const name of [owner, base]) if (name in alias) return alias[name] as Record<string, unknown>;
  for (const value of Object.values(alias)) {
    if (value && (typeof value === 'function' || typeof value === 'object') && base in (value as object)) return (value as Record<string, unknown>)[base] as Record<string, unknown>;
  }
  return undefined;
}

function check(subpath: string, alias: Record<string, unknown>) {
  const names = [...new Set(exportsOf(file(path.join(ROOT, subpath))))];
  expect(names.length).toBeGreaterThan(20);
  const plain = names.filter(name => !name.includes('.'));
  const missing = plain.filter(name => !(name in alias));
  expect(missing).toEqual([]);
  const statics = names.filter(name => name.includes('.'));
  const missingStatics = statics.filter(name => {
    const [owner, member] = name.split('.');
    const component = ownerOf(alias, owner);
    return !component || !(member in component);
  });
  expect(missingStatics).toEqual([]);
}

describe('@expo/ui exports (windows)', () => {
  it('has every value the universal entry exports', () => {
    check('universal', universal);
  });

  it('has every value @expo/ui/swift-ui exports, with the statics on its components', () => {
    check('swift-ui', swift);
  });

  it('has every modifier @expo/ui/swift-ui/modifiers exports', () => {
    check('swift-ui/modifiers', swiftModifiers);
  });

  it('has every value @expo/ui/jetpack-compose exports, with the statics on its components', () => {
    check('jetpack-compose', compose);
  });

  it('has every modifier @expo/ui/jetpack-compose/modifiers exports', () => {
    check('jetpack-compose/modifiers', composeModifiers);
  });
});
