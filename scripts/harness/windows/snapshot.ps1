param([string]$Process = '', [int]$Max = 400, [switch]$Interactive)
# The window's UI Automation tree as JSON — what Narrator reads, in the shape
# the harness hands to tests.
#
# Every node carries a `ref` (@e1, @e2, …) and its bounds in the window's own
# pixels, so a test presses `@e7` or `by.label('New')` and the harness resolves
# it to a point. Coordinates written into a test go stale the moment the layout
# moves; a ref is resolved fresh from the tree each time.
#
# -Interactive keeps only what a person can act on, which is what a test
# usually wants and is far smaller.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$proc = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Error "no window for $Process"; exit 1 }

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class HarnessSnapshotRect {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
}
"@
$windowRect = New-Object HarnessSnapshotRect+RECT
[void][HarnessSnapshotRect]::GetWindowRect($proc.MainWindowHandle, [ref]$windowRect)

$root = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
$script:nodes = New-Object System.Collections.ArrayList
$script:next = 0
# Explicit script scope: a function reading the parameter directly is easy to get wrong.
$script:onlyInteractive = [bool]$Interactive

# What a person can act on. Text and images are structure, not affordances.
$actionable = @('Button', 'Edit', 'CheckBox', 'ComboBox', 'Slider', 'Tab', 'TabItem',
                'ListItem', 'Hyperlink', 'MenuItem', 'RadioButton', 'Spinner', 'Thumb', 'SplitButton')

function Walk($element, $depth) {
  if ($script:nodes.Count -ge $Max) { return }
  try {
    $current = $element.Current
    $role = $current.ControlType.ProgrammaticName -replace '^ControlType\.', ''
    $name = $current.Name
    $interactive = $actionable -contains $role
    $offscreen = $current.IsOffscreen
    # A node earns a place if it is actionable or says something.
    $keep = if ($script:onlyInteractive) { $interactive } else { $interactive -or $name }
    if ($keep) {
      $box = $current.BoundingRectangle
      $script:next++
      [void]$script:nodes.Add([pscustomobject]@{
        ref         = "@e$($script:next)"
        role        = $role
        name        = $name
        depth       = $depth
        interactive = [bool]$interactive
        focused     = [bool]$current.HasKeyboardFocus
        focusable   = [bool]$current.IsKeyboardFocusable
        enabled     = [bool]$current.IsEnabled
        offscreen   = [bool]$offscreen
        # Window-relative, so a press does not care where the window sits.
        bounds      = if ([double]::IsInfinity($box.X) -or $box.Width -le 0) { $null } else {
          [pscustomobject]@{
            x      = [int]($box.X - $windowRect.Left)
            y      = [int]($box.Y - $windowRect.Top)
            width  = [int]$box.Width
            height = [int]$box.Height
          }
        }
      })
    }
  } catch {
    # An element can vanish mid-walk; the rest of the tree is still worth having.
    return
  }
  $child = $walker.GetFirstChild($element)
  while ($null -ne $child) {
    Walk $child ($depth + 1)
    $child = $walker.GetNextSibling($child)
  }
}

Walk $root 0
[pscustomobject]@{
  process = $proc.ProcessName
  window  = [pscustomobject]@{
    x      = $windowRect.Left
    y      = $windowRect.Top
    width  = $windowRect.Right - $windowRect.Left
    height = $windowRect.Bottom - $windowRect.Top
  }
  nodes   = @($script:nodes)
} | ConvertTo-Json -Depth 6 -Compress
