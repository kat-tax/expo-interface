// @ts-check
const {TARGET_SDK, withTargetSdk} = require('./msbuild');

describe('withTargetSdk', () => {
  it('adds the target SDK as an MSBuild property of its own when none were passed', () => {
    expect(withTargetSdk([])).toEqual(['--msbuildprops', TARGET_SDK]);
    expect(withTargetSdk(['--arch', 'x64'])).toEqual(['--arch', 'x64', '--msbuildprops', TARGET_SDK]);
    expect(TARGET_SDK).toBe('WindowsTargetPlatformVersion=10.0.22621.0');
  });

  it('joins it to the properties the caller passed, beside or after the option', () => {
    expect(withTargetSdk(['--msbuildprops', 'A=1', '--arch', 'x64'])).toEqual(['--msbuildprops', `A=1,${TARGET_SDK}`, '--arch', 'x64']);
    expect(withTargetSdk(['--msbuildprops=A=1'])).toEqual([`--msbuildprops=A=1,${TARGET_SDK}`]);
    expect(withTargetSdk(['--msbuildprops='])).toEqual([`--msbuildprops=${TARGET_SDK}`]);
    expect(withTargetSdk(['--msbuildprops', '--arch', 'x64'])).toEqual(['--msbuildprops', TARGET_SDK, '--arch', 'x64']);
    expect(withTargetSdk(['--msbuildprops'])).toEqual(['--msbuildprops', TARGET_SDK]);
  });

  it('leaves the caller\'s own target SDK alone', () => {
    const own = ['--msbuildprops', 'WindowsTargetPlatformVersion=10.0.26100.0'];
    expect(withTargetSdk(own)).toBe(own);
    expect(withTargetSdk(['--msbuildprops=A=1,WindowsTargetPlatformVersion=10.0.26100.0'])).toEqual(['--msbuildprops=A=1,WindowsTargetPlatformVersion=10.0.26100.0']);
  });
});


describe('findMsBuild', () => {
  const {findMsBuild} = require('./msbuild');

  it('asks vswhere for the newest MSBuild and takes the first path it prints', () => {
    const query = vi.fn(() => '\r\nC:\\VS\\MSBuild\\Current\\Bin\\MSBuild.exe\r\nC:\\Other\\MSBuild.exe\r\n');
    expect(findMsBuild(query)).toBe('C:\\VS\\MSBuild\\Current\\Bin\\MSBuild.exe');
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/Microsoft Visual Studio.Installer.vswhere\.exe$/), ['-latest', '-products', '*', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe']);
  });

  it('says what to install when vswhere finds none, and looks under the default program files without the variable', () => {
    const programFiles = process.env['ProgramFiles(x86)'];
    delete process.env['ProgramFiles(x86)'];
    try {
      const query = vi.fn(/** @type {(command: string, args: string[]) => string} */ (() => ''));
      expect(() => findMsBuild(query)).toThrow(/install Visual Studio/);
      expect(query.mock.calls[0]?.[0]).toMatch(/^C:\\Program Files \(x86\)\\/);
    } finally {
      if (programFiles !== undefined) process.env['ProgramFiles(x86)'] = programFiles;
    }
  });

  it('runs vswhere itself by default and reads nothing from a failed run', () => {
    const childProcess = require('node:child_process');
    const spawn = vi.spyOn(childProcess, 'spawnSync').mockReturnValue(/** @type {never} */ ({status: 0, stdout: 'C:\\Found\\MSBuild.exe\n'}));
    expect(findMsBuild()).toBe('C:\\Found\\MSBuild.exe');
    expect(spawn).toHaveBeenCalledWith(expect.stringContaining('vswhere.exe'), expect.arrayContaining(['-find']), {encoding: 'utf8'});
    spawn.mockReturnValue(/** @type {never} */ ({status: 1, stdout: 'ignored'}));
    expect(() => findMsBuild()).toThrow(/MSBuild was not found/);
  });
});
