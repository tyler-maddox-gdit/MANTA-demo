// The snapshot-run reader: the latest run a reports directory holds, and the fix skill's files for it.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The run tokens a reports directory holds: one per agent-analysis file. */
export function tokensIn(reportsDir) {
  if (!existsSync(reportsDir)) return [];
  return readdirSync(reportsDir)
    .map((f) => /^agent-analysis-(.+)\.json$/.exec(f)?.[1])
    .filter(Boolean)
    .sort();
}

/**
 * The latest run in a reports directory given relative to the repo root (e.g. 'demo-data/pr/reports'), or undefined
 * when it holds none. `patch` is the fix skill's patch path, relative to the root as given; `gate`, `proposals` and
 * `clusters` are its parsed files, each undefined when the run has no such file.
 */
export function readRun(reportsDir) {
  const dir = resolve(ROOT, reportsDir);
  const token = tokensIn(dir).pop();
  if (!token) return undefined;
  const json = (name) => {
    const file = join(dir, name + '-' + token + '.json');
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
  };
  return { token, patch: reportsDir + '/fix-' + token + '.patch', gate: json('gate'), proposals: json('fix-proposals'), clusters: json('cluster') };
}
