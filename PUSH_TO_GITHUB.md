# Push to GitHub

This guide helps you push the existing project to a new GitHub repository under your account (for example: `https://github.com/lukee-1/<repo>.git`).

Prerequisites
- Git installed and configured (`git config --global user.name` and `user.email`).
- A GitHub repository created (private or public). Create one at https://github.com/new and copy the repo URL.

Quick manual steps

```powershell
# from the project root
git init
git add .
git commit -m "Initial import of nexusml-pipeline-platform"
# set your remote URL (replace <repo-url>)
git remote add origin <repo-url>
# push default branch (main or master)
git branch -M main
git push -u origin main
```

Automated helper (PowerShell)

A helper script is provided at `scripts/push-to-github.ps1` that will:
- Initialize a Git repo if missing
- Create an initial commit if none exists
- Set the remote URL you provide
- Push to `main`

Run the script like:

```powershell
# Windows PowerShell
.\\\scripts\\push-to-github.ps1 -RemoteUrl https://github.com/lukee-1/nexusml-pipeline-platform.git
```

If you prefer to use an SSH remote, supply the SSH URL instead.

Security note: the script does not store credentials. For private repos, ensure you have an authenticated Git credential helper (Git Credential Manager) or use SSH keys.
