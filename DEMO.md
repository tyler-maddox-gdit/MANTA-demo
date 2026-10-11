# The demo runbook

MANTA across the software lifecycle, told in seven scenes on the Benefits Portal demo site: about 25 minutes,
from a developer's terminal through a pull request and a nightly build to QA and release. Every scene runs
without an AI key. Where the audience sees AI output that was produced earlier, say **"pre-run"** out loud;
never describe pre-run output as live.

The words in `code` are typed. `npm run demo -- scene <n>` sets each scene up and prints the same lines as
this page. On the demo PC, MANTA itself is checked out at `C:\demo\MANTA`; this repo is wherever you cloned it.

---

## Day-of checklist

Do these before the audience arrives, in this order.

- [ ] The night before: `npm run demo -- reset` ran once and ended with scene 1's cue.
- [ ] `npm run demo -- status` ends with **Ready.**: both story branches at their tags, no open live PR, a clean
      working tree, both snapshots listing a run token, `gh` signed in, Node 20 or later.
- [ ] `gh auth status` shows you signed in as a collaborator on `tyler-maddox-gdit/MANTA-demo`.
- [ ] The repo secret `MANTA_SECRET_DEMO_PW` is set (Settings → Secrets and variables → Actions).
- [ ] The repo secret `MANTA_READ_TOKEN` has not expired. It expires on: **____-__-__** (see "Setup Tyler does once").
- [ ] Chromium is installed: `npx playwright install chromium`.
- [ ] `npm run dev` opens the site at http://localhost:5173. Stop it again (Ctrl+C).
- [ ] The golden PR is open (its link is in `npm run demo -- status`).
- [ ] The Actions tab shows last night's **Nightly** run green.
- [ ] A browser is signed in to GitHub, with two tabs ready: the repo's pull requests, and the golden PR.
- [ ] The terminal font is large and the theme is light.

---

## Scene 1 · Conception (1 min)

**Setup.** `npm run demo -- reset` has run. The slide is up: a criterion row's checklist in the Workbench.

**Type.** Nothing.

**See.** One slide: a WCAG criterion's row in MANTA's Workbench, with its checklist of tests open.

**Say.**
- "Accessibility is part of the definition of done. Before anyone writes a line of code, this checklist is the
  acceptance criteria for the feature: what a tester will check, criterion by criterion."
- "Today we follow one feature, an upload dialog for a benefits portal, from the developer's laptop to the
  release paperwork."

**If it goes wrong.** No slide: open the Workbench on the nightly snapshot (scene 6's lines) and show any
criterion's checklist there.

---

## Scene 2 · The developer scans localhost (4 min)

**Setup.** `npm run demo -- scene 2` checks out the feature branch, `feature/upload-documents`. A **branch**
is a line of work kept apart from the main code until it is ready.

**Type.**
```
npm run dev        (in a second terminal; leave it running)
npx manta gate --base http://localhost:5173
```

**See.** MANTA's step stream as it scans each page, then the terminal summary: **New 3** (P1 2 · P2 1),
**Fixed 0**, **Tolerated** with the same number as the README's badge, the three new violations listed on
`/status?upload=BP-2026-10882`, and the last line `Gate failed: 3 new violations at or above minor.  exit 1`.

**Say.**
- "The developer runs MANTA on their own machine, against the site as it runs on their laptop."
- "This is the **gate**: a scan compared against a saved list of the problems we already know about. It passes
  or fails the change, the way a unit test does."
- "That saved list is the **baseline**: the accessibility debt the main code already has, committed to the
  repository. The badge on the README counts them. We are paying them down, but they do not block anyone."
- "What the gate blocks is *new* debt. Legacy debt tolerated, new debt blocked. That one-way rule is called a
  ratchet: the number can go down, never up."
- "The upload dialog this developer just built added three new problems: a file field with no label, a close
  button with no name, and hint text too faint to read. The developer learns that now, before the pull request
  does."

**If it goes wrong.** The dev server will not start: in the second terminal run `npm run build` then
`npm run preview`, and gate the preview build instead: `npx manta gate --base http://localhost:4173`.

---

## Scene 3 · The developer applies an AI fix (3 min)

**Setup.** `npm run demo -- scene 3` prints the patch's file name (it carries the snapshot's run token).

**Type.**
```
git apply demo-data/pr/reports/fix-<token>.patch
npx manta gate --base http://localhost:5173
```

**See.** `git apply` prints nothing; `git diff --stat` would show `src/pages/Status.jsx` and `src/styles.css`
changed. The gate runs again and ends with **New 0** and a passing verdict, plus the report's link.

**Say.**
- "MANTA's fix skill proposed these fixes as a **patch**: a file listing exact line changes to the source code,
  which `git apply` applies in one step."
- "The fix is a change to the source file and line that wrote the element, not an instruction about the page.
  MANTA applied nothing. The developer did, in one line, and can read every change first."
- "This patch was **pre-run** from a snapshot of this branch. With an AI key in CI, the same fix is written in
  the pull request's own run."

**If it goes wrong.** `git apply` refuses because the code has moved: open the patch file to show the changes,
and the Fix row of the same issue in the Workbench on `demo-data/pr` (scene 6's lines with `demo-data/pr` in
place of `demo-data/nightly`).

---

## Scene 4 · The pull request (6 min)

**Setup.** Undo scene 3's fix first; then the scene command pushes the branch, opens a live pull request,
starts the nightly run for scene 5 and prints both pull requests' links.

**Type.**
```
git checkout .
npm run demo -- scene 4
```

**See.** In the browser, the **live PR**: the red **MANTA gate** check; MANTA's comment — `MANTA gate · failed:
3 new violations at or above minor`, the New / Fixed / Tolerated lines, the three new ones in a table, and
`AI fixes: none proposed — this run had no AI provider.`; the warnings in the check's summary. Then switch to
the **golden PR** tab: the same comment with `AI fixes: 4 proposed, 3 as suggestions below`, a review with three
suggestions on the dialog's lines (the file field's label and the close button's name in `Status.jsx`, the hint
colour in `styles.css`), each with a **Commit suggestion** button, an "Also fixable" section holding the
footer links' fix, and the `git apply` line.

**Say.**
- "A **pull request** is how a change asks to join the main code: the team reviews it, and automated checks
  run on it."
- "A **pull request check** is one of those automated results, a green tick or a red cross beside the change.
  The gate is one required check: while it is red, this change cannot merge."
- "The comment is live. MANTA wrote it from the checks that ran on this pull request a minute ago, and it
  updates itself on every push."
- "This second pull request is the **golden PR**: the same change, with MANTA's AI output posted once, ahead of
  time. It is **pre-run**."
- "Each **suggestion** is a proposed edit attached to exact lines of the change. Anyone with write access
  accepts it with one click on Commit suggestion." Point at the button; never press it.
- "The footer links are old debt, outside this change, so MANTA lists their fix under Also fixable instead of
  attaching it to lines the change never touched."
- The golden PR's comment and review carry Tyler's name, not a bot's: they were posted from his machine.

**If it goes wrong.** CI is slow or the live PR will not open: show the golden PR alone. That is why it exists.

---

## Scene 5 · Nightly through login (3 min)

**Setup.** `npm run demo -- scene 5` names the nightly run scene 4 started.

**Type.**
```
gh run watch <run> -R tyler-maddox-gdit/MANTA-demo
```

**See.** The run's log: the Sign in path replayed (Email, Password, Sign in), the line
`Scanned along "Sign in": ends on http://localhost:4173/account`, MANTA's extended rules (the ones that press
keys) step by step, then the summary. In the browser, the run's page lists the artifact `manta-nightly`.

**Say.**
- "A **workflow run** is one execution of an automated job on GitHub's machines. This one runs every night, and
  we started one by hand twenty minutes ago."
- "Every night MANTA scans what no pull request touches: the account page behind the login, reached by a saved
  path that signs in with a password kept as a secret, never written in the repository."
- "It also runs MANTA's extended rules, the ones that press keys and walk the focus through the page."
- "Everything the run found is kept as an **artifact**: a bundle of files the run leaves behind. QA downloads it
  and opens it in the Workbench, which is the next scene."

**If it goes wrong.** The run is late or failed: open last night's **Nightly** run in the Actions tab; the
schedule guarantees there is one.

---

## Scene 6 · QA in the Workbench (5 min)

**Setup.** The Workbench opens the **nightly snapshot**: a real nightly run, downloaded and committed to this
repo, with its AI notes **pre-run** afterwards. Rescan reloads pages from the site, so the preview build runs
beside it.

**Type.**
```
npm run build
npm run preview    (in this repo, a second terminal)
cd C:\demo\MANTA
npm run manta -- --data-dir <this repo>\demo-data\nightly
```
(`npm run demo -- scene 6` prints the last two lines with the real paths.) Open the URL it prints, then the
Nightly run's report.

**See.** The run's report: add an issue on the account page; give a verdict on an issue; rescan the Pending
badge's contrast issue on `/status` (still failing); attest a criterion; open a criterion's checklist. Then the
Pages dialog's **Focus order** column on `/status?upload=BP-2026-10882`: the numbered stops walk out of the
open dialog into the page behind it.

**Say.**
- "The scan is evidence; the human is the judgment. QA adds what no rule can see, decides what the scan could
  only flag, and re-measures a fix on the spot."
- "Everything QA does is recorded on the run itself: who decided what, and when. The record is the run."
- "No rule fires on a dialog that lets focus walk out of it. MANTA recorded the walk; QA judges it against
  WCAG 2.4.3, Focus Order, with the checklist."
- "The plain-language notes beside each issue were written by MANTA's AI skills, **pre-run** on this snapshot."

**If it goes wrong.** The Workbench will not start: open `demo-data\nightly\reports\index.html` from disk.
It is read-only (no verdicts or rescans), but every finding and the Focus order picture are there.

---

## Scene 7 · Release (2 min)

**Setup.** The Workbench from scene 6 is still open.

**Type.** Nothing: press **Export** on the Nightly run.

**See.** The export dialog: the ACR draft (a Word document) and the USPS defects export.

**Say.**
- "The conformance paperwork comes from the same run QA just worked in. An ACR, the accessibility conformance
  report a buyer asks for, drafted from the evidence; nothing retyped."
- "The verdicts and attestations QA made a minute ago are in it."

**If it goes wrong.** The export dialog fails: open the committed ACR draft in `demo-data\nightly\reports\`.

---

## The non-technical cut (about 15 minutes)

For a room without developers: scenes **1, 2, 4, 6, 7**. Drop scene 3 (the terminal fix) and scene 5 (the
nightly log). In scene 4, the golden PR's suggestions are the AI moment; in scene 6, the Focus order picture
stands for the nightly. After scene 2, go straight to `npm run demo -- scene 4` (no `git checkout .` needed,
since no patch was applied); after scene 4, go straight to `npm run demo -- scene 6`. The nightly still starts in
scene 4; nobody watches it.

---

## Resetting between demos

```
npm run demo -- reset
```

It refuses when the working tree has changes; `npm run demo -- reset --force` discards them. A reset moves
`main` and `feature/upload-documents` back to their story tags and force-pushes both, closes every open pull
request from `feature/upload-documents`, restores `demo-data/` (undoing every verdict, added issue, rescan and
attestation made in the Workbench), removes the local `reports/`, `run-records/` and `ci-run/` folders, checks
out `main` and prints scene 1's cue. The golden PR and its branch are never touched.

On GitHub a reset costs one closed pull request, two force pushes and one Baseline run on `main` (which
commits nothing, since the baseline has not changed). Pull request numbers climb by one per rehearsal; the
golden PR's number never changes.

---

## Refreshing a snapshot

A snapshot is a committed copy of one MANTA run (`reports/`, `run-records/`, `sites/`) under `demo-data/`.
Refresh one after MANTA or the site changes, then commit it to `main` and move the story tags (see the last
section).

- **From a workflow run's artifact:** `npm run demo -- snapshot nightly <run id> --artifact manta-nightly`
  (or `snapshot pr <run id>` for a gate run's `manta-run`).
- **From this folder's last local run:** `npm run demo -- snapshot pr` copies the root `reports/`,
  `run-records/` and `sites/`.
- **To look at a CI run without committing it:** `npm run demo -- ci-run [<run id>]` downloads it into
  `ci-run/` and prints the Workbench command.

The command prints the run tokens it copied. See `demo-data/README.md` for how each snapshot is made.

---

## Setup Tyler does once

Most of this was done on 2026-10-11 when the repository was built. What is left is the part only the account owner can do — three secrets, a deploy key and a ruleset — and `demo/setup-wizard.sh` walks through it stage by stage (run it from this checkout with `gh` signed in as `tyler-maddox-gdit`: `bash demo/setup-wizard.sh`). The list, so the wizard can be checked against it:

**Done already** — the repository (public, under `tyler-maddox-gdit`) with `main`, `feature/upload-documents` and `golden/upload-documents` pushed; the baseline `main` tolerates and its badge, committed; the story tags `story/main` and `story/feature`; the `pr` snapshot (the feature branch's gated run, its cluster and fix artifacts and the patch, made on the Mac with the `claude-code` provider) and the `nightly` snapshot (a nightly run of the golden branch made on the Mac the same way CI makes it — `--extended --paths` through the Sign in path — with the full AI pass added); the golden PR, opened and labelled `golden`, with MANTA's post written onto it once from the `pr` snapshot.

**Still to do (the wizard's stages)**

1. **`MANTA_READ_TOKEN`** (repo secret): a fine-grained personal access token, resource owner
   `tyler-maddox-gdit`, repository access **only** `MANTA`, permission **Contents: read-only**. It lets `npm ci`
   install MANTA from its private repository. MANTA_READ_TOKEN expires: ____-__-__ (the wizard writes the date here).
   Until it exists every workflow run fails at `npm ci`.
2. **`MANTA_SECRET_DEMO_PW`** (repo secret): `benefits-demo`, the demo site's sign-in password. The nightly's
   Sign in path types it; without it the path is held and the nightly warns.
3. **`MANTA_DEMO_DEPLOY_KEY`** (repo secret) and the deploy key with write access: the wizard generates the pair,
   shows the public half to paste under Settings → Deploy keys, stores the private half in the secret and deletes
   the local files.
4. **The ruleset on `main`**: a branch ruleset targeting the default branch, requiring the status check **gate**
   (offered in the picker only once the gate workflow has run on a pull request — open a throwaway PR or wait for
   the first rehearsal), blocking force pushes for everyone but the bypass list: **Deploy keys** (so the Baseline
   workflow can commit the baseline) and **Repository admin** (so `npm run demo -- reset` can force-push `main`).
5. **Actions and code scanning**: Actions allowed; code scanning needs no setup on a public repository.
6. **The pivot (optional): `ANTHROPIC_API_KEY`** (repo secret). With it set, the gate also proposes fixes for
   the new violations (`--skills cluster,fix --scope new`) and the nightly runs the full AI pass; the live PR
   then gets its own suggestions. Say "the fix skill ran in this job and posted these itself". Remove the
   secret to go back to the pre-run story. Nothing else changes.

**Refreshing what was done** — the commands, should a snapshot or the golden PR ever need remaking:

- The baseline: on `main`, `npm run build`, `npm run preview`, `npx manta baseline --base http://localhost:4173`, `node .github/scripts/badge.mjs`, commit `.manta/`.
- The pr snapshot: on `feature/upload-documents`, build and preview, `npx manta gate --base http://localhost:4173`, then the pass on the Mac from the repo root: `node $MANTA/node_modules/tsx/dist/cli.mjs $MANTA/ai/cli.ts --skills cluster,fix --scope new --provider claude-code` (`$MANTA` is your MANTA checkout; the gate itself takes `--skills … --scope new --provider` in one go once a provider is on the PATH of a CI runner). Then `npm run demo -- snapshot pr` and commit `demo-data/pr` to `main`.
- The nightly snapshot: on `golden/upload-documents` (the dialog exists there; `main` lists the page but has no dialog), build and preview, `MANTA_SECRET_DEMO_PW=benefits-demo npx manta scan --base http://localhost:4173 --extended --paths 5d1e7a42 --name Nightly`, then the full pass (`--skills cluster,fix,explain,summary,adjudicate,acr --provider claude-code`), then `npm run demo -- snapshot nightly` and commit to `main`. A CI-made one works the same: `gh workflow run nightly.yml --ref golden/upload-documents`, then `npm run demo -- snapshot nightly <run id> --artifact manta-nightly` and the pass over it.
- The story tags: rebase the feature onto the new `main`, point the golden branch at the same commit, force-push both, `git tag -f story/main main`, `git tag -f story/feature feature/upload-documents`, `git push -f origin story/main story/feature`.
- The golden PR's post: `GITHUB_REPOSITORY=tyler-maddox-gdit/MANTA-demo GITHUB_TOKEN=$(gh auth token) npx manta post --pr <n> --run <token>` from the repo root with the pr snapshot's `reports/` copied to `reports/`. Never close the PR, never push to its branch, never press Commit suggestion.

The repo is public: the workflows, the golden PR and the committed snapshots are visible to anyone.
