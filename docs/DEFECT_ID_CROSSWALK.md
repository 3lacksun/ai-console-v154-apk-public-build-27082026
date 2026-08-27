# Defect ID Crosswalk — Canonical Lineage

**Current maintenance release:** 1.5.0  
**Purpose:** resolve AuditSkill `DEFECT-010` without rewriting historical evidence.

The v1.4.0 authoritative build specification and feature lock own the original `DEFECT-001` through `DEFECT-009` meanings. Later v1.4.2 release-gate reports reused `DEFECT-006`, `DEFECT-007`, and `DEFECT-008` for different release-engineering findings. Those historical documents are retained unchanged, but the reused labels are no longer canonical.

| Historical colliding label | Canonical meaning from authoritative specification | Historical release-gate meaning | Current non-colliding alias |
|---|---|---|---|
| `DEFECT-006` | SecureStore persistence failure must produce an explicit outcome | Positive real-app readiness gate | `RGATE-001` |
| `DEFECT-007` | Reject duplicate raw ZIP entry paths before JSZip/object-key collapse | Alternate/unverified APK route must not be publishable | `RGATE-002` |
| `DEFECT-008` | Correct stale README/release identity | Release identity/version drift | `RGATE-003` |

## Rules

1. `DEFECT-001..009` always retain the meanings in `AI_CONSOLE_V1_4_0_FULL_BUILD_SPECIFICATION.md` and `AI_CONSOLE_V1_4_0_FULL_FEATURE_LOCK.md`.
2. `RGATE-001..003` are release-gate aliases only; they are not replacements for the authoritative `DEFECT-006..008` meanings.
3. Historical reports are evidence and remain immutable. Current status, handover, continuation, and release documents must use this crosswalk instead of reusing a canonical `DEFECT-###` identifier for another issue.
4. New AuditSkill defects continue monotonically from the current canonical catalogue (`DEFECT-010` onward).

## Closure

`DEFECT-010` is remediated in the v1.5.0 current documentation set when every current status/handover document uses the canonical meanings above and no current document presents the old release-gate labels as canonical `DEFECT-006..008` meanings.
