// Draws .manta/badge.svg from .manta/baseline.json: the debt the baseline tolerates,
// summed over every page's per-rule counts. Run by baseline.yml after `manta baseline`.
import { readFileSync, writeFileSync } from 'node:fs';
import { makeBadge } from 'badge-maker';

const baseline = JSON.parse(readFileSync('.manta/baseline.json', 'utf8'));
const pages = Array.isArray(baseline.pages) ? baseline.pages : Object.values(baseline.pages ?? {});
const tolerated = pages.reduce((sum, page) => sum + Object.values(page.counts ?? {}).reduce((a, n) => a + n, 0), 0);

const svg = makeBadge({
  label: 'a11y debt',
  message: tolerated + ' tolerated',
  color: tolerated === 0 ? 'brightgreen' : 'orange',
});
writeFileSync('.manta/badge.svg', svg + '\n');
console.log('Badge drawn: ' + tolerated + ' tolerated.');
