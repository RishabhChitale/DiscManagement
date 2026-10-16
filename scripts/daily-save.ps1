# Commits and pushes any changes in the repo. Run daily by Task Scheduler.
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$log = Join-Path $repo "scripts\daily-save.log"
"=== $(Get-Date -Format s) ===" | Out-File $log -Append
git add -A *>> $log
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Daily save $(Get-Date -Format yyyy-MM-dd)" *>> $log
}
git push origin HEAD *>> $log
