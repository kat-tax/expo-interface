param([string]$Process = 'DropFiles')
# Brings a process's main window to the front and gives it the foreground.
#
# Windows refuses SetForegroundWindow to a process that does not own the
# foreground, so this attaches to the foreground thread's input queue first,
# which is the documented way past that lock.
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class HarnessRaise {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int c, uint flags);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
}
"@
$proc = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $proc) { Write-Error "no window for $Process"; exit 1 }
$window = $proc.MainWindowHandle
$foreground = [HarnessRaise]::GetForegroundWindow()
$owner = 0
$foregroundThread = [HarnessRaise]::GetWindowThreadProcessId($foreground, [ref]$owner)
$me = [HarnessRaise]::GetCurrentThreadId()
[void][HarnessRaise]::AttachThreadInput($foregroundThread, $me, $true)
[void][HarnessRaise]::ShowWindow($window, 9)                                  # restore if minimized
[void][HarnessRaise]::SetWindowPos($window, [IntPtr](-1), 0, 0, 0, 0, 0x0003) # topmost
[void][HarnessRaise]::SetWindowPos($window, [IntPtr](-2), 0, 0, 0, 0, 0x0003) # then back, but in front
[void][HarnessRaise]::BringWindowToTop($window)
$set = [HarnessRaise]::SetForegroundWindow($window)
[void][HarnessRaise]::AttachThreadInput($foregroundThread, $me, $false)
Start-Sleep -Milliseconds 300
Write-Output ("foreground " + ([HarnessRaise]::GetForegroundWindow() -eq $window) + " (set " + $set + ")")
