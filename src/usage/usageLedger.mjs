import { createId } from '../domain/conversationSchema.mjs';

export const USAGE_SCHEMA_VERSION = 2;
export const MAX_USAGE_EVENTS = 5000;

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nullableFinite = (value) => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const clean = (value) => String(value ?? '').trim();

export const createUsageEvent = ({
  workspaceId = null,
  chatId = null,
  skillId = null,
  taskId = null,
  origin = null,
  voiceSessionId = null,
  voiceTurnId = null,
  correlationId = null,
  outputRef = null,
  model = '',
  provider = 'OpenRouter',
  requestKind = 'chat',
  usage = null,
  estimatedPromptTokens = 0,
  estimatedCompletionTokens = 0,
  estimatedCostUsd = null,
  pricingSnapshotId = null,
  latencyMs = null,
  status = 'complete',
  now = Date.now(),
  id = createId('usage'),
} = {}) => {
  const promptTokens = finite(usage?.prompt_tokens ?? usage?.input_tokens, finite(estimatedPromptTokens, 0));
  const completionTokens = finite(usage?.completion_tokens ?? usage?.output_tokens, finite(estimatedCompletionTokens, 0));
  const totalTokens = finite(usage?.total_tokens, promptTokens + completionTokens);
  const providerCost = nullableFinite(usage?.cost ?? usage?.cost_usd);
  const estimatedCost = providerCost == null ? nullableFinite(estimatedCostUsd) : null;
  return {
    id,
    workspaceId: workspaceId ? clean(workspaceId) : null,
    chatId: chatId ? clean(chatId) : null,
    skillId: skillId ? clean(skillId) : null,
    taskId: taskId ? clean(taskId) : null,
    origin: origin ? clean(origin).toUpperCase() : null,
    voiceSessionId: voiceSessionId ? clean(voiceSessionId) : null,
    voiceTurnId: voiceTurnId ? clean(voiceTurnId) : null,
    correlationId: correlationId ? clean(correlationId) : null,
    outputRef: outputRef ? clean(outputRef) : null,
    model: clean(model) || 'unknown',
    provider: clean(provider) || 'OpenRouter',
    requestKind: clean(requestKind) || 'chat',
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd: providerCost,
    estimatedCostUsd: estimatedCost,
    pricingSnapshotId: estimatedCost == null ? null : (pricingSnapshotId ? clean(pricingSnapshotId) : null),
    costSource: providerCost != null ? 'provider' : estimatedCost != null ? 'estimated' : 'unavailable',
    latencyMs: nullableFinite(latencyMs),
    status: clean(status) || 'complete',
    createdAt: finite(now, Date.now()),
    schemaVersion: USAGE_SCHEMA_VERSION,
  };
};

export const normaliseUsageEvent = (raw = {}, now = Date.now()) => createUsageEvent({
  ...raw,
  usage: {
    prompt_tokens: raw.promptTokens,
    completion_tokens: raw.completionTokens,
    total_tokens: raw.totalTokens,
    cost: raw.costUsd,
  },
  estimatedCostUsd: raw.estimatedCostUsd,
  pricingSnapshotId: raw.pricingSnapshotId,
  latencyMs: raw.latencyMs,
  now: finite(raw.createdAt, now),
  id: raw.id || createId('usage'),
});

export const normaliseUsageLedger = (events = [], now = Date.now()) => (Array.isArray(events) ? events : []).map((event) => normaliseUsageEvent(event, now)).slice(-MAX_USAGE_EVENTS);
export const appendUsageEvent = (events = [], event, now = Date.now()) => [...normaliseUsageLedger(events, now), normaliseUsageEvent(event, now)].slice(-MAX_USAGE_EVENTS);

export const filterUsage = (events = [], filters = {}) => normaliseUsageLedger(events).filter((event) => {
  if (filters.from != null && event.createdAt < Number(filters.from)) return false;
  if (filters.to != null && event.createdAt > Number(filters.to)) return false;
  if (filters.workspaceId && event.workspaceId !== filters.workspaceId) return false;
  if (filters.model && event.model !== filters.model) return false;
  if (filters.provider && event.provider !== filters.provider) return false;
  if (filters.requestKind && event.requestKind !== filters.requestKind) return false;
  if (filters.costSource && event.costSource !== filters.costSource) return false;
  if (filters.skillId && event.skillId !== filters.skillId) return false;
  if (filters.taskId && event.taskId !== filters.taskId) return false;
  return true;
});

export const aggregateUsage = (events = [], filters = {}) => {
  const scoped = filterUsage(events, filters);
  return scoped.reduce((summary, event) => {
    summary.requests += 1;
    summary.promptTokens += event.promptTokens;
    summary.completionTokens += event.completionTokens;
    summary.totalTokens += event.totalTokens;
    if (event.costUsd != null) { summary.providerCostUsd += event.costUsd; summary.costUsd += event.costUsd; summary.costedRequests += 1; }
    else if (event.estimatedCostUsd != null) { summary.estimatedCostUsd += event.estimatedCostUsd; summary.costUsd += event.estimatedCostUsd; summary.estimatedRequests += 1; }
    else summary.unavailableCostRequests += 1;
    if (String(event.status).toLowerCase() !== 'complete') summary.failedRequests += 1;
    if (event.latencyMs != null) { summary.latencyMs += event.latencyMs; summary.latencySamples += 1; }
    return summary;
  }, {
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    providerCostUsd: 0,
    estimatedCostUsd: 0,
    costedRequests: 0,
    estimatedRequests: 0,
    unavailableCostRequests: 0,
    failedRequests: 0,
    latencyMs: 0,
    latencySamples: 0,
  });
};

export const groupUsage = (events = [], key = 'model', filters = {}) => {
  const groups = new Map();
  for (const event of filterUsage(events, filters)) {
    const groupKey = clean(event[key]) || 'Unspecified';
    const list = groups.get(groupKey) || [];
    list.push(event);
    groups.set(groupKey, list);
  }
  return Array.from(groups.entries()).map(([name, list]) => ({ name, ...aggregateUsage(list) })).sort((a, b) => b.costUsd - a.costUsd || b.totalTokens - a.totalTokens || b.requests - a.requests);
};
