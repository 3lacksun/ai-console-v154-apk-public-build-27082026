# Dr Stones Command Centre v1.5.0 — Implementation Report

**Date:** 26/08/2026  
**Upgrade baseline:** v1.4.3 remediated source handover  
**Release target:** v1.5.0 / Android versionCode 13  

## Implemented scope

### Workspace Memory
Persistent workspace-isolated memories now support type, title/content, pinning, enable/disable, provenance, bounded relevance selection, explicit prompt-context labelling and last-used tracking. Memory is stored inside each workspace and migrates through schema v5.

### Skills
A versioned Skills engine now provides ordered AI/memory/document steps, conditions, template variables, output routing, run history, workspace scope and three starter Skills: Workspace Brief, Memory Curator and Weekly Review.

### Usage & Cost Dashboard
OpenRouter requests ask for usage metadata. Chat, voice, Skills, tasks and Document Studio AI paths can record token/cost/latency provenance. Provider-returned monetary cost is retained; absent provider cost remains unavailable rather than being fabricated. The Command Intelligence dashboard supports Today, 7-day, 30-day and all-time views plus model aggregation.

### Scheduled & Conditional Tasks
Persistent once, interval, daily and weekly tasks can run a direct prompt or Skill and support always/online/active-workspace/has-memory conditions, run-now, enable/disable, deletion and run history. v1.5.0 guarantees execution while the app is active and catch-up evaluation on launch/resume. Closed-app OS background execution is deliberately not claimed. Imported project tasks are paused by default.

### Full Voice Mode
Full Voice integrates the existing speech-recognition bridge, normal OpenRouter generation path and Expo Speech TTS through the additive feature-lock state model: `IDLE`, `REQUESTING_PERMISSION`, `LISTENING`, `FINALIZING_STT`, `READY_TO_SEND`, `GENERATING`, `SPEAKING`, `INTERRUPTING`, `STOPPED`, `PERMISSION_DENIED`, `STT_ERROR`, `GENERATION_ERROR` and `TTS_ERROR`. It adds auto-send, auto-listen, spoken-response control, selectable TTS voice, playback rate and interruption/barge-in while preserving the v1.4.3 Android manual-stop fallback and ordinary text interaction.

## Integration and compatibility

- Existing four primary destinations remain Chats, Workspaces, Documents and Settings.
- Command Intelligence is a global/workspace modal rather than a fifth primary destination.
- Storage schema advances 4 → 5 with deterministic forward migration.
- Workspace project archive schema advances 2 → 3 and includes memory, Skills, usage and task histories.
- Existing protected AI settings, SecureStore boundary, Document Studio, branching, backup/restore and CI release gates are retained.
- Application ID remains `com.nexarenew.aiconsole`.
- Package version is `1.5.0`; Android versionCode is `13`.

## Verification performed

- `npm run check`: PASS.
- `npm test`: 110/110 PASS, 0 fail, 0 skipped after the Full Voice feature-lock completion pass.
- `node scripts/ci-version-guard.mjs`: PASS.
- `node scripts/verify-runtime-contract.mjs`: PASS.
- Dedicated v1.5 tests cover Workspace Memory, Skills, usage/cost provenance, scheduling, Full Voice state transitions, stale callback identity, lifecycle recovery, dedicated Voice UI/integration/provenance/privacy checks and intelligence-aware project archive round-trip/import pause semantics.

## External gates

Fresh dependency restoration from registry, Expo prebuild, Gradle APK compilation, APK signing/runtime/alignment, Android 16/API-36/16-KB acceptance, physical Full Voice/STT/TTS/accessibility, closed-app lifecycle behaviour outside the locked scheduling scope, and live-provider acceptance are not represented as PASS unless separately executed.


## Full Voice feature-lock completion amendment

The additive Full Voice Mode feature lock was applied after the original v1.5.0 implementation. Source remediation adds the locked state/error model, stable voice session/turn/run identities, dedicated full-screen Voice UI, sentence-aware TTS replay, guarded Auto-listen, explicit interruption/Stop, lifecycle STOPPED recovery, voice telemetry provenance and expanded deterministic coverage. Physical Android and live-provider gates remain external and are not claimed PASS.
