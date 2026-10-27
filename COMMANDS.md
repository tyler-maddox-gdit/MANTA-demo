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
npm run demo -- start
```

Uncommitted changes: `npm run demo -- reset --force`. `start` runs in terminal 1 for the whole show, Ctrl+C at the
end: QA (site `main` on 4173, Workbench 3508), Dev (this folder on the feature branch, clean, dev server on 5173),
Release (Workbench 3509, site 4175). QA and Release run from their own copies in the temp folder, so nothing in one touches
another. Type everything below in terminal 2.

## 1. QA

Browser only: Workbench http://127.0.0.1:3508/ · Launcher URL `http://localhost:4173/`.

## 2. Dev

```
npx manta gate --base http://localhost:5173
npm run demo -- fix
npx manta gate --base http://localhost:5173
npx manta note "During dev on upload dialog I fixed a few backlog issues with cluster"
```

`fix` asks `Apply these 3 fixes? [y/N]`: `y`. Gates: `New 3` exit 1, then `New 0 · Fixed 7 · Tolerated 20` exit 0. `note`: `Wrote .manta/work-notes/… a note by Tyler Maddox on 7 violations`.

## 3. DevOps

```
npm run demo -- stage devops
```

Prints the live PR and golden PR links. Browser from here. Never press Merge. Pushes the branch as tagged; the
Dev fix in this folder stays.

## 4. QA again, the next night

Browser only: Workbench http://127.0.0.1:3509/: Nightly shows 25 (was 33). Export → **Draft ACR**: provider Anthropic API is the
pre-run model this stage started on this PC (no real model; the remarks are the recording's, about 6 s; say "pre-run").
Only Release (`start`, `stage release`) and `workbench release` have it. Its site, with the upload dialog and the
fixes: http://localhost:4175/ (the Workbench's page links and Rescan go there).

## Clean-up

```
npm run demo -- stage dev        # start Dev over (start keeps running)
npm run demo -- stage devops     # close the live PR, open it again
npm run demo -- start            # discard Workbench edits (Ctrl+C start first; also starts Dev over)
npm run demo -- reset            # everything
npm run demo -- reset --force    # everything, discarding uncommitted changes
npm run demo -- status
```

## Fallbacks

```
npm run demo -- start --port 3600             # 3508 in use: QA on 3600, Release on 3601
npm run demo -- stage qa                      # QA alone, or stage release: replaces a running start
npx manta gate --base http://localhost:5173 --no-images   # pictures garbled
npm run build && npx vite preview --port 4174 # dev server will not start (4173 is QA's), then:
npx manta gate --base http://localhost:4174
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
