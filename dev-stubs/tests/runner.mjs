// Dev stub of the shared acceptance runner (the API serves the real one at /tests/runner.mjs).
// Same contract: runScenarios(scenarios, {api, ui, signal, onStart, onResult}) -> Result[]; summarize(results).
const get = (object, path) => path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), object);

async function runOne(scenario, {api, signal}) {
  const t0 = performance.now();
  const checks = [];
  try {
    if (scenario.kind === 'graphql') {
      const response = await fetch(`${api}/graphql`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Simulation': '1'},
        body: JSON.stringify({query: scenario.query}),
        signal,
      });
      const json = await response.json();
      checks.push({label: 'HTTP 200', ok: response.status === 200, expected: 200, actual: response.status});
      checks.push({label: 'geen GraphQL-fouten', ok: !json.errors, expected: 'geen', actual: json.errors ? json.errors.map(e => e.message) : 'geen'});
      const expect = scenario.expect ?? {};
      const actual = get(json, expect.path);
      if ('equals' in expect) checks.push({label: `${expect.path} = ${expect.equals}`, ok: actual === expect.equals, expected: expect.equals, actual});
      if ('min' in expect) checks.push({label: `${expect.path} ≥ ${expect.min}`, ok: typeof actual === 'number' && actual >= expect.min, expected: `≥ ${expect.min}`, actual});
      if ('max' in expect) checks.push({label: `${expect.path} ≤ ${expect.max}`, ok: typeof actual === 'number' && actual <= expect.max, expected: `≤ ${expect.max}`, actual});
      if ('containsUri' in expect) checks.push({label: `bevat ${expect.containsUri}`, ok: Array.isArray(actual) && actual.some(item => item.uri === expect.containsUri), expected: expect.containsUri, actual: Array.isArray(actual) ? actual.map(item => item.uri) : actual});
    } else {
      const response = await fetch(`${api}${scenario.path}`, {method: scenario.method ?? 'GET', headers: {'X-Simulation': '1'}, signal});
      checks.push({label: `HTTP ${scenario.expect.status}`, ok: response.status === scenario.expect.status, expected: scenario.expect.status, actual: response.status});
      if (scenario.expect.jsonPath) {
        const json = await response.json().catch(() => null);
        const actual = get(json, scenario.expect.jsonPath);
        checks.push({label: `${scenario.expect.jsonPath} aanwezig`, ok: actual !== undefined && actual !== null, expected: 'aanwezig', actual});
      }
    }
    return {id: scenario.id, title: scenario.title, area: scenario.area, requirement: scenario.requirement, status: checks.every(c => c.ok) ? 'pass' : 'fail', ms: Math.round(performance.now() - t0), checks};
  } catch (error) {
    if (signal?.aborted) {
      return {id: scenario.id, title: scenario.title, area: scenario.area, requirement: scenario.requirement, status: 'skipped', ms: Math.round(performance.now() - t0), checks, error: 'aborted'};
    }
    return {id: scenario.id, title: scenario.title, area: scenario.area, requirement: scenario.requirement, status: 'error', ms: Math.round(performance.now() - t0), checks, error: String(error && error.message || error)};
  }
}

export async function runScenarios(scenarios, options) {
  const results = [];
  for (const scenario of scenarios) {
    if (options.signal?.aborted) break;
    options.onStart?.(scenario);
    const result = await runOne(scenario, options);
    results.push(result);
    options.onResult?.(result);
  }
  return results;
}

export function summarize(results) {
  return {
    total: results.length,
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    error: results.filter(r => r.status === 'error').length,
    skipped: results.filter(r => r.status === 'skipped').length,
  };
}
