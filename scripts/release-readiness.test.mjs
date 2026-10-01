import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const repository = 'example/queueTunes';
const trustedRun = {
  conclusion: 'success',
  event: 'push',
  head_branch: 'main',
  head_repository: { full_name: repository },
};

for (const name of ['frontend', 'backend']) {
  const workflow = read(`.github/workflows/deploy-${name}.yml`);
  const condition = workflow.match(/^    if: >-\n((?: {6}.*\n)+)/m)?.[1].trim();
  test(`${name} deploy permits only trusted successful main pushes`, () => {
    assert.ok(condition);
    const evaluate = (run) => runInNewContext(condition, {
      github: { repository, event_name: 'workflow_run', ref: 'refs/heads/main', event: { workflow_run: run } },
    });
    assert.equal(evaluate(trustedRun), true);
    for (const change of [
      { event: 'pull_request' },
      { head_repository: { full_name: 'outsider/queueTunes' } },
      { head_branch: 'feature' },
      { conclusion: 'failure' },
      { conclusion: 'cancelled' },
    ]) assert.equal(evaluate({ ...trustedRun, ...change }), false);
    assert.doesNotMatch(workflow, /^\s+pull_request(?:_target)?:/m);
    assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha/);
    assert.match(workflow, /persist-credentials: false/);
    assert.match(workflow, /node-version: "22\.x"/);
    assert.match(workflow, /(?:environment: Production|name: "Production")/);
  });
  if (name === 'backend') {
    test('manual backend deploy rejects non-main refs', () => {
      for (const [ref, expected] of [['refs/heads/main', true], ['refs/heads/feature', false], ['refs/tags/main', false]]) {
        assert.equal(runInNewContext(condition, {
          github: { ref, repository, event_name: 'workflow_dispatch', event: { workflow_run: {} } },
        }), expected);
      }
    });
  }
}

test('private env files and runtime caches stay ignored; examples remain publishable', () => {
  for (const path of ['.env', 'frontend/.env', 'frontend/.env.production', 'backend/.env', 'backend/.env.production', 'backend/data/episodes.json']) {
    execFileSync('git', ['check-ignore', '--quiet', '--no-index', path], { cwd: root });
  }
  for (const path of ['frontend/.env.example', 'backend/.env.example']) {
    assert.equal(spawnSync('git', ['check-ignore', '--quiet', '--no-index', path], { cwd: root }).status, 1);
  }
});

test('only the original SVG icon is referenced and distributed', () => {
  assert.match(read('frontend/index.html'), /href="\/favicon\.svg"/);
  assert.match(read('frontend/public/favicon.svg'), /<svg /);
  assert.equal(existsSync(new URL('../frontend/public/favicon.ico', import.meta.url)), false);
  assert.equal(existsSync(new URL('../frontend/src/logo.svg', import.meta.url)), false);
  const manifest = JSON.parse(read('frontend/public/manifest.json'));
  assert.equal(manifest.icons[0].src, '/favicon.svg');
  const config = JSON.parse(read('frontend/staticwebapp.config.json'));
  assert.ok(config.navigationFallback.exclude.includes('/favicon.svg'));
  assert.ok(config.navigationFallback.exclude.includes('/third-party-notices.txt'));
});

test('license and runtime declarations are consistent', () => {
  assert.match(read('LICENSE'), /^ISC License/);
  for (const project of ['frontend', 'backend']) {
    const pkg = JSON.parse(read(`${project}/package.json`));
    const lock = JSON.parse(read(`${project}/package-lock.json`));
    assert.equal(pkg.license, 'ISC');
    assert.equal(pkg.engines.node, '22.x');
    assert.deepEqual(lock.packages[''].engines, pkg.engines);
    assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  }
});
