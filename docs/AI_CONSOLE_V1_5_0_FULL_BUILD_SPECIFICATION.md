# Dr Stones Command Centre v1.5.0 — Full Build Specification

> **Specification status:** AUTHORITATIVE TARGET — IMPLEMENTATION EXISTS; VERIFICATION IS TRACKED SEPARATELY  
> **Baseline:** Dr Stones Command Centre v1.4.3, inheriting the complete v1.4.0/v1.3.1 authorised scope  
> **Target:** Dr Stones Command Centre v1.5.0 — Command Intelligence  
> **Authority:** Explicit user-approved v1.5.0 scope + every non-conflicting requirement retained below  
> **Important:** This document is cumulative. Every pre-v1.5 requirement in this complete document remains active unless explicitly amended by Section 13. This document defines the authorised v1.5.0 target. Implementation and verification status are recorded separately; this specification does not by itself claim APK build, signing, device, accessibility, or live-provider acceptance.


## 1. Product objective

AI Console v1.4.0 SHALL be a premium Android-first AI productivity workspace in which chat, projects/workspaces and professional document authoring are equally coherent first-class workflows. The release SHALL preserve the authorised v1.3.1 behaviour while replacing incomplete, inconsistent or visually fragmented surfaces with a unified production-grade interaction system.

The principal user-facing domains SHALL be **Chats**, **Workspaces**, **Documents**, and **Settings**. Protected AI/provider/model/prompt configuration SHALL remain separated from ordinary settings behind the existing authorised six-digit-PIN boundary.

## 2. Build invariants

- **BLD-001** Preserve every non-conflicting authorised v1.3.1 feature and data contract.
- **BLD-002** Remediate all nine confirmed v1.3.1 audit defects before release readiness can be GO.
- **BLD-003** Do not expand Prompt Library beyond the minimum required to satisfy the existing v1.3.1 protected Prompt Library specification unless separately authorised.
- **BLD-004** Keep the application Expo/React Native Android-first unless a later authorised architecture decision supersedes it.
- **BLD-005** Keep OpenRouter-compatible streaming chat as the existing provider transport; do not introduce unrelated provider/model features.
- **BLD-006** Keep API key and PIN verifier in SecureStore and ordinary application state in versioned durable local storage.
- **BLD-007** Keep protected AI configuration out of ordinary exports/project archives where the v1.3.1 privacy contract excludes it.
- **BLD-008** Do not represent a debug-signed APK as production signed.
- **BLD-009** No unexecuted physical-device/provider/signing check may be reported as PASS.

## 3. Existing capability preservation

### 3.1 Conversations and generation

The build SHALL retain:
- stable chat/message IDs and versioned conversation state;
- streaming OpenRouter chat-completions;
- duplicate-send prevention, stop, retry, regenerate and stale-callback isolation;
- branch-aware edit/resubmit/regenerate history;
- copy, Markdown copy/export, share, quote, bookmark and applicable message actions;
- chat search, rename, pin, archive, delete, bulk actions, tags, folders and sort;
- workflow-tree parent/child relationships and ACTIVE/BLOCKED/COMPLETE state;
- local token estimates;
- offline draft queue separate from automatic provider replay;
- attachment intake and bounded text/ZIP context handling;
- safe Markdown and code rendering.

### 3.2 Workspaces

The build SHALL retain/create reliable workspace create/select/rename/archive/delete/notes behaviour, valid chat membership repair, project AI configuration only inside protected tools, and workspace-level association for chats/documents.

### 3.3 Protected AI configuration

The build SHALL retain the six-digit PIN gate and protected editing of the API key, provider/model/model catalogue, system prompt, Prompt Library, project AI settings, temperature, output-token controls and role configuration. Ordinary App Settings SHALL not expose those controls.

### 3.4 Data, privacy and portability

The build SHALL retain versioned persistence/migration, privacy sanitisation, safe JSON/chat exports, ordinary backup/restore, archive traversal/size/ratio controls, local PDF/share capability, and validated project archive semantics.

## 4. Document Studio Pro requirements

### 4.1 First-class Documents domain

- **DOC-001** Documents SHALL be a primary navigation destination, not merely a Settings export subsection.
- **DOC-002** Each workspace SHALL support multiple documents with stable IDs, title, status, timestamps, template/type metadata, revision metadata and workspace ownership.
- **DOC-003** Users SHALL be able to create, open, rename, duplicate, archive, restore/archive-state, and delete documents.
- **DOC-004** Document list SHALL support search, sort/filter, recent activity and clear workspace context.
- **DOC-005** Document cards SHALL show useful metadata and a professional preview/thumbnail treatment without exposing protected content.

### 4.2 Structured authoring

- **DOC-010** Each document SHALL support ordered sections/blocks with stable IDs and heading hierarchy.
- **DOC-011** Users SHALL be able to add, edit, delete, reorder and navigate sections.
- **DOC-012** Editor SHALL support rich Markdown-compatible authoring, headings, paragraphs, lists, links, quotes, code and page-break semantics where applicable.
- **DOC-013** Editor SHALL provide undo/redo and find-in-document.
- **DOC-014** Autosave SHALL expose explicit states such as `Saving`, `Saved`, `Save failed`; in-memory state alone SHALL NOT be represented as durably saved.
- **DOC-015** Unsaved or failed-save states SHALL survive navigation safely or warn before destructive exit.

### 4.3 Templates and composition

- **DOC-020** Built-in templates SHALL include at least: General Report, Technical Specification, Audit Report, Implementation Plan, Memorandum, Proposal and Formal Letter.
- **DOC-021** Templates SHALL initialise document structure and style without blocking later editing.
- **DOC-022** Documents SHALL support title/subtitle/author/metadata, cover page configuration, header/footer, page numbers, table of contents, page size, orientation and margins.
- **DOC-023** Table of contents SHALL derive from the structured heading hierarchy.
- **DOC-024** Print/PDF preview SHALL reflect the selected page/composition settings closely enough to make export outcome predictable.

### 4.4 Revision history and snapshots

- **DOC-030** Material document saves SHALL be capable of creating version/revision records according to a bounded retention policy.
- **DOC-031** Users SHALL be able to create named snapshots.
- **DOC-032** Revision browser SHALL show timestamp, label and relevant change metadata.
- **DOC-033** Users SHALL be able to compare revisions using a readable structural/text diff.
- **DOC-034** Restoring a revision SHALL create a recoverable new head revision rather than silently destroying history.

### 4.5 Chat-to-document workflows

- **DOC-040** Selected chat messages SHALL be insertable into a new or existing document.
- **DOC-041** Assistant output SHALL support `Add to document` from the message contextual menu.
- **DOC-042** AI-assisted document operations SHALL support append, insert and replace targets while respecting the existing protected model/configuration boundary.
- **DOC-043** Document generation SHALL never persist hidden request-only attachment/OCR/PDF extraction context into ordinary document metadata unless explicitly part of visible user content.

### 4.6 Export and portability

- **DOC-050** PDF export SHALL support the configured title hierarchy, page size/orientation/margins, cover page, TOC, headers/footers and page numbering where enabled.
- **DOC-051** Markdown, TXT and HTML export SHALL be available.
- **DOC-052** DOCX export SHALL be included only with an implementation capable of preserving the required document structure reliably; otherwise the release SHALL explicitly mark DOCX PARTIAL rather than fabricate fidelity.
- **DOC-053** Complete document-project ZIP export/import SHALL include schema/version manifest, documents, revisions permitted by export policy, styles/templates metadata and integrity records.
- **DOC-054** Import SHALL reject malformed, unsafe, future-incompatible, secret-bearing or integrity-failing archives before durable mutation.

## 5. Premium Android interaction requirements

- **AND-001** Secondary/contextual actions SHALL use coherent bottom-sheet/menu patterns rather than a mixture of inconsistent dialogs and permanent button rows.
- **AND-002** Long-pressing a message SHALL open a role/state-aware action menu/sheet containing only valid actions.
- **AND-003** Secondary touch targets SHALL be enlarged where usability requires it; critical frequent controls SHOULD meet a 48dp target and dense controls SHALL be device-reviewed.
- **AND-004** Compact layouts SHALL prioritise thumb-zone access for frequent actions without placing destructive controls in accidental reach.
- **AND-005** Persistent generation status SHALL remain visible/understandable when the user navigates within the app while a job is active.
- **AND-006** Stop, retry and regenerate SHALL have distinct visual and behavioural semantics.
- **AND-007** Shared native-style snackbar/toast/banner feedback SHALL replace silent or inconsistent operation feedback.
- **AND-008** Keyboard avoidance SHALL keep composer/editor/active controls usable with the Android IME visible.
- **AND-009** Android back handling SHALL close transient UI before navigation and SHALL preserve/guard unsaved work.
- **AND-010** Appropriate successful selections/confirmations MAY provide restrained haptic feedback, with accessibility/user preference respected.
- **AND-011** Empty states SHALL provide purpose-specific guidance and a meaningful next action.
- **AND-012** Modal/sheet hierarchy SHALL be consistent and SHALL prevent accidental overlay stacking.

## 6. Visual UI/UX system

- **VIS-001** Implement a shared design-token system for typography, spacing, dimensions, radii, borders, elevation, semantic state, motion, icon sizing, touch targets and responsive breakpoints.
- **VIS-002** Implement a deliberate typography hierarchy covering display, screen heading, section heading, document heading levels, body, UI labels, metadata, captions and code.
- **VIS-003** Replace inconsistent one-off surfaces with a coherent application/surface/card/sheet/dialog/document-canvas hierarchy.
- **VIS-004** Standardise buttons, icon buttons, inputs, text areas, selectors, search, tabs, navigation, chips, cards, lists, message bubbles, file/document cards, dialogs, sheets, menus, snackbars, banners, progress, skeletons and empty states.
- **VIS-005** Shared interactive components SHALL implement default, pressed, focused, selected, disabled, loading and error states where applicable.
- **VIS-006** Chat presentation SHALL be refined for readability and productivity: clear user/assistant distinction, restrained chrome, improved Markdown/code/attachments and reduced permanent action clutter.
- **VIS-007** Conversation/workspace lists SHALL improve title/metadata/selection hierarchy, search/filter presentation and contextual actions.
- **VIS-008** Document Studio SHALL use a purpose-designed professional authoring visual language rather than a Settings-style form layout.
- **VIS-009** Use skeleton/progressive loading and explicit loading/empty/error/offline states where applicable rather than unexplained blank surfaces.
- **VIS-010** Motion SHALL be subtle and functional; reduced-motion mode SHALL eliminate/reduce nonessential movement.
- **VIS-011** Edge-to-edge Android system-bar handling SHALL be deliberate and legible in supported visual modes.
- **VIS-012** Iconography SHALL be internally consistent in family, size, weight and alignment.

## 7. Responsive and adaptive UI

- **RSP-001** Compact layout: single-pane primary content, mobile navigation, contextual sheets.
- **RSP-002** Medium layout: navigation rail and selective split panes where useful.
- **RSP-003** Expanded layout: multi-pane productivity layout.
- **RSP-004** Expanded Document Studio SHOULD support `Document browser | Editor | Outline/properties` when width permits.
- **RSP-005** Tablet/foldable UI SHALL reflow/recompose rather than simply stretch phone components.
- **RSP-006** Landscape-phone layouts SHALL remain usable without hidden essential controls or horizontal overflow.
- **RSP-007** Applicable navigation/editor state SHALL survive orientation/activity recreation without unintended data loss.

## 8. Accessibility

- **A11Y-001** Every icon-only control SHALL expose a meaningful accessible label.
- **A11Y-002** Interactive elements SHALL expose appropriate role, state and value semantics.
- **A11Y-003** Focus order SHALL follow visual/task order and focus SHALL be restored after transient sheets/dialogs close.
- **A11Y-004** Generation, save, import/export, success and error state changes SHALL be communicated accessibly where material.
- **A11Y-005** Dynamic font scaling/high text zoom SHALL not make primary workflows unusable.
- **A11Y-006** Reduced-motion preference SHALL be explicitly honoured.
- **A11Y-007** Reorder/drag operations SHALL have an accessible non-drag alternative.
- **A11Y-008** Document outline/navigation SHALL be TalkBack navigable.
- **A11Y-009** Contrast and touch targets SHALL be reviewed across the authorised light appearance.
- **A11Y-010** Physical-device TalkBack/focus testing SHALL be a release acceptance gate when device access is available; otherwise it remains UNVERIFIABLE, not PASS.

## 9. Audit defect remediation requirements

- **FIX-001 / DEFECT-001** Complete the existing protected Prompt Library user workflow only to its already-authorised v1.3.1 contract: edit/version, duplicate, search, enabled/favourite, role, workspace assignment, import/export and variable substitution; no unrelated prompt expansion.
- **FIX-002 / DEFECT-002** Expose validated portable workspace project archive export/import end-to-end.
- **FIX-003 / DEFECT-003** Repair GitHub Actions paths to the actual canonical project layout and prove clean-checkout execution.
- **FIX-004 / DEFECT-004** Expose accessible workspace rename and persistence.
- **FIX-005 / DEFECT-005** Make restore success conditional on successful verified durable persistence; rollback on failure.
- **FIX-006 / DEFECT-006** Surface SecureStore API-key persistence failure and distinguish session-only state if supported.
- **FIX-007 / DEFECT-007** Detect/reject duplicate raw ZIP entry paths before JSZip/object-key collapse and add crafted regression coverage.
- **FIX-008 / DEFECT-008** Correct stale v1.3.0 README release identity.
- **FIX-009 / DEFECT-009** Correct/derive CI artifact identity from the current release metadata.

## 10. Data and persistence requirements

- **DATA-001** Introduce a new schema version only if Document Studio's model cannot be represented compatibly; migration SHALL be deterministic and idempotent.
- **DATA-002** Migration SHALL preserve all v1.3.1 conversations, branches, workspaces, organisation, queue state and privacy invariants.
- **DATA-003** Document saves and restores SHALL use explicit durable-success/failure outcomes.
- **DATA-004** Document revisions/snapshots SHALL use bounded retention or explicit user-controlled pruning to prevent uncontrolled local growth.
- **DATA-005** Import/restore operations SHALL validate fully before mutation and SHALL retain a recoverable prior state until durable completion is verified.
- **DATA-006** Request-only extraction context, API keys, PIN material and protected configuration SHALL not leak into ordinary document/project exports.

## 11. CI/release requirements

- **REL-001** Canonical release source paths SHALL be internally consistent between package layout, workflow working directory, cache path and artifact path.
- **REL-002** CI SHALL run deterministic install, static checks, unit/integration tests, Expo diagnostics, production dependency audit policy, export/prebuild/build and signing/certificate verification where credentials permit.
- **REL-003** Release identity SHALL be derived or consistently updated across package/app metadata, README, docs, artifact names and handover/release evidence.
- **REL-004** Production signing secrets SHALL remain external to source and ordinary archives.
- **REL-005** Debug/test and production artifacts SHALL be unambiguously labelled.

## 12. Verification and release acceptance

A release candidate SHALL execute, where facilities permit:
1. static/syntax/import/dependency checks;
2. complete deterministic unit/domain tests;
3. migration and persistence failure-injection tests;
4. chat generation/branching/workspace regressions;
5. Prompt Library minimum-contract regressions;
6. document create/edit/revision/template/export/import workflows;
7. archive duplicate/traversal/size/ratio/integrity tests;
8. restore rollback and SecureStore failure tests;
9. responsive layout checks for representative compact/medium/expanded widths;
10. physical Android keyboard, back, haptics, native share/file picker/PDF and TalkBack checks where available;
11. clean-checkout CI build and signing verification where release credentials are available.

**Release readiness SHALL remain NO-GO while any locally actionable HIGH blocker or mandatory locked requirement remains open.** External unavailable gates SHALL be recorded as PARTIAL/UNVERIFIABLE rather than silently promoted to PASS.


## 13. v1.5.0 Command Intelligence feature requirements

### 13.1 Architectural invariants

- **INT-001** v1.5.0 SHALL preserve the Expo/React Native application, Android application ID `com.nexarenew.aiconsole`, light-only appearance, protected AI settings boundary, local-first persistence, and the four primary destinations **Chats / Workspaces / Documents / Settings**.
- **INT-002** Command Intelligence SHALL be an integrated global/workspace surface, not a fifth primary destination.
- **INT-003** Existing chats, documents, project archives, ordinary backup/restore, protected configuration, branching, generation controls and Document Studio workflows SHALL remain functional.
- **INT-004** Persistent application schema SHALL advance to v5 using deterministic forward migration; existing data SHALL not be destructively rewritten.

### 13.2 Workspace Memory

- **MEM-001** Each workspace SHALL own an isolated persistent memory collection. Memories from one workspace SHALL NOT be injected into another workspace unless the user explicitly copies/recreates them there.
- **MEM-002** Memory records SHALL support type, title, content, enabled state, pinned state, provenance/source metadata, created/updated time and last-used time.
- **MEM-003** Users SHALL be able to create, edit, pin/unpin, enable/disable and delete memories from the Command Intelligence UI.
- **MEM-004** Prompt augmentation SHALL visibly distinguish Workspace Memory as user-controlled context and SHALL not elevate memory above system/project instructions.
- **MEM-005** Memory selection SHALL be bounded and deterministic, with pinned memories preferentially included and query relevance used when available.
- **MEM-006** When injected memories are used, the application SHALL update their last-used metadata without crossing workspace boundaries.

### 13.3 Skills

- **SKL-001** Skills SHALL be reusable, versioned workflow definitions with name, description, workspace scope, enabled state, ordered steps and output action.
- **SKL-002** Supported step types SHALL include AI prompt, save memory and create document; supported step conditions SHALL include always, previous-result, variable and connectivity predicates.
- **SKL-003** Skills SHALL support template variables including input, previous step output, workspace name, Workspace Memory context and named user variables.
- **SKL-004** Skill runs SHALL retain the exact skill ID/version, workspace, optional task origin, status, step results, output, timestamps and failure state.
- **SKL-005** Built-in starter Skills SHALL include Workspace Brief, Memory Curator and Weekly Review and SHALL be seeded only during upgrade/new-state initialisation rather than duplicated on every normalisation.
- **SKL-006** Users SHALL be able to create, duplicate, enable/disable, execute and delete eligible custom Skills. Built-in definitions SHALL not be silently destroyed.
- **SKL-007** Skill outputs SHALL support chat, document, memory or no automatic destination.

### 13.4 Usage & Cost Dashboard

- **USG-001** Every supported OpenRouter generation path SHALL record a usage event for chat, voice, Skill, scheduled task and Document Studio AI operations where applicable.
- **USG-002** The provider request SHALL ask OpenRouter for usage data and SHALL consume provider-returned token/cost metadata when supplied.
- **USG-003** Token estimates MAY be used where provider token counts are absent, but monetary cost SHALL NOT be fabricated or calculated from unverified pricing. Missing provider cost SHALL remain explicitly unavailable.
- **USG-004** Each usage event SHALL record workspace/chat/Skill/task linkage where applicable, model, provider, request kind, prompt/completion/total tokens, cost provenance, latency, status and timestamp.
- **USG-005** The dashboard SHALL provide Today / 7 days / 30 days / All time summaries and model breakdowns including requests, tokens, provider-reported cost and latency where available.
- **USG-006** Usage history SHALL use bounded retention suitable for local persistence.

### 13.5 Scheduled & Conditional Tasks

- **TSK-001** Tasks SHALL persist definitions and execution history in schema v5 state.
- **TSK-002** Supported schedules SHALL include one-time, interval, daily and weekly recurrence.
- **TSK-003** Supported conditions SHALL include always, online, active-workspace and has-memory predicates.
- **TSK-004** A task SHALL be able to execute either a Skill or a direct prompt and SHALL retain status, next/last run time, errors and run records.
- **TSK-005** Tasks SHALL support enable/disable, run-now and delete controls.
- **TSK-006** This release SHALL guarantee scheduling while the application is active plus catch-up evaluation on app launch/resume. It SHALL NOT claim OS-level closed-app/background execution without a separately integrated and device-verified native background scheduler.
- **TSK-007** Project-archive imports SHALL pause imported scheduled tasks by default to prevent unintentional autonomous execution until explicitly re-enabled.

### 13.6 Full Voice Mode

- **VOI-001** Full Voice SHALL implement a state machine covering IDLE, LISTENING, FINALISING, THINKING, SPEAKING, INTERRUPTED and ERROR.
- **VOI-002** Full Voice SHALL integrate the existing guarded speech-recognition module, OpenRouter generation path and Expo Speech TTS rather than creating a parallel provider architecture.
- **VOI-003** Users SHALL be able to enable Full Voice, auto-send recognised transcripts, auto-listen after responses, enable/disable spoken responses, choose an available TTS voice and control playback rate.
- **VOI-004** Barge-in/interruption SHALL stop current TTS and allow the recognition workflow to resume without losing the ordinary text-chat fallback.
- **VOI-005** The Android explicit-manual-stop transcript-preservation fallback introduced in v1.4.3 SHALL remain scoped only to the known recoverable Android client/code-5 condition and SHALL not mask other speech errors.
- **VOI-006** If speech/TTS is unavailable or fails, the user SHALL retain normal text interaction and a visible error/recovery state.

### 13.7 Import/export, privacy and verification

- **INT-005** Workspace project archive schema SHALL advance to v3 and include workspace memories, Skills, Skill runs, usage data, scheduled tasks and task runs while preserving archive integrity and raw-ZIP protections.
- **INT-006** Imported IDs SHALL be remapped to avoid collision and imported tasks SHALL be disabled/paused by default.
- **INT-007** API keys, PIN material and other protected secrets SHALL remain excluded from ordinary workspace/project intelligence exports according to the existing privacy boundary.
- **INT-008** Deterministic verification SHALL include dedicated Workspace Memory, Skills, usage/cost, scheduling and Full Voice state-machine tests in addition to the complete inherited regression suite.
- **INT-009** A fresh v1.5.0 APK, signing identity, Android 16/API-36 behaviour, 16-KB acceptance, speech recognition, TTS, foreground/background lifecycle and physical accessibility remain release/device gates and SHALL NOT be reported PASS without execution evidence.
