# Dr Stones Command Centre v1.5.3 — Dual Provider Implementation Report

**Date:** 26/08/2026  
**Release:** v1.5.3 / Android versionCode 18  
**Application ID:** `com.nexarenew.aiconsole`  
**Baseline:** `DR_STONES_COMMAND_CENTRE_V1_5_0_FULL_VOICE_COMPLETE_HANDOVER_26082026090032.zip`  
**Baseline SHA-256:** `570249f06296712491b475c488ba554b18cac346aa0b73d28b6a2d66e7e4588b`

## Authorised change

The user explicitly authorised restoring Together.ai as a dual provider alongside OpenRouter. The implementation deliberately imports only this beneficial divergent-APK capability. The uploaded v1.5.2/versionCode 17 APK's dark/automatic appearance and image-generation branches are not merged.

## Implemented

- Added a provider registry with exactly `openrouter` and `together`.
- Preserved OpenRouter endpoints, headers and explicit streaming-usage request semantics.
- Added Together OpenAI-compatible chat-completions and model-list endpoints.
- Added separate SecureStore-backed Together API key storage.
- Added protected provider selector and separate credential status surfaces.
- Added provider-specific model catalogues and selected model persistence with backward migration from the legacy OpenRouter-only keys.
- Routed Chat, Full Voice, Skills, Scheduled Tasks and Document AI through the selected provider while preserving Workspace Memory.
- Preserved the original provider/model when retrying a failed generation and added retry usage provenance.
- Added provider identity to usage recording; monetary cost remains unavailable when not provider-reported.
- Preserved explicit attachment-consent semantics using the currently selected provider.
- Preserved light-only appearance and the existing protected-settings PIN boundary.
- No automatic cross-provider fallback exists.
- Release identity advanced to v1.5.3/versionCode 18 so a future APK can upgrade over the inspected divergent v1.5.2/versionCode 17 APK.

## Local verification

- `npm test`: **117/117 PASS, 0 fail, 0 skipped** using the same temporary local JSZip 3.10.1 test-resolution method documented by the prior release; the symlink is removed before packaging.
- `node scripts/static-check.mjs`: **PASS**.
- `node scripts/ci-version-guard.mjs`: **PASS**.
- `node scripts/verify-runtime-contract.mjs`: **PASS**.
- `node scripts/build-apk-policy.mjs`: expected fail-closed exit 1 with `BUILD_APK_RELEASE_GATE=BLOCKED` — **policy PASS**.
- clean offline `npm ci`: **NOT_EXECUTABLE_HERE** because the local npm cache still lacks `zod-3.25.76.tgz`.

## External gates

No live OpenRouter or Together request has been executed with user credentials in this environment. No fresh v1.5.3 APK has been built. Android runtime, 16-KB, signing and physical Full Voice/accessibility tests therefore remain external/unverified.

**LOCAL_SOURCE_GO: PASS**  
**DUAL_PROVIDER_SOURCE_GO: PASS**  
**PRODUCTION_GO: NO**
