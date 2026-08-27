# Dr Stones Command Centre v1.5.0 — Full Voice Mode Feature Lock

**Status:** AUTHORITATIVE ADDITIVE FEATURE-LOCK AMENDMENT  
**Target release:** Dr Stones Command Centre v1.5.0  
**Baseline:** Current authoritative v1.5.0 handover `DR_STONES_COMMAND_CENTRE_V1_5_0_HANDOVER_26082026064502.zip`  
**Baseline SHA-256:** `466401cb44287b9b9d841f100c703d37ca5916a96471408bbb51ecd619f2532c`  
**Application ID:** `com.nexarenew.aiconsole`  
**Android versionCode:** `13`  
**Persistent schema:** `5`  
**Authority effect:** Additive. No existing v1.5.0 or inherited v1.4.x/v1.3.1 feature is retired by this amendment.

## 1. Lock statement

Full Voice Mode is locked as a first-class conversational control surface for the existing Chat domain. It MUST use the existing speech-recognition bridge, shared generation path, Workspace Memory, usage/cost telemetry, persistence, protected AI configuration and conversation history. It MUST NOT introduce a parallel provider client, duplicate conversation model, duplicate memory store or independent usage ledger.

Implementation existence alone does not satisfy this lock. Each requirement must meet its behaviour, persistence/error-state, regression and applicable runtime/device acceptance obligations before being reported complete.

## 2. State-machine lock

- **FL-VOI-100** Full Voice Mode SHALL use one authoritative voice-session state machine.
- **FL-VOI-101** Principal states SHALL include `IDLE`, `REQUESTING_PERMISSION`, `LISTENING`, `FINALIZING_STT`, `READY_TO_SEND`, `GENERATING`, and `SPEAKING`.
- **FL-VOI-102** Exceptional/control states SHALL include `INTERRUPTING`, `STOPPED`, `PERMISSION_DENIED`, `STT_ERROR`, `GENERATION_ERROR`, and `TTS_ERROR`.
- **FL-VOI-103** Visible labels such as Listening, Thinking/Generating and Speaking SHALL only be shown when the corresponding runtime state is actually active.
- **FL-VOI-104** Asynchronous callbacks SHALL be guarded by voice/session/run identity so stale callbacks cannot mutate a newer session or turn.

## 3. Speech-to-text lock

- **FL-VOI-110** Reuse the existing authorised speech-recognition bridge; do not replace compliant functionality unnecessarily.
- **FL-VOI-111** Support microphone permission request, previously-granted state, denial and recoverable retry.
- **FL-VOI-112** Support interim transcript, final transcript, manual stop, cancel and recognition error handling.
- **FL-VOI-113** Preserve the narrowly scoped v1.4.3 Android manual-stop transcript fallback for the known explicit-stop client/code-5 case.
- **FL-VOI-114** The Android manual-stop workaround SHALL NOT suppress genuine permission, network, recogniser-service or unrelated client errors.
- **FL-VOI-115** Repeated voice turns SHALL not duplicate recognition starts, sends or final transcript delivery.
- **FL-VOI-116** Raw microphone audio SHALL NOT be persisted.

## 4. Shared generation lock

- **FL-VOI-120** Final voice utterances SHALL enter the same shared generation path as typed Chat requests.
- **FL-VOI-121** Voice requests SHALL inherit the active conversation, workspace, Workspace Memory, system/project context, selected model and protected configuration.
- **FL-VOI-122** Voice requests SHALL inherit ordinary generation cancellation, streaming, persistence, stale-callback isolation and failure handling.
- **FL-VOI-123** Voice turns SHALL remain ordinary user/assistant conversation messages rather than a separate incompatible voice-message model.
- **FL-VOI-124** Where supported by the current execution model, provenance SHALL distinguish `VOICE` origin and carry stable voice session/turn identifiers.

## 5. Text-to-speech lock

- **FL-VOI-130** Completed assistant responses SHALL be speakable through the authorised TTS layer, expected to remain `expo-speech` unless a later authorised amendment supersedes it.
- **FL-VOI-131** Support installed-voice selection and persisted speech-rate preference.
- **FL-VOI-132** Support explicit Stop and replay of the last assistant response.
- **FL-VOI-133** Playback SHALL expose truthful `SPEAKING`, completion and error states.
- **FL-VOI-134** Where reliable native pause/resume is not available, use Stop plus restart-from-sentence semantics rather than falsely claiming native pause/resume.
- **FL-VOI-135** Generated TTS audio SHALL NOT be persisted unless separately authorised.

## 6. Continuous conversation lock

- **FL-VOI-140** Auto-send SHALL optionally submit a final recognised utterance without an additional user tap.
- **FL-VOI-141** Auto-listen SHALL optionally reopen recognition after successful TTS completion.
- **FL-VOI-142** With Auto-send and Auto-listen enabled, the supported loop is `LISTENING → FINALIZING_STT → GENERATING → SPEAKING → LISTENING`.
- **FL-VOI-143** The loop SHALL guard against duplicate sends, duplicate recogniser starts, overlapping TTS and stale callbacks.
- **FL-VOI-144** Automatic return to listening SHALL be visibly communicated and SHALL not occur after ambiguous lifecycle interruption unless continuation is demonstrably safe.

## 7. Interruption / barge-in lock

- **FL-VOI-150** While `SPEAKING`, the user SHALL be able to interrupt playback and return to listening.
- **FL-VOI-151** The minimum interruption transition is `SPEAKING → INTERRUPTING → stop TTS → LISTENING`.
- **FL-VOI-152** Interrupting playback SHALL NOT delete, rewrite or hide the already-generated assistant message.
- **FL-VOI-153** Explicit `Interrupt` and `Stop` controls SHALL remain available where applicable even if automatic barge-in is supported.

## 8. Full-screen Voice UI lock

- **FL-VOI-160** Full Voice Mode SHALL be a dedicated subordinate conversational surface reachable from Chat; it SHALL NOT become a fifth primary navigation destination.
- **FL-VOI-161** The screen SHALL expose the actual voice state, current transcript/assistant response and relevant Stop/Interrupt controls.
- **FL-VOI-162** A keyboard/text fallback SHALL be reachable directly from Voice Mode and SHALL continue the same active conversation.
- **FL-VOI-163** Voice controls SHALL use the existing premium light Android design system and applicable frequent-control touch-target requirements.
- **FL-VOI-164** Protected provider/model configuration SHALL remain outside ordinary Voice controls and behind the existing protected configuration boundary.

## 9. Voice preferences lock

- **FL-VOI-170** Persist selectable installed voice, speech rate, Auto-send and Auto-listen preferences through the ordinary authorised persistence model.
- **FL-VOI-171** Voice preferences SHALL survive ordinary app restart/state restoration where the existing settings model supports it.
- **FL-VOI-172** Microphone permission status and recovery actions SHALL be presented truthfully; denied/unavailable STT SHALL not make typed Chat unusable.

## 10. Lifecycle and error-recovery lock

- **FL-VOI-180** Full Voice Mode SHALL handle Android Back, navigation away/return, app background/foreground, permission revocation, STT failure, TTS failure, provider/network failure and generation cancellation without corrupting conversation state.
- **FL-VOI-181** Ambiguous lifecycle interruption SHALL recover conservatively, normally to `STOPPED` or another explicitly recoverable state rather than silently reopening the microphone.
- **FL-VOI-182** Voice failure SHALL not trap the user or disable ordinary typed Chat.

## 11. Workspace Memory / telemetry lock

- **FL-VOI-190** Voice-originated generation SHALL use the same Workspace Memory selection/injection semantics as an equivalent typed request.
- **FL-VOI-191** No voice pathway may bypass workspace-memory isolation; Workspace A memory SHALL NOT enter Workspace B.
- **FL-VOI-192** Provider generation initiated through Voice Mode SHALL enter the ordinary Usage & Cost ledger.
- **FL-VOI-193** Applicable telemetry SHOULD include voice origin/session, workspace, conversation, model, token usage, latency, success/failure and provider-reported monetary cost where supplied.
- **FL-VOI-194** STT/TTS activity SHALL NOT be represented as OpenRouter token usage or fabricated provider monetary cost.

## 12. Privacy lock

- **FL-VOI-200** Raw microphone audio SHALL not be persisted, archived or exported by default.
- **FL-VOI-201** Only authorised derived state such as visible transcript, ordinary chat messages, voice preferences and bounded provenance/run metadata may persist.
- **FL-VOI-202** Existing privacy sanitisation, protected-secret exclusions and archive/export protections remain fully active for voice-originated content.

## 13. Accessibility lock

- **FL-VOI-210** Voice controls SHALL expose meaningful TalkBack labels, roles and states.
- **FL-VOI-211** Significant voice state changes SHALL be announced accessibly without continuously announcing every interim transcript update.
- **FL-VOI-212** Dynamic text scaling, logical focus order, focus restoration and reduced-motion treatment remain mandatory.
- **FL-VOI-213** Waveform/activity animation SHALL have a reduced-motion alternative that preserves state comprehensibility.

## 14. Deterministic regression lock

The deterministic suite SHALL cover at least:

- **FL-VOI-T001** IDLE → LISTENING.
- **FL-VOI-T002** permission denial/recovery.
- **FL-VOI-T003** interim/final transcript handling.
- **FL-VOI-T004** Android manual-stop fallback.
- **FL-VOI-T005** genuine STT failures remain failures.
- **FL-VOI-T006** final transcript → shared generation.
- **FL-VOI-T007** generation → TTS.
- **FL-VOI-T008** TTS completion → Auto-listen where enabled.
- **FL-VOI-T009** Auto-send/Auto-listen disabled semantics.
- **FL-VOI-T010** barge-in/Interrupt and explicit Stop.
- **FL-VOI-T011** generation cancellation.
- **FL-VOI-T012** stale STT/generation callback isolation.
- **FL-VOI-T013** lifecycle/background recovery reducer/state behaviour.
- **FL-VOI-T014** TTS/provider failure.
- **FL-VOI-T015** Voice usage provenance.
- **FL-VOI-T016** Workspace Memory integration/isolation.
- **FL-VOI-T017** keyboard fallback.
- **FL-VOI-T018** ordinary conversation-history persistence.
- **FL-VOI-T019** repeated voice-turn stability.

Existing passing tests SHALL NOT be removed or weakened merely to satisfy this feature lock.

## 15. Physical Android acceptance lock

The following remain runtime/device gates and SHALL NOT be reported PASS until actually executed against a fresh APK from the exact final source:

- **FL-VOI-D001** fresh APK installation/cold launch.
- **FL-VOI-D002** microphone permission grant and denial/recovery.
- **FL-VOI-D003** recognition start/interim/final transcript.
- **FL-VOI-D004** Android manual-stop regression.
- **FL-VOI-D005** repeated conversational turns.
- **FL-VOI-D006** Auto-send and Auto-listen.
- **FL-VOI-D007** TTS playback/voice/rate.
- **FL-VOI-D008** Interrupt/barge-in and Stop TTS.
- **FL-VOI-D009** Stop generation/network/provider recovery.
- **FL-VOI-D010** Android Back and background/foreground lifecycle.
- **FL-VOI-D011** keyboard fallback.
- **FL-VOI-D012** TalkBack/dynamic text/reduced-motion acceptance.
- **FL-VOI-D013** long/repeated session stability.
- **FL-VOI-D014** Usage/Cost provenance and Workspace Memory isolation under live execution.

## 16. Release and completion lock

- **FL-VOI-220** Full Voice Mode source completion requires STT → shared AI generation → TTS, continuous conversation controls, interruption, keyboard fallback, lifecycle/error recovery, Workspace Memory integration, telemetry, privacy, accessibility implementation and deterministic regressions.
- **FL-VOI-221** Full Voice Mode production acceptance additionally requires a fresh APK and actual Android/device evidence for all applicable mandatory gates.
- **FL-VOI-222** Source/static evidence cannot substitute for physical-device voice/TalkBack/runtime evidence.
- **FL-VOI-223** Unexecuted runtime/device/provider/signing gates SHALL be recorded as `NOT_EXECUTED`, `UNVERIFIABLE`, `PARTIAL` or `EXTERNAL_BLOCKED` as appropriate, never PASS.
- **FL-VOI-224** Production GO is prohibited while any mandatory locally actionable Full Voice defect remains open or any mandatory release gate lacks required evidence.

## 17. Explicit non-goals

This amendment does NOT authorise:

- a new provider family or parallel LLM client;
- a separate voice-only chat history;
- cloud storage of raw microphone audio;
- closed-app always-listening behaviour;
- wake-word monitoring;
- background microphone capture;
- a fifth primary navigation destination;
- dark mode;
- removal/weakening of the protected AI configuration boundary;
- replacement of the existing v1.4.3 Android manual-stop remediation without stronger verified evidence.

## 18. Precedence

This amendment supplements the current cumulative v1.5.0 Feature Lock. If an earlier Full Voice design note conflicts with this amendment, this amendment controls for Full Voice Mode unless a later explicit authorised amendment supersedes it.
