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

# The properties Narrator reads past the name and the role, and which nothing
# else in a test run can see: a control that sets none of them looks
# identical in the tree to one that sets them all. `LiveSetting` has no named
# field in the managed client, so it is looked up by its UIA id (30135).
$liveSetting = try { [System.Windows.Automation.AutomationProperty]::LookupById(30135) } catch { $null }
$LIVE_NAMES = @('off', 'polite', 'assertive')

# Reads one property, answering $null for "not set" in all the ways UIA says
# it: absent, NotSupported, an empty string, or a number below 1. That last one
# matters more than it looks — react-native-windows returns **-1** for an unset
# position or set size, not 0, so a tree without it reads "(-1 of -1)" on every
# node that never set one.
function Prop($element, $property, $unsetBelowOne = $true) {
  if (-not $property) { return $null }
  try {
    # Without the second argument UI Automation returns the property's
    # **default** — '' or 0 or $false — for an element that does not support
    # it. Asking it to ignore the default instead hands back `NotSupported`,
    # which arrives here as a bare `System.__ComObject` that `-eq` will not
    # match: every property then reads as set, on every node.
    $value = $element.GetCurrentPropertyValue($property)
  } catch { return $null }
  if ($null -eq $value) { return $null }
  if ($value -is [System.__ComObject]) { return $null }
  if ($value -is [string] -and $value -eq '') { return $null }
  if ($unsetBelowOne -and $value -is [int] -and $value -lt 1) { return $null }
  return $value
}

function Walk($element, $depth) {
  if ($script:nodes.Count -ge $Max) { return }
  try {
    $current = $element.Current
    $role = $current.ControlType.ProgrammaticName -replace '^ControlType\.', ''
    $name = $current.Name
    $interactive = $actionable -contains $role
    $offscreen = $current.IsOffscreen
    # The kit sets this from React Native's testID. It is not the text a person
    # reads, so it survives relabelling and localisation.
    $testId = $current.AutomationId
    # Everything a screen reader would say that a name and a role do not cover.
    $helpText = Prop $element ([System.Windows.Automation.AutomationElement]::HelpTextProperty)
    $posInSet = Prop $element ([System.Windows.Automation.AutomationElement]::PositionInSetProperty)
    $setSize = Prop $element ([System.Windows.Automation.AutomationElement]::SizeOfSetProperty)
    $headingLevel = Prop $element ([System.Windows.Automation.AutomationElement]::HeadingLevelProperty)
    $itemStatus = Prop $element ([System.Windows.Automation.AutomationElement]::ItemStatusProperty)
    $isDialog = Prop $element ([System.Windows.Automation.AutomationElement]::IsDialogProperty) $false
    $live = Prop $element $liveSetting
    # A node earns a place if it is actionable, says something, or was
    # deliberately marked with a testID.
    $keep = if ($script:onlyInteractive) { $interactive } else { $interactive -or $name -or $testId }
    if ($keep) {
      $box = $current.BoundingRectangle
      $script:next++
      [void]$script:nodes.Add([pscustomobject]@{
        ref         = "@e$($script:next)"
        role        = $role
        name        = $name
        # Empty rather than absent would put a dead field on every node of
        # every tree, and these trees are read by people and by models.
        testId      = if ($testId) { $testId } else { $null }
        depth       = $depth
        interactive = [bool]$interactive
        focused     = [bool]$current.HasKeyboardFocus
        focusable   = [bool]$current.IsKeyboardFocusable
        enabled     = [bool]$current.IsEnabled
        offscreen   = [bool]$offscreen
        # Present only when set, so a tree stays readable and a property that
        # is missing is visibly missing rather than drawn as a default.
        help        = $helpText
        # "2 of 5", the way it is announced, rather than two numbers to pair up.
        inSet       = if ($posInSet -and $setSize) { "$posInSet of $setSize" } else { $null }
        heading     = if ($headingLevel -is [int]) { $headingLevel } else { $null }
        live        = if ($live -is [int] -and $live -gt 0 -and $live -lt $LIVE_NAMES.Count) { $LIVE_NAMES[$live] } else { $null }
        status      = $itemStatus
        dialog      = if ($isDialog -eq $true) { $true } else { $null }
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
