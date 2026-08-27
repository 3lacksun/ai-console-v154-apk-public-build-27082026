import { createId } from '../domain/conversationSchema.mjs';

export const SKILL_SCHEMA_VERSION = 2;
export const SKILL_RUN_SCHEMA_VERSION = 2;
export const SKILL_STEP_TYPES = Object.freeze(['prompt', 'generate', 'condition', 'set_variable', 'write_document', 'notify', 'save_memory']);
export const SKILL_STATUSES = Object.freeze(['DRAFT', 'PUBLISHED', 'RETIRED']);

const clean = (value) => String(value ?? '').trim();
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const canonicalStepType = (value) => ({ ai_prompt: 'generate', create_document: 'write_document' }[clean(value).toLowerCase()] || clean(value).toLowerCase() || 'generate');
const stableJson = (value) => JSON.stringify(value, Object.keys(value || {}).sort());
const fnv1a = (text) => { let hash = 0x811c9dc5; for (const char of String(text)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193); } return (hash >>> 0).toString(16).padStart(8, '0'); };
const snapshotContent = (skill) => ({ name: skill.name, description: skill.description, workspaceScope: skill.workspaceScope, inputs: skill.inputs || [], steps: skill.steps || [], output: skill.output });
const snapshotHash = (skill) => `fnv1a-${fnv1a(stableJson(snapshotContent(skill)))}`;

export const createSkillStep = ({
  name = 'Generate', type = 'generate', prompt = '{{input}}', condition = { type: 'always' }, memoryType = 'fact',
  outputVariable = '', variableName = '', value = '', notificationText = '', now = Date.now(), id = createId('skill-step'),
} = {}) => {
  const canonical = canonicalStepType(type);
  return {
    id,
    name: clean(name) || canonical.replace(/_/g, ' '),
    type: SKILL_STEP_TYPES.includes(canonical) ? canonical : 'generate',
    prompt: String(prompt ?? ''),
    condition: condition && typeof condition === 'object' ? { ...condition } : { type: 'always' },
    memoryType: clean(memoryType) || 'fact',
    outputVariable: clean(outputVariable),
    variableName: clean(variableName),
    value: String(value ?? ''),
    notificationText: String(notificationText ?? ''),
    createdAt: finite(now, Date.now()),
  };
};

const normaliseInput = (input = {}, index = 0) => ({
  id: clean(input.id) || `input-${index + 1}`,
  name: clean(input.name) || `Input ${index + 1}`,
  key: clean(input.key) || `input${index + 1}`,
  type: ['text','number','boolean','choice','documentRef','chatRef','secretRef'].includes(input.type) ? input.type : 'text',
  required: input.required !== false,
  choices: Array.isArray(input.choices) ? input.choices.map(clean).filter(Boolean).slice(0, 50) : [],
});

const normaliseVersionSnapshot = (entry = {}, fallbackVersion = 1) => ({
  version: Math.max(1, finite(entry.version, fallbackVersion)),
  publishedAt: finite(entry.publishedAt, Date.now()),
  contentHash: clean(entry.contentHash) || `legacy-${fallbackVersion}`,
  name: clean(entry.name) || 'Skill',
  description: clean(entry.description),
  workspaceScope: entry.workspaceScope === 'all' ? 'all' : clean(entry.workspaceScope),
  inputs: Array.isArray(entry.inputs) ? entry.inputs.map(normaliseInput) : [],
  steps: (Array.isArray(entry.steps) ? entry.steps : []).map((step) => createSkillStep({ ...step, id: step.id || createId('skill-step'), now: finite(step.createdAt, Date.now()) })),
  output: ['chat','document','memory','none'].includes(entry.output) ? entry.output : 'chat',
});

export const createSkill = ({
  name = 'New Skill', description = '', workspaceScope = 'all', inputs = [], steps = null, output = 'chat', now = Date.now(),
  id = createId('skill'), version = 1, builtIn = false, status = 'DRAFT', publishedVersions = [], enabled = true,
} = {}) => {
  const base = {
    id,
    name: clean(name) || 'New Skill',
    description: clean(description),
    workspaceScope: workspaceScope === 'all' ? 'all' : clean(workspaceScope),
    inputs: Array.isArray(inputs) ? inputs.map(normaliseInput) : [],
    version: Math.max(1, finite(version, 1)),
    status: SKILL_STATUSES.includes(status) ? status : 'DRAFT',
    enabled: enabled !== false,
    builtIn: Boolean(builtIn),
    steps: (Array.isArray(steps) && steps.length ? steps : [createSkillStep({ prompt: '{{input}}', now })]).map((step) => createSkillStep({ ...step, now: finite(step.createdAt, now), id: step.id || createId('skill-step') })),
    output: ['chat', 'document', 'memory', 'none'].includes(output) ? output : 'chat',
    createdAt: finite(now, Date.now()),
    updatedAt: finite(now, Date.now()),
    publishedVersions: (Array.isArray(publishedVersions) ? publishedVersions : []).map((entry, index) => normaliseVersionSnapshot(entry, index + 1)),
    schemaVersion: SKILL_SCHEMA_VERSION,
  };
  return base;
};

export const normaliseSkill = (raw = {}, now = Date.now()) => {
  const legacyStatus = raw.status ? raw.status : 'PUBLISHED';
  const base = createSkill({ ...raw, status: legacyStatus, now: finite(raw.createdAt, now), id: raw.id || createId('skill') });
  let publishedVersions = base.publishedVersions;
  if (!publishedVersions.length && base.status === 'PUBLISHED') {
    publishedVersions = [{ ...snapshotContent(base), version: base.version, publishedAt: finite(raw.updatedAt, base.createdAt), contentHash: clean(raw.contentHash) || snapshotHash(base) }];
  }
  return { ...base, publishedVersions, enabled: raw.enabled !== false, updatedAt: finite(raw.updatedAt, finite(raw.createdAt, now)) };
};
export const normaliseSkills = (skills = [], now = Date.now()) => (Array.isArray(skills) ? skills : []).map((skill) => normaliseSkill(skill, now));

export const createDefaultSkills = (now = Date.now()) => [
  createSkill({ id: 'skill-workspace-brief', name: 'Workspace Brief', description: 'Summarise the current workspace using its persistent memory.', builtIn: true, status: 'PUBLISHED', output: 'chat', now, steps: [{ name: 'Create brief', type: 'generate', prompt: 'Using the workspace memory and the request below, produce a concise status brief with decisions, priorities, risks and next actions.\n\nRequest: {{input}}' }] }),
  createSkill({ id: 'skill-memory-curator', name: 'Memory Curator', description: 'Turn supplied notes into a clean persistent workspace memory suggestion.', builtIn: true, status: 'PUBLISHED', output: 'memory', now, steps: [{ name: 'Curate memory', type: 'generate', prompt: 'Rewrite the following into one concise durable project memory. Preserve concrete decisions, constraints, names and numbers. Return only the memory text.\n\n{{input}}' }] }),
  createSkill({ id: 'skill-weekly-review', name: 'Weekly Review', description: 'Generate a structured weekly review for the active workspace.', builtIn: true, status: 'PUBLISHED', output: 'document', now, steps: [{ name: 'Review', type: 'generate', prompt: 'Prepare a weekly workspace review from the supplied request and persistent memory. Use headings: Progress, Decisions, Risks, Outstanding work, Next week.\n\n{{input}}' }] }),
].map((skill) => normaliseSkill(skill, now));

export const renderSkillTemplate = (template, context = {}) => String(template ?? '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey) => {
  const key = String(rawKey || '').trim();
  if (key === 'input') return String(context.input ?? '');
  if (key === 'previous') return String(context.previous ?? '');
  if (key === 'workspace.name') return String(context.workspace?.name ?? '');
  if (key === 'memory') return String(context.memory ?? '');
  if (key.startsWith('var.')) return String(context.variables?.[key.slice(4)] ?? '');
  if (key.startsWith('input.')) return String(context.inputs?.[key.slice(6)] ?? '');
  return '';
});

export const skillStepConditionMet = (condition = { type: 'always' }, context = {}) => {
  const type = clean(condition?.type) || 'always';
  if (type === 'always') return true;
  if (type === 'previous_nonempty') return Boolean(clean(context.previous));
  if (type === 'previous_contains') return clean(context.previous).toLowerCase().includes(clean(condition.value).toLowerCase());
  if (type === 'variable_equals') return String(context.variables?.[condition.key] ?? '') === String(condition.value ?? '');
  if (type === 'exists') return context.variables?.[condition.key] != null && String(context.variables?.[condition.key]) !== '';
  if (type === 'numeric_compare') { const left = Number(context.variables?.[condition.key]); const right = Number(condition.value); if (!Number.isFinite(left) || !Number.isFinite(right)) return false; return condition.operator === 'gt' ? left > right : condition.operator === 'gte' ? left >= right : condition.operator === 'lt' ? left < right : condition.operator === 'lte' ? left <= right : left === right; }
  if (type === 'online') return context.online !== false;
  return false;
};

export const validateSkill = (skill) => {
  const candidate = normaliseSkill(skill || {});
  const errors = [];
  if (!clean(candidate.name)) errors.push({ field: 'name', message: 'Skill name is required.' });
  if (!candidate.steps.length) errors.push({ field: 'steps', message: 'At least one step is required.' });
  candidate.steps.forEach((step, index) => {
    if (!SKILL_STEP_TYPES.includes(step.type)) errors.push({ stepId: step.id, message: `Step ${index + 1} has an unsupported type.` });
    if (['prompt','generate','write_document','save_memory'].includes(step.type) && !clean(step.prompt)) errors.push({ stepId: step.id, message: `Step ${index + 1} requires content.` });
    if (step.type === 'set_variable' && !clean(step.variableName || step.outputVariable)) errors.push({ stepId: step.id, message: `Step ${index + 1} requires a variable name.` });
  });
  return { ok: errors.length === 0, errors };
};

export const createDraftFromPublishedSkill = (skill, now = Date.now()) => {
  const current = normaliseSkill(skill, now);
  if (current.status === 'RETIRED') throw new Error('Retired Skills cannot be edited. Duplicate it instead.');
  return { ...current, status: 'DRAFT', updatedAt: now };
};

export const updateSkillDraft = (skill, patch = {}, now = Date.now()) => {
  const current = normaliseSkill(skill, now);
  if (current.status !== 'DRAFT') throw new Error('Published Skills are immutable. Create a draft first.');
  return normaliseSkill({ ...current, ...patch, status: 'DRAFT', publishedVersions: current.publishedVersions, updatedAt: now }, now);
};

export const publishSkillDraft = (skill, now = Date.now()) => {
  const current = normaliseSkill(skill, now);
  if (current.status !== 'DRAFT') throw new Error('Only a draft can be published.');
  const verdict = validateSkill(current); if (!verdict.ok) throw new Error(verdict.errors[0]?.message || 'Skill validation failed.');
  const maxVersion = Math.max(0, ...current.publishedVersions.map((entry) => finite(entry.version, 0)));
  const version = Math.max(current.version, maxVersion + 1);
  const contentHash = snapshotHash(current);
  const snapshot = { ...snapshotContent(current), version, publishedAt: now, contentHash };
  return normaliseSkill({ ...current, version, status: 'PUBLISHED', contentHash, publishedVersions: [...current.publishedVersions.filter((entry) => entry.version !== version), snapshot], updatedAt: now }, now);
};

export const retireSkill = (skill, now = Date.now()) => ({ ...normaliseSkill(skill, now), status: 'RETIRED', enabled: false, updatedAt: now });

export const resolveSkillVersion = (skill, version = null) => {
  const current = normaliseSkill(skill || {});
  const requested = version == null ? current.version : Number(version);
  const found = current.publishedVersions.find((entry) => Number(entry.version) === requested);
  if (found) return { ...current, ...found, version: found.version, status: 'PUBLISHED', publishedVersions: current.publishedVersions };
  if (current.status === 'PUBLISHED' && Number(current.version) === requested) return current;
  throw new Error(`Skill version ${requested} is unavailable.`);
};

export const moveSkillStep = (skill, stepId, direction, now = Date.now()) => {
  const current = normaliseSkill(skill, now); if (current.status !== 'DRAFT') throw new Error('Create a draft before reordering steps.');
  const steps = [...current.steps]; const index = steps.findIndex((step) => step.id === stepId); const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= steps.length) return current; [steps[index], steps[target]] = [steps[target], steps[index]];
  return updateSkillDraft(current, { steps }, now);
};

export const exportSkillDefinition = (skill) => JSON.stringify({ format: 'dr-stones-skill', version: 1, skill: normaliseSkill(skill) }, null, 2);
export const parseSkillImport = (text) => {
  let payload; try { payload = JSON.parse(String(text || '')); } catch (_) { throw new Error('Skill import is not valid JSON.'); }
  if (payload?.format !== 'dr-stones-skill' || !payload.skill) throw new Error('Unsupported Skill import format.');
  const imported = normaliseSkill({ ...payload.skill, id: createId('skill'), status: 'DRAFT', builtIn: false, publishedVersions: [], version: 1, createdAt: Date.now(), updatedAt: Date.now() });
  const verdict = validateSkill(imported); if (!verdict.ok) throw new Error(verdict.errors[0]?.message || 'Skill import validation failed.');
  return imported;
};

export const createSkillRun = ({ skill, workspaceId, input = '', taskId = null, requestedVersion = null, now = Date.now(), id = createId('skill-run'), correlationId = createId('corr') } = {}) => ({
  id,
  correlationId,
  skillId: skill?.id || null,
  skillVersion: requestedVersion || skill?.version || 1,
  skillContentHash: clean(skill?.contentHash) || null,
  skillName: skill?.name || 'Unknown Skill',
  workspaceId: workspaceId || null,
  taskId: taskId || null,
  input: String(input ?? ''),
  status: 'RUNNING',
  stepResults: [],
  output: '',
  error: null,
  startedAt: now,
  completedAt: null,
  schemaVersion: SKILL_RUN_SCHEMA_VERSION,
});

export const finishSkillRun = (run, { output = '', stepResults = [], error = null, status = null, now = Date.now() } = {}) => ({ ...run, status: status || (error ? 'FAILED' : 'COMPLETE'), output: String(output ?? ''), stepResults, error: error ? String(error).slice(0, 500) : null, completedAt: now });
export const normaliseSkillRuns = (runs = []) => (Array.isArray(runs) ? runs : []).map((run) => ({ ...run, correlationId: run.correlationId || createId('corr'), stepResults: Array.isArray(run.stepResults) ? run.stepResults : [], status: ['RUNNING','COMPLETE','FAILED','CANCELLED'].includes(run.status) ? run.status : 'FAILED', schemaVersion: SKILL_RUN_SCHEMA_VERSION })).slice(-500);
