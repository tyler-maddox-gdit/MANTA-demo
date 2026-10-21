#!/usr/bin/env node
// The demo script: resets the story, sets up each stage of the demo and prints what to type next.
// Pure Node, so it runs the same on Windows and macOS: it spawns git and gh, never a shell.
// Usage: npm run demo -- <command>   (or: node demo/demo.mjs <command>). `help` lists the commands.
// The cue strings below are the ones DEMO.md prints; change them in both places.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

// ── Constants ───────────────────────────────────────────────────────────────
const REPO = 'tyler-maddox-gdit/MANTA-demo';
const MAIN = { branch: 'main', tag: 'story/main' };
const FEATURE = { branch: 'feature/upload-documents', tag: 'story/feature' };
const GOLDEN_BRANCH = 'golden/upload-documents';
const NIGHTLY_WORKFLOW = 'nightly.yml';
const GATE_WORKFLOW = 'gate.yml';
const SIGN_IN_PATH = '5d1e7a42'; // the "Sign in" path in sites/http_localhost_4173.json
const SITE_STORE = 'http_localhost_4173.json'; // the one committed file under sites/
const ARTIFACTS = { 'manta-run': GATE_WORKFLOW, 'manta-nightly': NIGHTLY_WORKFLOW };
const RUN_DIRS = ['reports', 'run-records', 'sites']; // what a --data-dir holds
const DEV_ORIGIN = 'http://localhost:5173';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// MANTA as npm ci installed it: the Workbench (MANTA's reviewer GUI) runs from here, so no MANTA checkout is needed.
const MANTA_PKG = join(ROOT, 'node_modules', '@usps', '508-toolkit');
const WORKBENCH_PORT = 3508;

// ── The cues (DEMO.md says the same) ───────────────────────────────────────
const GATE_LINE = 'npx manta gate --base ' + DEV_ORIGIN;
const SLIDE = 'presentation/index.html';
const PREVIEW_PORT = 4173;
const PREVIEW_ORIGIN = 'http://localhost:' + PREVIEW_PORT;
const workbenchLine = (name) => 'npm run demo -- workbench ' + name + '   (opens the Workbench on it; Ctrl+C stops it)';
const CUES = {
  qa: {
    title: 'Stage · QA and release: the Workbench',
    type: [],
    next: 'Open http://127.0.0.1:' + WORKBENCH_PORT + '/. Launcher: paste ' + PREVIEW_ORIGIN + '/ (and /apply, /status, /signin,\n  /status?upload=BP-2026-10882), press Start. Then the Nightly run: its AI notes (say "pre-run"), Focus order on\n  the upload page, a verdict, Rescan, attest, Export (ACR draft, defects). Ctrl+C stops both servers.',
  },
  devops: {
    title: 'Stage · DevOps: the pull request gate',
    type: [],
    next: 'Open the live PR. Checks → MANTA gate, watch it fail on 3 new (about 90 s). Conversation: the comment, the\n  Pre-run comment (say "pre-run"), the code scanning alerts, the review. In the green Tip under MANTA\'s review, tick\n  "Apply all 3 suggested fixes": one commit, the gate runs again and goes green. Never Merge. Fallback: the golden PR.',
  },
  dev: {
    title: 'Stage · Development: the developer\'s gate',
    type: ['npm run dev                 (in a second terminal; leave it running)', GATE_LINE + '      → New 3, Gate failed, exit 1', 'npm run demo -- fix         → the AI skills\' proposals (pre-run); answer y to apply the patch', GATE_LINE + '      → passed, exit 0'],
    next: 'With the claude CLI on this machine, npm run demo -- fix --live runs the skills here instead.',
  },
};
const STAGE_LIST = 'Stages: npm run demo -- stage dev | devops | qa   (any order; each sets itself up)';

function printCue(name) {
  const cue = CUES[name];
  console.log('\n' + cue.title + '   (slide: ' + SLIDE + '#' + name + ')');
  if (cue.type.length) {
    console.log('  Type:');
    for (const line of cue.type) console.log('    ' + line);
  }
  console.log('  ' + cue.next + '\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function die(message) {
  console.error('[ERROR] ' + message);
  process.exit(1);
}

/** Runs a command in the repo root with no shell: its output to the terminal, or captured when `capture`. */
function run(cmd, args, { capture = false } = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, shell: false, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
  if (r.error?.code === 'ENOENT') die(cmd + ' is not installed, or not on PATH.');
  return { ok: r.status === 0, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() };
}

/** Runs a command and stops the script when it fails. */
function must(cmd, args) {
  if (!run(cmd, args).ok) die(cmd + ' ' + args.join(' ') + ' failed.');
}

/** A command's output, or undefined when it failed. */
function out(cmd, args) {
  const r = run(cmd, args, { capture: true });
  return r.ok ? r.stdout : undefined;
}

const revParse = (ref) => out('git', ['rev-parse', '--verify', '--quiet', ref]);
const dirtyFiles = () => (out('git', ['status', '--porcelain']) ?? '').split('\n').filter(Boolean);
const ghJson = (args) => {
  const text = out('gh', [...args, '-R', REPO]);
  return text ? JSON.parse(text) : undefined;
};
const openPrs = (head) => ghJson(['pr', 'list', '--head', head, '--state', 'open', '--json', 'number,url']) ?? [];

/** The run tokens a reports directory holds: one per agent-analysis file. */
function tokensIn(reportsDir) {
  if (!existsSync(reportsDir)) return [];
  return readdirSync(reportsDir)
    .map((f) => /^agent-analysis-(.+)\.json$/.exec(f)?.[1])
    .filter(Boolean)
    .sort();
}

function latestRun(workflow) {
  const runs = ghJson(['run', 'list', '--workflow', workflow, '--limit', '1', '--json', 'databaseId,status,conclusion,createdAt']);
  return runs?.[0];
}

function artifactOf(flags, fallback) {
  const name = flags.artifact ?? fallback;
  if (!(name in ARTIFACTS)) die('--artifact is one of ' + Object.keys(ARTIFACTS).join(', ') + '.');
  return name;
}

// ── Commands ────────────────────────────────────────────────────────────────
function reset(flags) {
  const dirty = dirtyFiles();
  if (dirty.length && !flags.force) die('The working tree has changes (' + dirty.length + ' files). Commit or discard them, or run reset --force to discard them.');
  must('git', ['fetch', 'origin', '--prune', '--tags', '--force']);
  for (const { tag } of [MAIN, FEATURE]) if (!revParse('refs/tags/' + tag + '^{commit}')) die('Tag ' + tag + ' is missing. Set the story tags first (DEMO.md, Setup Tyler does once).');
  if (dirty.length) {
    must('git', ['reset', '--hard', '--quiet']);
    must('git', ['clean', '-fd', '--quiet']);
  }
  // Detach first, so neither story branch is the checked-out one while it is moved.
  must('git', ['checkout', '--quiet', '--detach', MAIN.tag]);
  for (const { branch, tag } of [MAIN, FEATURE]) must('git', ['branch', '--force', branch, tag]);
  // Closed before the push: a force-push to an open pull request's branch starts a gate run that posts on it later.
  for (const pr of openPrs(FEATURE.branch)) must('gh', ['pr', 'close', String(pr.number), '-R', REPO, '--comment', 'Closed by the demo reset.']);
  must('git', ['push', '--force', 'origin', MAIN.branch + ':' + MAIN.branch, FEATURE.branch + ':' + FEATURE.branch]);
  must('git', ['checkout', '--quiet', MAIN.branch]);
  // Undo what the Workbench wrote into the snapshots: attestations, added issues, verdicts, rescans.
  must('git', ['checkout', '--', 'demo-data']);
  must('git', ['clean', '-fdx', '--quiet', 'demo-data']);
  for (const dir of ['reports', 'run-records', 'ci-run']) rmSync(join(ROOT, dir), { recursive: true, force: true });
  const sites = join(ROOT, 'sites');
  if (existsSync(sites)) for (const f of readdirSync(sites)) if (f !== SITE_STORE) rmSync(join(sites, f), { recursive: true, force: true });
  console.log('[DONE] Reset: main at ' + MAIN.tag + ', ' + FEATURE.branch + ' at ' + FEATURE.tag + ', no live PR, snapshots restored.');
  console.log(STAGE_LIST);
}

/**
 * Every stage's starting state, whatever ran before: tracked files as committed (the dev stage's applied patch
 * and the Workbench's writes into the snapshots discarded), no local runs, the feature branch at its tag and
 * checked out. `main` is never touched; origin is never pushed to here.
 */
function prepare() {
  must('git', ['fetch', 'origin', '--prune', '--tags', '--force', '--quiet']);
  if (!revParse('refs/tags/' + FEATURE.tag + '^{commit}')) die('Tag ' + FEATURE.tag + ' is missing. Set the story tags first (DEMO.md, Setup Tyler does once).');
  const dirty = dirtyFiles();
  if (dirty.length) console.log('Discarding ' + dirty.length + ' local change(s): ' + dirty.map((l) => l.replace(/^\s*\S+\s+/, '')).join(', '));
  must('git', ['checkout', '--quiet', '--', '.']);
  must('git', ['clean', '-fdx', '--quiet', 'demo-data']);
  for (const dir of RUN_DIRS.filter((d) => d !== 'sites').concat('ci-run')) rmSync(join(ROOT, dir), { recursive: true, force: true });
  const sites = join(ROOT, 'sites');
  if (existsSync(sites)) for (const f of readdirSync(sites)) if (f !== SITE_STORE) rmSync(join(sites, f), { recursive: true, force: true });
  // Detach first: git refuses to move the checked-out branch.
  must('git', ['checkout', '--quiet', '--detach']);
  must('git', ['branch', '--force', FEATURE.branch, FEATURE.tag]);
  must('git', ['checkout', '--quiet', FEATURE.branch]);
  console.log('[DONE] On ' + FEATURE.branch + ' at ' + FEATURE.tag + ', clean.');
}

async function stage(name, flags) {
  if (!CUES[name]) die('stage takes qa, devops or dev.');
  prepare();
  if (name === 'devops') {
    // Closed before the push: a force-push to an open pull request's branch starts a gate run that posts on it later.
    for (const pr of openPrs(FEATURE.branch)) must('gh', ['pr', 'close', String(pr.number), '-R', REPO, '--comment', 'Closed by the demo: the next rehearsal opens a new pull request.']);
    must('git', ['push', '--force', '--quiet', 'origin', FEATURE.branch + ':' + FEATURE.branch]);
    const r = run('gh', ['pr', 'create', '-R', REPO, '--base', MAIN.branch, '--head', FEATURE.branch, '--title', 'Upload documents', '--body', 'A Documents column and an upload dialog on /status. Opened live by the demo (stage devops).'], { capture: true });
    if (!r.ok) die('gh pr create failed: ' + r.stderr);
    const golden = openPrs(GOLDEN_BRANCH)[0]?.url;
    console.log('\nLive PR:              ' + r.stdout.split('\n').pop());
    console.log('Golden PR (fallback): ' + (golden ?? 'none open: see DEMO.md, Setup Tyler does once'));
    return printCue('devops');
  }
  if (name === 'qa') return await stageQa(flags);
  printCue('dev');
}

/** Whether nothing listens on 127.0.0.1:<port>. */
const portFree = (port) => new Promise((resolve) => {
  const probe = createServer();
  probe.once('error', () => resolve(false));
  probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
});

/** The QA stage: the preview build on 4173 and the Workbench on the nightly snapshot, both in this process until Ctrl+C. */
async function stageQa(flags) {
  const port = flags.port ?? WORKBENCH_PORT;
  for (const [p, what] of [[PREVIEW_PORT, 'the preview'], [port, 'the Workbench']]) {
    if (!(await portFree(p))) die('Port ' + p + ' is in use, so ' + what + ' cannot start. Stop what holds it' + (p === port ? ', or: npm run demo -- stage qa --port ' + (port + 100) : '') + '.');
  }
  const vite = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(vite)) die('vite is not installed here: run npm ci first.');
  const dataDir = join(ROOT, 'demo-data', 'nightly');
  if (!existsSync(join(dataDir, 'reports'))) die('No reports/ in ' + dataDir + ': see DEMO.md, Refreshing a snapshot.');
  if (!existsSync(join(MANTA_PKG, 'ui', 'cli.ts'))) die('MANTA is not installed here: run npm ci first.');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  must(process.execPath, [vite, 'build']);
  printCue('qa');
  // Only node is spawned (npm and vite are .cmd shims on Windows, which spawn cannot run without a shell).
  const children = [
    spawn(process.execPath, [vite, 'preview', '--port', String(PREVIEW_PORT)], { cwd: ROOT, stdio: 'inherit' }),
    spawn(process.execPath, [tsx, join(MANTA_PKG, 'ui', 'cli.ts'), String(port), '--data-dir', dataDir], { cwd: ROOT, stdio: 'inherit' }),
  ];
  const stop = () => { for (const c of children) if (c.exitCode === null && !c.killed) c.kill(); };
  process.on('SIGINT', () => { stop(); process.exit(130); });
  process.on('exit', stop);
  for (const c of children) c.on('exit', (code) => { if (code) console.error('[ERROR] A server stopped (see above); the other was stopped too. Fix it and run the stage again.'); stop(); if (code) process.exitCode = code; });
}

const firstSentence = (text) => (text.match(/^.*?[.!?](\s|$)/) ?? [text])[0].trim();
const clip = (text, n = 110) => (text.length > n ? text.slice(0, n - 1) + '…' : text);
function wrap(text, indent, width = 100) {
  const lines = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > width - indent.length) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => indent + l).join('\n');
}
async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}

/**
 * The AI skills over the developer's run, in the terminal. Without --live nothing runs: the cluster and fix
 * skills' output from the pr snapshot (written ahead of time, said so on screen) is printed in MANTA's own lines:
 * the clusters, what the fix skill noticed about the project before writing, each edit; then it asks before
 * applying the patch, so the gate can run again. With --live the skills run here through the claude CLI.
 */
const TTY = process.stdout.isTTY === true;
const paint = (code, text) => (TTY ? '\x1b[' + code + 'm' + text + '\x1b[0m' : text);
const bold = (t) => paint('1', t);
const dim = (t) => paint('2', t);
const red = (t) => paint('31', t);
const green = (t) => paint('32', t);
const cyan = (t) => paint('36', t);
const pause = (ms) => (TTY ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
const cols = () => process.stdout.columns ?? 110;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const NOUN = { '#upload-close': 'close button', '#refresh': 'refresh button', '#upload-file': 'file field', '#upload-hint': 'hint text' };
const noun = (selector) => NOUN[selector] ?? selector;

/** The developer's explanation of one proposal: a title, the problem as a user meets it, and the fix, from the rule and the edit itself. */
function explain(rule, targets, p) {
  const replacement = (p.edits ?? []).map((e) => e.replacement).join('\n');
  const [first, ...rest] = targets;
  switch (rule) {
    case 'button-name': {
      const labels = [...replacement.matchAll(/aria-label="([^"]+)"/g)].map((m) => '"' + m[1] + '"');
      return {
        title: cap(noun(first)) + ' with no name',
        problem: 'The ' + noun(first) + ' is an icon with no text, so a screen reader announces it as "button" and nothing else. A person who cannot see the icon has no way to know what it does.' + (rest.length ? ' The ' + rest.map(noun).join(' and ') + ' on the same page ' + (rest.length === 1 ? 'has' : 'have') + ' the same problem, for the same reason.' : ''),
        fix: 'Give each icon button an accessible name with aria-label' + (labels.length ? ' (' + labels.join(', ') + ')' : '') + '. The SVG stays aria-hidden, so the label is the only thing announced.',
      };
    }
    case 'label': {
      const text = replacement.match(/<label[^>]*>([^<]+)<\/label>/)?.[1];
      return {
        title: cap(noun(first)) + ' with no label',
        problem: 'The ' + noun(first) + ' has no label. A screen reader announces it with no name, the hint under it is not connected to it, and clicking the words does nothing.',
        fix: 'Add a visible label' + (text ? ', "' + text + '",' : '') + ' tied to the field by its id, in the wrapper the other form rows use' + (/aria-describedby/.test(replacement) ? ', and point aria-describedby at the hint so the limits are read with the field.' : '.'),
      };
    }
    case 'color-contrast': {
      const ratios = [...(p.domSpec?.domInstruction ?? '').matchAll(/(\d+(?:\.\d+)?):1/g)].map((m) => m[1] + ':1');
      const hex = replacement.match(/#[0-9a-f]{3,6}\b/i)?.[0];
      return {
        title: cap(noun(first)) + ' too faint to read',
        problem: 'The ' + noun(first) + ' is ' + (ratios[0] ?? 'under 4.5:1') + ' against its background; the minimum for text this size is 4.5:1. Hard to read with low vision, and on a dim screen hard for anyone.',
        fix: 'Darken the colour' + (hex ? ' to ' + hex : '') + (ratios[1] ? ' (' + ratios[1] + ')' : '') + ' in the shared rule in the stylesheet, where it is set, so everything that uses it gets the fix.',
      };
    }
    default:
      return { title: cap(noun(first)) + ': ' + rule, problem: firstSentence(p.domSpec?.domInstruction ?? ''), fix: '' };
  }
}

/** What the project is, read from its own files: the frameworks and versions, the stylesheet, whether source stamping is on. */
function stackLine() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const major = (name) => (pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '').replace(/^[\^~]/, '').split('.')[0];
  const config = JSON.parse(readFileSync(join(ROOT, '.manta', 'config.json'), 'utf8'));
  const vite = existsSync(join(ROOT, 'vite.config.js')) ? readFileSync(join(ROOT, 'vite.config.js'), 'utf8') : '';
  return [
    major('react') && 'React ' + major('react'),
    major('react-router-dom') && 'react-router ' + major('react-router-dom'),
    major('vite') && 'Vite ' + major('vite'),
    (config.styles ?? []).length && 'plain CSS in ' + config.styles.join(', '),
    /mantaSource/.test(vite) && 'source stamps on',
  ].filter(Boolean).join(' · ');
}

/**
 * The fix skill's answer over the developer's run, as the developer reads it: what it read, the stack and
 * conventions it found, then each fix with the problem and the change in plain words and the diff itself,
 * and a question before anything is applied. Without --live nothing runs: the answer is the skill's own
 * output from the pr snapshot (DEMO.md says "pre-run" out loud). With --live the skill runs here through the
 * claude CLI.
 */
async function fix(flags) {
  if (out('git', ['rev-parse', '--abbrev-ref', 'HEAD']) !== FEATURE.branch) die('fix runs on ' + FEATURE.branch + ': npm run demo -- stage dev first.');
  if (flags.live) return fixLive();
  const dir = join(ROOT, 'demo-data', 'pr', 'reports');
  const token = tokensIn(dir).pop();
  if (!token) die('demo-data/pr holds no run: see DEMO.md, Refreshing a snapshot.');
  const proposals = JSON.parse(readFileSync(join(dir, 'fix-proposals-' + token + '.json'), 'utf8'));
  const gate = JSON.parse(readFileSync(join(dir, 'gate-' + token + '.json'), 'utf8'));
  const patch = 'demo-data/pr/reports/fix-' + token + '.patch';
  const prov = proposals.provenance ?? {};
  const impactOf = Object.fromEntries((gate.new ?? []).map((n) => [n.ruleId, n.impact]));
  const pages = [...new Set((gate.new ?? []).map((n) => n.page))];
  const list = proposals.proposals ?? [];
  const files = [...new Set(list.flatMap((p) => (p.edits ?? []).map((e) => e.file)))];
  const label = (name, text) => console.log(dim(name.padEnd(22)) + text);
  const width = cols();

  console.log('');
  console.log(bold('MANTA fix') + dim(' · run ' + token + ' · ' + (prov.model ?? 'model not recorded') + ' via ' + (prov.provider ?? 'an AI provider')));
  console.log('');
  await pause(500);
  label('Reading the run', (gate.new ?? []).length + ' new violation' + ((gate.new ?? []).length === 1 ? '' : 's') + ' on ' + pages.join(', ') + ' · ' + (gate.tolerated ?? []).length + ' tolerated by the baseline');
  await pause(700);
  label('Reading the project', stackLine());
  await pause(600);
  const conventions = [...new Set(list.flatMap((p) => p.conventionsDetected ?? []))].slice(0, 4);
  conventions.forEach((c, i) => label(i === 0 ? 'Conventions found' : '', clip(c, width - 22)));
  await pause(400);

  for (const [i, p] of list.entries()) {
    const part = (k) => [...new Set((p.members ?? []).map((m) => m.split('|::|')[k]))];
    const rules = part(1);
    const targets = part(2);
    const e = explain(rules[0], targets, p);
    const right = rules.join(', ') + ' · ' + rules.map((r) => impactOf[r] ?? 'new').join(', ') + ' · ' + targets.join(', ');
    const left = (i + 1) + ' · ' + e.title;
    console.log('');
    console.log(bold(left) + dim(' '.repeat(Math.max(2, width - left.length - right.length)) + right));
    console.log(wrap(e.problem, '    ', width));
    if (e.fix) console.log(wrap('Fix: ' + e.fix, '    ', width));
    for (const edit of p.edits ?? []) {
      console.log('');
      console.log('    ' + cyan(edit.file + ':' + edit.startLine));
      for (const l of edit.original.split('\n')) console.log('    ' + red('- ' + clip(l.trim(), width - 6)));
      for (const l of edit.replacement.split('\n')) console.log('    ' + green('+ ' + clip(l.trim(), width - 6)));
    }
    await pause(300);
  }
  console.log('');
  console.log(bold(list.length + ' fix' + (list.length === 1 ? '' : 'es')) + dim(' · ' + files.length + ' file' + (files.length === 1 ? '' : 's') + ' · ' + files.join(', ')));
  if (!run('git', ['apply', '--check', patch], { capture: true }).ok) die('The patch does not apply: already applied? npm run demo -- stage dev starts over.');
  if (!/^y(es)?$/i.test(await ask('\nApply ' + (list.length === 1 ? 'this fix' : 'these ' + list.length + ' fixes') + '? [y/N] '))) {
    console.log('Nothing applied. The patch is at ' + patch + '\n');
    return;
  }
  must('git', ['apply', patch]);
  console.log('Applied to ' + files.join(' and ') + '. Nothing committed.');
  must('git', ['diff', '--stat']);
  console.log('\nRun the gate again: ' + GATE_LINE + '\n');
}

function fixLive() {
  const reports = join(ROOT, 'reports');
  if (tokensIn(reports).length === 0) die('No run in reports/: run the gate first (' + GATE_LINE + ').');
  if (!run('claude', ['--version'], { capture: true }).ok) die('--live needs the claude CLI (MANTA\'s claude-code provider).');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  must(process.execPath, [tsx, join(MANTA_PKG, 'ai', 'cli.ts'), '--skills', 'cluster,fix', '--scope', 'new', '--provider', 'claude-code']);
  const patch = 'reports/fix-' + tokensIn(reports).pop() + '.patch';
  if (!existsSync(join(ROOT, patch))) die('The fix skill wrote no patch (' + patch + '): see its lines above.');
  must('git', ['apply', patch]);
  must('git', ['diff', '--stat']);
  console.log('\nRun the gate again: ' + GATE_LINE + '\n');
}

function snapshot(name, runId, flags) {
  if (!name || !/^[a-z0-9-]+$/.test(name)) die('snapshot takes a name: pr or nightly (lowercase letters, digits and hyphens).');
  const dest = join(ROOT, 'demo-data', name);
  let src = ROOT;
  let tmp;
  if (runId) {
    const artifact = artifactOf(flags, 'manta-run');
    tmp = mkdtempSync(join(tmpdir(), 'manta-snapshot-'));
    must('gh', ['run', 'download', runId, '-R', REPO, '-n', artifact, '-D', tmp]);
    src = tmp;
  }
  if (!existsSync(join(src, 'reports'))) die('No reports/ in ' + src + ': nothing to snapshot.');
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const dir of RUN_DIRS) if (existsSync(join(src, dir))) cpSync(join(src, dir), join(dest, dir), { recursive: true });
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  const tokens = tokensIn(join(dest, 'reports'));
  console.log('[DONE] demo-data/' + name + ' holds ' + tokens.length + ' run(s): ' + (tokens.join(', ') || 'none'));
  console.log('Commit it: git add demo-data/' + name + ' && git commit -m "Refresh the ' + name + ' snapshot"');
}

function ciRun(runId, flags) {
  const artifact = artifactOf(flags, 'manta-nightly');
  if (!runId) {
    const latest = latestRun(ARTIFACTS[artifact]);
    if (!latest) die('No ' + ARTIFACTS[artifact] + ' run found to download.');
    runId = String(latest.databaseId);
  }
  const dest = join(ROOT, 'ci-run');
  rmSync(dest, { recursive: true, force: true });
  must('gh', ['run', 'download', runId, '-R', REPO, '-n', artifact, '-D', dest]);
  const tokens = tokensIn(join(dest, 'reports'));
  console.log('[DONE] ci-run/ holds run ' + runId + "'s " + artifact + ': ' + (tokens.join(', ') || 'no run'));
  console.log('Open it in the Workbench: ' + workbenchLine('ci-run'));
}

/** The Workbench on one snapshot (demo-data/<name>) or on ci-run/, from the MANTA package npm ci installed. */
function workbench(name = 'nightly', flags) {
  const dataDir = name === 'ci-run' ? join(ROOT, 'ci-run') : join(ROOT, 'demo-data', name);
  if (!existsSync(join(dataDir, 'reports'))) die('No reports/ in ' + dataDir + ': name a snapshot (nightly or pr) or ci-run.');
  if (!existsSync(join(MANTA_PKG, 'ui', 'cli.ts'))) die('MANTA is not installed here: run npm ci first.');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  console.log('Workbench on ' + dataDir + '. Open the URL below, then the run\'s report. Ctrl+C stops it.');
  const r = spawnSync(process.execPath, [tsx, join(MANTA_PKG, 'ui', 'cli.ts'), String(flags.port ?? WORKBENCH_PORT), '--data-dir', dataDir], { cwd: ROOT, stdio: 'inherit', shell: false });
  process.exitCode = r.status ?? 0;
}

/** Whether the Chromium MANTA scans with is installed: MANTA's own Playwright launches it headless, as a scan does, and closes it. */
function chromiumInstalled() {
  try {
    const playwright = createRequire(join(MANTA_PKG, 'package.json')).resolve('playwright');
    const probe = 'require(' + JSON.stringify(playwright) + ').chromium.launch().then((b) => b.close()).then(() => process.exit(0), () => process.exit(1))';
    return spawnSync(process.execPath, ['-e', probe], { stdio: 'ignore', timeout: 60_000 }).status === 0;
  } catch {
    return false;
  }
}

function status() {
  let ok = true;
  const say = (good, text) => {
    if (!good) ok = false;
    console.log((good ? '  ok    ' : '  FIX   ') + text);
  };
  if (!run('git', ['fetch', 'origin', '--prune', '--tags', '--force', '--quiet'], { capture: true }).ok) say(false, 'git fetch origin failed: the checks below read what this clone last fetched');
  console.log('Story branches');
  for (const { branch, tag } of [MAIN, FEATURE]) {
    const t = revParse('refs/tags/' + tag + '^{commit}');
    const local = revParse('refs/heads/' + branch);
    const remote = revParse('refs/remotes/origin/' + branch);
    if (!t) say(false, tag + ' is missing (set once, after the first baseline run)');
    // A fresh clone has no local feature branch yet: the first stage's checkout makes it from origin's.
    else if (!local && remote === t) say(true, branch + ' on origin at ' + tag + ' (made locally by its first checkout)');
    else say(local === t && remote === t, branch + (local === t ? ' at ' : ' NOT at ') + tag + (remote === t ? ', origin too' : ', origin differs: run stage devops or reset'));
  }
  say(Boolean(revParse('refs/remotes/origin/' + GOLDEN_BRANCH)), GOLDEN_BRANCH + ' on origin');
  console.log('Pull requests');
  const live = openPrs(FEATURE.branch);
  say(live.length === 0, live.length ? live.length + ' open live PR(s) from ' + FEATURE.branch + ': run reset' : 'no open live PR from ' + FEATURE.branch);
  const golden = openPrs(GOLDEN_BRANCH);
  say(golden.length > 0, golden.length ? 'golden PR open: ' + golden[0].url : 'no golden PR open');
  console.log('Working tree');
  const dirty = dirtyFiles();
  say(dirty.length === 0, dirty.length ? dirty.length + ' changed files:\n' + dirty.map((f) => '          ' + f).join('\n') : 'clean');
  console.log('Snapshots');
  for (const name of ['pr', 'nightly']) {
    const tokens = tokensIn(join(ROOT, 'demo-data', name, 'reports'));
    say(tokens.length > 0, 'demo-data/' + name + ': ' + (tokens.join(', ') || 'empty'));
  }
  console.log('Tools');
  const major = Number(process.versions.node.split('.')[0]);
  say(major >= 20, 'node ' + process.version + (major >= 20 ? '' : ' (20 or later needed)'));
  const installed = existsSync(join(MANTA_PKG, 'package.json'));
  say(installed, installed ? 'MANTA ' + JSON.parse(readFileSync(join(MANTA_PKG, 'package.json'), 'utf8')).version + ' installed' : 'MANTA not installed: run npm ci');
  const chromium = installed && chromiumInstalled();
  say(chromium, 'Chromium for scanning' + (chromium ? '' : ': run npm run install-browser-gdit'));
  const login = out('gh', ['api', 'user', '--jq', '.login']);
  const admin = login && out('gh', ['api', 'repos/' + REPO, '--jq', '.permissions.admin']) === 'true';
  say(Boolean(admin), login ? 'gh signed in as ' + login + (admin ? ', a repo admin' : ', not a repo admin: reset cannot force-push main. gh auth switch -u tyler-maddox-gdit') : 'gh is not signed in: gh auth login');
  console.log(ok ? '\nReady.' : '\nNot ready: fix the lines marked FIX.');
  process.exitCode = ok ? 0 : 1;
}

function help() {
  console.log(`MANTA demo — npm run demo -- <command>

  reset [--force]          Back to the start: story branches to their tags (force-pushed), live PRs closed,
                           snapshots restored, local runs removed. --force discards local changes.
  stage <dev|devops|qa>    Set a stage up, whatever ran before, and print what to type next. dev leaves the
         [--port n]        feature branch checked out, clean; devops opens the live PR; qa runs the preview
                           build and the Workbench on the nightly snapshot until Ctrl+C.
  fix [--live]             The AI skills over the developer's run: pre-run from demo-data/pr, printed and
                           its patch applied. --live runs cluster and fix here through the claude CLI.
  snapshot <name> [run]    Copy a run into demo-data/<name>/: a workflow run's artifact when [run] is given
         [--artifact a]    (manta-run by default, or manta-nightly), else this folder's reports/, run-records/, sites/.
  ci-run [run]             Download a workflow run's artifact into ci-run/ (the latest nightly by default)
         [--artifact a]    and print the command that opens it in the Workbench.
  workbench [name]         The Workbench on demo-data/<name> (nightly by default, or pr), or on ci-run.
         [--port n]        Port 3508 unless given.
  status                   The day-of check: branches against tags, open PRs, changes, snapshots, tools, gh.
  setup-github             The one-time GitHub setup: secrets, deploy key, ruleset (needs a repo admin).
  help                     This list.

Repo ${REPO} · sign-in path ${SIGN_IN_PATH} · Workbench port ${WORKBENCH_PORT}`);
}

// ── Arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--force') flags.force = true;
  else if (argv[i] === '--live') flags.live = true;
  else if (argv[i] === '--artifact') flags.artifact = argv[++i];
  else if (argv[i] === '--port') flags.port = Number(argv[++i]);
  else if (argv[i].startsWith('--')) die('Unknown flag ' + argv[i] + '. Try: npm run demo -- help');
  else words.push(argv[i]);
}
const [command, a, b] = words;
switch (command) {
  case 'reset': reset(flags); break;
  case 'stage': await stage(a, flags); break;
  case 'fix': await fix(flags); break;
  case 'snapshot': snapshot(a, b, flags); break;
  case 'ci-run': ciRun(a, flags); break;
  case 'workbench': workbench(a, flags); break;
  case 'status': status(); break;
  case 'setup-github': await import('./setup-github.mjs'); break;
  case 'help': case undefined: help(); break;
  default: die('Unknown command ' + command + '. Try: npm run demo -- help');
}
