/**
 * Acceptance tests: the scenarios and the runner come from the API
 * (`/tests/scenarios.json` and `/tests/runner.mjs`), so the browser and the
 * CLI share one implementation. The UI never reimplements assertions.
 */

export interface Area {
  id: string;
  title: string;
}

export interface Scenario {
  id: string;
  area: string;
  title: string;
  requirement: string[];
  kind: 'graphql' | 'http';
  [key: string]: unknown;
}

export interface Manifest {
  version: number;
  generated: string;
  areas: Area[];
  scenarios: Scenario[];
}

export interface Check {
  label: string;
  ok: boolean;
  actual?: unknown;
  expected?: unknown;
}

export type ResultStatus = 'pass' | 'fail' | 'error' | 'skipped';

export interface Result {
  id: string;
  title: string;
  area: string;
  requirement: string[];
  status: ResultStatus;
  ms: number;
  checks: Check[];
  error?: string;
}

export interface RunnerModule {
  runScenarios: (scenarios: Scenario[], options: {
    api: string;
    ui: string;
    signal?: AbortSignal;
    onResult?: (result: Result) => void;
    onStart?: (scenario: Scenario) => void;
  }) => Promise<Result[]>;
  summarize?: (results: Result[]) => unknown;
}

export interface AcceptanceSummary {
  total: number;
  pass: number;
  fail: number;
  error: number;
  skipped: number;
  durationMs: number;
}

export interface AcceptanceRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  api: string;
  ui: string;
  apiVersion: string | null;
  manifestGenerated: string | null;
  scope: string;
  results: Result[];
  summary: AcceptanceSummary;
  stoppedBy: 'finished' | 'user' | null;
}

/** Base URL of the API (the GraphQL URL without /graphql); VITE_TESTS_BASE can point elsewhere for local stubs. */
export const apiBaseUrl = () => (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql\/?$/, '');
export const testsBaseUrl = () => ((import.meta.env.VITE_TESTS_BASE as string | undefined) || apiBaseUrl()).replace(/\/$/, '');

export async function loadManifest(signal?: AbortSignal): Promise<Manifest> {
  const response = await fetch(`${testsBaseUrl()}/tests/scenarios.json`, {signal, cache: 'no-cache'});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

let runnerPromise: Promise<RunnerModule> | null = null;
export function loadRunner(): Promise<RunnerModule> {
  if (!runnerPromise) {
    runnerPromise = import(/* @vite-ignore */ `${testsBaseUrl()}/tests/runner.mjs`) as Promise<RunnerModule>;
    runnerPromise.catch(() => { runnerPromise = null; });
  }
  return runnerPromise;
}

export async function fetchApiVersion(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}/health`, {signal, cache: 'no-cache'});
    const json = await response.json();
    return typeof json?.version === 'string' ? json.version : null;
  } catch {
    return null;
  }
}

export const summarizeResults = (results: Result[], durationMs: number): AcceptanceSummary => ({
  total: results.length,
  pass: results.filter(result => result.status === 'pass').length,
  fail: results.filter(result => result.status === 'fail').length,
  error: results.filter(result => result.status === 'error').length,
  skipped: results.filter(result => result.status === 'skipped').length,
  durationMs: Math.round(durationMs),
});

const ACCEPTANCE_KEY = 'vtn-sim-acceptance-runs';
export const MAX_ACCEPTANCE_RUNS = 10;

export const loadAcceptanceRuns = (): AcceptanceRun[] => {
  try {
    const raw = window.localStorage.getItem(ACCEPTANCE_KEY);
    return raw ? JSON.parse(raw) as AcceptanceRun[] : [];
  } catch {
    return [];
  }
};

export const saveAcceptanceRuns = (runs: AcceptanceRun[]): AcceptanceRun[] => {
  let kept = runs.slice(0, MAX_ACCEPTANCE_RUNS);
  while (kept.length > 0) {
    try {
      window.localStorage.setItem(ACCEPTANCE_KEY, JSON.stringify(kept));
      return kept;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
  return kept;
};

const format = (value: unknown) => {
  if (value === undefined) {
    return '';
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 300 ? text.slice(0, 297) + '…' : text;
};

/** Markdown test report meemoo can attach to a test round. */
export function toMarkdownReport(run: AcceptanceRun, areas: Area[], labels: {title: string, date: string, api: string, ui: string, apiVersion: string, scope: string, area: string, pass: string, fail: string, error: string, skipped: string, total: string, duration: string, failures: string, none: string, check: string, expected: string, actual: string}): string {
  const areaTitle = (id: string) => areas.find(area => area.id === id)?.title ?? id;
  const lines: string[] = [];
  lines.push(`# ${labels.title}`, '');
  lines.push(`- ${labels.date}: ${new Date(run.startedAt).toISOString()}`);
  lines.push(`- ${labels.api}: ${run.api}${run.apiVersion ? ` (${labels.apiVersion} ${run.apiVersion})` : ''}`);
  lines.push(`- ${labels.ui}: ${run.ui}`);
  lines.push(`- ${labels.scope}: ${run.scope}`);
  lines.push(`- ${labels.duration}: ${(run.summary.durationMs / 1000).toFixed(1)} s`, '');
  lines.push(`| ${labels.area} | ${labels.pass} | ${labels.fail} | ${labels.error} | ${labels.skipped} | ${labels.total} |`);
  lines.push('|---|---:|---:|---:|---:|---:|');
  const areaIds = [...new Set(run.results.map(result => result.area))];
  for (const id of areaIds) {
    const results = run.results.filter(result => result.area === id);
    const count = (status: ResultStatus) => results.filter(result => result.status === status).length;
    lines.push(`| ${areaTitle(id)} | ${count('pass')} | ${count('fail')} | ${count('error')} | ${count('skipped')} | ${results.length} |`);
  }
  lines.push(`| **${labels.total}** | ${run.summary.pass} | ${run.summary.fail} | ${run.summary.error} | ${run.summary.skipped} | ${run.summary.total} |`, '');
  lines.push(`## ${labels.failures}`, '');
  const failures = run.results.filter(result => result.status === 'fail' || result.status === 'error');
  if (failures.length === 0) {
    lines.push(`_${labels.none}_`, '');
  }
  for (const result of failures) {
    lines.push(`### ${result.id} · ${result.title} (${areaTitle(result.area)}; ${result.requirement.join(', ')})`, '');
    lines.push(`- ${result.status}, ${result.ms} ms`);
    if (result.error) {
      lines.push(`- ${format(result.error)}`);
    }
    for (const check of result.checks.filter(item => !item.ok)) {
      lines.push(`- ❌ ${labels.check}: ${check.label}`);
      if (check.expected !== undefined) {
        lines.push(`  - ${labels.expected}: \`${format(check.expected)}\``);
      }
      if (check.actual !== undefined) {
        lines.push(`  - ${labels.actual}: \`${format(check.actual)}\``);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
