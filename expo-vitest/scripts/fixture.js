// Runs the fixture's tests against the package as an app would have it.
//
//   node scripts/fixture.js
//   node scripts/fixture.js --update-lockfile
//
// The fixture is copied to a folder outside this one and installed there, from
// its own lockfile. `npm pack` builds the package (`prepack`) and makes the
// tarball a publish would upload; that is unpacked into the copy's
// `node_modules` and named in its manifest, and the fixture's tests run there.
//
// Outside, and really installed, because both are what an app has and each
// hides something otherwise:
//
// - The engine under the iOS and Android projects leaves alone any package
//   whose folder contains the run, taking it to be the project itself. A
//   fixture inside this folder is never treated the way an app's dependency
//   is, so what only happens to a dependency cannot show. The engine compiling
//   this package with React Native's Babel preset, which broke its setup file,
//   was one such thing.
// - Packages linked in from this folder's `node_modules` rather than installed
//   make a layout the engine keeps two copies of a module in, which fails for
//   reasons that are neither the package's nor an app's.
//
// `--update-lockfile` installs without the lockfile and copies the new one
// back, for when the fixture's manifest changes.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'fixture');
const update = process.argv.includes('--update-lockfile');
const shell = process.platform === 'win32';
// The real path, since a temporary folder is often reached through a link and the engine compares paths.
const scratch = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'expo-vitest-fixture-'));
const modules = path.join(scratch, 'node_modules');
const installed = path.join(modules, 'expo-vitest');

/** Runs a command in the scratch folder, its output with this one's. */
function run(command, args, options = {}) {
  execFileSync(command, args, {cwd: scratch, stdio: 'inherit', ...options});
}

try {
  fs.cpSync(fixture, scratch, {recursive: true, filter: source => path.basename(source) !== 'node_modules'});

  console.log(`==== What an app has installed, in ${scratch}`);
  run('bun', ['install', ...(update ? [] : ['--frozen-lockfile'])], {shell});
  if (update) {
    fs.copyFileSync(path.join(scratch, 'bun.lock'), path.join(fixture, 'bun.lock'));
    console.log('fixture/bun.lock updated');
  }

  console.log('==== The package, as published');
  fs.mkdirSync(installed, {recursive: true});
  execFileSync('npm', ['pack', '--pack-destination', modules, '--loglevel', 'error'], {cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell});
  const [tarball] = fs.readdirSync(modules).filter(name => name.endsWith('.tgz'));
  if (!tarball) throw new Error('npm pack left no tarball');
  // Names only, from the folder they are in: a Windows tar reads `C:` as a host name, and GNU tar a backslash as a character.
  run('tar', ['-xzf', tarball, '-C', 'expo-vitest', '--strip-components=1'], {cwd: modules});
  fs.rmSync(path.join(modules, tarball));

  const packed = fs.readdirSync(installed, {recursive: true}).filter(name => fs.statSync(path.join(installed, name)).isFile());
  const sources = packed.filter(name => /\.tsx?$/.test(name) && !name.endsWith('.d.ts'));
  if (sources.length) throw new Error(`the package ships TypeScript Node cannot load: ${sources.join(', ')}`);

  // Named in the manifest as an app names it, which is what the engine reads to decide how to treat it.
  const manifestFile = path.join(scratch, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const {version} = JSON.parse(fs.readFileSync(path.join(installed, 'package.json'), 'utf8'));
  manifest.devDependencies = {...manifest.devDependencies, 'expo-vitest': version};
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${tarball}: ${packed.length} files`);

  console.log('==== The fixture, on it');
  run(process.execPath, [path.join(modules, 'vitest', 'vitest.mjs'), 'run']);
} finally {
  fs.rmSync(scratch, {recursive: true, force: true});
}
