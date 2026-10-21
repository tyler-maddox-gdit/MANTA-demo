# Demo commands, in order

Run from the repo folder. Only the commands you type. Stage order: QA, Dev, DevOps, Release.

## 1. One-time setup (a new PC)

```
npm ci
npm ci --allow-git=all
npm run install-browser-gdit
npm run demo -- status
```

- Use the second line only if the first stops with `EALLOWGIT`.
- `status` should end `Ready.` The one line that may say FIX is `gh` not signed in as the admin account; only `reset` needs it.

## 2. Before the audience

```
npm run demo -- reset
npm run demo -- status
```

- `reset` puts both branches back at their story tags, closes any live PR, restores the snapshots and deletes local runs. Needs the admin `gh` account.
- If the tree has uncommitted changes: `npm run demo -- reset --force`.

## 3. Stage QA: the backlog

```
npm run demo -- stage qa
```

- Workbench: http://127.0.0.1:3508/. The site is `main`, before the upload change: the Nightly run shows 33 open issues (27 on the five pages the gate scans, 6 on `/account`).
- Launcher: paste `http://localhost:4173/` only.
- Ctrl+C stops the site and the Workbench before Stage Dev.
- Port 3508 taken: `npm run demo -- stage qa --port 3600`

## 4. Stage Dev (two terminals)

Terminal 1:

```
npm run demo -- stage dev
npx manta gate --base http://localhost:5173 --no-screenshots
npm run demo -- fix
npx manta gate --base http://localhost:5173 --no-screenshots
```

Terminal 2, started before the first gate and left running:

```
npm run dev
```

- `fix` shows the AI answer and asks `Apply these 3 fixes? [y/N]`: type `y`.
- Gates (about 8 s each): first `New 3`, exit 1; second `New 0`, `Fixed 7`, `Tolerated 20`, exit 0.
- Stop `npm run dev` (Ctrl+C) before Stage Release.

## 5. Stage DevOps

```
npm run demo -- stage devops
```

Prints the live PR link and the golden PR link. Everything after is in the browser. Never press Merge.

Start Stage Release during the gate's 90 s wait if you like: it only touches this PC.

## 6. Stage Release: back to QA, the next night

```
npm run demo -- stage release
```

- The upload change with the fixes, as merged; the Workbench on the release snapshot: the Nightly run shows 25 (was 33).
- Workbench: http://127.0.0.1:3508/. Ctrl+C stops both.
- Port 3508 taken: `npm run demo -- stage release --port 3600`

## 7. Clear out the runs

Between stages or between rehearsals. Each stage command already clears local runs, the applied patch and the Workbench's edits when it starts, so any stage command works as a quick clean-up.

| To clear | Command |
|---|---|
| Start Stage Dev over (discards the applied fix) | `npm run demo -- stage dev` |
| Close the live PR and start Stage DevOps again | `npm run demo -- stage devops` |
| Discard what the Workbench wrote into the snapshots | `npm run demo -- stage qa` (or `stage release`) |
| Everything: branches, live PR, snapshots, local runs | `npm run demo -- reset` |
| Everything, discarding uncommitted changes | `npm run demo -- reset --force` |
| Check it worked | `npm run demo -- status` |

## 8. Fallbacks

```
npm run demo -- stage qa --port 3600
npm run build
npm run preview
npx manta gate --base http://localhost:4173 --no-screenshots
npm run demo -- fix --live
```

- `--port 3600`: Workbench port in use.
- `build`, `preview` and the `4173` gate: the dev server will not start, so gate the built site instead.
- `fix --live`: runs the real AI skills; needs the `claude` command line signed in.

## 9. Other

```
npm run demo -- help
npm run demo -- workbench
npm run demo -- workbench release
npm run demo -- workbench pr
```

- `workbench` opens the nightly snapshot alone; `workbench release` the release snapshot; `workbench pr` the pull request snapshot.
