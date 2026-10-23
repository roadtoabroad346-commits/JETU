# Windows setup

`/workspace/JETU` is the Linux Codex workspace. It is not a Windows path. On Windows, use a local Git checkout such as `C:\workspace\JETU`.

Open PowerShell and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
New-Item -ItemType Directory -Force C:\workspace | Out-Null
git clone --branch main https://github.com/roadtoabroad346-commits/JETU.git C:\workspace\JETU
Set-Location C:\workspace\JETU
npm ci --include=dev
Copy-Item .env.example .env.local
notepad .env.local
npm run check
npm run dev
```

Open `http://localhost:3000`. Keep all edits inside `C:\workspace\JETU`. Save work with:

```powershell
git status
git add .
git commit -m "describe the change"
git push origin main
```

To update an existing checkout before work:

```powershell
Set-Location C:\workspace\JETU
git pull --ff-only origin main
npm ci --include=dev
```

If `C:\workspace\JETU` already exists and is not a Git repository, do not clone over it. Move it to a backup directory or choose a new path. The repository's `scripts\setup-windows.ps1` automates the safe clone/update/install/check flow.

For the local Supabase stack, start Docker Desktop first: `scripts\db.mjs` then
targets `npipe:////./pipe/docker_engine` and the safety guard accepts the Linux
socket and the Windows named pipe (everything remote stays rejected). Linux-only
socket assumptions no longer apply, but the Windows path itself has not been
exercised in recorded evidence yet — run `npm run db:start` and stop at the
first error instead of working around the guard.
