# The demo runbook

MANTA across the software lifecycle, shown on the Benefits Portal demo site in stages that stand on their own:
**QA** (the backlog in the Workbench), **Dev** (the developer's gate and MANTA's AI skills), **DevOps** (the pull
request gate) and **Release** (the Workbench again, the morning after the change merges). Each stage is set up by
one command, whatever ran before it, so show any of them, in any order. The story below runs them QA → Dev →
DevOps → Release, about 26 minutes, starting and ending on the tester, where most of this audience sits; the
slide, [presentation/index.html](presentation/index.html), lights each one. What to say at each beat, and what every
finding is, is in [SCRIPT.md](SCRIPT.md).

Every stage runs without an AI key. Where the audience sees AI output that was produced earlier, say
**"pre-run"** out loud; never describe pre-run output as live.

The words in `code` are typed. `npm run demo -- stage <name>` sets a stage up and prints the same lines as
this page. To set up the PC you present from, follow [SETUP.md](SETUP.md) first: it ends with a dry run of
every stage.

---

## Day-of checklist

Do these before the audience arrives, in this order.

- [ ] The PC was set up with [SETUP.md](SETUP.md), and its dry run went through every stage.
- [ ] The night before: `npm run demo -- reset` ran once. (After a DevOps rehearsal, `status` is rightly
      **Not ready** until `reset` runs: a live PR is open and origin's feature branch is a commit ahead.)
- [ ] `npm run demo -- status` ends with **Ready.**: both story branches at their tags, no open live PR, a clean
      working tree, all three snapshots listing a run token, `gh` signed in, Node 20 or later.
- [ ] `gh auth status` shows you signed in as a collaborator on `tyler-maddox-gdit/MANTA-demo`.
- [ ] The repo secret `MANTA_SECRET_DEMO_PW` is set (Settings → Secrets and variables → Actions).
- [ ] The repo secret `MANTA_READ_TOKEN` has not expired. It expires on: **2099-01-01** (see "Setup Tyler does once").
- [ ] Chromium is installed: `npm run install-browser-gdit`.
- [ ] `npm run dev` opens the site at http://localhost:5173. Stop it again (Ctrl+C).
- [ ] The golden PR is open (its link is in `npm run demo -- status`).
- [ ] A browser is signed in to GitHub, with two tabs ready: the repo's pull requests, and the golden PR.
- [ ] The slide is open in a browser tab: `presentation/index.html`. **Next stage** or `→` moves it on.
- [ ] The terminal font is large and the theme is light.

---

## The slide

`presentation/index.html` is one page: the lifecycle as a pipeline (Plan, Develop, Integrate, Test, Release),
MANTA's part at every stage, and the three demo stages as groups over it. **Next stage** cycles all → QA and
release → Development → DevOps; any stage is clickable; `→`, `←`, `0`, `1`, `2`, `3` work; and `#qa`, `#devops`, `#dev`
on the URL open a stage directly, which is what each `stage` command prints. Show it with everything lit for the
opening, then light the stage you are about to demo. For the Release stage, press **Release** (or `1`): QA and
release lights again.

---

## The story

One backlog, one change, three seats, and back to the first. Three threads run through it: the five tolerated
"Last updated" lines that share one grey, the refresh button that shares the close button's pattern, and the
tester's judgment.

**Opening, on the slide, everything lit (2 min).** "The Benefits Portal has 27 known accessibility problems.
Today a developer adds an upload dialog to it, and we watch that one change from three seats: the tester's, the
developer's, and the pull request's. Then we go back to the tester the morning after. Where you see AI output I
will say **pre-run**: no AI runs on this laptop today." Light QA and release.

**QA, the tester's seat (8 min).** The Workbench on `main`, before the change: a scan from the browser, the
Nightly's backlog (33 open issues: 27 on the five pages, 6 on `/account`), the AI notes, the "Last updated" grey on five pages and the refresh button ("remember these two"),
an added issue, a verdict, a rescan, a checklist. Hands off with: 33 on the list, and nobody owns one.

**Development, the developer's seat (6 min).** Red gate (Tolerated 27: the tester's backlog), the AI skills,
whose cluster step pulls the grey and the refresh button in with the new defects, green gate: **Fixed 7**,
Tolerated 20. Lands on: fixed before anyone else saw it, by a developer who never read WCAG.

**DevOps, the reviewer's seat (6 min).** The rewind, said plainly: the gate on the laptop is a courtesy, and
say this developer pushed the dialog as it was. The same three on the pull request, the fixes where the
reviewer lives, one click, green. Lands on: policy, not a person. Hands off with: say it merges; that night
the nightly runs again.

**Release, back in the tester's seat (3 min).** The next Nightly: 33 became 25, and nobody filed a ticket.
Then the fourth defect, the one no rule fires on: focus walks out of the dialog. The tester's verdict, and the
ACR drafted from the run. Lands on: the scan is evidence, the tester is the judgment, the paperwork is drafted
from both.

**Close, on the slide, everything lit (1 min).** "One backlog, one change. The tester saw the debt, the
developer cleared seven of it on the way past, the pull request would have stopped the new three, and the
tester found the one no rule can."

The stages make the story true: `stage qa` builds `main`, so the launcher finds the backlog and no dialog;
`stage devops` discards any local fix and pushes the branch as tagged; `stage release` builds the branch with
the fixes applied, the site as it merges, which is the build the release snapshot scanned.

---

## Stage · QA: the backlog in the Workbench (about 8 min)

**Setup.**
```
npm run demo -- stage qa
```
It checks out `main` at its story tag (detached: the site before the upload change), builds it, then runs the
preview on http://localhost:4173 and MANTA's Workbench on the **nightly snapshot** (a nightly run of that build,
made as CI makes it, with its AI notes **pre-run** afterwards) together, until Ctrl+C. The Workbench runs from the MANTA
`npm ci` installed; no MANTA checkout is needed.

**Type.** Nothing more. Open http://127.0.0.1:3508/.

**See, in order.**
1. **The launcher.** Paste `http://localhost:4173/`, name the run (the Name field is required), pick the
   conformance level, press **Start**. One row, the
   current step, then the report: 5 violations on Home. "A scan launched from the browser: no command line, and
   the same scan core the command line and the pipeline run."
2. **The Nightly run** (the run list, then its report): **33** open issues across 6 pages: 27 on the five the gate
   also scans, 6 on `/account`, reached through the Sign in path. The **Start here** card lists the causes: the
   footer links (15), then `p.muted#last-updated` (5). The plain-language notes beside each issue, the summary and the adjudications, all
   **pre-run** by MANTA's AI skills on this snapshot. Point at the "Last updated" contrast finding on all five
   pages (one grey, one cause) and the refresh button on Check a case: "remember these two".
3. **What only a tester does.** Add an issue on the account page (the two **Read** links); give a verdict on the
   skip link (adjudicated likely violation); **Rescan** the Pending badge's contrast issue on `/status` (still
   failing; it reloads the page from the preview); open a criterion's checklist.

**Say.**
- "This is the backlog: 27 known problems on the five public pages, 6 more behind the sign-in, scanned every night, tolerated by the gate, nobody's
  ticket."
- "The scan is evidence; the human is the judgment. QA adds what no rule can see, decides what the scan could
  only flag, and re-measures a fix on the spot."
- "Everything QA does is recorded on the run itself: who decided what, and when. The record is the run."
- Hand off: "33 on the list, and nobody owns one. Watch what happens when a developer touches the page next to
  them."

Ctrl+C stops both servers before the next stage.

**If it goes wrong.** The Workbench will not start: open `demo-data\nightly\reports\index.html` from disk. It
is read-only (no verdicts or rescans), but every finding and the AI notes are there. Port 3508 in
use: `npm run demo -- stage qa --port 3600`. The export dialog fails: open the committed ACR draft in
`demo-data\nightly\reports\`.

---

## Stage · Development: the developer's gate (about 6 min)

**Setup.**
```
npm run demo -- stage dev
```
It puts the feature branch, `feature/upload-documents`, in the working tree, clean, with no local runs. A
**branch** is a line of work kept apart from the main code until it is ready.

**1 · The gate.** Type:
```
npm run dev        (in a second terminal; leave it running)
npx manta gate --base http://localhost:5173
```
**See.** MANTA's step stream as it scans each page (about 15 seconds), then the terminal summary: **New 3** (P1 2 · P2 1),
**Fixed 0**, **Tolerated** with the same number as the README's badge, the three new violations listed on
`/status?upload=BP-2026-10882`, each with a framed picture of the element from the scan's own screenshot, outlined in
red, with its rule, impact and source file and line (Windows Terminal 1.22 or later; `--no-images` leaves them out), and the last line `Gate failed: 3 new violations at or above minor.  exit 1`.
- "Accessibility is part of the definition of done: before anyone wrote a line of this dialog, a WCAG checklist
  was its acceptance criteria, and this is the check the developer runs against it."
- "The developer runs MANTA on their own machine, against the site as it runs on their laptop. This is the
  **gate**: a scan compared against the saved list of the problems we already know about, the baseline. It
  passes or fails the change, the way a unit test does. Legacy debt tolerated, new debt blocked. Tolerated 27:
  the tester's backlog you just saw."
- "The upload dialog added three new problems: a file field with no label, a close button with no name, and hint
  text too faint to read. The developer learns that now, before the pull request does."
- "Now: this developer is not an accessibility specialist. `button-name`, `label`, `color-contrast`: what do
  they do about it?"

**2 · The AI skills.** Type:
```
npm run demo -- fix
```
**See.** The fix skill's answer, as the developer reads it. A header, `MANTA fix · run … · claude-opus-5 via
claude-code`. A framed box, **Reading**: **The run** (3 new violations on the upload page, 27
tolerated by the baseline), **The project** (React 18, react-router 6, Vite 5, plain CSS in `src/styles.css`,
source stamps on) and **Conventions found** (the button class naming, the `aria-hidden` icons, the stable ids,
the `DEBT` comments). Then the two skills, one after the other. **Step 1 · cluster** (group findings that
share one cause): "30 findings in this run come down to 3 shared causes and 6 one-offs", then the three
causes. **Text too faint to read** (6 elements) and **Icon buttons with no name** (3 elements) have a green
dot, each marked "Contains a new finding (#upload-hint) and 5 existing ones" and "(#upload-close) and 2 existing
ones". **Icon links with no name** has a hollow dot: "Existing debt in the baseline… Left alone." **Step 2 ·
fix** (write the change for each new finding): three fixes, each titled by what a user hits, with the rule,
impact and elements on the right and a grey line saying where it came from. **1 · Hint text too faint to read**
("From cluster Text too faint to read: fixes the new finding and its 5 existing partners in one edit": the
shared colour `--muted-bad`, 2.81:1 darkened to #595959, 7.0:1, one edit on line 1 of the stylesheet),
**2 · Close button with no name** ("…its 2 existing partners in 2 edits, one per element": an `aria-label` on
the close button and on the old refresh button), **3 · File field with no label** (a visible "Choose files to
upload" label, `aria-describedby` to the hint; "Standalone: no other finding shares its cause."). Under each:
the problem in plain words, the fix in plain words, and the diff, red and green, with the file and line. Then
`3 fixes · 2 files` and the question `Apply these 3 fixes? [y/N]`. Read the fixes aloud first; then type `y`:
`Applied to src/styles.css and src/pages/Status.jsx. Nothing committed.` and the diff summary. The output
never says so itself, so you do: this answer is **pre-run**.
- "This is MANTA's fix skill, **pre-run** on this run: no AI runs on this laptop today. With a key or the Claude
  command line here, the same command runs it live, in a minute or two."
- "It read the run, then the project: the stack, the stylesheet, how this team writes buttons and form rows
  and marks its known debt. Then two skills. **Cluster** groups findings by cause: thirty findings, three
  causes. Two of those causes hold something new, so the footer links are left alone. **Fix** then writes the
  change for each new finding, in plain words and as the diff, on the exact line that wrote the element."
- "Land the first fix: the new hint reuses the site's muted grey, the same grey as the footer's last-updated
  line on every page. Cluster saw that, so fix changed the one shared colour: one edit, six findings, the new
  one and five that were already there. The close button and the old refresh button share a pattern, so the
  same pass labels both. The file field shares nothing, so fix took it alone."
- "It asks. Nothing is applied until the developer has read the diff and said yes; nothing is committed."

**3 · Green.** Type:
```
npx manta gate --base http://localhost:5173
```
**See.** `New 0`, **Fixed 7** (the five "Last updated" lines that shared the grey, and the refresh button on two
pages, labelled in the same pass), **Tolerated 20**, and `Gate passed`, `exit 0`.
- "Fixed before anyone else saw it, by a developer who never read WCAG. The count only goes down; the pull
  request will come in green."

**If it goes wrong.** The dev server will not start: in the second terminal run `npm run build` then
`npm run preview`, and gate the preview build instead: `npx manta gate --base http://localhost:4173`. `fix`
says the patch does not apply: `npm run demo -- stage dev` starts the stage over. The second gate still fails:
read what it names; `git diff` shows what was applied.

**Live.** On a machine with the `claude` command line, `npm run demo -- fix --live` runs the cluster and fix
skills over the gate's run through MANTA's `claude-code` provider and applies the patch they write (a minute or
two). Say "the skills ran here". Their wording differs from run to run.

---

## Stage · DevOps: the pull request gate (about 6 min)

The one live GitHub Action of the demo: the gate runs on a pull request, MANTA posts what it found and the
fixes, the fixes are applied from the pull request's Conversation tab, and the gate goes green.

**Setup.**
```
npm run demo -- stage devops
```
It puts the feature branch back at its tag, closes any live PR from an earlier rehearsal, pushes the branch,
opens the live PR and prints its link and the golden PR's (the fallback). The browser is signed in to GitHub,
with the golden PR open in a background tab.

**1 · The pull request.** Open the live PR's link (**Conversation** tab). The checks area shows a yellow dot:
running.
- "Now rewind. The gate on the laptop is a courtesy; not every developer runs it. Say this one pushed the dialog
  as it was." (`stage devops` did exactly that: it discarded the fix and pushed the branch as tagged.)
- "A developer built an upload dialog and opened a **pull request**: how a change asks to join the main code.
  The team reviews it, and automated checks run on it."
- "A **pull request check** is one of those results, a green tick or a red cross beside the change. MANTA's gate
  is a required one: while it is red, this change cannot merge."

**2 · Watch the gate run** (about a minute and a half). **Checks** tab → **MANTA gate**; expand the **Gate** step
as it goes. It ends `Gate failed: 3 new violations at or above minor`.
- "On GitHub's machines: install, build the site, scan the page this change touches, compare against the
  **baseline**, the accessibility debt the main code already has, committed to the repository. The badge on the
  README counts it. Legacy debt tolerated, new debt blocked: a ratchet, the number can go down, never up."

**3 · What MANTA posted.** Back to **Conversation** (refresh if it has not updated). Point at each, in order:
- The red **MANTA gate** check, marked **Required**: "Blocked: it cannot merge."
- MANTA's comment, `MANTA gate · failed: 3 new violations at or above minor`: "New 3, Tolerated 6. The old debt
  is tolerated, the new debt is not, and each one names the source file and line that wrote it."
- The comment headed **Pre-run AI fixes**: "These fixes are **pre-run**: MANTA's AI wrote them ahead of time, on a
  snapshot of this same branch, because this repository has no AI key today. With a key, this job writes them
  itself, in the run you just watched."
- The alerts from **github-advanced-security** on the changed lines, and the second red check, **Code scanning
  results / MANTA**: "The same findings also go to GitHub's code scanning, in SARIF, the format code scanners
  share. Accessibility lands in the Security tab beside every other scanner, tracked the same way."
- Skip GitHub's long "Code Scanning has recently been set up" comment if it is there: it comes once, on the first
  pull request.

**4 · Apply the fixes, in one click.** MANTA's review, `3 suggested fixes from MANTA.`, shows each suggestion on its
lines in the Conversation tab: the shared colour on line 1 of `styles.css`, the close button's name and the file
field's label in `Status.jsx`. Read one aloud (the close button's `aria-label="Close upload dialog"`). The old
refresh button's label is not a suggestion, because GitHub can only suggest on lines the pull request changed;
MANTA lists it in its comment under **Also fixable**.
- "Each suggestion is an edit to the exact source line that wrote the element. The contrast fix goes to the
  stylesheet, where the shared colour is set, so it clears this hint and the old last-updated lines too."

Right under the review, a comment with a green **Tip**: "One click applies all 3 of MANTA's suggested fixes", and
under it the box **☐ Apply all 3 suggested fixes**. Tick it. Within about half a minute a commit appears, "Apply
MANTA's suggested fixes (…)", made in your name, and the tip turns into a **Note**: "Applied all 3 of MANTA's
suggested fixes in …". (The demo's **Apply fixes** workflow does it: it writes the three suggestions into one
commit, so the gate runs once. Committing them one by one with **Commit suggestion** works too, but each commit
starts the gate again.)
- "MANTA changed nothing. A person with write access accepted three fixes, with one click, in one commit."

**5 · Green** (about a minute and a half). The gate runs again on the new commit. The check turns green, MANTA's
comment rewrites itself to `MANTA gate · passed: no new violations`, and the code scanning alerts show as fixed.
- "Policy, not a person. New debt cannot merge; legacy debt can only shrink. And this time it was fixed before
  it ever landed."
- Hand off: "Say it merges. That night the nightly the tester showed you runs again, on main: the same
  scanner, signed in with a password kept as a secret, with the rules that press keys and walk the focus. And
  the tester opens it in the morning." (Open it if there is time: Actions → **Nightly**, the **Scan** step, the
  Sign in path ending on `/account`, the `manta-nightly` artifact the Workbench opens.)

Never press **Merge**, and never tick **Merge without waiting for requirements to be met (bypass rules)**, which
appears because you are an admin. The next `stage devops` or `reset` closes this pull request; never `git pull`
the feature branch after the apply (the next stage puts it back).

**If it goes wrong.** The gate takes over about three minutes, or the suggestions never appear: switch to the
golden PR tab. "This is the same change, with MANTA's fixes posted ahead of time: **pre-run**." Show its comment
and review, and press nothing there. The re-run comes back red: "it measures every push; here is what it found",
read the comment, and move on. No green nightly to show: skip it, or start one the day before:
`gh workflow run nightly.yml -R tyler-maddox-gdit/MANTA-demo --ref main`.

**With an AI key.** When the repo secret `ANTHROPIC_API_KEY` is set ("Setup Tyler does once", item 6), there is no
Pre-run comment: the gate job runs MANTA's fix skill itself (a minute or two longer) and posts its own suggestions.
Say "the fix skill ran in this job and posted these itself". Their wording differs from run to run.

---

## Stage · Release: the next morning, back in the Workbench (about 3 min)

**Setup.** Ctrl+C the dev server from the Development stage first (port 4173 and 3508 must be free; the dev
server's 5173 is not in the way, but the stage discards its applied patch). It can run during the DevOps
stage's gate wait: it only touches this PC.
```
npm run demo -- stage release
```
It puts the feature branch in the working tree, applies the developer's fixes (the same patch `fix` applies),
builds it, then runs the preview on http://localhost:4173 and the Workbench on the **release snapshot** (a
nightly run of that build: the site as it merges, AI notes **pre-run**), until Ctrl+C.

**Type.** Nothing more. Open http://127.0.0.1:3508/.

**See, in order.**
1. **The Nightly run**: **25** open issues (was 33). The "Last updated" lines, the account page's too, and the
   refresh button are gone.
2. **Focus order.** The Pages dialog's **Focus order** column on `/status?upload=BP-2026-10882`: the numbered
   stops walk past the page behind the open dialog, into the dialog at 15 to 18, and straight out into the footer.
   Record a verdict on 2.4.3 with the checklist, and attest.
3. **Export** on the Nightly run: the ACR draft (a Word document) and the USPS defects export.

**Say.**
- "Yesterday 33, this morning 25. Eight: the seven the developer's gate counted, and the same grey on the
  account page the gate never scans. Nobody filed a ticket."
- "Three defects the machine found and the machine fixed. Every gate is green. Here is the fourth. No rule
  fires on a dialog that lets focus walk out of it, so no gate stopped it and no AI fixed it. MANTA recorded the
  walk; QA judges it against WCAG 2.4.3, Focus Order, with the checklist."
- "The conformance paperwork comes from the same run QA just worked in: an ACR, the accessibility conformance
  report a buyer asks for, drafted from the evidence; nothing retyped. The verdict QA made a minute ago is in it."

**If it goes wrong.** The Workbench will not start: open `demo-data\release\reports\index.html` from disk. It
is read-only, but every finding and the Focus order picture are there. Port 3508 in use:
`npm run demo -- stage release --port 3600`. The export dialog fails: open the committed ACR draft in
`demo-data\release\reports\`.

---

## Resetting between demos

```
npm run demo -- reset
```

It refuses when the working tree has changes; `npm run demo -- reset --force` discards them. A reset moves
`main` and `feature/upload-documents` back to their story tags, closes every open pull request from
`feature/upload-documents`, force-pushes both branches, restores `demo-data/` (undoing every verdict, added
issue, rescan and attestation made in the Workbench), removes the local `reports/`, `run-records/` and `ci-run/`
folders and checks out `main`. The golden PR and its branch are never touched.

A stage command does the local part of this on its own (the working tree, the snapshots, the local runs, the
feature branch), so between stages nothing else is needed. `reset` is for `main`, origin and the night before.

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

The command prints the run tokens it copied. See `demo-data/README.md` for how each snapshot is made. The
`pr` snapshot is also what `npm run demo -- fix` prints and applies: its `cluster-*.json`, `fix-proposals-*.json`
and `fix-*.patch` must come from a run of `feature/upload-documents` at its tag, or the patch will not apply. The
shared-colour fix is on line 1 of `src/styles.css`, a line the feature commit changes (it adds the `--scrim`
token): GitHub only takes a suggestion on a line the pull request changed, so a fix on an untouched line would be
listed under **Also fixable** instead of applied by the one click. Check that after a refresh.

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
   secret to go back to the pre-run story. Nothing else changes. On the laptop, the pivot is
   `npm run demo -- fix --live` with the `claude` command line installed.

**Refreshing what was done** — the commands, should a snapshot or the golden PR ever need remaking:

- The baseline: on `main`, `npm run build`, `npm run preview`, `npx manta baseline --base http://localhost:4173`, `node .github/scripts/badge.mjs`, commit `.manta/`.
- The pr snapshot: on `feature/upload-documents`, build and preview, `npx manta gate --base http://localhost:4173`, then `npm run demo -- fix --live` (or, from a MANTA checkout, `node $MANTA/node_modules/tsx/dist/cli.mjs $MANTA/ai/cli.ts --skills cluster,fix --scope new --provider claude-code`), `git checkout -- src` to undo the applied patch, then `npm run demo -- snapshot pr` and commit `demo-data/pr` to `main`.
- The nightly snapshot: on `main` (the backlog; no upload dialog), build and preview, `MANTA_SECRET_DEMO_PW=benefits-demo npx manta scan --base http://localhost:4173 --extended --paths 5d1e7a42 --name Nightly`, then the full pass (`node node_modules/tsx/dist/cli.mjs node_modules/@usps/508-toolkit/ai/cli.ts --skills cluster,fix,explain,summary,adjudicate,acr --provider claude-code`), then `npm run demo -- snapshot nightly` and commit to `main`. A CI-made one works the same: `gh workflow run nightly.yml --ref main`, then `npm run demo -- snapshot nightly <run id> --artifact manta-nightly` and the pass over it.
- The release snapshot: the same, on `feature/upload-documents` with the pr snapshot's patch applied first (`git apply demo-data/pr/reports/fix-<token>.patch`; so refresh `pr` first), then `npm run demo -- snapshot release` and `git checkout -- src`.
- The story tags, after any commit to `main` (the stage commands run the `demo/demo.mjs` of the branch they check out, so the feature branch must carry `main`'s): `git rebase main feature/upload-documents`, `git tag -f story/main main`, `git tag -f story/feature feature/upload-documents`, `git push -f origin main feature/upload-documents story/main story/feature`. The golden branch stays where it is unless its PR is being remade.
- The golden PR's post: `GITHUB_REPOSITORY=tyler-maddox-gdit/MANTA-demo GITHUB_TOKEN=$(gh auth token) npx manta post --pr <n> --run <token>` from the repo root with the pr snapshot's `reports/` copied to `reports/`. Never close the PR, never push to its branch, never press Commit suggestion.

The repo is public: the workflows, the golden PR and the committed snapshots are visible to anyone.
