import test from 'node:test';
import assert from 'node:assert/strict';
import { imageGenerationBody, normaliseImageGenerationResponse, OPENROUTER_IMAGE_URL, OPENROUTER_IMAGE_MODELS_URL } from '../src/images/imageGeneration.mjs';
import { applyEstimatedUsageCost, evaluateUsageBudgets, projectedRequestCostUsd, upsertPricingAssumption, upsertUsageBudget } from '../src/usage/usageGuardrails.mjs';
import { createUsageEvent } from '../src/usage/usageLedger.mjs';
import { deleteWorkspaceMemories, filterWorkspaceMemories, normaliseWorkspaceMemory, buildWorkspaceMemoryContext } from '../src/memory/workspaceMemory.mjs';
import { normaliseCState } from '../src/workspaces/workspaceSchema.mjs';

test('v1.5.4 image generation uses dedicated OpenRouter image endpoints and disables provider fallback', () => {
  assert.equal(OPENROUTER_IMAGE_URL, 'https://openrouter.ai/api/v1/images');
  assert.equal(OPENROUTER_IMAGE_MODELS_URL, 'https://openrouter.ai/api/v1/images/models');
  const body = imageGenerationBody({ model:'vendor/image-model', prompt:'A precise architectural diagram' });
  assert.equal(body.model, 'vendor/image-model');
  assert.equal(body.prompt, 'A precise architectural diagram');
  assert.deepEqual(body.provider, { allow_fallbacks:false });
  assert.throws(() => imageGenerationBody({ prompt:'   ' }), /image description/i);
});

test('image response requires actual image bytes before success', () => {
  assert.throws(() => normaliseImageGenerationResponse({ data:[] }), /no usable image data/i);
  const result = normaliseImageGenerationResponse({ data:[{ b64_json:'YWJj', media_type:'image/png' }], usage:{ cost:0.012 } });
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].base64, 'YWJj');
  assert.equal(result.images[0].mimeType, 'image/png');
  assert.equal(result.usage.cost, 0.012);
});

test('local pricing estimates remain explicitly estimated and provider cost wins', () => {
  const assumptions = upsertPricingAssumption([], { provider:'OpenRouter', model:'m1', inputUsdPerMillion:2, outputUsdPerMillion:4 }, 100);
  assert.equal(projectedRequestCostUsd({ provider:'OpenRouter', model:'m1', promptTokens:1000, maxCompletionTokens:500 }, assumptions), 0.004);
  const estimated = applyEstimatedUsageCost(createUsageEvent({ provider:'OpenRouter', model:'m1', estimatedPromptTokens:1000, estimatedCompletionTokens:500, now:200 }), assumptions);
  assert.equal(estimated.costSource, 'estimated');
  assert.equal(estimated.estimatedCostUsd, 0.004);
  const provider = applyEstimatedUsageCost(createUsageEvent({ provider:'OpenRouter', model:'m1', usage:{ prompt_tokens:1000, completion_tokens:500, cost:0.01 }, now:201 }), assumptions);
  assert.equal(provider.costSource, 'provider');
  assert.equal(provider.costUsd, 0.01);
  assert.equal(provider.estimatedCostUsd, null);
});

test('global and workspace hard budgets block before provider calls when projected spend reaches limit', () => {
  let budgets = upsertUsageBudget([], { scope:'GLOBAL', period:'MONTHLY', amountUsd:1, warningPercent:80, hardStopEnabled:true }, 100);
  budgets = upsertUsageBudget(budgets, { scope:'WORKSPACE', workspaceId:'ws-1', period:'MONTHLY', amountUsd:0.6, warningPercent:50, hardStopEnabled:true }, 100);
  const events = [createUsageEvent({ workspaceId:'ws-1', usage:{ cost:0.55 }, now:Date.now() })];
  const result = evaluateUsageBudgets({ events, budgets, workspaceId:'ws-1', projectedCostUsd:0.05 });
  assert.equal(result.allowed, false);
  assert.equal(result.blocks.length, 1);
  assert.equal(result.blocks[0].budget.scope, 'WORKSPACE');
  assert.equal(result.warnings.length >= 1, true);
});

test('memory management supports filtering, bulk deletion and bounded workspace-only context', () => {
  const memories = [
    normaliseWorkspaceMemory({ id:'m1', workspaceId:'ws-1', title:'Pinned instruction', content:'Use concise output', pinned:true, enabled:true, priority:'high', tags:['style'] }),
    normaliseWorkspaceMemory({ id:'m2', workspaceId:'ws-1', title:'Disabled', content:'Do not use', enabled:false }),
    normaliseWorkspaceMemory({ id:'m3', workspaceId:'ws-1', title:'Suggestion', content:'Review me', suggestion:true, enabled:true }),
  ];
  assert.equal(filterWorkspaceMemories(memories, { filter:'pinned' }).map((m)=>m.id).join(','), 'm1');
  assert.equal(filterWorkspaceMemories(memories, { filter:'disabled' }).map((m)=>m.id).join(','), 'm2');
  assert.deepEqual(deleteWorkspaceMemories({ id:'ws-1', memories }, ['m2','m3']).memories.map((m)=>m.id), ['m1']);
  const context = buildWorkspaceMemoryContext({ id:'ws-1', memories }, 'concise style');
  assert.deepEqual(context.entries.map((m)=>m.id), ['m1']);
  assert.match(context.text, /Use concise output/);
  assert.doesNotMatch(context.text, /Do not use|Review me/);
});

test('schema 6 migration preserves prior v1.5 domains and initializes merged usage controls', () => {
  const prior = { storageSchemaVersion:5, chats:[], workspaces:[{id:'ws-1',name:'One',chatIds:[],documentIds:[],memories:[]}], activeWorkspaceId:'ws-1', skills:[{id:'skill-1',name:'S',steps:[]}], scheduledTasks:[], usageLedger:[] };
  const next = normaliseCState(prior, 1234);
  assert.equal(next.storageSchemaVersion, 6);
  assert.deepEqual(next.usageBudgets, []);
  assert.deepEqual(next.pricingAssumptions, []);
  assert.equal(next.skills.length >= 1, true);
});
