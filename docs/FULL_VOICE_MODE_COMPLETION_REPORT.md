# Full Voice Mode Source Completion Report

## Result

Full Voice Mode has been remediated against the additive v1.5.0 Full Voice feature lock at source/static/deterministic-test level.

### Implemented/remediated
- Locked state machine: `IDLE`, `REQUESTING_PERMISSION`, `LISTENING`, `FINALIZING_STT`, `READY_TO_SEND`, `GENERATING`, `SPEAKING`, `INTERRUPTING`, `STOPPED`, `PERMISSION_DENIED`, `STT_ERROR`, `GENERATION_ERROR`, `TTS_ERROR`.
- Stable voice session/turn/STT/TTS run identity and stale-callback guards.
- Explicit permission denial and STT error recovery without disabling typed chat.
- Final STT result handling for Full Voice turn boundaries while preserving the v1.4.3 Android manual-stop fallback.
- Shared conversation/provider/memory generation path retained; no parallel provider client.
- Voice-origin usage telemetry now records VOICE origin plus session/turn IDs.
- Sentence-aware TTS, explicit Stop, replay/restart from stopped sentence.
- Guarded Auto-send/Auto-listen loop with lifecycle cancellation.
- Explicit Interrupt path and Stop semantics.
- Dedicated full-screen subordinate Voice conversational UI with keyboard fallback and Voice controls access.
- Conservative background/lifecycle recovery to STOPPED.
- Concise accessibility state announcements; no interim transcript live-region spam in the Full Voice screen.
- No raw microphone recording persistence enabled.

## Local verification
- `npm run check`: PASS.
- `npm test`: 110 PASS / 0 FAIL / 0 SKIPPED.
- Audit-only release-critical ZIP dependencies were linked from the preinstalled toolchain for tests only; `node_modules` is not part of source or handover. A clean offline `npm ci` was attempted separately and remained NOT_EXECUTABLE_HERE because npm cache lacked `zod-3.25.76.tgz`; this is not reported as PASS.

## Mandatory external gates still open
- Fresh v1.5.0 APK build from the final exact source.
- APK signing/alignment/16-KB verification.
- Android 16/API-36 install/cold-launch acceptance.
- Physical Full Voice STT/TTS/manual-stop/repeated-turn/interrupt/lifecycle testing.
- TalkBack/dynamic-text/reduced-motion device acceptance.
- Live OpenRouter usage/cost provenance acceptance.

**SOURCE/LOCAL FULL VOICE VERDICT:** PASS  
**PHYSICAL DEVICE FULL VOICE VERDICT:** UNVERIFIABLE / NOT EXECUTED  
**PRODUCTION GO:** NO
