# This script has been renamed to setup.ps1.
# Please use setup.ps1 instead — it collects all required machine-level configuration.

$setupScript = Join-Path $PSScriptRoot 'setup.ps1'
& powershell -ExecutionPolicy Bypass -File $setupScript @args
