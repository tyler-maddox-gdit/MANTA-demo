# The demo runbook

MANTA across the software lifecycle, told in six scenes on the Benefits Portal demo site: about 25 minutes,
from a developer's terminal through a pull request and a nightly build to QA and release. Every scene runs
without an AI key. Where the audience sees AI output that was produced earlier, say **"pre-run"** out loud;
never describe pre-run output as live.

The words in `code` are typed. `npm run demo -- scene <n>` sets each scene up and prints the same lines as
this page. To set up the PC you present from, follow [SETUP.md](SETUP.md) first: it ends with a dry run of
every scene.

---

## Day-of checklist

Do these before the audience arrives, in this order.

- [ ] The PC was set up with [SETUP.md](SETUP.md), and its dry run went through every scene.
- [ ] The night before: `npm run demo -- reset` ran once and ended with scene 1's cue.
- [ ] `npm run demo -- status` ends with **Ready.**: both story branches at their tags, no open live PR, a clean
      working tree, both snapshots listing a run token, `gh` signed in, Node 20 or later.
- [ ] `gh auth status` shows you signed in as a collaborator on `tyler-maddox-gdit/MANTA-demo`.
- [ ] The repo secret `MANTA_SECRET_DEMO_PW` is set (Settings → Secrets and variables → Actions).
- [ ] The repo secret `MANTA_READ_TOKEN` has not expired. It expires on: **2099-01-01** (see "Setup Tyler does once").
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

**If it goes wrong.** No slide: open the Workbench on the nightly snapshot (scene 5's lines) and show any
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

## Scene 3 · The pull request (8 min)

The one live GitHub Action of the demo: the gate runs on a pull request, MANTA posts what it found and the fixes,
the fixes are applied from the pull request's Conversation tab, and the gate goes green.

**Setup.** Scene 2 is done: the terminal is on the feature branch with a clean tree. The browser is signed in to
GitHub, with the golden PR open in a background tab as the fallback (`npm run demo -- status` prints its link).

**1 · Push and open the pull request.** Type:
```
npm run demo -- scene 3
```
It pushes the feature branch, opens the live PR and prints its link and the golden PR's.
- "The developer is happy enough to share the change: they push it and open a pull request."

**2 · The pull request.** Open the live PR's link (**Conversation** tab). The checks area shows a yellow dot: running.
- "A **pull request** is how a change asks to join the main code: the team reviews it, and automated checks run
  on it."
- "A **pull request check** is one of those results, a green tick or a red cross beside the change. MANTA's gate
  is a required one: while it is red, this change cannot merge."

**3 · Watch the gate run** (about a minute and a half). **Checks** tab → **MANTA gate**; expand the **Gate** step
as it goes. It ends `Gate failed: 3 new violations at or above minor`.
- "The same command the developer ran on the laptop, now on GitHub's machines: install, build the site, scan
  every page, compare against the baseline."
- "The same three problems the developer saw. Now the team sees them too."

**4 · What MANTA posted.** Back to **Conversation** (refresh if it has not updated). Point at each, in order:
- The red **MANTA gate** check, marked **Required**: "Blocked: it cannot merge."
- MANTA's comment, `MANTA gate · failed: 3 new violations at or above minor`: "New 3, Tolerated 27. The old debt
  is tolerated, the new debt is not, and each one names the source file and line that wrote it."
- The comment headed **Pre-run AI fixes**: "These fixes are **pre-run**: MANTA's AI wrote them ahead of time, on a
  snapshot of this same branch, because this repository has no AI key today. With a key, this job writes them
  itself, in the run you just watched."
- The alerts from **github-advanced-security** on the changed lines, and the second red check, **Code scanning
  results / MANTA**: "The same findings also go to GitHub's code scanning, in SARIF, the format code scanners
  share. Accessibility lands in the Security tab beside every other scanner, tracked the same way."
- Skip GitHub's long "Code Scanning has recently been set up" comment if it is there: it comes once, on the first
  pull request.

**5 · Apply the fixes, in one click.** MANTA's review, `3 suggested fixes from MANTA.`, shows each suggestion on its
lines in the Conversation tab: the close button's name and the file field's label in `Status.jsx`, the hint colour
in `styles.css`. Read one aloud (the close button's `aria-label="Close"`).
- "Each suggestion is an edit to the exact source line that wrote the element. The contrast fix goes to the
  stylesheet, where the colour is set, not to the page."

Right under the review, a comment with a green **Tip**: "One click applies all 3 of MANTA's suggested fixes", and
under it the box **☐ Apply all 3 suggested fixes**. Tick it. Within about half a minute a commit appears, "Apply
MANTA's suggested fixes (…)", made in your name, and the tip turns into a **Note**: "Applied all 3 of MANTA's
suggested fixes in …". (The demo's **Apply fixes** workflow does it: it writes the three
suggestions into one commit, so the gate runs once. Committing them one by one with **Commit suggestion** works
too, but each commit starts the gate again.)
- "MANTA changed nothing. A person with write access accepted three fixes, with one click, in one commit."

**6 · Green** (about a minute and a half). A new commit, "Apply suggestions from code review", appears and the gate
runs again. The check turns green, MANTA's comment rewrites itself to `MANTA gate · passed: no new violations`, and
the code scanning alerts show as fixed.
- "Legacy debt tolerated, new debt blocked, and this time fixed before it ever landed."

Never press **Merge**, and never tick **Merge without waiting for requirements to be met (bypass rules)**, which
appears because you are an admin: the reset closes this pull request and undoes the commit.

**If it goes wrong.** The gate takes over about three minutes, or the suggestions never appear: switch to the
golden PR tab. "This is the same change, with MANTA's fixes posted ahead of time: **pre-run**." Show its comment
and review, and press nothing there. The re-run comes back red: "it measures every push; here is what it found",
read the comment, and move on.

**With an AI key.** When the repo secret `ANTHROPIC_API_KEY` is set ("Setup Tyler does once", item 6), there is no
Pre-run comment: the gate job runs MANTA's fix skill itself (a minute or two longer) and posts its own suggestions.
Say "the fix skill ran in this job and posted these itself". Their wording differs from run to run.

---

## Scene 4 · Nightly through login (2 min)

**Setup.** Nothing runs live here: the Nightly workflow runs on its own every morning (06:17 UTC), and this scene
opens the latest green one. `npm run demo -- scene 4` prints its run number.

**Type.**
```
gh run view <run> -R tyler-maddox-gdit/MANTA-demo --web
```

**See.** The run's page in the browser. Open the **Scan** step's log: the Sign in path replayed (Email, Password,
Sign in), the line `Scanned along "Sign in": ends on http://localhost:4173/account`, MANTA's extended rules (the
ones that press keys) step by step, then the summary. The run's summary lists the artifact `manta-nightly`.

**Say.**
- "A **workflow run** is one execution of an automated job on GitHub's machines. This one runs every night on its
  own; this is last night's."
- "Every night MANTA scans what no pull request touches: the account page behind the login, reached by a saved
  path that signs in with a password kept as a secret, never written in the repository."
- "It also runs MANTA's extended rules, the ones that press keys and walk the focus through the page."
- "Everything the run found is kept as an **artifact**: a bundle of files the run leaves behind. QA downloads it
  and opens it in the Workbench, which is the next scene."

**If it goes wrong.** No green nightly: open the Actions tab and show the most recent Nightly run, whatever its
state. Start one the day before if the schedule has not run yet: `gh workflow run nightly.yml -R
tyler-maddox-gdit/MANTA-demo --ref main`.

---

## Scene 5 · QA in the Workbench (5 min)

**Setup.** The Workbench opens the **nightly snapshot**: a real nightly run, downloaded and committed to this
repo, with its AI notes **pre-run** afterwards. Rescan reloads pages from the site, so the preview build runs
beside it.

**Type.**
```
npm run build
npm run preview    (a second terminal; leave it running)
npm run demo -- workbench nightly
```
The Workbench runs from the MANTA that `npm ci` installed; no MANTA checkout is needed. Open the URL it prints
(http://127.0.0.1:3508/), then the Nightly run's report.

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

## Scene 6 · Release (2 min)

**Setup.** The Workbench from scene 5 is still open.

**Type.** Nothing: press **Export** on the Nightly run.

**See.** The export dialog: the ACR draft (a Word document) and the USPS defects export.

**Say.**
- "The conformance paperwork comes from the same run QA just worked in. An ACR, the accessibility conformance
  report a buyer asks for, drafted from the evidence; nothing retyped."
- "The verdicts and attestations QA made a minute ago are in it."

**If it goes wrong.** The export dialog fails: open the committed ACR draft in `demo-data\nightly\reports\`.

---

## The non-technical cut (about 15 minutes)

For a room without developers: scenes **1, 2, 3, 5, 6**. Drop scene 4 (the nightly log). In scene 3, the
suggestions and the gate turning green are the AI moment; in scene 5, the Focus order picture stands for the
nightly. After scene 3, go straight to `npm run demo -- scene 5`.

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

The repository, its branches, tags, snapshots and golden PR were built on 2026-10-11/13. The account-level
setup is `npm run demo -- setup-github`, run from any checkout with `gh` signed in as `tyler-maddox-gdit` (a repo
admin). It is pure Node, so it runs on Windows or a Mac. Each stage looks first and skips what is already there,
so it is safe to run again: when the read token expires, or to make a fresh deploy key.

1. **Actions** enabled. If pushes and pull requests never start a run but a manual run does, turn Actions off
   and on again (SETUP.md, Troubleshooting). That happened once, on 2026-10-13: the repo was created empty.
2. **`MANTA_READ_TOKEN`** (repo secret): a fine-grained personal access token, resource owner
   `tyler-maddox-gdit`, repository access **only** `MANTA`, permission **Contents: read-only**. It lets `npm ci`
   install MANTA from its private repository. GitHub lets no script create one: the stage opens the page, lists
   the settings, and `gh` takes the token at a hidden prompt. MANTA_READ_TOKEN expires: 2099-01-01 (the stage
   writes the date here). Until it exists every workflow run fails at `npm ci`.
3. **`MANTA_SECRET_DEMO_PW`** (repo secret): `benefits-demo`, the demo site's sign-in password. The nightly's
   Sign in path types it; without it the path is held and the nightly warns. Set 2026-10-13.
4. **`MANTA_DEMO_DEPLOY_KEY`** (repo secret) and the deploy key **baseline job** with write access: generated by
   `ssh-keygen`, the public half added as a deploy key, the private half only in the secret. Set 2026-10-13.
5. **The ruleset `main`** on the default branch: the check **MANTA gate** (the gate workflow's job) required,
   force pushes blocked, bypassed by **Repository admin** (so `npm run demo -- reset` can force-push `main`;
   present signed in as `tyler-maddox-gdit`) and **Deploy keys** (so the Baseline workflow can commit the
   baseline). Created 2026-10-13.
6. **Optional, the pivot: `ANTHROPIC_API_KEY`** (repo secret). With it set, the gate also proposes fixes for
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
