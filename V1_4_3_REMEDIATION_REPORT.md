# Dr Stones Command Centre v1.4.3 — Audit Remediation Report

**Baseline:** v1.4.2 handover revision `6fc3f77`  
**Upgrade target:** v1.4.3 / Android `versionCode` 12  
**Authoritative feature target:** preserved v1.4.0 build specification, feature lock, and technical specification  
**Audit source:** `DR_STONES_COMMAND_CENTRE_AUDITSKILL_CATALOGUE_26082026045650.md`

## Scope

This is a patch-level reliability, provenance, and governance upgrade. It does not redesign the application architecture, remove locked features, weaken the protected-settings boundary, change the Android application ID, or change the Expo 57 / React Native 0.86 stack.

## Audit defect remediation

### DEFECT-010 — canonical defect-ID collision

**Remediation:** added `docs/DEFECT_ID_CROSSWALK.md`. The authoritative `DEFECT-006..008` meanings remain those in the locked specification. Historical release-gate uses are mapped to `RGATE-001..003`; historical evidence remains unchanged.

**Result:** **PASS IN CURRENT SOURCE**. Regression tests prevent current documents from reusing the colliding historical meanings.

### DEFECT-011 — stale persistent Drive current pointer

**Remediation:** the final v1.4.3 handover publication step updates the persistent current-version record only after the package ZIP and SHA-256 are created and verified. The pointer records remaining APK/runtime evidence gates rather than overstating production readiness.

**Result:** **PERSISTENCE STEP REQUIRED AFTER PACKAGE CREATION**. Local source remediation is complete; final Drive write/readback is a separate persistence operation.

### DEFECT-012 — stale packaged source integrity manifests

**Remediation:** `SHA256SUMS.txt` and `SHA256SUMS_EXEC002.txt` are regenerated from the frozen v1.4.3 source tree. The manifests deliberately exclude themselves plus `node_modules`, `.git`, generated native trees, and transient build output so they are deterministic and non-self-referential.

**Result:** **PASS WHEN FINAL MANIFEST READBACK REPORTS ZERO MISMATCHES**. See the final package verification evidence.

### DEFECT-013 — under-scoped outer checksum manifest

**Remediation:** the final handover `CHECKSUMS.txt` has an exact declared scope and covers the handover record, source archive, current source integrity manifests, audit catalogue, remediation patch and local verification evidence. No unrelated or absent artefact is claimed.

**Result:** **PASS WHEN FINAL PACKAGE CHECKSUM VERIFICATION REPORTS ZERO MISMATCHES**.

### DEFECT-014 — under-evidenced source → APK provenance

**Remediation:** v1.4.3 does not promote or package the legacy v1.4.2 APK as a matching build. Current source/package evidence is separated from future CI/APK evidence. A v1.4.3 APK becomes release evidence only after the existing GitHub workflow executes its dependency, build, signing, alignment, Android 16, 16-KB, and positive-app-ready gates for the exact v1.4.3 source revision.

**Result:** **PASS FOR SOURCE/PACKAGE PROVENANCE POLICY; EXTERNAL APK GATE REMAINS UNEXECUTED**. No fresh APK claim is made.

### DEFECT-015 — Android continuous speech manual-stop result loss

**External contract checked:** on 26 August 2026, `expo-speech-recognition` latest stable is 56.0.1 and upstream Android issue #165 remains open. In continuous mode, explicit `stop()` can emit Android client error/code 5 and discard the final result even though an interim transcript exists.

**Remediation:** added `src/voice/manualStopFallback.mjs` and integrated a bounded fallback in `App.js`. The fallback activates only when all of the following are true:

- platform is Android;
- the user explicitly requested stop;
- a non-empty interim transcript already exists; and
- the native error is `client` or code `5`.

In that case the retained transcript is opened in the existing review sheet instead of being discarded. Permission, network, service, and non-user-stop errors retain normal failure handling. Text input fallback remains unchanged.

**Result:** **PASS IN SOURCE / DEVICE ACCEPTANCE UNVERIFIABLE HERE**. Dedicated positive and negative regression tests pass; physical Android 16 repetition remains required for device-level closure.

## Version upgrade

- package version: `1.4.3`
- Expo version: `1.4.3`
- Android versionCode: `12`
- Android package: unchanged `com.nexarenew.aiconsole`
- Expo SDK: unchanged 57
- React Native: unchanged 0.86.2
- UI mode: unchanged light-only

## Verification state

Local executable verification is recorded in `VERIFICATION_STATUS.md`. No fresh APK, production signature, emulator, physical-device, or live-provider PASS is inferred from source verification.
