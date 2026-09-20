// Compiles `src` to `dist` for publishing.
//
// The package runs from source in its own repository, since Node strips types
// from a `.ts` file it is handed. It will not do that for a file under
// `node_modules`, and a Vitest config or a command is loaded by Node, so what
// is installed has to be JavaScript.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

fs.rmSync(dist, {recursive: true, force: true});
execFileSync(process.execPath, [tsc, '-p', path.join(root, 'tsconfig.build.json')], {cwd: root, stdio: 'inherit'});

// What the compiler does not carry: the PowerShell the Windows driver runs.
let copied = 0;
for (const entry of fs.readdirSync(path.join(root, 'src'), {recursive: true, withFileTypes: true})) {
  if (!entry.isFile() || !entry.name.endsWith('.ps1')) continue;
  const from = path.join(entry.parentPath, entry.name);
  const to = path.join(dist, path.relative(path.join(root, 'src'), from));
  fs.mkdirSync(path.dirname(to), {recursive: true});
  fs.copyFileSync(from, to);
  copied += 1;
}

const files = fs.readdirSync(dist, {recursive: true}).length;
console.log(`built ${files} files into dist${copied ? `, ${copied} scripts copied` : ''}`);
