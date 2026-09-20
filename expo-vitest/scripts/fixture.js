// Runs the fixture's tests against the package as it would be installed.
//
//   node scripts/fixture.js
//
// `npm pack` builds it (`prepack`) and makes the tarball a publish would
// upload. That is unpacked into the fixture's `node_modules`, so the fixture's
// config and tests find the package by name, compiled, where Node will not
// strip types and Vitest leaves things out of its module graph by default.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'fixture');
const modules = path.join(fixture, 'node_modules');
const installed = path.join(modules, 'expo-vitest');
const shell = process.platform === 'win32';

fs.rmSync(installed, {recursive: true, force: true});
fs.mkdirSync(installed, {recursive: true});
for (const stale of fs.readdirSync(modules).filter(name => name.endsWith('.tgz'))) fs.rmSync(path.join(modules, stale));

execFileSync('npm', ['pack', '--pack-destination', modules, '--loglevel', 'error'], {cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell});
const [tarball] = fs.readdirSync(modules).filter(name => name.endsWith('.tgz'));
if (!tarball) throw new Error('npm pack left no tarball');

// Names only, from the folder they are in: a Windows tar reads `C:` as a host name, and GNU tar a backslash as a character.
execFileSync('tar', ['-xzf', tarball, '-C', 'expo-vitest', '--strip-components=1'], {cwd: modules, stdio: 'inherit'});
fs.rmSync(path.join(modules, tarball));

const packed = fs.readdirSync(installed, {recursive: true}).filter(name => fs.statSync(path.join(installed, name)).isFile());
const sources = packed.filter(name => /\.tsx?$/.test(name) && !name.endsWith('.d.ts'));
if (sources.length) throw new Error(`the package ships TypeScript Node cannot load: ${sources.join(', ')}`);
console.log(`installed ${tarball} into the fixture: ${packed.length} files`);

// Its `exports` list the manifest and not the command's file, which is beside it.
const vitest = path.join(path.dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs');
execFileSync(process.execPath, [vitest, 'run'], {cwd: fixture, stdio: 'inherit'});
