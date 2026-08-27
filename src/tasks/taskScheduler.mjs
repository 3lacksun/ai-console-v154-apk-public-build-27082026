import { createId } from '../domain/conversationSchema.mjs';

export const TASK_SCHEMA_VERSION = 2;
export const TASK_RUN_SCHEMA_VERSION = 2;
export const TASK_EXECUTION_POLICIES = Object.freeze(['FOREGROUND_REQUIRED', 'BEST_EFFORT_BACKGROUND', 'NOTIFY_ONLY']);
export const TASK_SCHEDULE_TYPES = Object.freeze(['once', 'interval', 'daily', 'weekly', 'condition']);
export const TASK_CONDITION_TYPES = Object.freeze(['always','online','workspace_active','has_memory','app_resumed','workspace_changed','previous_run_succeeded','previous_run_failed','usage_threshold_reached']);
const clean = (value) => String(value ?? '').trim();
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const MIN_INTERVAL_MINUTES = 1;
const localTimezone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local device time'; } catch (_) { return 'Local device time'; } };
const fnv1a=(text)=>{let h=0x811c9dc5;for(const char of String(text)){h^=char.charCodeAt(0);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,'0');};

export const normaliseSchedule = (schedule = {}, now = Date.now()) => {
  const type = TASK_SCHEDULE_TYPES.includes(schedule.type) ? schedule.type : 'once';
  const timezone = clean(schedule.timezone) || localTimezone();
  if (type === 'interval') return { type, timezone, intervalMinutes: Math.max(MIN_INTERVAL_MINUTES, finite(schedule.intervalMinutes, 60)) };
  if (type === 'daily') return { type, timezone, hour: Math.min(23, Math.max(0, finite(schedule.hour, 8))), minute: Math.min(59, Math.max(0, finite(schedule.minute, 0))) };
  if (type === 'weekly') return { type, timezone, dayOfWeek: Math.min(6, Math.max(0, finite(schedule.dayOfWeek, 1))), hour: Math.min(23, Math.max(0, finite(schedule.hour, 8))), minute: Math.min(59, Math.max(0, finite(schedule.minute, 0))) };
  if (type === 'condition') return { type, timezone, evaluationIntervalMinutes: Math.max(MIN_INTERVAL_MINUTES, finite(schedule.evaluationIntervalMinutes, 1)) };
  return { type: 'once', timezone, runAt: finite(schedule.runAt, now + 60_000) };
};

export const calculateNextRunAt = (schedule, now = Date.now(), previousRunAt = null) => {
  const s = normaliseSchedule(schedule, now);
  if (s.type === 'once') return s.runAt > now || previousRunAt == null ? s.runAt : null;
  if (s.type === 'interval') return (previousRunAt == null ? now : previousRunAt) + s.intervalMinutes * 60_000;
  if (s.type === 'condition') return (previousRunAt == null ? now : previousRunAt) + s.evaluationIntervalMinutes * 60_000;
  const date = new Date(now); date.setSeconds(0, 0);
  if (s.type === 'daily') { date.setHours(s.hour, s.minute, 0, 0); if (date.getTime() <= now) date.setDate(date.getDate() + 1); return date.getTime(); }
  const delta = (s.dayOfWeek - date.getDay() + 7) % 7; date.setDate(date.getDate() + delta); date.setHours(s.hour, s.minute, 0, 0); if (date.getTime() <= now) date.setDate(date.getDate() + 7); return date.getTime();
};

export const previewScheduleOccurrences = (schedule, now = Date.now(), count = 3) => {
  const occurrences=[]; let cursor=null; for(let i=0;i<Math.max(1,Math.min(10,count));i+=1){ const next=calculateNextRunAt(schedule, i===0?now:(cursor+1), cursor); if(next==null)break; occurrences.push(next); cursor=next; if(schedule?.type==='condition') break; } return occurrences;
};

export const taskRunKey = (task, scheduledAt = task?.nextRunAt) => `taskrun-${fnv1a(`${task?.id||''}|${scheduledAt||''}|${task?.skillVersion||''}`)}`;

export const createScheduledTask = ({
  name = 'Scheduled task', workspaceId = null, skillId = null, skillVersion = null, prompt = '', schedule = null,
  condition = { type: 'online' }, enabled = true, catchUp = true, executionPolicy = 'FOREGROUND_REQUIRED',
  notificationPolicy = { due: false, complete: false, preview: false }, now = Date.now(), id = createId('task'),
} = {}) => {
  const normalisedSchedule = normaliseSchedule(schedule || { type: 'once', runAt: now + 60_000 }, now);
  const policy = TASK_EXECUTION_POLICIES.includes(executionPolicy) ? executionPolicy : 'FOREGROUND_REQUIRED';
  return {
    id, name: clean(name) || 'Scheduled task', workspaceId: workspaceId || null, skillId: skillId || null,
    skillVersion: skillVersion == null ? null : Math.max(1, finite(skillVersion, 1)), prompt: String(prompt ?? ''), schedule: normalisedSchedule,
    condition: condition && typeof condition === 'object' && TASK_CONDITION_TYPES.includes(clean(condition.type)) ? { ...condition, type:clean(condition.type) } : { type: 'online' },
    executionPolicy: policy,
    notificationPolicy: { due:Boolean(notificationPolicy?.due), complete:Boolean(notificationPolicy?.complete), preview:Boolean(notificationPolicy?.preview) },
    enabled: enabled !== false, catchUp: catchUp !== false, createdAt: now, updatedAt: now, lastRunAt: null,
    nextRunAt: calculateNextRunAt(normalisedSchedule, now, null), lastStatus: 'NEVER_RUN', lastError: null,
    schemaVersion: TASK_SCHEMA_VERSION,
  };
};

export const normaliseScheduledTask = (raw = {}, now = Date.now()) => {
  const base = createScheduledTask({ ...raw, now: finite(raw.createdAt, now), id: raw.id || createId('task') });
  return { ...base, enabled: raw.enabled !== false, catchUp: raw.catchUp !== false, updatedAt: finite(raw.updatedAt, base.createdAt), lastRunAt: raw.lastRunAt == null ? null : finite(raw.lastRunAt, null), nextRunAt: raw.nextRunAt == null ? calculateNextRunAt(base.schedule, now, raw.lastRunAt) : finite(raw.nextRunAt, null), lastStatus: clean(raw.lastStatus) || 'NEVER_RUN', lastError: raw.lastError ? String(raw.lastError).slice(0, 500) : null, schemaVersion:TASK_SCHEMA_VERSION };
};
export const normaliseScheduledTasks = (tasks = [], now = Date.now()) => (Array.isArray(tasks) ? tasks : []).map((task) => normaliseScheduledTask(task, now));

export const taskConditionMet = (task, context = {}) => {
  const type = clean(task?.condition?.type) || 'always';
  if (type === 'always') return true;
  if (type === 'online') return context.online !== false;
  if (type === 'workspace_active') return Boolean(task.workspaceId && context.activeWorkspaceId === task.workspaceId);
  if (type === 'has_memory') return finite(context.memoryCount, 0) > 0;
  if (type === 'app_resumed') return context.event === 'APP_RESUMED';
  if (type === 'workspace_changed') return context.event === 'WORKSPACE_CHANGED' && (!task.workspaceId || task.workspaceId === context.activeWorkspaceId);
  if (type === 'previous_run_succeeded') return task.lastStatus === 'COMPLETE';
  if (type === 'previous_run_failed') return task.lastStatus === 'FAILED';
  if (type === 'usage_threshold_reached') return finite(context.usageSpendUsd, 0) >= Math.max(0, finite(task.condition?.amountUsd, 0));
  return false;
};
export const isTaskDue = (task, now = Date.now()) => Boolean(task?.enabled && task?.nextRunAt != null && Number(task.nextRunAt) <= now);

export const completeScheduledTaskRun = (task, { status = 'COMPLETE', error = null, scheduledAt = task?.nextRunAt, now = Date.now() } = {}) => {
  const nextRunAt = task.schedule?.type === 'once' ? null : calculateNextRunAt(task.schedule, now, scheduledAt || now);
  return { ...task, lastRunAt: now, nextRunAt, lastStatus: status, lastError: error ? String(error).slice(0, 500) : null, enabled: task.schedule?.type === 'once' ? false : task.enabled, updatedAt: now };
};

export const skipScheduledTaskRun = (task, { reason = 'Condition not met.', scheduledAt = task?.nextRunAt, now = Date.now() } = {}) => {
  const nextRunAt = task.schedule?.type === 'once' ? (task.catchUp ? task.nextRunAt : null) : calculateNextRunAt(task.schedule, now, scheduledAt || now);
  return { ...task, nextRunAt, lastStatus: 'SKIPPED', lastError: reason, enabled: task.schedule?.type === 'once' && !task.catchUp ? false : task.enabled, updatedAt: now };
};

export const createTaskRunRecord = ({ task, status = 'RUNNING', output = '', error = null, scheduledAt = task?.nextRunAt, executionEnvironment = 'FOREGROUND', now = Date.now(), id = createId('task-run'), correlationId = createId('corr') } = {}) => ({
  id, correlationId, runKey:taskRunKey(task,scheduledAt), taskId: task?.id || null, taskName: task?.name || 'Task', workspaceId: task?.workspaceId || null,
  skillId: task?.skillId || null, skillVersion:task?.skillVersion||null, executionPolicy:task?.executionPolicy||'FOREGROUND_REQUIRED', executionEnvironment,
  scheduledAt:scheduledAt||null, startedAt:now, status, output: String(output ?? ''), error: error ? String(error).slice(0, 500) : null,
  createdAt: now, completedAt: status === 'RUNNING' ? null : now, schemaVersion:TASK_RUN_SCHEMA_VERSION,
});
export const normaliseTaskRuns = (runs = []) => (Array.isArray(runs) ? runs : []).map((run) => ({ ...run, correlationId:run.correlationId||createId('corr'), runKey:run.runKey||`legacy-${run.id||createId('task-run')}`, scheduledAt:run.scheduledAt??null, startedAt:run.startedAt||run.createdAt||Date.now(), status: ['RUNNING','COMPLETE','FAILED','SKIPPED','CANCELLED','FOREGROUND_REQUIRED','NOTIFIED'].includes(run.status) ? run.status : 'FAILED', schemaVersion:TASK_RUN_SCHEMA_VERSION })).slice(-500);
