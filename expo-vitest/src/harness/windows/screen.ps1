param(
  [string]$Out = "$PSScriptRoot\screen.png",
  [int]$X = 0,
  [int]$Y = 0,
  [int]$W = 0,
  [int]$H = 0,
  [string]$Process = ''
)
# Copies a region of the screen as it is, without touching any window's z-order.
# Raising the app to capture it would hide a share sheet or a flyout that is
# over it, which is usually the thing being looked at.
#
# With -Process, the region is that process's main window; otherwise the whole
# virtual screen, or the rectangle given.
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

if ($Process) {
  Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class HarnessRect {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
}
"@
  $proc = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (-not $proc) { Write-Error "no window for $Process"; exit 1 }
  $rect = New-Object HarnessRect+RECT
  [void][HarnessRect]::GetWindowRect($proc.MainWindowHandle, [ref]$rect)
  $X = $rect.Left; $Y = $rect.Top
  $W = $rect.Right - $rect.Left; $H = $rect.Bottom - $rect.Top
}

if ($W -le 0 -or $H -le 0) {
  $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
  if ($W -le 0) { $W = $bounds.Width }
  if ($H -le 0) { $H = $bounds.Height }
}

$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($X, $Y, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "saved $Out ($W x $H at $X,$Y)"
