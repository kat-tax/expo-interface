# Prints the seconds since the user last touched the keyboard or mouse.
#
# Synthetic input goes to whatever is in front, which is the user's own window
# if they are at the desk — clicks meant for the app land in their browser, and
# nothing says so. The harness asks this before it presses anything.
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class HarnessIdle {
  [StructLayout(LayoutKind.Sequential)] struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  public static double Seconds() {
    var info = new LASTINPUTINFO();
    info.cbSize = (uint)Marshal.SizeOf(info);
    GetLastInputInfo(ref info);
    return (Environment.TickCount - (int)info.dwTime) / 1000.0;
  }
}
"@
[HarnessIdle]::Seconds()
