# Dr Stones Command Centre v1.5.4 — REM002 R1 Execution Report

**Run:** REM002 R1  
**Timestamp:** 2026-08-26T22:43:47+01:00  
**Master Rules:** v1.2.19 / 20260826-03  
**Input exact persisted v1.5.4 SHA-256:** `d57bf2fcf4a21d31df7f7e7638acb87b4f7edd497ed966605a4848400c01ba7d`  
**Production-authoritative release:** v1.5.3 (unchanged)

## Fresh findings and remediation

### DSCC-V154-CI-001 — HIGH — CLOSED
The v1.5.4 Android workflow's APK inspection asserted `versionName='1.5.3'`. A genuine v1.5.4 APK would fail its own mandatory release workflow. Corrected to `1.5.4`; static and deterministic anti-regression assertions were added.

### DSCC-V154-PKG-001 — MEDIUM — CLOSED
On an untouched extraction of the exact persisted predecessor, `HANDOVER_SHA256SUMS.txt` failed with 94 missing paths plus 2 checksum mismatches and `SHA256SUMS_EXEC002.txt` failed with 94 missing paths plus 24 mismatches. The separate 209-file package manifest was valid. Current-facing inventories/checksums are regenerated from final successor bytes and executable verification is added; the predecessor package manifest is retained only under `historical-integrity/`.

## Fresh local verification before final reseal
- exact persisted predecessor ZIP SHA and archive integrity: PASS;
- predecessor package manifest: 209/209 PASS;
- static check after CI identity remediation: PASS;
- CI version guard: PASS;
- runtime contract: PASS;
- complete deterministic suite after final integrity regression addition: **131/131 PASS, 0 fail, 0 skip**;
- current provider-contract web verification: OpenRouter image endpoints/model API and Together OpenAI-compatible base/model contract remain current; live credential execution remains required;
- Expo SDK 57 / React Native 0.86 configuration is consistent with current Expo SDK documentation; `expo-speech-recognition` 56.0.1 remains the package's current published line and a real Android runtime gate remains mandatory.

## Remaining gates
See `KNOWN_EXTERNAL_GATES.md`. Production promotion remains NO-GO until mandated GitHub Android, signing/16-KB, physical Android/accessibility and authorised live-provider acceptance are actually executed.

## Final pre-seal integrity

- `HANDOVER_SHA256SUMS.txt`: **213/213 PASS** before final evidence refresh; regenerated again from final pre-seal bytes below.
- `SHA256SUMS_EXEC002.txt`: **213/213 PASS** before final evidence refresh; regenerated again from final pre-seal bytes below.
- Locally actionable defects open: **0**.
