// @ts-check
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {exportArgs} = require('./bundle');

const DEFAULTS = {bundleOutput: 'windows/App/Bundle/index.windows.bundle', assetsDest: 'windows/App/Bundle'};

describe('exportArgs', () => {
  it('is a release bundle into the project by default', () => {
    expect(exportArgs('/app', [], DEFAULTS)).toEqual(['--platform', 'windows', '--bundle-output', DEFAULTS.bundleOutput, '--assets-dest', DEFAULTS.assetsDest, '--dev', 'false']);
    expect(exportArgs('/app', ['--dev'], DEFAULTS)).toEqual(['--platform', 'windows', '--bundle-output', DEFAULTS.bundleOutput, '--assets-dest', DEFAULTS.assetsDest, '--dev', 'true']);
  });

  it("passes the MSBuild target's arguments to the exporter, without an entry file the app does not have", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-bundle-'));
    const args = ['--platform', 'windows', '--entry-file', 'index.js', '--bundle-output', 'C:\\app\\windows\\App\\Bundle\\index.windows.bundle', '--assets-dest', 'C:\\app\\windows\\App\\Bundle', '--dev', 'false', '--reset-cache', '--sourcemap-output', 'C:\\app\\windows\\x64\\Release\\sourcemaps\\react\\index.windows.bundle.packager.map', '--minify', 'false'];
    expect(exportArgs(root, args, DEFAULTS)).toEqual([
      '--platform',
      'windows',
      '--bundle-output',
      'C:\\app\\windows\\App\\Bundle\\index.windows.bundle',
      '--assets-dest',
      'C:\\app\\windows\\App\\Bundle',
      '--dev',
      'false',
      '--sourcemap-output',
      'C:\\app\\windows\\x64\\Release\\sourcemaps\\react\\index.windows.bundle.packager.map',
      '--minify',
      'false',
      '--reset-cache',
    ]);
    // An entry file the app does have is the exporter's to use.
    fs.writeFileSync(path.join(root, 'index.js'), '');
    expect(exportArgs(root, ['--entry-file', 'index.js'], DEFAULTS)).toContain('--entry-file');
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('keeps the platform windows and leaves out what the exporter does not take', () => {
    const args = exportArgs('/app', ['--platform', 'ios', '--dev', 'true', '--config', 'x', '--verbose', '--entry-file'], DEFAULTS);
    expect(args.slice(0, 2)).toEqual(['--platform', 'windows']);
    expect(args).toContain('true');
    expect(args).not.toContain('ios');
    expect(args).not.toContain('--config');
    expect(args).not.toContain('--verbose');
    expect(args).not.toContain('--entry-file');
  });
});
