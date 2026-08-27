# Dr Stones Command Centre — vNext Master Merged Feature Specification

**Document status:** PROPOSED ADDITIVE NEXT-TARGET SPECIFICATION — IMPLEMENTATION NOT YET AUTHORISED BY THIS DOCUMENT ALONE  
**Created:** 26/08/2026 11:52:15 Europe/London  
**Current authoritative implementation baseline:** v1.5.3 Dual Provider  
**Current Android versionCode:** 18  
**Application ID:** `com.nexarenew.aiconsole`  
**Current authoritative handover:** `DR_STONES_COMMAND_CENTRE_V1_5_3_DUAL_PROVIDER_HANDOVER_26082026103314.zip`  
**Current authoritative handover SHA-256:** `69d93cdacb66343e5c99ca9ac4d7b9adb6d7fc88faa1865969d1f092aad1c039`  
**Master Rules:** v1.2.18 / revision 20260826-02  

---

## 1. Purpose and authority

This document defines the **cumulative feature-union target** requested for Dr Stones Command Centre. It merges:

1. every active authorised capability already present in the current v1.5.3 project lineage;
2. materially useful feature behaviour evidenced in the supplied ARM64 v1.4.2 APK;
3. materially useful feature behaviour evidenced in the supplied divergent v1.5.2 APK;
4. the complete non-conflicting v1.5.0 Command Intelligence / Full Voice feature programme and planned UI flows;
5. the current v1.5.3 OpenRouter + Together AI dual-provider feature lock.

This is an **additive next-target specification**. It does not silently demote, replace or modify the current v1.5.3 release. The current v1.5.3 handover remains the authoritative implementation baseline until a successor is implemented, verified, packaged, persisted and promoted under the applicable handover rules.

### 1.1 Explicit authority effect

The user's current instruction authorises the next-target specification to include the useful feature union from the compared APKs. Accordingly, this document **supersedes the current v1.5.3 image-generation exclusion for the future implementation target only**. It does not make image generation part of the already-published v1.5.3 implementation.

All other current v1.5.3 locks survive unless this document explicitly changes them.

### 1.2 Non-regression rule

No existing authorised v1.5.3, v1.5.0, v1.4.x or preserved v1.3.1 feature may be removed merely because this specification adds a richer replacement UI or combines earlier divergent implementations.

Where an older APK implements a feature through a legacy parallel store or obsolete service path, the **behaviour** may be carried forward but the current canonical v1.5.3 architecture remains the implementation base. Legacy parallel data stores, obsolete endpoints and contradictory settings are not reintroduced merely to copy old code.

---

## 2. Evidence and lineage used for the merge

### 2.1 Current authoritative implementation

- Release: v1.5.3 / versionCode 18.
- Handover: `DR_STONES_COMMAND_CENTRE_V1_5_3_DUAL_PROVIDER_HANDOVER_26082026103314.zip`.
- SHA-256: `69d93cdacb66343e5c99ca9ac4d7b9adb6d7fc88faa1865969d1f092aad1c039`.
- Locked additions already implemented in source: Workspace Memory, Skills, Usage & Cost ledger/dashboard, Scheduled & Conditional Tasks, Full Voice Mode, OpenRouter + Together AI selection.
- Current source verification evidence: 117 deterministic tests PASS, package/source integrity PASS; fresh v1.5.3 APK/device/live-provider acceptance remains unexecuted according to the current-version record.

### 2.2 Supplied ARM64 v1.4.2 comparison APK

- File: `Dr_Stones_Command_Centre_5f0777d_arm64_debug.apk`.
- SHA-256 of the supplied comparison file: `77de69efdf6246821750476ddbdce72a4b75967ad32e7b145270e9668257529b`.
- Material feature evidence retained for this union:
  - Local Memory Vault management behaviour;
  - edit/create/delete and bulk-clear memory actions;
  - Cost & Usage Control;
  - monthly budget guardrail;
  - hard request blocking at budget limit;
  - local pricing assumptions labelled as estimates;
  - local usage-history clearing;
  - existing attachment/APK/media/document capabilities where not already superseded by current v1.5.3 equivalents.

### 2.3 Supplied divergent v1.5.2 comparison APK

- File: `142.apk`.
- SHA-256 of the supplied comparison file: `df690cb6f44ab7590bf093ec6e7713f17e17d2f000537792ecc690c3a9a991cc`.
- Material feature evidence retained for this union:
  - manual AI image generation from the current chat composer prompt;
  - OpenRouter image-model concept;
  - generated-image attachment/output handling;
  - user-facing image-generation error/recovery states.

The v1.5.2 APK is not adopted as the canonical implementation baseline. Its branch-specific automatic/dark appearance and obsolete/incorrect provider transport details are explicitly rejected below.

---

## 3. Product shell and primary information architecture

### 3.1 Four primary destinations remain locked

The application SHALL retain exactly four primary destinations:

1. **Chats**
2. **Workspaces**
3. **Documents**
4. **Settings**

There SHALL be no permanent fifth bottom-navigation destination for Memory, Skills, Tasks, Automation, Usage, Voice or Images.

### 3.2 Feature homes

- **Chats:** conversation, attachments, generated images, per-request memory context, Full Voice Mode.
- **Workspaces:** workspace overview, Workspace Memory, Skills, Tasks and workspace automation history.
- **Documents:** Document Studio Pro and document AI.
- **Settings:** General settings, Usage & Cost, persistent Voice preferences, Backup/Restore.
- **Protected AI & Prompt Settings:** provider, provider credentials, model selection, image-model selection where applicable, Prompt Library and protected project/system settings.

### 3.3 Global header

The global header SHALL expose, subject to responsive space:

- active workspace;
- active text-generation provider/model;
- generation state when active;
- compact usage/token/cost affordance;
- a route to Settings.

A running Skill/Task/background operation SHALL remain visible through a persistent global execution-status banner when the user navigates elsewhere.

---

## 4. Chats and conversation management

All current conversation capabilities remain required:

- streaming generation;
- stable chat/message identities;
- edit/resubmit/regenerate lineage;
- branching;
- bookmarks/pinning where currently supported;
- search;
- rename;
- archive;
- delete and bulk actions;
- tags/folders/sorting where currently supported;
- workflow-tree/status behaviour;
- stop/retry/regenerate states;
- offline/deferred generation handling;
- safe Markdown and code rendering;
- request provenance and usage linkage.

### 4.1 Composer

The chat composer SHALL support:

- multiline text;
- ordinary Send;
- Stop while generating;
- file/document attachment;
- gallery image attachment;
- camera capture;
- APK/ZIP/text/context staging where currently authorised;
- Workspace Memory context chip;
- microphone / speech input;
- accessible entry to Full Voice Mode;
- **Create image** action defined in section 5.

Long-running operations SHALL expose visible cancellation and SHALL never report optimistic success before completion.

---

## 5. New merged feature: AI image generation

### 5.1 Scope

Manual image generation is now part of the vNext target.

The first implementation SHALL reproduce the useful behaviour evidenced in the divergent v1.5.2 APK while integrating it into the current v1.5.3 architecture.

### 5.2 User flow

From an active Chat:

1. user enters an image description in the existing composer;
2. user invokes **Create image** from the attachment/action surface or another equally reachable composer action;
3. the app validates provider credential and image-model availability;
4. generation starts with a persistent visible state and Stop where supported;
5. on success the generated image is inserted into the active conversation as a durable image output/attachment with provenance;
6. the user can open, share/export, reuse or reference the generated image according to existing media/attachment policy.

The user SHALL receive clear guidance if the composer is empty or no active chat exists.

### 5.3 Provider boundary

- Initial vNext image generation SHALL use **OpenRouter image-capable models**, matching the evidenced branch behaviour.
- Together AI remains a first-class text-generation provider under the current v1.5.3 lock, but **Together image generation is not automatically authorised by this specification**.
- Text/chat provider selection SHALL not silently switch because image generation needs an image-capable model.
- Image-model selection SHALL be explicit and separate enough to prevent image-only models appearing as normal text-chat models.
- No third provider is authorised.

### 5.4 Model catalogue

Protected AI settings SHALL provide an image-model selector/filter that:

- identifies image-capable OpenRouter models;
- stores the selected image model separately from each provider's text model;
- restores the prior image model when possible;
- handles model disappearance or provider catalogue failure truthfully;
- does not make an incompatible image model selectable for ordinary text generation.

### 5.5 Image generation output and errors

Required states include:

- prompt required;
- API key missing;
- no usable image model;
- generating;
- cancelled;
- provider/network failure;
- model returned no image;
- all attempted candidate models failed, if deterministic fallback among explicitly supported image candidates is retained;
- completed image.

Generated images SHALL have a safe local filename/identifier rather than depending on a fixed literal filename such as `generated-image.png` for identity.

### 5.6 Usage and provenance

Every image generation SHALL create a UsageEvent with:

- source `CHAT_IMAGE` or another dedicated non-ambiguous source type;
- provider;
- model;
- workspace/chat/correlation IDs;
- success/failure;
- latency;
- provider-reported token/usage/cost data where supplied;
- cost `UNAVAILABLE` when trustworthy monetary cost is absent.

Image generation SHALL NOT be silently available to Skills, Tasks, Full Voice or Document AI in this release. Those integrations require separate explicit requirements and tests.

---

## 6. Attachments, local files and media

Preserve and unify the strongest current attachment behaviour:

- documents/files;
- plain text;
- ZIP/project archive context subject to archive safety policy;
- APK staging where currently supported;
- gallery images;
- camera photos;
- generated images;
- local PDF extraction/review;
- privacy sanitisation and request-only exclusion rules;
- bounded context handling;
- attachment failure/retry/remove states.

Camera/gallery permissions SHALL be requested contextually, with denial and recovery paths. Permission presence in an APK manifest is not sufficient verification of usable workflow behaviour.

---

## 7. Workspaces

Existing workspace create/select/rename/archive/export/import behaviour remains required.

Each workspace SHALL become the durable context and automation boundary for:

- chats;
- documents;
- notes/project organisation;
- Workspace Memory;
- workspace-scoped Skills;
- Tasks;
- usage provenance and optional workspace budgets.

### 7.1 Workspace Overview

Selecting a workspace SHALL open or make available a Workspace Overview containing:

- chat/document counts;
- Memory summary;
- Skills summary;
- Tasks summary;
- recent automation/run status;
- existing workspace edit/archive/export actions.

---

## 8. Workspace Memory — merged full target

The current v1.5.3 Workspace Memory architecture is authoritative. The older Local Memory Vault does **not** return as a second memory store.

### 8.1 Memory entity and isolation

Each memory SHALL retain at least:

- stable ID;
- exact workspace ID;
- type: Fact / Instruction / Decision / Preference / Reference;
- title;
- content;
- tags;
- enabled state;
- pinned state;
- priority;
- origin/provenance;
- timestamps;
- usage count / last-used evidence where available;
- archived state.

Workspace A memory SHALL never be silently injected into Workspace B.

### 8.2 Full management UI

The next target SHALL combine current v1.5.3 memory behaviour, the planned v1.5 UI and the useful older Memory Vault actions:

- create memory;
- **edit existing memory**;
- delete memory;
- pin/unpin;
- enable/disable;
- archive/unarchive;
- search;
- filters for All / Pinned / Suggestions / Disabled / Archived as applicable;
- provenance/detail view;
- used-count / recent-use evidence where available;
- **multi-select and bulk delete/clear** with explicit destructive confirmation;
- empty/loading/error states.

Bulk deletion SHALL state precisely that it removes memory entries only and does not remove chats, documents, prompts or provider settings.

### 8.3 AI suggestions

AI-derived candidate memories SHALL enter a suggestion inbox rather than silently becoming durable memory by default.

User options:

- Reject;
- Review & save;
- Edit & save;
- reject all suggestions.

A blanket default “Approve all” is not required.

### 8.4 Per-request memory control

Chat and other AI execution surfaces SHALL expose:

- selected memory count;
- excluded-memory reasons;
- context-budget limitation;
- `Why selected?` explanation;
- per-request deselection;
- one-request `Memory off`.

Per-request overrides SHALL NOT mutate durable memory definitions.

### 8.5 Deterministic selection

Memory resolution SHALL remain deterministic/explainable using exact workspace filtering, enabled/archive filtering, pinned/priority/relevance ordering and a bounded context budget. No vector database is required solely to satisfy this target.

---

## 9. Skills

Skills remain reusable, versioned, declarative workflows integrated into Workspaces.

### 9.1 Required operations

- browse/search/filter Skills;
- new Skill;
- duplicate;
- draft editing;
- validation;
- publish immutable version;
- new draft from a published version;
- run manually;
- schedule;
- disable/retire;
- import/export;
- run history;
- output links;
- usage links.

### 9.2 Supported first-class step types

At minimum:

- PROMPT;
- GENERATE;
- CONDITION;
- SET_VARIABLE;
- WRITE_DOCUMENT;
- NOTIFY.

No arbitrary `eval`, shell execution or unbounded code injection is introduced.

### 9.3 Skill Builder

Use a mobile-first ordered card editor rather than requiring a node graph.

Every step SHALL expose:

- type;
- concise summary;
- inputs/output variable;
- validation status;
- Move Up / Move Down accessible controls;
- edit action.

Published versions are immutable. Existing scheduled Tasks remain pinned to their exact Skill version unless explicitly updated.

### 9.4 Starter Skills

Preserve the current authorised starter set:

- Workspace Brief;
- Memory Curator;
- Weekly Review.

---

## 10. Scheduled & Conditional Tasks

Tasks remain workspace-scoped and persistent.

### 10.1 Triggers

Support:

- Once;
- Daily;
- Weekly;
- Interval;
- supported local Condition.

The UI SHALL show timezone and preview future occurrences for time triggers.

### 10.2 Local conditions

Supported local conditions may include:

- network available;
- app resumed;
- workspace changed;
- previous run succeeded;
- previous run failed;
- usage threshold reached.

Unsupported remote-web monitoring SHALL NOT appear as if locally guaranteed.

### 10.3 Execution policies

Expose the actual execution contract:

- Best effort background;
- Foreground required;
- Notify only.

Closed-app exact autonomous execution is not guaranteed by this specification.

### 10.4 Required management

- create/edit/duplicate/delete;
- run now;
- pause/resume;
- exact action/Skill-version pinning;
- next occurrence;
- notification policy;
- history;
- scheduled time versus actual start time;
- offline/deferred state;
- idempotent catch-up/reconciliation.

### 10.5 Notification permission

A user-facing education screen SHALL precede the Android notification permission dialog. Generated content is hidden from notifications by default unless explicitly enabled.

---

## 11. Usage & Cost — merged full target

The current v1.5.3 generation ledger remains the canonical instrumentation layer. The older APK's Usage Control and the planned v1.5 Budget UI are merged **into this ledger**, not implemented as a second accounting system.

### 11.1 Usage event truth

Every AI-producing operation SHALL record provenance sufficient to identify:

- provider;
- model;
- workspace;
- source: Chat / Image / Voice / Skill / Task / Document;
- correlation/run IDs;
- prompt/completion/reasoning/total tokens where returned or validly derived;
- latency;
- success/failure;
- provider-reported monetary cost when supplied;
- estimated cost only when a valid pricing snapshot/assumption supports it;
- cost source: `PROVIDER`, `ESTIMATED`, or `UNAVAILABLE`.

Unknown cost SHALL never display as `$0.00` merely because it is unknown.

### 11.2 Dashboard

Usage & Cost SHALL support:

- Today / 7 days / 30 days / Month / All;
- request count;
- token totals;
- provider-reported cost;
- estimated cost shown separately;
- average latency;
- failure rate;
- breakdown by provider;
- breakdown by model;
- breakdown by workspace;
- breakdown by source;
- event list/detail;
- correlation links back to Task/Skill/Document/output when source records remain.

Charts may supplement but SHALL NOT replace accessible textual equivalents.

### 11.3 Local pricing assumptions

Carry forward the older Usage Control capability as a clearly bounded estimate mechanism:

- user may define local pricing assumptions for models when trustworthy provider monetary cost is unavailable;
- assumptions SHALL identify model/provider, input price, output price and effective timestamp where relevant;
- derived monetary values SHALL be labelled **Estimated**;
- explanatory copy SHALL state that local estimates are not provider invoices;
- changing a pricing assumption SHALL NOT rewrite historical estimates that were already snapshotted for completed events unless an explicit data-repair operation is separately authorised.

The current v1.5.3 rule remains intact: absent provider cost must not be fabricated or represented as provider-reported cost.

### 11.4 Budgets and guardrails

Support configurable budgets:

- global monthly budget;
- workspace monthly budget;
- warning threshold percentage;
- hard-stop enable/disable;
- current spend/progress;
- explicit budget state.

Optional future daily budgets may be added without changing the monthly requirement.

### 11.5 Warning behaviour

Crossing a warning threshold SHALL create non-blocking visible feedback and route to the relevant budget detail.

### 11.6 Hard stop

When an enabled budget has reached its hard limit:

- the budget preflight executes **before** the provider call;
- new chargeable AI requests are blocked;
- already completed usage is not modified;
- the UI explains which budget blocked the request;
- the user can open Usage & Cost / budget settings;
- an override exists only if explicitly supported by the active budget policy, and any override is recorded in run evidence.

### 11.7 Clear local usage history

The user SHALL have an explicit **Clear local usage history** function.

Before deletion, show:

- which local usage events/aggregates will be removed;
- whether budget calculations will reset as a consequence;
- that provider-side billing/history is not changed;
- that chats/documents/generated outputs are not removed.

This is a destructive action and requires confirmation.

---

## 12. Full Voice Mode

The current authoritative Full Voice Mode lock remains active in full.

### 12.1 Core state machine

Required principal states:

- IDLE;
- REQUESTING_PERMISSION;
- LISTENING;
- FINALIZING_STT;
- READY_TO_SEND;
- GENERATING;
- SPEAKING.

Required control/error states include:

- INTERRUPTING;
- STOPPED;
- PERMISSION_DENIED;
- STT_ERROR;
- GENERATION_ERROR;
- TTS_ERROR.

### 12.2 Shared generation

Voice SHALL use the same provider path, workspace context, Workspace Memory selection, generation manager/orchestrator, cancellation, usage ledger and conversation history as typed Chat.

### 12.3 Required voice behaviour

- interim/final speech recognition;
- current Android manual-stop fallback preserved;
- auto-send optional;
- auto-listen optional;
- speak assistant response optional;
- selectable installed voice;
- speech rate;
- explicit Stop/replay;
- Interrupt / barge-in;
- keyboard fallback;
- conservative lifecycle recovery;
- no raw microphone audio persistence;
- TalkBack state announcements without excessive interim chatter.

Full Voice remains subordinate to Chat and never becomes a fifth primary destination.

---

## 13. Document Studio Pro

All current Document Studio requirements remain mandatory:

- multiple documents per workspace;
- create/open/rename/duplicate/archive/delete/search/sort;
- structured sections/headings;
- add/edit/delete/reorder/navigation;
- Markdown-compatible editing;
- undo/redo/find;
- truthful autosave/saved/failure state;
- professional templates: Report, Technical Specification, Audit, Implementation Plan, Memorandum, Proposal, Formal Letter;
- cover/title metadata, header/footer, page numbers, TOC, page size, orientation, margins;
- print/PDF preview using the same render model as export;
- revision history/named snapshots;
- revision comparison and non-destructive restore;
- add selected chat outputs to documents;
- AI append/insert/replace using the currently selected authorised provider;
- PDF, Markdown, TXT and HTML export;
- DOCX export only when fidelity is verifiably achieved;
- safe versioned document-project archive import/export;
- local PDF extraction/review and OCR pipeline where currently supported.

Image generation is not automatically a Document AI operation under this specification; generated images may be attached/inserted through ordinary media/document workflows where supported.

---

## 14. Providers, credentials and models

### 14.1 Exactly two text-generation provider families

The text-generation provider lock remains:

- OpenRouter;
- Together AI.

No third provider is added.

### 14.2 Correct endpoints

- OpenRouter chat: `https://openrouter.ai/api/v1/chat/completions`.
- OpenRouter models: `https://openrouter.ai/api/v1/models`.
- Together chat: `https://api.together.ai/v1/chat/completions`.
- Together models: `https://api.together.ai/v1/models`.

The divergent APK's `api.together.xyz` transport SHALL NOT be carried forward.

### 14.3 Credentials

- separate SecureStore OpenRouter and Together API keys;
- no key copying between providers;
- secrets excluded from ordinary exports/backups/workspace archives/logs/usage events/prompts;
- protected settings remain behind the authorised six-digit PIN boundary;
- secure-store failures are reported truthfully.

### 14.4 Provider selection

Provider selection is explicit and user-controlled.

- no automatic OpenRouter↔Together fallback;
- retry preserves original provider/model;
- switching provider restores that provider's own selected/default model;
- Chat, Full Voice, Skills, Tasks and Document AI use the selected text provider unless a future explicitly authorised per-feature pinning rule changes this.

---

## 15. Prompt Library and protected configuration

Preserve the current protected Prompt Library and configuration capabilities, including:

- prompt create/edit/delete/duplicate where currently supported;
- favourites/pinning where currently supported;
- search/organisation;
- staged prompt use;
- protected provider/model/system/project configuration;
- protected-settings PIN boundary;
- no ordinary-navigation bypass of protected AI configuration.

No prompt marketplace, cloud prompt sync or collaborative prompt-authoring programme is added by this specification.

---

## 16. Backup, restore, project archives and portability

### 16.1 Backup content

Backups/project archives SHALL account for:

- chats;
- workspaces;
- documents;
- prompts;
- Workspace Memory;
- Skills and exact versions;
- Task definitions;
- optional usage details/summaries;
- run histories according to bounded retention policy;
- Voice preferences;
- generated-image metadata/local content where the relevant export policy includes media.

### 16.2 Exclusions

Do not export:

- provider API keys;
- PIN verifier material;
- secret Skill values;
- raw microphone audio;
- transient native notification identifiers as portable state.

### 16.3 Restore

Restore SHALL:

- validate archive structure/integrity;
- preview domains to be imported;
- migrate IDs/references safely;
- reconcile task definitions;
- recreate local/native notification identifiers rather than importing stale IDs;
- preserve transactional/durable rollback expectations;
- reject duplicate ZIP/path hazards according to current archive safety policy.

---

## 17. Persistent data and migration

The current schema-5 / workspace-archive-schema-3 model remains the minimum current baseline.

A successor implementation SHALL introduce a deterministic migration only when the merged features require new state. It SHALL preserve all existing chats, documents, workspaces, prompts, memories, Skills, Tasks, usage records and provider selections.

Potential new/expanded state includes:

- image-generation preferences/provenance;
- memory archived/bulk-selection management metadata where needed;
- pricing snapshots/local price assumptions;
- usage budgets;
- budget override evidence;
- generated-image attachment records.

Unbounded journals SHALL remain partitioned/bounded rather than being forced into one ever-growing monolithic state blob.

---

## 18. Privacy and security

Preserve all authorised protections:

- six-digit protected-settings PIN boundary;
- SecureStore secrets;
- request-context sanitisation;
- no secrets in ordinary export, logs or telemetry;
- raw microphone audio not persisted;
- safe archive parsing;
- stable IDs and integrity checks;
- no client-side-only substitute for required protected settings.

Image prompts and generated-image metadata SHALL follow the same privacy/export policy as other user content. Provider responses/URLs that contain temporary credentials or signed query material SHALL not be indiscriminately logged.

This specification does not authorise derestriction or removal of the existing protected-settings architecture.

---

## 19. Android UI/UX contract

### 19.1 Appearance

**Light-only remains authoritative.**

The divergent v1.5.2 APK's automatic/dark appearance is explicitly **not imported**.

Required visual character:

- white/off-white surfaces;
- black Command Centre header and strong primary actions;
- restrained neutral borders;
- rounded cards/sheets;
- no decorative glassmorphism;
- dense but readable hierarchy;
- native Android proportions.

### 19.2 Touch and one-handed ergonomics

- primary actions ≥48dp height;
- icon-only actions ≥48×48dp hit target;
- bottom-weighted Save/Run/Publish/Schedule/Stop/Interrupt actions on compact phones;
- essential operations must not exist only in the top-right corner;
- long press may supplement but never be the only route;
- keyboard-aware scrolling and IME-safe bottom actions.

### 19.3 Android Back

Ordered back behaviour:

1. dismiss nested picker/dialog/sheet;
2. close focused editor/step editor;
3. leave subordinate detail/builder/Voice surface;
4. return to the current primary destination root;
5. preserve/confirm unsaved draft state appropriately.

### 19.4 Feedback

Use shared, truthful:

- loading;
- empty;
- offline;
- error;
- blocked;
- success;
- snackbar/banner;
- persistent execution status.

No feature domain may use a blank white screen as its empty/error state.

---

## 20. Accessibility

All merged features SHALL satisfy:

- TalkBack-readable titles and controls;
- correct role/state/value semantics;
- selected state on chips/tabs/provider/model selectors;
- numeric progress semantics;
- accessible generation/save/error/success announcements;
- logical focus order and restoration;
- dynamic text scaling without clipping critical controls;
- reduced-motion support;
- non-drag alternatives for reordering;
- meaningful cost labels such as provider-reported vs estimated;
- status never communicated by colour alone;
- Full Voice state announcements without repeatedly speaking every interim transcript update;
- generated-image controls and previews have meaningful accessible labels/descriptions supplied by UI context rather than fabricated visual content descriptions.

Physical TalkBack/device acceptance remains a runtime gate and cannot be inferred from source presence.

---

## 21. Responsive/adaptive behaviour

### Compact (<700)

- four-item bottom navigation;
- one-column forms/cards;
- full-screen subordinate workflows;
- sticky lower primary action where safe;
- vertically stacked Skill steps.

### Medium (700–999)

- one/two-column summaries;
- vertical Skill Builder remains valid;
- detail metadata may use two columns.

### Expanded (≥1000)

- expanded shell/navigation rail may be used;
- workspace subnavigation/content pane may be used;
- Usage can use two-column metrics/breakdowns;
- Document Studio may use multi-pane layout;
- no expanded-only capability may be unavailable on phone.

---

## 22. Offline, failure and recovery requirements

### Memory

Local CRUD remains available when the provider is offline. Selection failure is visible and may allow Send without Memory only when policy permits.

### Skills

Validation errors remain attached to affected steps. A failed run retains completed-step evidence and exposes deterministic retry/cancel options.

### Tasks

If background execution was unavailable, show `Needs app open`/deferred state rather than generic failure.

### Usage

A usage-journal write failure must not destroy a valid generation output; expose repair/recovery state.

### Voice

STT/TTS/provider errors retain safe visible transcript/content and provide Retry / Keyboard / End Voice Mode.

### Images

Image-generation failure keeps the user's prompt, exposes Retry/change image model, and does not create a false successful image attachment.

---

## 23. Cross-feature execution and provenance

Every AI-producing path SHALL converge on the shared current generation/provider architecture rather than creating silent side channels.

The execution/provenance model SHALL cover:

- typed Chat;
- Document AI;
- Skill GENERATE steps;
- Task-triggered prompt/Skill execution;
- Full Voice generation;
- manual Chat image generation through a dedicated image-generation execution type.

Each path SHALL produce stable correlation IDs, cancellation semantics, usage evidence and output references appropriate to its type.

---

## 24. Feature-union conflict resolutions

The following decisions are explicit and controlling for this merged target:

| Divergent/older behaviour | vNext decision |
|---|---|
| Separate Local Memory Vault | **Do not restore as a parallel store.** Merge its edit/search/bulk-management UX into canonical Workspace Memory. |
| Older local Usage Control | **Merge guardrails/pricing assumptions/clear-history behaviour into canonical Usage & Cost ledger.** |
| Local cost estimates | Allowed only as clearly marked **Estimated** values with pricing snapshot/assumption provenance; never represented as provider invoice/cost. |
| Budget hard stop | **Include.** Block before provider call when enabled limit is reached. |
| `142.apk` manual image generation | **Include for vNext.** Integrate into Chat/composer via OpenRouter image-capable models. |
| Together image generation | **Not automatically included.** Requires separate authority/validation. |
| Automatic provider fallback | **Reject.** Current v1.5.3 no-fallback rule remains. |
| `api.together.xyz` branch endpoint | **Reject.** Preserve current `api.together.ai` endpoints. |
| Automatic/dark appearance from divergent APK | **Reject.** Light-only remains locked. |
| Third provider | **Reject.** Exactly OpenRouter + Together for text generation. |
| Older duplicate attachment/PDF implementations | Preserve user capability but use current canonical attachment/document implementation. |
| Multi-ABI APK packaging difference | Not treated as a user feature. Build architecture is governed by the current Android build/release specification and later verified successor release requirements. |

---

## 25. Required user journeys for the merged target

At minimum, acceptance SHALL cover:

1. Create/edit/search/filter a workspace memory -> select it in Chat -> send with exact memory provenance.
2. Bulk-delete selected memories -> confirm scope -> verify chats/documents/prompts remain untouched.
3. Receive AI memory suggestion -> review/edit/save or reject.
4. Create a Skill with inputs + Generate + Condition + Write Document -> validate -> publish immutable v1.
5. Run Skill -> Stop/retry appropriately -> inspect output and usage.
6. Schedule a Skill -> verify exact version pin -> next occurrence -> pause/resume/history.
7. Miss a best-effort Task -> reopen app -> observe truthful catch-up and scheduled-vs-actual evidence.
8. Open Usage & Cost -> filter by provider/workspace/source -> trace Task -> Skill run -> output.
9. Configure local price assumption for a model with unavailable provider cost -> verify resulting value is labelled Estimated, never provider-reported.
10. Configure monthly warning + hard stop -> trigger warning -> trigger pre-provider block.
11. Clear local usage history -> verify explicit scope and provider-side billing unaffected.
12. Full Voice: listen -> finalise -> generate -> speak -> interrupt/barge in -> continue same conversation.
13. Deny microphone -> recover through Keyboard while typed Chat remains usable.
14. Enter an image prompt -> Create image -> generation state -> completed generated-image chat output -> usage provenance.
15. Image-generation provider failure -> prompt retained -> actionable retry/change-model state -> no false image output.
16. Switch OpenRouter/Together for text -> verify provider-specific model restoration and no silent fallback.
17. Backup/restore merged domains -> secrets excluded -> task/native IDs reconciled -> generated media handled according to archive policy.
18. Compact Android Back/IME/one-handed workflow across Memory editor, Skill Builder, Task editor, Usage budget editor, Voice and image-generation sheet/action.
19. TalkBack/dynamic-text/reduced-motion acceptance on all newly added controls and state changes.

---

## 26. Verification truth model

Every requirement SHALL be classified using actual evidence:

- **PASS** — required behaviour was actually verified at the appropriate level;
- **FAIL** — executed verification demonstrates non-compliance;
- **PARTIAL** — some required evidence/behaviour verified but material coverage remains;
- **UNVERIFIABLE** — required execution cannot currently be performed.

Source presence alone is not runtime/device verification.

### 26.1 Required deterministic coverage

A successor implementation SHALL add/retain deterministic tests covering at least:

- provider selection/isolation/retry/no-fallback;
- Workspace Memory CRUD/edit/search/filter/bulk deletion and workspace isolation;
- AI memory suggestion approval boundary;
- memory selection/context-budget provenance;
- Skill validation/versioning/run/cancel/history;
- Task recurrence/condition/idempotency/catch-up;
- Usage provider/estimated/unavailable semantics;
- pricing snapshot/local assumptions;
- budget warning/hard-stop preflight/override evidence;
- usage history clearing;
- Full Voice state machine/manual-stop/auto-send/auto-listen/barge-in/lifecycle;
- image prompt validation/model selection/success/failure/cancel/output provenance;
- backup/restore privacy and referential integrity;
- archive duplicate/path safety;
- Android navigation/state reducers where deterministic testing is practical.

### 26.2 Fresh Android acceptance

Production acceptance additionally requires an APK built from the exact final successor source and applicable checks for:

- install/cold launch;
- signing and package identity;
- Android 16/API-36 behaviour;
- 16-KB native-page compatibility where applicable;
- camera/gallery/file permissions;
- generated image workflow;
- notification permission and Task flows;
- Full Voice microphone/STT/TTS/barge-in;
- Android Back and IME;
- TalkBack/dynamic text/reduced motion;
- live OpenRouter and Together text-provider calls using authorised credentials;
- live OpenRouter image generation using an authorised image-capable model.

Unexecuted device/live-provider gates remain UNVERIFIABLE/NOT EXECUTED and are never converted to PASS.

---

## 27. Recommended implementation order

1. Freeze current v1.5.3 baseline and create successor release branch/state.
2. Add/extend shared Usage domain for pricing snapshots, budgets and guardrails.
3. Upgrade Workspace Memory UI: edit/search/filter/archive/bulk actions and suggestion/detail screens.
4. Complete richer Usage & Cost screens, filters, event detail, budgets and clear-history flow.
5. Add OpenRouter image-model discovery/selection abstraction without affecting text model catalogues.
6. Add Chat composer Create image workflow and generated-image attachment/output type.
7. Wire image usage/provenance/error/cancellation to shared execution evidence.
8. Reconcile planned Workspace/Skills/Tasks/Voice screen flows with existing v1.5.3 implementations without duplicating stores/services.
9. Extend backup/archive/data migration for budget/pricing/image metadata as required.
10. Accessibility, one-handed Android and responsive regression.
11. Deterministic full regression.
12. Fresh APK build and package verification.
13. Physical Android + live-provider acceptance.
14. Reconcile authoritative Build Specification, Technical Specification, Feature Lock, version/release metadata and handover only after the implementation is actually authorised/completed.

---

## 28. Completion definition for the merged target

The merged target is not complete merely because every named screen/control exists.

Completion requires:

- every preserved v1.5.3 feature remains functional;
- imported older-APK behaviours are integrated into current canonical domains rather than bolted on as duplicate stores;
- image generation works through the authorised provider/model path and is auditable;
- Memory edit/search/bulk management is complete;
- Usage pricing estimates, budgets, warnings, hard stops and history clearing are complete and truthful;
- Skills/Tasks/Voice/Document/Chat/provider behaviour remains non-regressed;
- privacy/security/export boundaries remain intact;
- applicable deterministic tests pass;
- release artefacts and documentation are reconciled when release identity changes;
- any unexecuted live/device gates remain explicitly open rather than silently counted as passed.

---

## 29. Final merged product definition

The resulting product shall be one coherent Android-first Command Centre rather than a collection of branch features:

> **A persistent, workspace-aware AI command environment with advanced chat and file context, Document Studio Pro, deterministic Workspace Memory, reusable versioned Skills, scheduled/conditional Tasks, auditable Usage & Cost with budgets and guardrails, Full Voice Mode, dual OpenRouter/Together text generation, and manual OpenRouter-powered AI image generation — all inside the existing four-destination, light-only, protected, offline-conscious Android UX.**

The current v1.5.3 implementation remains the baseline from which this target must be built. No superseded APK is authorised to replace it wholesale.
