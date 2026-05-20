param(
    [Parameter(Mandatory=$true)]
    [string]$RemoteUrl
)

# Ensure script runs from repository root
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
Set-Location -Path (Resolve-Path ..).Path

if (-not (Test-Path .git)) {
    git init
}

# Create initial commit if no commits exist
$hasCommits = & git rev-parse --verify HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    git add -A
    git commit -m "Initial import of nexusml-pipeline-platform"
}

# Set or update remote
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    git remote remove origin
}

git remote add origin $RemoteUrl

# Ensure main branch
git branch -M main

Write-Host "Pushing to $RemoteUrl (branch: main) ..."

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful." -ForegroundColor Green
} else {
    Write-Host "Push failed. Check credentials and remote URL." -ForegroundColor Red
}
