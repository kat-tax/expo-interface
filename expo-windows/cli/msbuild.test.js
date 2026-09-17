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
