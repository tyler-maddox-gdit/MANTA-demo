// Holds sites/http_localhost_4173.json to MANTA's own version-2 readers: the site store's,
// the path record's, and each step's rows against the schema MANTA replays.
// Run from a MANTA checkout that reads a version-2 store (it imports MANTA's source through tsx):
//   npx tsx <this repo>/demo/check-site-store.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORIGIN = 'http://localhost:4173';
const sitesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sites');
const manta = (file) => import(pathToFileURL(join(process.cwd(), file)).href);

const { readSite, siteFileFor } = await manta('ui/site-store.ts');
const { isPathRecord } = await manta('utils/path-log.ts');
const { STEP_SCRIPT_SCHEMA, schemaProblems, checkStepScript, secretsOf, envName } = await manta('utils/path-script.ts');

const problems = [];
const site = readSite(sitesDir, ORIGIN);
if (!site) problems.push(join(sitesDir, siteFileFor(ORIGIN)) + ' is missing or not a site store MANTA reads');
for (const path of site?.paths ?? []) {
  if (!isPathRecord(path)) problems.push('path ' + path.id + ' is not a path record');
  path.steps.forEach((step, i) => {
    const rows = { actions: step.actions, done: step.done };
    for (const p of schemaProblems(rows, STEP_SCRIPT_SCHEMA, STEP_SCRIPT_SCHEMA, '')) problems.push(path.name + ', step ' + (i + 1) + ': ' + p);
    for (const p of checkStepScript(rows)) problems.push(path.name + ', step ' + (i + 1) + ': ' + p);
  });
  const secrets = secretsOf(path.steps);
  console.log('path ' + path.id + ' "' + path.name + '"' + (site.signIn === path.id ? ' (the sign-in path)' : '') + ': ' +
    path.steps.length + ' step(s), secrets ' + (secrets.map(envName).join(', ') || 'none'));
}
if (problems.length) {
  for (const p of problems) console.error('[ERROR] ' + p);
  process.exit(1);
}
console.log('[DONE] ' + siteFileFor(ORIGIN) + ': ' + site.paths.length + ' path(s), no problems.');
