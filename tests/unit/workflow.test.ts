import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const deployJob = workflow.slice(workflow.indexOf('\n  deploy:'));

describe('deploy workflow', () => {
  it('does not share a workflow-wide concurrency group (a PR run could replace a pending main deploy)', () => {
    expect(workflow).not.toMatch(/^concurrency:/m);
  });
  it('serialises only the deploy job', () => {
    expect(deployJob).toMatch(/\n    concurrency:\n      group: pages\n      cancel-in-progress: false\n/);
  });
  it('never deploys pull requests', () => {
    expect(deployJob).toContain("if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'");
  });
});
