# DR STONES COMMAND CENTRE — v1.5.4 SUCCESSOR AUTONOMOUS COMPLETION CONTINUATION PROMPT

## MISSION

Continue the existing Dr Stones Command Centre successor implementation from its current in-progress v1.5.4 working state and drive it through implementation, remediation, verification, regression, packaging, persistence and handover as far as the available environment genuinely permits.

Do not restart the application.
Do not rebuild from an older release.
Do not discard already implemented v1.5.4 work.
Do not promote an incomplete or insufficiently verified release.
Do not claim execution or verification that did not occur.

## 1. MANDATORY GOVERNANCE BOOTSTRAP

Before substantive work:

1. Retrieve and read the complete current authoritative `/Master Documents/MASTER_LLM_OPERATING_RULES.md`.
2. Apply its current authority, precedence, dependency-resolution, remediation, verification, packaging, persistence, integrity and handover rules.
3. Reconcile the current project Feature Locks, specifications, amendments, implementation reports and explicit instructions.
4. Treat superseded releases as provenance only.
5. Do not select a baseline merely because it has the newest timestamp, largest file size or highest version-like filename.
6. Apply PASS / FAIL / PARTIAL / UNVERIFIABLE truthfully.
7. Unexecuted work is never PASS.
8. Missing optional tooling blocks only the work that genuinely requires that tooling. Continue all meaningful implementation, static analysis, deterministic testing and alternative verification.
9. If a required dependency is missing, follow DEP-001 before replacing, downloading, changing version or declaring a blocker.
10. Never claim an APK build, device test, provider request, upload, persistence operation, clean extraction, signing verification or other execution occurred unless it actually occurred.

Expected governing Master Rules at this continuation point: Master Rules v1.2.18 / revision 20260826-02. Reverify rather than assuming this remains current.

## 2. AUTHORITATIVE RELEASE BASELINE

The last authoritative, persisted release remains:

- Dr Stones Command Centre v1.5.3 Dual Provider
- Android versionCode: 18
- Application ID: `com.nexarenew.aiconsole`
- Authoritative handover: `DR_STONES_COMMAND_CENTRE_V1_5_3_DUAL_PROVIDER_HANDOVER_26082026103314.zip`
- Expected SHA-256: `69d93cdacb66343e5c99ca9ac4d7b9adb6d7fc88faa1865969d1f092aad1c039`

IMPORTANT: v1.5.3 remains the authoritative release baseline until a qualifying successor handover has been completed, verified, persisted and promoted. Do not overwrite or demote it merely because an unfinished v1.5.4 working tree exists.

## 3. CURRENT SUCCESSOR WORKING STATE

An in-progress successor has already been developed:

- Target release: v1.5.4
- Target Android versionCode: 19
- Target storage schema: 6

Locate the most complete current v1.5.4 working source before making new changes. The previous working directory was `/mnt/data/dscc_vnext_v154_source/`; do not assume that temporary path still exists in a new environment. Locate the persisted/current working material first.

The latest known deterministic checkpoint BEFORE the final Skills/Tasks remediation was `123 / 123 tests PASS, 0 failures, 0 skips`. That result MUST NOT be treated as verification of the final current tree, because material Skills and Tasks changes were made afterward. The final current tree therefore requires complete re-verification.

## 4. AUTHORITATIVE SUCCESSOR TARGET

Load and apply `DR_STONES_COMMAND_CENTRE_VNEXT_MASTER_MERGED_FEATURE_SPECIFICATION_26082026115215.md`.

This is the cumulative successor target. It explicitly preserves the v1.5.3 architecture and merges useful capabilities from the authoritative v1.5.3 lineage, the supplied ARM64 v1.4.2 comparison APK, the divergent v1.5.2 comparison APK, the complete non-conflicting v1.5 Command Intelligence programme, and the v1.5.3 OpenRouter + Together dual-provider lock.

Do not reintroduce obsolete branch architecture simply because a feature was first discovered in an older APK.

## 5. IMPLEMENTED v1.5.4 WORK TO PRESERVE

The following work has already been implemented in the successor working tree and must be preserved unless inspection proves it defective.

### A. AI IMAGE GENERATION

- Manual image generation from Chat.
- OpenRouter image-generation integration.
- Dedicated image-model selection.
- Image model kept separate from normal text model.
- Durable generated-image output.
- Unique generated-image identity.
- Conversation provenance.
- Image preview.
- Sharing/export integration.
- Explicit error/recovery states.
- No silent image-provider fallback.
- No third provider.

### B. USAGE / COST / BUDGETS

- Local pricing assumptions.
- Estimated-cost classification.
- Provider-reported cost remains distinct.
- Global budgets.
- Workspace budgets.
- Budget warning thresholds.
- Pre-provider hard-stop enforcement.
- Clear local usage history workflow.
- Disclosure that provider billing/history is not erased.

### C. WORKSPACE MEMORY

- Expanded memory entity.
- Title.
- Tags.
- Priority.
- Archive state.
- Search.
- Filtering.
- Editing.
- Bulk deletion.
- Usage counts.
- Schema migration support.

### D. STORAGE

Storage schema migration is schema 5 -> schema 6. Existing chats, documents, workspaces, Skills, Tasks, Voice preferences, provider credentials and other authorised state must remain migratable.

### E. PROVIDERS

Preserve exactly the authorised text providers: OpenRouter and Together AI.

Correct text endpoints:

- OpenRouter: `https://openrouter.ai/api/v1/chat/completions`
- Together: `https://api.together.ai/v1/chat/completions`

Do NOT restore the divergent `api.together.xyz` endpoint. Do NOT introduce automatic OpenRouter <-> Together provider failover. Do NOT introduce a third text provider.

### F. PRODUCT SHELL

Preserve light-only UI, Android-first Expo / React Native architecture, application ID `com.nexarenew.aiconsole`, and exactly four primary destinations: Chats, Workspaces, Documents, Settings. Do not add a permanent fifth Automation/Memory/Skills/Tasks/Images tab.

## 6. LATEST SKILLS REMEDIATION TO PRESERVE AND VERIFY

A deeper audit found the inherited v1.5.3 Skills implementation was materially thinner than its locked specification. The successor Skills engine was therefore advanced to schema 2.

Known implemented/remediated work includes:

- PROMPT
- GENERATE
- CONDITION
- SET_VARIABLE
- WRITE_DOCUMENT
- NOTIFY
- Skill validation
- draft-from-published behaviour
- immutable published-version snapshots
- content hashes
- exact Skill-version resolution
- retire semantics
- accessible step reordering
- safe Skill import/export primitives
- stable Skill-run correlation IDs
- legacy compatibility where required

Do not assume these are correct merely because code exists. Test them.

Required Skills target includes Skills library, search/filter, create, duplicate, draft editing, validation, publish, immutable published versions, new draft from published version, manual run, scheduling, disable/retire, import/export, run history, output links, usage links, exact version pinning, accessible Move Up / Move Down controls, and useful error/recovery states.

Starter Skills remain Workspace Brief, Memory Curator and Weekly Review.

## 7. LATEST TASKS REMEDIATION TO PRESERVE AND VERIFY

The inherited Tasks implementation was also found to be thinner than the authorised target. The successor Tasks engine was advanced to schema 2.

Known implemented/remediated work includes:

Triggers:
- Once
- Interval
- Daily
- Weekly
- Condition

Execution policies:
- FOREGROUND_REQUIRED
- BEST_EFFORT_BACKGROUND
- NOTIFY_ONLY

Also preserve and verify timezone metadata, occurrence preview, expanded local conditions, exact Skill-version pinning, scheduled timestamp, actual start timestamp, execution environment, correlation ID, deterministic run keys, and idempotency/reconciliation.

Required Tasks target includes create, edit, duplicate, delete, pause/resume, Run Now, next occurrence, exact Skill-version display, execution-policy explanation, notification policy, run history, scheduled versus actual start evidence, offline/deferred state, foreground-required state, idempotent catch-up, and truthful Android background limitations.

Never imply Android guarantees exact closed-app JavaScript execution.

## 8. KNOWN REMAINING IMPLEMENTATION WORK

Inspect the actual working tree first, then complete every still-missing locally actionable requirement.

At the previous continuation point the known remaining gaps included:

1. Richer Skill Builder UI and complete engine/UI wiring.
2. Richer Task editor, trigger picker, condition builder and run-history UI wiring.
3. Per-request Workspace Memory controls: selected count, selection preview, exclusion reasons, context-budget limitation, Why selected?, per-request deselection, one-request Memory off.
4. Persistent global Skill/Task execution-status banner.
5. Enhanced workspace/model/usage header integration.
6. Usage-event detail and correlation navigation: Task -> Skill -> output and reverse links where records exist.
7. Native Task-notification education and permission integration.
8. Any remaining gaps between implementation and the complete merged feature specification.

This list is not permission to ignore other defects discovered during inspection. If another locally actionable defect prevents compliance, remediate it.

## 9. FULL VOICE MODE

Preserve and verify the complete Full Voice Mode programme.

Required state model includes `IDLE`, `REQUESTING_PERMISSION`, `LISTENING`, `FINALIZING_STT`, `READY_TO_SEND`, `GENERATING`, `SPEAKING`, `INTERRUPTING`, `STOPPED`, plus explicit `PERMISSION_DENIED`, `STT_ERROR`, `GENERATION_ERROR`, `TTS_ERROR`.

Preserve interim/final transcript, Android manual-stop recognition workaround, auto-send, auto-listen where authorised, speech output, installed voice selection, speed, Stop/replay, interruption/barge-in, keyboard fallback, lifecycle recovery, and no raw microphone-audio persistence.

Voice must use the shared Chat/provider/Workspace Memory/generation/usage architecture rather than a parallel provider path.

## 10. DOCUMENT STUDIO PRO

Do not regress Document Studio. Preserve the authorised document programme including multiple workspace documents; create/open/rename/duplicate/archive/delete; search/sort; headings/sections; section reordering; Markdown-compatible editing; undo/redo/find; durable autosave states; templates; cover/title metadata; headers/footers; page numbering; TOC; page size/orientation/margins; preview; revision history; snapshots; comparison/restore; Chat-to-document insertion; AI append/insert/replace; PDF/Markdown/TXT/HTML export; DOCX only where fidelity is actually achieved; project/document ZIP import/export; local PDF extraction/review/OCR where currently authorised.

## 11. UI / UX / ANDROID ACCEPTANCE

The successor must remain premium Android-first and light-only.

Inspect and remediate visual hierarchy, spacing, typography, cards/sheets, responsive compact/tablet layouts, safe areas, edge-to-edge behaviour, display cutouts, IME/keyboard avoidance, one-handed ergonomics, minimum 48dp touch targets, Android system Back behaviour, loading states, empty states, offline states, disabled/blocked states, error/recovery states, success feedback, long-running Stop controls, and blank-screen dead ends.

Android Back should progressively dismiss a picker/dialog/sheet, leave a nested editor, leave subordinate detail, then return to the destination root. Unsaved destructive exits require appropriate confirmation.

## 12. ACCESSIBILITY

Inspect and remediate applicable TalkBack labels, accessibility roles, selected-state semantics, progress values, focus order, focus restoration, modal focus, dynamic text, reduced motion, non-colour status communication, accessible Skill reordering, accessible image-generation controls, and accessible cost/provider semantics.

Do not claim physical TalkBack acceptance unless actually executed on an appropriate device/environment.

## 13. VERIFICATION SEQUENCE

After implementation changes:

A. Run syntax/parser/static checks on every materially edited JS/JSX/MJS surface.

B. Run the complete deterministic test suite. The previous pre-final-remediation checkpoint was 123 / 123 PASS. The current final tree must establish a NEW result. Do not reuse the old result.

C. Add/update tests for material newly implemented behaviour, especially Skill version immutability, draft -> publish, exact Skill version resolution, all supported Skill step types, Task trigger calculation, timezone/occurrence preview, Task execution policy, deterministic Task run keys, Task idempotency, scheduled vs actual evidence, Memory per-request overrides, budget warning/hard stop, image generation provider isolation, schema 5 -> 6 migration, and existing dual-provider regression.

D. Run project static verification scripts.

E. Run CI/release identity guards applicable to the working tree.

F. Re-run every failed or affected test after remediation.

G. Perform full regression before release/handover.

Classify every verification area truthfully: PASS / FAIL / PARTIAL / UNVERIFIABLE.

## 14. DEPENDENCIES

If a dependency is missing: inspect the Library `dependencies` folder first where available; inspect the project dependency bundle; preserve the project-selected version; do not silently upgrade/substitute; continue source/static work if runtime dependency restoration is not required for that work.

A prior environment contained an exact JSZip dependency that allowed archive tests to run even though an attempted npm dependency restoration had not completed. Do not convert that historical fact into an assumption about the new environment.

## 15. APK / ANDROID BUILD

After source verification is clean, attempt the actual Android build if the environment permits it.

If an APK is genuinely built: locate the actual APK; record exact filename/path; record debug/release classification; record size; inspect package/application ID; inspect versionName/versionCode; verify signature state where tooling permits; calculate SHA-256 where applicable; perform available install/runtime checks.

Do not report an APK merely because configuration exists. Do not report a predicted output path as a generated APK.

If no compatible Android build environment exists, classify the APK gate PARTIAL or UNVERIFIABLE and continue every other meaningful release check.

## 16. LIVE PROVIDER TESTING

If valid credentials and network access are available, test OpenRouter text generation, Together text generation, OpenRouter image generation, provider switching, no silent provider fallback, usage capture, and budget preflight behaviour.

Do not expose API keys in output or evidence.

If credentials/network are unavailable, leave these gates UNVERIFIABLE rather than FAIL unless the application itself demonstrably fails before the external boundary.

## 17. PHYSICAL DEVICE / EXTERNAL GATES

Where facilities permit, test Android launch, navigation, Back, IME, image generation, camera/gallery, Full Voice, interruption/barge-in, notifications/tasks, offline/restart persistence, TalkBack, dynamic text, and reduced motion.

If physical-device execution is unavailable, do not stop source completion. Record the gate as UNVERIFIABLE/PARTIAL.

## 18. RELEASE PROMOTION RULE

Do NOT promote v1.5.4 merely because implementation is substantially complete.

Promotion requires the applicable release/handover gates. Before promotion:

1. reconcile implementation with the complete merged specification;
2. reconcile versionName/versionCode/schema metadata;
3. update affected project documentation;
4. create final verification evidence;
5. finalise release-controlled bytes;
6. create the complete timestamped HANDOVER ZIP;
7. ensure it contains the complete application, not patches only;
8. include at least one complete authoritative specification;
9. include relevant verification evidence;
10. verify archive integrity;
11. clean re-extract and inspect the handover;
12. verify release identity and self-containment;
13. verify no required file depends on an older handover;
14. persist the verified handover in the canonical project files;
15. verify persistence.

Only after those gates may the successor become the current authoritative baseline under HAND-008.

If those gates cannot be satisfied, preserve v1.5.3 as authoritative and report v1.5.4 as an in-progress/provisional successor.

## 19. HANDOVER PACKAGE

If the successor qualifies for handover, create a filename using `DR_STONES_COMMAND_CENTRE_V1_5_4_<DESCRIPTOR>_HANDOVER_DDMMYYYYHHMMSS.zip` with a real timestamp.

The handover must be independently usable and contain complete current source/application, package manifests/lockfile as applicable, complete authoritative merged specification, relevant technical/feature documentation, implementation/remediation report, verification report, known external gates, continuation/handover prompt, release/version metadata, and applicable integrity evidence. Do not package temporary caches or secrets merely for completeness.

## 20. PERSISTENCE

Persist final qualifying project artefacts to the canonical Dr Stones Command Centre / AI Console project files. Keep project structure organised. The merged specification belongs with project specifications. A qualifying handover belongs in the handover area. Verification evidence belongs in QA/evidence.

Do not overwrite useful historical v1.5.3 provenance. After upload/persistence, verify the resulting file/location. Never claim persistence from an intended upload.

## 21. CURRENT RELEASE POINTER

Do not modify `AI_CONSOLE_CURRENT_VERSION.md` or equivalent authoritative current-release pointer until v1.5.4 genuinely qualifies under the release/handover rules.

If v1.5.4 qualifies: update the pointer; identify the exact new handover; identify versionName/versionCode; record its verified persistence state; ensure no stale pointer still calls v1.5.3 current.

If v1.5.4 does not qualify: leave v1.5.3 current and record precisely why promotion remains blocked.

## 22. AUTONOMOUS EXECUTION CONTRACT

Continue autonomously through:

`inspect -> reconcile -> implement -> test -> diagnose -> remediate -> retest -> regression -> release reconciliation -> package if qualified -> clean-package verification -> persist if qualified -> verify persistence -> promote only if qualified`

Do not stop after merely finding defects. Do not ask for approval for fixes already authorised by this prompt. Only stop for a genuine blocker requiring information, credentials, hardware, external authority or an unavailable mandatory capability. When a stronger external test is unavailable, continue all meaningful lower-level work.

## 23. FINAL REPORT

At completion provide:

1. MASTER RULE BOOTSTRAP status.
2. Exact baseline used.
3. Exact successor version/build/schema.
4. Features implemented/remediated.
5. Remaining defects, if any.
6. Deterministic test result with exact pass/fail/skip counts.
7. Static verification result.
8. APK build result.
9. Live-provider verification result.
10. Android/device verification result.
11. Accessibility verification result.
12. Package/handover result.
13. Persistence result.
14. Current authoritative baseline after the run.
15. Production verdict: GO / CONDITIONAL GO / NO-GO.

Do not combine unavailable external gates with locally failed tests. A clean local implementation with unavailable physical-device/provider testing may be reported as locally verified with external gates, but never as fully device/provider verified.

## 24. SUCCESS CONDITION

The desired end state is:

- every locally actionable merged-spec requirement implemented;
- no known locally actionable P0/P1/P2 implementation defect left open;
- complete deterministic suite PASS;
- affected regression PASS;
- source/static verification PASS;
- documentation/release identity reconciled;
- complete handover built and clean-verified if release-qualified;
- handover persisted and verified;
- v1.5.4 promoted only when the applicable HAND-008 requirements are genuinely satisfied;
- all unavailable external gates explicitly retained rather than fabricated.

Begin immediately by retrieving the current Master Rules, locating the most complete v1.5.4 working source, reconciling it against the authoritative v1.5.3 baseline and merged vNext specification, and continuing the unfinished implementation and verification loop.
