// The one-time GitHub setup of tyler-maddox-gdit/MANTA-demo: the three secrets, the deploy key and the ruleset.
// Pure Node, so it runs the same on Windows and macOS: it spawns gh and ssh-keygen, never a shell.
// Every stage looks first and skips what is already there, so it is safe to run again (a new read token on
// expiry, a fresh deploy key). Run it signed in to gh as a repo admin: npm run demo -- setup-github
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const REPO = 'tyler-maddox-gdit/MANTA-demo';
const DEMO_PW = 'benefits-demo'; // the demo site's one password; the nightly's Sign in path types it
const DEPLOY_KEY_TITLE = 'baseline job';
const RULESET_NAME = 'main';
const GATE_CHECK = 'MANTA gate'; // the gate workflow's job name, which is the check's name
const GITHUB_ACTIONS_APP = 15368;
const REPOSITORY_ADMIN_ROLE = 5;
const STAGES = 6;
const DEMO_MD = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'DEMO.md');

let stageNo = 0;
const skipped = [];
const stage = (title) => console.log('\n▸ Stage ' + ++stageNo + '/' + STAGES + ' · ' + title);
const say = (text) => console.log('  ' + text);
const done = (text) => console.log('  ✓ ' + text);

function die(message) {
  console.error('[ERROR] ' + message);
  process.exit(1);
}

/** Runs a command with no shell, its output captured; `input` is written to its stdin. */
function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { shell: false, encoding: 'utf8', input, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'] });
  if (r.error?.code === 'ENOENT') die(cmd + ' is not installed, or not on PATH.');
  return { ok: r.status === 0, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() };
}

function must(cmd, args, input) {
  const r = run(cmd, args, input);
  if (!r.ok) die(cmd + ' ' + args[0] + ' ' + (args[1] ?? '') + ' failed: ' + (r.stderr || r.stdout));
  return r.stdout;
}

const api = (path, ...args) => JSON.parse(must('gh', ['api', 'repos/' + REPO + path, ...args]) || 'null');
const apiInput = (method, path, body) => must('gh', ['api', '-X', method, 'repos/' + REPO + path, '--input', '-'], JSON.stringify(body));
const secretNames = () => new Set(JSON.parse(must('gh', ['secret', 'list', '-R', REPO, '--json', 'name'])).map((s) => s.name));
const setSecret = (name, value) => must('gh', ['secret', 'set', name, '-R', REPO], value);

/** Asks a question; with no terminal to answer it (piped, CI) the answer is no. */
async function ask(question) {
  if (!process.stdin.isTTY) {
    say(question + ' — no terminal to answer, so no.');
    return '';
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question('  ' + question + ' ')).trim();
  } finally {
    rl.close();
  }
}
const confirm = async (question) => /^y/i.test(await ask(question + ' [y/N]'));

function openUrl(url) {
  say('↗ ' + url);
  const [cmd, args] = process.platform === 'win32' ? ['explorer.exe', [url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawnSync(cmd, args, { stdio: 'ignore', shell: false });
}

/** gh prompts for the value itself, input hidden, so it never passes through this script. */
function promptSecret(name) {
  const r = spawnSync('gh', ['secret', 'set', name, '-R', REPO], { stdio: 'inherit', shell: false });
  return r.status === 0;
}

// ── Stages ──────────────────────────────────────────────────────────────────
console.log('MANTA-demo · one-time GitHub setup of ' + REPO);
const login = must('gh', ['api', 'user', '--jq', '.login']);
const repo = api('');
if (!repo.permissions?.admin) die('gh is signed in as ' + login + ', who is not an admin of ' + REPO + '. Sign in as tyler-maddox-gdit: gh auth switch -u tyler-maddox-gdit');
say('Signed in to gh as ' + login + ' (admin).');

stage('Actions');
const actions = api('/actions/permissions');
if (actions.enabled) done('Actions is enabled.');
else {
  apiInput('PUT', '/actions/permissions', { enabled: true, allowed_actions: 'all' });
  done('Actions enabled.');
}
say('If pushes and pull requests never start a run (only a manual run does), turn Actions off and on again: SETUP.md, Troubleshooting.');

stage('MANTA_READ_TOKEN: lets npm ci install MANTA from its private repository');
const secrets = secretNames();
if (secrets.has('MANTA_READ_TOKEN') && !(await confirm('MANTA_READ_TOKEN is set. Replace it (a renewed token)?'))) done('MANTA_READ_TOKEN is set.');
else if (await confirm('Create the token in the browser now?')) {
  openUrl('https://github.com/settings/personal-access-tokens/new');
  say('• Token name: MANTA-demo read. Resource owner: tyler-maddox-gdit.');
  say('• Expiration: 1 year, the most it allows. Note the date.');
  say('• Repository access: Only select repositories → MANTA.');
  say('• Permissions → Repository permissions → Contents: Read-only. Nothing else.');
  say('• Generate token and copy it (it is shown once). Paste it at gh\'s prompt below.');
  if (!promptSecret('MANTA_READ_TOKEN')) skipped.push('MANTA_READ_TOKEN: gh secret set MANTA_READ_TOKEN -R ' + REPO);
  else {
    done('MANTA_READ_TOKEN set.');
    const expires = await ask('Its expiry date (YYYY-MM-DD):');
    if (/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
      const demo = readFileSync(DEMO_MD, 'utf8')
        .replace(/It expires on: \*\*[^*]+\*\*/, 'It expires on: **' + expires + '**')
        .replace(/MANTA_READ_TOKEN expires: \S+/, 'MANTA_READ_TOKEN expires: ' + expires);
      writeFileSync(DEMO_MD, demo);
      done('Wrote ' + expires + ' into DEMO.md. Commit it on main.');
    } else say('No date written: put it into DEMO.md by hand (search for "expires").');
  }
} else skipped.push('MANTA_READ_TOKEN: run this again, or create the token by hand (SETUP.md, Part A)');

stage('MANTA_SECRET_DEMO_PW: the password the nightly\'s Sign in path types');
if (secrets.has('MANTA_SECRET_DEMO_PW')) done('MANTA_SECRET_DEMO_PW is set.');
else {
  setSecret('MANTA_SECRET_DEMO_PW', DEMO_PW);
  done('MANTA_SECRET_DEMO_PW set to the demo password.');
}

stage('The deploy key the Baseline job pushes to main with');
const keys = api('/keys').filter((k) => k.title === DEPLOY_KEY_TITLE);
if (keys.length && secrets.has('MANTA_DEMO_DEPLOY_KEY')) done('Deploy key "' + DEPLOY_KEY_TITLE + '" and MANTA_DEMO_DEPLOY_KEY are both there.');
else {
  for (const k of keys) must('gh', ['api', '-X', 'DELETE', 'repos/' + REPO + '/keys/' + k.id]);
  const dir = mkdtempSync(join(tmpdir(), 'manta-demo-key-'));
  try {
    const file = join(dir, 'deploy');
    must('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', 'MANTA-demo baseline job', '-f', file]);
    apiInput('POST', '/keys', { title: DEPLOY_KEY_TITLE, key: readFileSync(file + '.pub', 'utf8').trim(), read_only: false });
    setSecret('MANTA_DEMO_DEPLOY_KEY', readFileSync(file, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  done('Deploy key added with write access; its private half is only in MANTA_DEMO_DEPLOY_KEY.');
}

stage('The ruleset on main: the gate is required, admins and the deploy key bypass it');
const ruleset = api('/rulesets').find((r) => r.name === RULESET_NAME);
if (ruleset) done('Ruleset "' + RULESET_NAME + '" exists: https://github.com/' + REPO + '/rules/' + ruleset.id);
else {
  apiInput('POST', '/rulesets', {
    name: RULESET_NAME,
    target: 'branch',
    enforcement: 'active',
    conditions: { ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] } },
    rules: [
      { type: 'non_fast_forward' },
      { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: false, required_status_checks: [{ context: GATE_CHECK, integration_id: GITHUB_ACTIONS_APP }] } },
    ],
    // Admins, so `npm run demo -- reset` can force-push main; the deploy key, so the Baseline job can commit.
    bypass_actors: [
      { actor_type: 'RepositoryRole', actor_id: REPOSITORY_ADMIN_ROLE, bypass_mode: 'always' },
      { actor_type: 'DeployKey', bypass_mode: 'always' },
    ],
  });
  done('Ruleset "' + RULESET_NAME + '" created: "' + GATE_CHECK + '" required, force pushes blocked but for admins and deploy keys.');
}

stage('Optional: ANTHROPIC_API_KEY turns the AI passes live');
if (secrets.has('ANTHROPIC_API_KEY')) done('ANTHROPIC_API_KEY is set: the gate and the nightly run their AI passes. Remove it to go back to pre-run.');
else if (await confirm('Set an Anthropic API key now?')) {
  openUrl('https://console.anthropic.com/settings/keys');
  if (promptSecret('ANTHROPIC_API_KEY')) done('ANTHROPIC_API_KEY set.');
} else say('Not set: the AI passes stay pre-run. Add it any time: gh secret set ANTHROPIC_API_KEY -R ' + REPO);

const golden = JSON.parse(must('gh', ['pr', 'list', '-R', REPO, '--head', 'golden/upload-documents', '--state', 'open', '--json', 'url']));
console.log('\nGolden PR: ' + (golden[0]?.url ?? 'none open — DEMO.md, Refreshing what was done, says how to remake it'));
if (skipped.length) {
  console.log('\nStill to do:');
  for (const s of skipped) console.log('  • ' + s);
}
console.log('\nNext: npm run demo -- status');
