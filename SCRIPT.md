# The script

What to say, what to type, what will appear, and what every finding is. Not word for word: each beat has the
point to make, and the specifics are here so nothing has to be improvised. The mechanics (setup commands,
fallbacks, resets) are in [DEMO.md](DEMO.md); this page is the story on top of them. Order: Dev → DevOps → QA,
about 25 minutes.

---

## The cast

**The site.** The Benefits Portal, a React site for no real agency: Home, Apply, Check a case (`/status`),
Sign in, and an Account page behind the sign-in. It carries **27 known accessibility problems** on `main`,
committed as the baseline (`.manta/baseline.json`; the README badge says `a11y debt: 27 tolerated`). That is
the legacy debt: MANTA tolerates it and blocks anything new.

**The change.** The branch `feature/upload-documents` adds a Documents column to the case table and an
**Upload documents** dialog, opened by `/status?upload=BP-2026-10882`. The dialog ships with three defects.

### The three new defects (the whole demo follows these)

| # | What a user hits | Rule, impact | Where | The fix MANTA writes |
|---|---|---|---|---|
| 1 | The dialog's close button is an icon only. A screen reader says "button" and nothing else. | `button-name`, critical, P1 (WCAG 4.1.2) | `src/pages/Status.jsx:18`, `#upload-close` | `aria-label="Close upload dialog"` on the button, and the same on the old refresh button (two edits); the SVGs stay `aria-hidden` |
| 2 | The file field has no label. "Edit, file upload" with no name: upload what? | `label`, critical, P1 (WCAG 1.3.1, 4.1.2) | `src/pages/Status.jsx:21`, `#upload-file` | A visible `<label for="upload-file">Choose files to upload</label>` in the project's `.field` wrapper, plus `aria-describedby="upload-hint"` so the limits are read with the field |
| 3 | The hint "Max 10 MB per file. Up to 5 files." is light grey on white, 2.81:1. It reuses the site's shared `.muted` style, the same grey as the footer's "Last updated" line. | `color-contrast`, serious, P2 (WCAG 1.4.3) | `src/pages/Status.jsx:22`, `#upload-hint`; the colour is the shared `--muted-bad` token on `src/styles.css:1` | One edit: `--muted-bad` `#9a9a9a` → `#595959` (7.0:1). It clears the new hint and the five tolerated "Last updated" lines |

Impact and priority are axe's and MANTA's words for the same thing: critical = P1, serious = P2.

### The legacy debt, 27 items, by pattern

| Pattern | Count | Where it shows |
|---|---|---|
| Footer social links are icons with no name (`link-name`, serious) | 15 | 3 links × 5 pages, `src/Shell.jsx:30-32` |
| Footer "Last updated" line, grey 2.81:1, the same `.muted` style the new hint reuses (`color-contrast`, serious) | 5 | 1 × 5 pages, `src/Shell.jsx:36` |
| Refresh button on Check a case is an icon with no name (`button-name`, critical) | 2 | `/status` and `/status?upload=…`, `src/pages/Status.jsx:41` |
| "Pending" badge, amber on white (`color-contrast`, serious) | 2 | `/status` and `/status?upload=…`, `.badge-pending` |
| Hero image with no alt (`image-alt`, critical) | 1 | Home, `src/pages/Home.jsx:27` |
| SSN field: visible text not associated with the field (`label`, critical) | 1 | Apply, `#ssn` |
| Household size select with no name (`select-name`, critical) | 1 | Apply, `#household-size` |

Two of these are the twist in Act 1. The "Last updated" line shares one colour with the new hint, so the one
colour edit that fixes the new defect also clears five tolerated findings. The refresh button is the same
icon-button pattern as the close button, so MANTA fixes it in the same pass (its own edit, its own label).
**Fixed 7** on the second gate is those two together: 5 + 2.

### The fourth defect, which no rule finds

The open dialog does not hold keyboard focus. MANTA's focus-order picture of `/status?upload=BP-2026-10882`
numbers 21 stops: 1 to 14 are the page behind the dialog (skip link, navigation, the refresh button, the case
table), the dialog's own controls are only stops 15 to 18, and 19 to 21 are the footer. A keyboard user who
opens the dialog tabs through the page underneath before reaching it, and straight out the other side. No axe
rule fires on that. WCAG 2.4.3 Focus Order; a Trusted Tester test. Act 3 ends on it.

### The needs-review items (the nightly's extended rules; verdicts, not violations)

The nightly run has MANTA's extended rules on. They press keys and look at states, and they hand back
questions, each with a pre-run AI adjudication the tester can take or overrule:

- **`skip-link-works`**, every page: "Skip to main content" targets `#main-content`, and no element has
  that id (the landmark is `id="main"`), so Enter on the skip link moves focus nowhere. AI adjudication on the
  header link on each of the five pages: **likely violation**. The eleven case-table and news links the rule
  also listed: **likely pass** (they are content links, not a bypass mechanism). WCAG 2.4.1.
- **`non-text-contrast-border`**, the six Apply fields and the two Sign-in fields: the focus outline is amber
  on white, 1.66:1, and it is the only focus cue measured. AI adjudication: **likely violation**. The tester
  confirms it by tabbing into a field and looking, or overrules it. WCAG 1.4.11.

### The account page, reached only through the sign-in

The nightly signs in (path "Sign in": Email, Password, Sign in; demo@example.gov; the password is a repo
secret) and scans `/account`, which no pull request touches. It finds three: the avatar has no alt
(`image-alt`, critical), the Pending badge and "Last updated" line fail contrast, and the footer links. What
the scan does not find, and the tester adds in Act 3: two message links both named **Read** (WCAG 2.4.4, link
purpose only from context).

### The numbers at each gate

| Gate | Pages scanned | New | Fixed | Tolerated | Result |
|---|---|---|---|---|---|
| Act 1, laptop, first gate | 5 | **3** (P1 2, P2 1) | 0 | 27 | `Gate failed: 3 new violations at or above minor.  exit 1` |
| Act 1, laptop, after the fix | 5 | 0 | **7** (5 "Last updated" lines, 2 refresh buttons) | 20 | `Gate passed`, `exit 0` |
| Act 2, pull request, first run | 1 (the upload page only; the workflow narrows the config to the page the change touches) | **3** | 0 | 6 | red, `MANTA gate · failed: 3 new violations at or above minor` |
| Act 2, after the one-click apply | 1 | 0 | 1 | 5 | green, `MANTA gate · passed: no new violations` |
| Act 3, Workbench launcher scan | the pages you paste | not a gate: 30 violations over the 5 pages (7 critical, 23 serious) | | | a report |
| Act 3, the Nightly run | 5 pages + `/account` by the sign-in path, extended rules on | 33 violations, the needs-review items, the focus-order pictures | | | |

The pull request tolerates 6 because it scans one page: that page's refresh button, Pending badge, "Last
updated" line and three social links. The golden PR (the fallback) says Tolerated 27: it ran before the
workflow narrowed the scan to the changed page.

---

## Opening, on the slide (2 min)

The slide with everything lit. Point along the pipeline once: plan, develop, integrate, test, release, and
MANTA's three features at each.

- "A developer builds an upload dialog for the Benefits Portal. It ships with three defects: a file field with no
  label, a close button with no name, hint text too faint to read. We are going to follow that one dialog
  through three seats: the developer's laptop, the pull request, and the tester's Workbench. The same three
  defects every time; what changes is what MANTA puts in front of each person."
- "Everything you see runs without an AI key. Where you see AI output, I will say **pre-run**: MANTA's AI ran
  on this exact run earlier, and I am showing you what it wrote."

Press **Next stage**: Development lights.

---

## Act 1 · Development: the developer's seat (6 min)

Setup, before the audience: `npm run demo -- stage dev`, then `npm run dev` in a second terminal.

**Beat 1 · The gate.** Type `npx manta gate --base http://localhost:5173`.

Expect the step stream (five pages), then **New 3**, **Fixed 0**, **Tolerated 27**, the three new findings on
`/status?upload=BP-2026-10882`, each with its source file and line, and `Gate failed … exit 1`.

- "This is the developer's own machine, the site as it runs on their laptop. MANTA scans it and compares it
  with the baseline: the 27 problems the site already had, committed to the repository. Legacy debt tolerated,
  new debt blocked. The number can go down; it cannot go up."
- Read the three aloud as a user would meet them (the table above): a button that says "button", a file field
  with no name, a hint you cannot read. "Each one names the file and the line that wrote it."
- "This developer is not an accessibility specialist. `button-name`? `label`? What do they do?"

**Beat 2 · The AI skills.** Type `npm run demo -- fix`.

Expect the fix skill's answer, top to bottom: the header with the run and the model; **Reading the run**,
**Reading the project**, **Conventions found**; **Step 1 · cluster** (30 findings, 3 shared causes, 6 one-offs;
the text-too-faint and icon-buttons causes have a green dot, the footer links say "Left alone"); **Step 2 · fix**
with three fixes, each titled by what a user hits and tagged "From cluster…" or "Standalone…", with the problem
and the fix in plain words and the diff in red and green; then `3 fixes · 3 files` and the question
`Apply these 3 fixes? [y/N]`. Stop there. The output does not say pre-run; you do.

- "Pre-run. MANTA's fix skill ran on this run earlier; this is its answer."
- **Reading the project**: "Before it wrote anything it read the project: React, Vite, where the stylesheet
  is, how this team names buttons, marks icons, lays out form rows, flags its known debt. The fix is in this
  project's conventions, not a generic one."
- **Step 1 · cluster**: "First skill: it groups findings by cause, not by page. Thirty findings, three causes.
  The footer links are old debt, so they are left alone. The two green ones each hold one finding of ours and
  some old debt that shares its cause: our hint with the five 'Last updated' lines, our close button with the
  old refresh buttons."
- **Step 2 · fix**: "Second skill: it writes the change for each new finding. Cluster handed it the shared
  causes; the file field has no partner, so it took it alone."
- **1 · Hint text too faint to read**: "This is the one to land. The new hint reuses the site's muted grey, the
  same one as the footer's last-updated line on every page. So one edit, the shared colour in the stylesheet,
  2.8 to 1 up to 7 to 1, fixes our new problem and five that were already there. One edit, six findings."
- **2 · Close button with no name**: "What a user hits, in plain words, then the change. The refresh button
  that was already there is the same pattern, so the same pass fixes both, with a label each: two edits."
- **3 · File field with no label**: "A visible label, Choose files to upload, in the wrapper the other form
  rows use, and the size limits tied to the field so they are read with it."
- "It asks. The developer reads the diff and says yes." Type `y`: `Applied to src/styles.css, src/Shell.jsx and
  src/pages/Status.jsx. Nothing committed.`, then the diff summary.

**Beat 3 · Green.** Type the gate again.

Expect **New 0**, **Fixed 7**, **Tolerated 20**, `Gate passed`, `exit 0`.

- "Fixed 7. Our three new problems are gone, and so are seven old ones: the five last-updated lines that shared
  the grey, and the refresh button on two pages. The count only goes down."
- Land it: "Fixed before anyone else saw it, by a developer who never read WCAG."

If it goes wrong: DEMO.md, the Development stage. The dev server will not start: gate the preview build instead. `fix` refuses:
`stage dev` again.

Press **Next stage**: DevOps lights.

---

## Act 2 · DevOps: the reviewer's seat (8 min)

Setup, before the audience, or on stage if you want the push seen: `npm run demo -- stage devops`. It
discards the local fix, pushes the branch as it was, opens the live pull request and prints its link and the
golden PR's. Open the live PR.

**Beat 1 · The rewind.** The Conversation tab, the checks area with a yellow dot.

- "Now rewind. The gate on the laptop is a courtesy; not every developer runs it. Say this one pushed the
  dialog as it was and opened a pull request: how a change asks to join the main code."
- "MANTA's gate is a required check: while it is red, this cannot merge. No person has to say no."

**Beat 2 · The gate runs** (about 90 s). Checks → MANTA gate; expand the Gate step while it runs. It ends
`Gate failed: 3 new violations at or above minor`.

- "On GitHub's machines: install, build, scan the page this change touches, compare with the same baseline.
  New 3, Tolerated 6: this page's share of the old debt."

**Beat 3 · What MANTA posted.** Back on Conversation, refresh. In order:

- The red **MANTA gate**, marked Required. "Blocked."
- MANTA's comment, the table of the three. "The same three the developer saw, same files, same lines."
- The **Pre-run AI fixes** comment. "Pre-run: no key in this repository today. With a key, the job writes them
  itself, in the run you just watched."
- The **github-advanced-security** alerts on the changed lines, and the second check, Code scanning results.
  "Accessibility findings in GitHub's Security tab, in SARIF, beside every other scanner."
- MANTA's review, `3 suggested fixes from MANTA.`, each on its line: the shared colour on line 1 of the
  stylesheet, the close button's `aria-label="Close upload dialog"`, the file field's label. "The same fixes the
  developer got, now where the reviewer lives: on the diff." Only edits on lines the pull request changed can be
  suggestions; the rest (the old refresh button) are listed in MANTA's comment under Also fixable.

**Beat 4 · One click.** The green Tip under the review: tick **Apply all 3 suggested fixes**. About 30 s
later a commit appears in your name.

- "MANTA changed nothing. A person with write access accepted three fixes, one click, one commit."

**Beat 5 · Green** (about 90 s). The check turns green; the comment rewrites itself to `passed: no new
violations`; the alerts show as fixed.

- "And every night, on its own, the same scanner signs in with a password kept as a secret and scans the account
  page no pull request touches, with the rules that press keys and walk the focus. Last night's run is in the
  Actions tab." That run is what Act 3 opens.
- Land it: "Policy, not a person. New debt cannot merge; legacy debt can only shrink."

Never press **Merge**. If it goes wrong: switch to the golden PR tab, say "pre-run", and show its comment and
review without pressing anything (DEMO.md, the DevOps stage).

Press **Next stage**: QA and release lights.

---

## Act 3 · QA and release: the tester's seat (8 min)

Setup, before the audience: Ctrl+C the dev server from Act 1, then `npm run demo -- stage qa`. It rebuilds
the site at http://localhost:4173 and starts the Workbench on the nightly snapshot at http://127.0.0.1:3508/.

**Beat 1 · The handoff.**

- "The dialog reaches test. The site behind the Workbench is the build the nightly scanned last night, defects
  and all, so you can see how a tester meets them."

**Beat 2 · A scan from the browser.** The launcher: paste the pages (`http://localhost:4173/`, `/apply`,
`/status`, `/signin`, `/status?upload=BP-2026-10882`), pick the conformance level, Start.

Expect one row per page, the steps, then the report: 30 violations, 7 critical, 23 serious; the upload page
shows the three.

- "No command line. The same scan core the developer and the pipeline ran, from a browser."

**Beat 3 · The Nightly run.** Open it from the run list.

- The AI notes beside the findings, pre-run: the run summary ("fix the footer links first: one fix clears
  fifteen") and the plain-language explanation on each cluster. "Pre-run. This is what a finding reads like
  for the person who has to fix it, and for the person who has to explain it."
- The account page: "The nightly signed in and scanned a page no pull request touches." The avatar with no
  alt. Then **add an issue**: the two **Read** links in Messages, both named the same. "No rule finds that. The
  tester did, and it is on the run with everything else."
- A **verdict** on a needs-review item: the skip link on the upload page, adjudicated **likely violation**
  (the target id does not exist). Confirm it. Then one of the focus-outline items on Apply, also adjudicated
  **likely violation**: tab into the field, look at the outline, and decide. "The machine gave a leaning; the
  tester decides."
- **Rescan** the Pending badge's contrast finding on `/status`. It reloads the page from the preview and
  measures again: still failing. "A fix is re-measured on the spot, not re-filed."
- **Attest** a criterion, and open a criterion's **checklist**: "The Trusted Tester tests, as the checklist for
  that criterion, inside the tool."

**Beat 4 · The fourth defect.** The Pages dialog, the **Focus order** column, on
`/status?upload=BP-2026-10882`.

- "Three defects the machine found and the machine fixed. Here is the fourth." Count the stops: 1 to 14 behind
  the dialog, the dialog at 15 to 18, the footer after. "The dialog does not hold focus. No rule fires on
  that. MANTA recorded the walk; the Trusted Tester judges it, 2.4.3 Focus Order, with the checklist, and the
  verdict is on the run."

**Beat 5 · Export.** On the Nightly run: the ACR draft (Word) and the defects export.

- "The conformance report a buyer asks for, drafted from this run into the VPAT 2.5 template. Four criteria
  are marked Partially Supports with the remark written: 1.1.1, 1.4.3, 2.4.4, 4.1.2. Twenty-five carry
  evidence. The twenty-four the scan cannot reach are left for a person, and the draft says so in its own
  methods section: no manual evaluation was performed. The product name is a placeholder. The verdicts and
  the issue you just added are in it. Nothing retyped."
- Land it: "The scan is evidence; the tester is the judgment; the paperwork is drafted from both."

If it goes wrong: open `demo-data/nightly/reports/index.html` from disk (read-only); port taken:
`--port 3600` (DEMO.md, the QA stage).

Press **Show all**.

---

## Close, on the slide (1 min)

- "One dialog, three seats, one record. The developer fixed it before anyone saw it. The pull request would
  have stopped it if they had not. The tester found the one no rule can, and the report came out of the same
  run."

---

## Questions to expect

- **Is this just axe?** The scan core is axe plus MANTA's extended rules (the ones that press keys and walk
  the focus). Everything around it, the baseline, the gate, the source lines, the fixes, the verdicts, the ACR,
  is MANTA.
- **False positives?** Verdicts outrank the scan: a tester marks a finding on the run and the run records
  who decided and when. The baseline is a separate, committed list of what the gate tolerates, so the two
  never silently overwrite each other.
- **Does it replace manual testing?** No: Act 3 is the argument. The focus-order defect and the two Read links
  came from a person. MANTA records them beside the machine's findings so they reach the ACR.
- **What did the AI actually run on?** Pre-run, on these exact runs, with the provider named in the header
  (`claude-code`, the model in the output). With a key it runs in the gate job or on the laptop; the wording
  differs run to run.
- **Why did the PR tolerate 6 and the laptop 27?** The PR scans the one page the change touches; the laptop
  scanned all five.
- **How many rules, which WCAG?** The config says: WCAG 2.1 A and AA tags, fail on anything minor or worse;
  the Workbench can scan at 2.2 AA.
