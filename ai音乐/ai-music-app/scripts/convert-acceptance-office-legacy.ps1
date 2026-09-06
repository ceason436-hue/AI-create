param(
  [Parameter(Mandatory = $true)]
  [string]$OutputDir
)

$ErrorActionPreference = 'Stop'
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDir).Path
$pptx = Join-Path $resolvedOutput 'synthetic-course.pptx'
$ppt = Join-Path $resolvedOutput 'synthetic-course.ppt'

$powerPoint = $null
$presentation = $null
try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($pptx, $true, $false, $false)
  $presentation.SaveAs($ppt, 1)
} finally {
  if ($presentation) { $presentation.Close() }
  if ($powerPoint) { $powerPoint.Quit() }
}
