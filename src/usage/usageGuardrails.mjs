import { createId } from '../domain/conversationSchema.mjs';

export const PRICING_SCHEMA_VERSION = 1;
export const BUDGET_SCHEMA_VERSION = 1;
const clean = (value) => String(value ?? '').trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nullableFinite = (value) => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;

export const normalisePricingAssumption = (raw = {}, now = Date.now()) => ({
  id: clean(raw.id) || createId('pricing'),
  provider: clean(raw.provider) || 'OpenRouter',
  model: clean(raw.model) || 'unknown',
  inputUsdPerMillion: Math.max(0, finite(raw.inputUsdPerMillion, 0)),
  outputUsdPerMillion: Math.max(0, finite(raw.outputUsdPerMillion, 0)),
  source: 'local-user-assumption',
  createdAt: finite(raw.createdAt, now),
  updatedAt: finite(raw.updatedAt, now),
  schemaVersion: PRICING_SCHEMA_VERSION,
});

export const normalisePricingAssumptions = (values = [], now = Date.now()) => {
  const keyed = new Map();
  for (const raw of Array.isArray(values) ? values : []) {
    const value = normalisePricingAssumption(raw, now);
    keyed.set(`${value.provider.toLowerCase()}::${value.model}`, value);
  }
  return [...keyed.values()];
};

export const findPricingAssumption = (values = [], provider, model) => {
  const p = clean(provider).toLowerCase();
  const m = clean(model);
  return normalisePricingAssumptions(values).find((item) => item.provider.toLowerCase() === p && item.model === m) || null;
};

export const estimateUsageCostUsd = ({ provider, model, promptTokens = 0, completionTokens = 0 } = {}, assumptions = []) => {
  const assumption = findPricingAssumption(assumptions, provider, model);
  if (!assumption) return { costUsd: null, pricingSnapshotId: null };
  const costUsd = (Math.max(0, finite(promptTokens, 0)) / 1_000_000) * assumption.inputUsdPerMillion
    + (Math.max(0, finite(completionTokens, 0)) / 1_000_000) * assumption.outputUsdPerMillion;
  return { costUsd, pricingSnapshotId: assumption.id };
};

export const applyEstimatedUsageCost = (event, assumptions = []) => {
  if (!event || event.costUsd != null) return event;
  const estimate = estimateUsageCostUsd(event, assumptions);
  if (estimate.costUsd == null) return { ...event, estimatedCostUsd: null, pricingSnapshotId: null, costSource: 'unavailable' };
  return { ...event, estimatedCostUsd: estimate.costUsd, pricingSnapshotId: estimate.pricingSnapshotId, costSource: 'estimated' };
};

export const normaliseUsageBudget = (raw = {}, now = Date.now()) => ({
  id: clean(raw.id) || createId('budget'),
  scope: clean(raw.scope).toUpperCase() === 'WORKSPACE' ? 'WORKSPACE' : 'GLOBAL',
  workspaceId: clean(raw.scope).toUpperCase() === 'WORKSPACE' && raw.workspaceId ? clean(raw.workspaceId) : null,
  period: clean(raw.period).toUpperCase() === 'DAILY' ? 'DAILY' : 'MONTHLY',
  amountUsd: Math.max(0.01, finite(raw.amountUsd, 50)),
  warningPercent: Math.min(100, Math.max(1, finite(raw.warningPercent, 80))),
  hardStopEnabled: Boolean(raw.hardStopEnabled),
  enabled: raw.enabled !== false,
  createdAt: finite(raw.createdAt, now),
  updatedAt: finite(raw.updatedAt, now),
  schemaVersion: BUDGET_SCHEMA_VERSION,
});

export const normaliseUsageBudgets = (values = [], now = Date.now()) => (Array.isArray(values) ? values : []).map((value) => normaliseUsageBudget(value, now));

export function periodStart(period = 'MONTHLY', now = Date.now()) {
  const date = new Date(now);
  if (String(period).toUpperCase() === 'DAILY') return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

export const eventKnownCostUsd = (event) => {
  if (event?.costUsd != null && Number.isFinite(Number(event.costUsd))) return Math.max(0, Number(event.costUsd));
  if (event?.estimatedCostUsd != null && Number.isFinite(Number(event.estimatedCostUsd))) return Math.max(0, Number(event.estimatedCostUsd));
  return 0;
};

export function usageSpendForBudget(events = [], budget, now = Date.now()) {
  const normalised = normaliseUsageBudget(budget, now);
  const from = periodStart(normalised.period, now);
  return (Array.isArray(events) ? events : []).reduce((sum, event) => {
    if (!event || Number(event.createdAt) < from || Number(event.createdAt) > now) return sum;
    if (normalised.scope === 'WORKSPACE' && event.workspaceId !== normalised.workspaceId) return sum;
    return sum + eventKnownCostUsd(event);
  }, 0);
}

export function evaluateUsageBudgets({ events = [], budgets = [], workspaceId = null, projectedCostUsd = 0, now = Date.now() } = {}) {
  const relevant = normaliseUsageBudgets(budgets, now).filter((budget) => budget.enabled && (budget.scope === 'GLOBAL' || budget.workspaceId === workspaceId));
  const statuses = relevant.map((budget) => {
    const spentUsd = usageSpendForBudget(events, budget, now);
    const projectedUsd = spentUsd + Math.max(0, finite(projectedCostUsd, 0));
    const ratio = budget.amountUsd > 0 ? projectedUsd / budget.amountUsd : 1;
    return {
      budget,
      spentUsd,
      projectedUsd,
      percent: Math.min(999, ratio * 100),
      warning: ratio * 100 >= budget.warningPercent,
      blocked: budget.hardStopEnabled && projectedUsd >= budget.amountUsd,
    };
  });
  return {
    allowed: !statuses.some((item) => item.blocked),
    statuses,
    warnings: statuses.filter((item) => item.warning),
    blocks: statuses.filter((item) => item.blocked),
  };
}

export function projectedRequestCostUsd({ provider, model, promptTokens = 0, maxCompletionTokens = 0 } = {}, assumptions = []) {
  return estimateUsageCostUsd({ provider, model, promptTokens, completionTokens: maxCompletionTokens }, assumptions).costUsd || 0;
}

export const upsertPricingAssumption = (values = [], next, now = Date.now()) => {
  const candidate = normalisePricingAssumption({ ...next, updatedAt: now }, now);
  const existing = normalisePricingAssumptions(values, now);
  const index = existing.findIndex((item) => item.id === candidate.id || (item.provider.toLowerCase() === candidate.provider.toLowerCase() && item.model === candidate.model));
  if (index < 0) return [...existing, candidate];
  const result = [...existing]; result[index] = { ...candidate, id: existing[index].id, createdAt: existing[index].createdAt };
  return result;
};

export const upsertUsageBudget = (values = [], next, now = Date.now()) => {
  const candidate = normaliseUsageBudget({ ...next, updatedAt: now }, now);
  const existing = normaliseUsageBudgets(values, now);
  const index = existing.findIndex((item) => item.id === candidate.id || (item.scope === candidate.scope && item.period === candidate.period && item.workspaceId === candidate.workspaceId));
  if (index < 0) return [...existing, candidate];
  const result = [...existing]; result[index] = { ...candidate, id: existing[index].id, createdAt: existing[index].createdAt };
  return result;
};
