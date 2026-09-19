param(
  [string]$Points = '',     # "x,y;x,y;…" — relative to the window when -Process is given, else screen pixels
  [string]$Keys = '',       # SendKeys text, e.g. "{TAB}{ENTER}" or "hello"
  [int]$Pause = 400,
  [string]$Process = ''
)
# Synthetic mouse and keyboard input.
#
# Points are window-relative when -Process names one, because a window that
# opened cascaded is not at the screen origin and a click computed from a
# screenshot would land somewhere else.
#
# SetCursorPos alone raises no pointer-move, so hover never fires from it; the
# click below moves and then presses, which the renderer sees as a real pointer.
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class HarnessInput {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  public static void Click(int x, int y) {
    SetCursorPos(x, y);
    System.Threading.Thread.Sleep(80);
    mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);   // left down
    System.Threading.Thread.Sleep(60);
    mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);   // left up
  }
}
"@

$originX = 0
$originY = 0
if ($Process) {
  $proc = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (-not $proc) { Write-Error "no window for $Process"; exit 1 }
  $rect = New-Object HarnessInput+RECT
  [void][HarnessInput]::GetWindowRect($proc.MainWindowHandle, [ref]$rect)
  $originX = $rect.Left
  $originY = $rect.Top
}

foreach ($point in $Points.Split(';')) {
  if (-not $point.Trim()) { continue }
  $xy = $point.Split(',')
  $x = [int]$xy[0] + $originX
  $y = [int]$xy[1] + $originY
  [HarnessInput]::Click($x, $y)
  Write-Output "clicked $x,$y"
  Start-Sleep -Milliseconds $Pause
}

if ($Keys) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.SendKeys]::SendWait($Keys)
  Start-Sleep -Milliseconds $Pause
  Write-Output "sent $Keys"
}
