# Dr Stones Command Centre v1.5.4 — REM002 R2 Provider Contract Review

**Generated:** 2026-08-27T00:24:32+01:00  
**Classification:** current-contract review; live credentialed execution remains external.

## OpenRouter

Current source uses:
- chat: `https://openrouter.ai/api/v1/chat/completions`
- models: `https://openrouter.ai/api/v1/models`
- image generation: `https://openrouter.ai/api/v1/images`
- image models: `https://openrouter.ai/api/v1/images/models`

These paths were checked against current official OpenRouter documentation in this REM002 run and remain current. No live request was made.

## Together AI

Current source uses:
- chat: `https://api.together.ai/v1/chat/completions`
- models: `https://api.together.ai/v1/models`
- bearer authentication

These transport contracts remain aligned with current Together OpenAI-compatible documentation.

The static default model is `moonshotai/Kimi-K2.5`. Current Together documentation is inconsistent: recommended-model material still names Kimi K2.5 while another current model page states it is unavailable on Serverless API. The application already validates the selected model against the live provider catalogue and selects an available returned model when necessary. Therefore no speculative hard-coded replacement was made.

**Verdict:** static provider transport contracts PASS; Kimi serverless availability and all provider success/failure/usage behaviour remain **UNVERIFIABLE until live credentialed execution**.
