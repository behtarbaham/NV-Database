$ErrorActionPreference = 'Stop'

$appName = 'Navand Course Manager'
$zipName = 'Navand Course Manager-win32-x64.zip'
$installRoot = Join-Path $env:LOCALAPPDATA 'Programs'
$installDir = Join-Path $installRoot $appName
$extractDir = Join-Path $env:TEMP "$appName-install"
$zipPath = Join-Path $PSScriptRoot $zipName

if (-not (Test-Path -LiteralPath $zipPath)) {
  throw "Missing installer payload: $zipPath"
}

New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

$payloadDir = Join-Path $extractDir 'Navand Course Manager-win32-x64'
if (-not (Test-Path -LiteralPath $payloadDir)) {
  throw "Invalid installer payload: $payloadDir"
}

Remove-Item -LiteralPath $installDir -Recurse -Force -ErrorAction SilentlyContinue
Move-Item -LiteralPath $payloadDir -Destination $installDir

$exePath = Join-Path $installDir 'Navand Course Manager.exe'
$shell = New-Object -ComObject WScript.Shell

$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) "$appName.lnk"
$shortcut = $shell.CreateShortcut($desktopShortcut)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $installDir
$shortcut.IconLocation = $exePath
$shortcut.Save()

$programsDir = [Environment]::GetFolderPath('Programs')
$startMenuShortcut = Join-Path $programsDir "$appName.lnk"
$shortcut = $shell.CreateShortcut($startMenuShortcut)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $installDir
$shortcut.IconLocation = $exePath
$shortcut.Save()

Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue
Start-Process -FilePath $exePath -WorkingDirectory $installDir
