# Demo commands

Run from the repo folder. Order: QA → Dev → DevOps → QA again (release).

## Setup (new PC, once)

```
npm ci
npm run install-browser-gdit
npm run demo -- status
```

`EALLOWGIT` on the first line: `npm ci --allow-git=all`. `status` ends `Ready.`

## Before the audience

```
npm run demo -- reset
npm run demo -- status
```

Uncommitted changes: `npm run demo -- reset --force`.

## 1. QA

```
npm run demo -- stage qa
```

Workbench http://127.0.0.1:3508/ · Launcher URL `http://localhost:4173/` · Ctrl+C when done.

## 2. Dev

Terminal 2 first, left running:

```
npm run dev
```

Terminal 1:

```
npm run demo -- stage dev
npx manta gate --base http://localhost:5173
npm run demo -- fix
npx manta gate --base http://localhost:5173
npx manta note "During dev on upload dialog I fixed a few backlog issues with cluster"
```

`fix` asks `Apply these 3 fixes? [y/N]`: `y`. Gates: `New 3` exit 1, then `New 0 · Fixed 7 · Tolerated 20` exit 0. `note`: `Wrote .manta/work-notes/… a note by Tyler Maddox on 7 violations`. Ctrl+C `npm run dev` when done.

## 3. DevOps

```
npm run demo -- stage devops
```

Prints the live PR and golden PR links. Browser from here. Never press Merge.

## 4. QA again, the next night

```
npm run demo -- stage release
```

Workbench http://127.0.0.1:3508/: Nightly shows 25 (was 33). Export → **Draft ACR**: provider Anthropic API is the
pre-run model this stage started on this PC (no real model; the remarks are the recording's, about 6 s; say "pre-run").
Only this stage and `workbench release` have it. Ctrl+C when done.

## Clean-up

```
npm run demo -- stage dev        # start Dev over
npm run demo -- stage devops     # close the live PR, open it again
npm run demo -- stage qa         # discard Workbench edits
npm run demo -- reset            # everything
npm run demo -- reset --force    # everything, discarding uncommitted changes
npm run demo -- status
```

## Fallbacks

```
npm run demo -- stage qa --port 3600          # 3508 in use (also stage release)
npx manta gate --base http://localhost:5173 --no-images   # pictures garbled
npm run build && npm run preview              # dev server will not start, then:
npx manta gate --base http://localhost:4173
npm run demo -- fix --live                    # real AI; claude CLI signed in
git checkout -- demo-data                     # Draft ACR failed: the committed ACR back in demo-data/release/reports/
```

## Other

```
npm run demo -- help
npm run demo -- workbench            # nightly snapshot
npm run demo -- workbench release    # also starts the pre-run model for Draft ACR
npm run demo -- workbench pr
```
