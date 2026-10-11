// Holds sites/http_localhost_4173.json to MANTA's own readers: the site store's,
// the path record's, and each step's Smart Script against the schema MANTA replays.
// Run from a MANTA checkout (it imports MANTA's source through tsx):
//   npx tsx <this repo>/demo/check-site-store.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORIGIN = 'http://localhost:4173';
const sitesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sites');
const manta = (file) => import(pathToFileURL(join(process.cwd(), file)).href);

const { readSite, siteFileFor } = await manta('ui/site-store.ts');
const { isPathRecord } = await manta('utils/path-log.ts');
const { scriptRecordProblems, checkStepScript, secretsOf, envName } = await manta('utils/path-script.ts');

const problems = [];
const site = readSite(sitesDir, ORIGIN);
if (!site) problems.push(join(sitesDir, siteFileFor(ORIGIN)) + ' is missing or not a site store MANTA reads');
for (const path of site?.paths ?? []) {
  if (!isPathRecord(path)) problems.push('path ' + path.id + ' is not a path record');
  path.steps.forEach((step, i) => {
    const last = i === path.steps.length - 1;
    if (!step.script) return problems.push(path.name + ', step ' + (i + 1) + ': no Smart Script');
    for (const p of scriptRecordProblems(step.script)) problems.push(path.name + ', step ' + (i + 1) + ': ' + p);
    for (const p of checkStepScript(step.script, { last })) problems.push(path.name + ', step ' + (i + 1) + ': ' + p);
    if (step.script.by !== 'user') problems.push(path.name + ', step ' + (i + 1) + ': not by user');
    if (!site.variables.some((v) => v.id === step.variable)) problems.push(path.name + ', step ' + (i + 1) + ': names no variable');
  });
  const secrets = secretsOf(path.steps.map((s) => s.script).filter(Boolean));
  console.log('path ' + path.id + ' "' + path.name + '": ' + path.steps.length + ' steps, secrets ' + (secrets.map(envName).join(', ') || 'none'));
}
if (problems.length) {
  for (const p of problems) console.error('[ERROR] ' + p);
  process.exit(1);
}
console.log('[DONE] ' + siteFileFor(ORIGIN) + ': ' + site.paths.length + ' path(s), no problems.');
