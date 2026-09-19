// Lints a file the moment it is written, so a violation of the repository's
// zero-warning policy is known now rather than at the end of a long session.
// oxlint takes about a tenth of a second on one file.
//
// Wired to PostToolUse (Edit|Write) in .claude/settings.json. Reads the hook
// payload on stdin; exit 2 reports the lint output back to Claude, exit 0 says
// nothing. Anything it cannot lint is silently none of its business.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LINTABLE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function editedFile() {
  try {
    const input = fs.readFileSync(0, 'utf8');
    return JSON.parse(input || '{}')?.tool_input?.file_path;
  } catch {
    return undefined;
  }
}

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const file = editedFile();
if (!file) process.exit(0);

const absolute = path.resolve(root, file);
// Only this repository's own source: not node_modules, not a scratch file elsewhere.
if (!absolute.startsWith(root + path.sep)) process.exit(0);
if (absolute.split(path.sep).includes('node_modules')) process.exit(0);
if (!LINTABLE.has(path.extname(absolute))) process.exit(0);

const oxlint = path.join(root, 'node_modules', 'oxlint', 'bin', 'oxlint');
if (!fs.existsSync(oxlint)) process.exit(0);
const result = spawnSync(process.execPath, [oxlint, '--max-warnings', '0', absolute], {cwd: root, encoding: 'utf8'});

// A tool that could not run at all is not this hook's problem.
if (result.error || result.status === null || result.status === 0) process.exit(0);

process.stderr.write(`oxlint is not clean on ${path.relative(root, absolute)}:\n${result.stdout}${result.stderr}`);
process.exit(2);
