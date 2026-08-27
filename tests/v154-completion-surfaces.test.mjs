import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../App.js', import.meta.url), 'utf8');
const hub = await readFile(new URL('../src/components/IntelligenceHub.js', import.meta.url), 'utf8');

test('v1.5.4 chat exposes request-scoped Workspace Memory controls without mutating durable memory', () => {
  for (const token of ['Memory off','Why selected?','requestMemoryExcludedIds','bounded context budget','memoryOptions']) assert.match(app, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(app, /buildWorkspaceMemoryContext\(workspace, query, memoryOptions\)/);
});

test('v1.5.4 persistent global execution banner and header usage affordance remain route-independent', () => {
  assert.match(app, /const executionStatus =/);
  assert.match(app, /styles\.executionBanner/);
  assert.match(app, /Open usage and cost/);
  assert.match(app, /activeWorkspace\?\.name/);
});

test('Skill Builder exposes draft, validation, publication, versioning, ordered steps and import export', () => {
  for (const token of ['Skill Builder','Create draft Skill','Publish','New draft','Retire','Import as draft','Exported Skill JSON','SKILL_STEP_TYPES']) assert.ok(hub.includes(token), token);
  assert.match(app, /publishSkillDraft/);
  assert.match(app, /createDraftFromPublishedSkill/);
  assert.match(app, /moveSkillStep/);
});

test('Skill executor runs canonical first-class step types and carries Task correlation/version provenance', () => {
  for (const step of ['generate','prompt','condition','set_variable','write_document','notify','save_memory']) assert.ok(app.includes(`step.type === '${step}'`), step);
  assert.match(app, /requestedVersion:task\.skillVersion/);
  assert.match(app, /correlationId:running\.correlationId/);
  assert.match(app, /outputRef:run\.id/);
});

test('Task editor exposes all schedule/condition policies, exact Skill pinning, occurrence preview, catch-up and history', () => {
  for (const token of ['TASK_SCHEDULE_TYPES','TASK_CONDITION_TYPES','TASK_EXECUTION_POLICIES','Exact Skill version','Next occurrences','Idempotent catch-up','scheduled','actual','Duplicate']) assert.ok(hub.includes(token), token);
  assert.match(app, /DUPLICATE_SUPPRESSED/);
  assert.match(app, /WORKSPACE_CHANGED/);
  assert.match(app, /APP_RESUMED/);
});

test('Task notification education precedes Android notification permission request and previews default off', () => {
  assert.match(hub, /Android notification permission/);
  assert.match(hub, /generated content is hidden by default/i);
  assert.match(hub, /Continue to Android permission/);
  assert.match(app, /PermissionsAndroid\.PERMISSIONS\.POST_NOTIFICATIONS/);
  assert.match(hub, /useState\(false\).*notifyPreview|notifyPreview.*useState\(false\)/s);
});

test('Usage UI exposes event detail and Task Skill output correlation identifiers', () => {
  for (const token of ['Usage events','Event detail','Correlation:','Task:','Skill:','Output:']) assert.ok(hub.includes(token), token);
  assert.match(app, /correlationId, outputRef/);
});
