# Dr Stones Command Centre v1.5.3 — Dual Provider Feature Lock

**Status:** AUTHORITATIVE ADDITIVE FEATURE LOCK  
**Date:** 26/08/2026  
**Release:** v1.5.3 / Android versionCode 18  
**Application ID:** `com.nexarenew.aiconsole`  
**Baseline:** v1.5.0 Full Voice source-complete continuation  
**Authority:** explicit user instruction authorising Together.ai dual-provider support.

## 1. Authority effect

This amendment supersedes the earlier restriction against adding a new provider **only to the extent necessary to support exactly two selectable provider families: OpenRouter and Together AI**. All other v1.5.0 and Full Voice locks remain active unless explicitly amended below.

It does not authorise a third provider, automatic provider fallback, image generation, dark mode, or a provider architecture rewrite.

## 2. Provider lock

- **DP-001** The application SHALL support exactly `openrouter` and `together` as first-class selectable AI providers.
- **DP-002** Provider selection SHALL be explicit and user-controlled in protected AI & Prompt Settings.
- **DP-003** The application SHALL NOT silently or automatically fall back from one provider to the other after an error, timeout, quota failure, model failure, or missing credential.
- **DP-004** Retry SHALL preserve the provider/model of the failed request unless the user explicitly changes provider for a new request.
- **DP-005** Existing OpenRouter behaviour SHALL be preserved.

## 3. Provider endpoints and transport

- **DP-010** OpenRouter chat remains `https://openrouter.ai/api/v1/chat/completions` and model discovery remains `https://openrouter.ai/api/v1/models`.
- **DP-011** Together AI chat SHALL use the OpenAI-compatible `https://api.together.ai/v1/chat/completions` endpoint.
- **DP-012** Together AI model discovery SHALL use `https://api.together.ai/v1/models`.
- **DP-013** Both providers SHALL use Bearer authentication and the shared streaming/generation abstraction.
- **DP-014** Provider-specific headers/body options SHALL remain isolated. OpenRouter-specific metadata/usage request fields SHALL NOT be blindly sent to Together unless Together documents/supports them.
- **DP-015** Together Responses API is not required for this release; chat completions is the locked Together text-generation transport.

## 4. Credentials and privacy

- **DP-020** OpenRouter and Together SHALL use separate SecureStore-backed API-key records.
- **DP-021** A provider credential SHALL never be copied to the other provider.
- **DP-022** Both API keys SHALL be excluded from ordinary exports, backups, workspace/project archives, logs, prompts and usage events.
- **DP-023** SecureStore read/write failures SHALL remain truthful and recoverable; session-only state SHALL not be described as durably saved.

## 5. Model catalogues

- **DP-030** Each provider SHALL maintain its own model catalogue and selected model.
- **DP-031** Switching provider SHALL restore that provider's prior/default model rather than reusing an incompatible model identifier from the other provider.
- **DP-032** Together model sync SHALL expose text/chat-capable models and SHALL not make image-only models selectable in the text-generation picker.
- **DP-033** Model sync failure SHALL not cause automatic provider switching.

## 6. Shared execution surface

- **DP-040** The selected provider SHALL apply consistently to new Chat requests.
- **DP-041** Full Voice generation SHALL use the same selected-provider execution path as typed Chat.
- **DP-042** Skills SHALL use the selected provider unless a later separately authorised per-Skill provider pinning feature is introduced.
- **DP-043** Scheduled/conditional task AI actions SHALL use the selected provider under the existing foreground/catch-up scheduling boundary.
- **DP-044** Document AI operations SHALL use the selected provider.
- **DP-045** Workspace Memory selection/injection semantics SHALL be provider-independent and preserved.

## 7. Usage and cost truth

- **DP-050** Every generation usage event SHALL record the actual provider and model used.
- **DP-051** Provider token usage SHALL be recorded when returned by that provider.
- **DP-052** Provider-reported monetary cost SHALL be treated as authoritative when supplied.
- **DP-053** If Together does not return monetary cost for a request, cost SHALL remain `UNAVAILABLE`; the application SHALL NOT fabricate a dollar cost from unverified assumptions.
- **DP-054** Usage views SHALL distinguish provider identity sufficiently to audit OpenRouter versus Together activity.

## 8. UI and accessibility

- **DP-060** Protected AI settings SHALL clearly expose the active provider, separate API-key controls and the active provider's model selection.
- **DP-061** The UI SHALL state that there is no automatic provider fallback.
- **DP-062** General Settings SHALL not expose provider credentials or bypass the existing PIN-protected configuration boundary.
- **DP-063** Provider-selection controls SHALL expose accessible selected-state semantics and retain existing touch-target/accessibility requirements.

## 9. Migration and release identity

- **DP-070** Existing v1.5.0 users SHALL migrate with OpenRouter active by default and their existing OpenRouter API key/model preserved.
- **DP-071** Together credential/catalogue/selection state SHALL initialise safely when absent.
- **DP-072** Release identity is v1.5.3 / versionCode 18 so this source can supersede the divergent uploaded v1.5.2 / versionCode 17 APK without changing the Android application ID.

## 10. Explicit exclusions

The following are **not authorised by this amendment**:

- automatic OpenRouter ↔ Together fallback;
- load balancing or multi-provider parallel generation;
- Together image generation or image-model UI;
- restoration of the divergent APK's dark/automatic appearance mode;
- any third provider;
- cloud credential sync;
- removal or weakening of the existing protected-settings PIN boundary.

## 11. Verification lock

Source completion requires deterministic evidence for provider normalization, endpoints, auth/header isolation, body isolation, separate credentials, privacy exclusion, provider-specific model catalogues, shared execution wiring, original-provider retry, and usage provenance.

Production acceptance additionally requires a fresh APK from the exact v1.5.3 source and live-provider tests using authorised OpenRouter and Together credentials. Missing live credentials or device/build evidence MUST remain `UNVERIFIABLE` / `NOT_EXECUTED`, never PASS.
