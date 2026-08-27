# Full Voice Mode Remediation Ledger

**Baseline:** DR_STONES_COMMAND_CENTRE_V1_5_0_HANDOVER_26082026064502.zip  
**Baseline SHA-256:** `466401cb44287b9b9d841f100c703d37ca5916a96471408bbb51ecd619f2532c`  
**Feature lock:** `DR_STONES_COMMAND_CENTRE_V1_5_0_FULL_VOICE_MODE_FEATURE_LOCK.md`

| Task ID | Requirement(s) | Baseline gap | Remediation | Local status | External gate |
|---|---|---|---|---|---|
| FV-001 | FL-VOI-100..104 | Legacy state names and generic ERROR; no stable voice callback provenance | Replaced Full Voice state machine with locked principal/error states, session/turn/run IDs, callback guards and state announcements | PASS | Physical lifecycle/device verification pending |
| FV-002 | FL-VOI-111..116 | Permission denial collapsed into generic error; final STT event not treated as turn boundary | Added REQUESTING_PERMISSION/PERMISSION_DENIED/STT_ERROR, final-result delivery, duplicate-start guard and conservative abort/end handling | PASS | Android STT device regression pending |
| FV-003 | FL-VOI-113..114 | Existing manual-stop fallback required preservation | Retained narrow Android explicit-stop client/code-5 transcript fallback unchanged | PASS | Physical Android manual-stop regression pending |
| FV-004 | FL-VOI-120..124 | Shared generation existed but voice session/turn provenance absent | Kept appendTurn/buildProviderRequest/startGeneration path; added VOICE origin, session and turn IDs | PASS | Live provider verification pending |
| FV-005 | FL-VOI-130..135 | Whole-response TTS only; no restart-from-sentence semantics/replay | Added sentence segmentation, per-sentence TTS run guard, Stop and replay from stopped sentence | PASS | Device TTS voice/rate/playback verification pending |
| FV-006 | FL-VOI-140..144 | Auto loop existed but no guarded visible auto-listen pending state | Added guarded auto-listen timer, duplicate protection and visible pending state; lifecycle cancels it | PASS | Repeated physical-turn verification pending |
| FV-007 | FL-VOI-150..153 | Tap-to-interrupt existed only through composer mic and legacy INTERRUPTED state | Added explicit INTERRUPTING transition and dedicated Interrupt/Stop controls | PASS | Physical barge-in/Stop verification pending |
| FV-008 | FL-VOI-160..164 | No dedicated Full Voice conversational surface | Added `FullVoiceScreen` subordinate full-screen modal from Chat with actual state, transcript, response, keyboard, replay, controls and Stop/Interrupt | PASS | UI/device acceptance pending |
| FV-009 | FL-VOI-170..172 | Preferences mostly present; permission status not modeled | Preserved voice/rate/auto settings persistence and added explicit permission status/recovery semantics | PASS | Restart/device permission verification pending |
| FV-010 | FL-VOI-180..182 | Background transition did not stop STT/TTS or recover voice state | Added lifecycle abort/stop and conservative STOPPED recovery; keyboard fallback focuses same chat composer | PASS | Android lifecycle verification pending |
| FV-011 | FL-VOI-190..194 | RequestKind voice existed but stable voice telemetry fields absent | Extended usage events with origin, voiceSessionId and voiceTurnId; no STT/TTS token attribution | PASS | Live OpenRouter usage/cost verification pending |
| FV-012 | FL-VOI-200..202 | No raw audio persistence found | Maintained recognition without recording persistence and retained ordinary privacy path | PASS | Archive/device review pending |
| FV-013 | FL-VOI-210..213 | State announcements and dedicated Voice surface absent | Added concise state announcements, labelled 48dp controls and reduced-motion-aware full-screen surface | PASS | TalkBack/dynamic-text physical acceptance pending |
| FV-014 | FL-VOI-T001..T019 | Dedicated Full Voice coverage was minimal | Added state, identity, lifecycle, sentence replay, UI/integration, provenance and privacy regression tests | PASS | Device-only tests remain external |
| FV-015 | FL-VOI-D001..D014 / 220..224 | Fresh APK/device/provider evidence absent | No false promotion; retained as external release gates | NOT_EXECUTABLE_HERE | REQUIRED |
