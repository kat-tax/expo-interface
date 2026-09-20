import {agentDeviceDriver} from '../platforms/agent-device.ts';
import {webDriver} from '../platforms/web.ts';
import {windowsDriver} from '../platforms/windows.ts';
import type {Driver, DriverOptions, Platform} from './types.ts';

/**
 * The driver for a platform.
 *
 * Windows is driven here, because `agent-device` has no backend
 * for it; web by a headless Chromium that needs nothing installed beyond this
 * repository; iOS and Android by `agent-device`, which does those far better
 * than a hand-rolled adb or simctl wrapper ever would.
 *
 * Kept apart from the CLI so the test layer can make a driver without running
 * the command line.
 */
export function driverFor(platform: Platform, options: DriverOptions): Driver {
  if (platform === 'windows') return windowsDriver(options);
  if (platform === 'web') return webDriver(options);
  return agentDeviceDriver(platform, options);
}
