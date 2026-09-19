param([string]$Process = 'DropFiles', [int]$Max = 200)
# Walks the UI Automation tree of a process's main window — what Narrator reads.
#
# A control with no name reads as its type alone ("button"), which is the most
# common accessibility bug in an island: UIA derives no name from a panel of a
# glyph and a text block, so the control has to carry one itself.
# Labels carry punctuation the console's default code page mangles into "?".
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$proc = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Error "no window for $Process"; exit 1 }

$root = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
$script:count = 0

function Walk($element, $depth) {
  if ($script:count -ge $Max) { return }
  $type = $element.Current.ControlType.ProgrammaticName -replace '^ControlType\.', ''
  $name = $element.Current.Name
  $state = @()
  if ($element.Current.HasKeyboardFocus) { $state += 'focused' }
  if ($element.Current.IsKeyboardFocusable) { $state += 'focusable' }
  if ($element.Current.IsOffscreen) { $state += 'offscreen' }
  $interactive = $type -in @('Button', 'Edit', 'CheckBox', 'ComboBox', 'Slider', 'Tab', 'TabItem', 'ListItem', 'Hyperlink', 'MenuItem', 'RadioButton')
  if ($name -or $interactive) {
    $script:count++
    $line = ('  ' * $depth) + $type + " '" + $name + "'"
    if ($state.Count) { $line += ' [' + ($state -join ',') + ']' }
    if ($interactive -and -not $name) { $line += '  <- no accessible name' }
    Write-Output $line
  }
  $child = $walker.GetFirstChild($element)
  while ($null -ne $child) {
    Walk $child ($depth + 1)
    $child = $walker.GetNextSibling($child)
  }
}

Walk $root 0
Write-Output "$($script:count) named or interactive elements"
