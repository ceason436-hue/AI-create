param(
  [ValidateSet('generate', 'clean')]
  [string]$Mode = 'generate',
  [string]$OutputDir = 'D:\.codex\AI-create\synthetic-fixtures'
)

$ErrorActionPreference = 'Stop'
$fixtureNames = @(
  'manifest.json',
  'synthetic-course.md',
  'synthetic-course.ppt',
  'synthetic-course.pptx',
  'synthetic-cover.jpg',
  'synthetic-cover.png',
  'synthetic-cover.webp',
  'synthetic-handbook.doc',
  'synthetic-handbook.docx',
  'synthetic-lesson.mp4',
  'synthetic-lesson.webm',
  'synthetic-reading.txt',
  'synthetic-subtitles.webvtt',
  'synthetic-worksheet.pdf'
)

$absoluteOutput = [System.IO.Path]::GetFullPath($OutputDir)
if (-not $absoluteOutput.StartsWith('D:\.codex\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Acceptance fixtures must stay under D:\.codex.'
}

foreach ($name in $fixtureNames) {
  $target = Join-Path $absoluteOutput $name
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Force
  }
}
if (Test-Path -LiteralPath $absoluteOutput) {
  Get-ChildItem -LiteralPath $absoluteOutput -File -Filter '~$*' | Remove-Item -Force
}
if ($Mode -eq 'clean') {
  Write-Output "Removed generated acceptance fixtures from $absoluteOutput"
  exit 0
}

New-Item -ItemType Directory -Path $absoluteOutput -Force | Out-Null
$profileRoot = [Environment]::GetFolderPath('UserProfile')
$runtimeRoot = Join-Path $profileRoot '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$runtimeNode = Join-Path $runtimeRoot 'node\bin\node.exe'
$runtimePython = Join-Path $runtimeRoot 'python\python.exe'
$runtimeModules = Join-Path $runtimeRoot 'node\node_modules'
$presentationSkill = Join-Path $profileRoot '.codex\plugins\cache\openai-primary-runtime\presentations\26.904.11930\skills\presentations'
$toolingRoot = 'D:\.codex\AI-create\fixture-tooling'
$ffmpeg = Join-Path $toolingRoot 'node_modules\ffmpeg-static\ffmpeg.exe'
$presentationBuild = 'D:\.codex\AI-create\.fixture-presentation-build'

foreach ($required in @($runtimeNode, $runtimePython, $runtimeModules, $presentationSkill)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Required Codex workspace dependency is unavailable: $required"
  }
}
if (-not (Test-Path -LiteralPath $ffmpeg)) {
  npm.cmd install --prefix $toolingRoot ffmpeg-static@5.2.0 --no-save --ignore-scripts=false
}

& $runtimePython (Join-Path $PSScriptRoot 'generate-acceptance-fixtures.py') --output-dir $absoluteOutput --ffmpeg $ffmpeg
if ($LASTEXITCODE -ne 0) { throw 'Base fixture generation failed.' }

$env:CODEX_RUNTIME_NODE_MODULES = $runtimeModules
$env:CODEX_PRESENTATION_SKILL_DIR = $presentationSkill
$env:CODEX_RUNTIME_PYTHON = $runtimePython
if (Test-Path -LiteralPath $presentationBuild) {
  Remove-Item -LiteralPath $presentationBuild -Recurse -Force
}
& $runtimeNode (Join-Path $PSScriptRoot 'generate-acceptance-presentation.mjs') $absoluteOutput
if ($LASTEXITCODE -ne 0) { throw 'PPTX fixture generation failed.' }

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'convert-acceptance-office-legacy.ps1') -OutputDir $absoluteOutput
if ($LASTEXITCODE -ne 0) { throw 'Legacy Office fixture conversion failed.' }

& $runtimePython (Join-Path $PSScriptRoot 'generate-acceptance-fixtures.py') --output-dir $absoluteOutput --manifest-only
if ($LASTEXITCODE -ne 0) { throw 'Fixture manifest generation failed.' }

& $runtimePython (Join-Path $PSScriptRoot 'verify-acceptance-fixtures.py') --output-dir $absoluteOutput --ffmpeg $ffmpeg
if ($LASTEXITCODE -ne 0) { throw 'Fixture verification failed.' }

Write-Output "Generated synthetic acceptance fixtures in $absoluteOutput"
