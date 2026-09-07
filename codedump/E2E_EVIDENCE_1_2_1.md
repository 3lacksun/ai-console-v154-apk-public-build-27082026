# Code Dump v1.2.1 — End-to-End Evidence Allocation Correction

## Status

Technically complete and verified on 7 September 2026 against the existing Code Dump v1.2.0 multi-audit baseline. This is an in-place continuation; Standard Code Dump and the v1.2.0 multi-audit/intake expansion remain preserved.

## Problem corrected

A real 501-file end-to-end audit exposed an evidence-allocation defect: although the project inventory contained the required frontend/runtime files, focused evidence selection could spend the available source budget on broad/early matches and omit critical connective files such as the client runtime, service worker, or orchestration core. The resulting LLM report therefore classified workflows as UNVERIFIABLE even though those files existed in the supplied project.

This was a parser/evidence-selection failure, not evidence that the audited application itself lacked those files.

## v1.2.1 behaviour

The audit pack generator is advanced to 1.1.1 and the application release identity to Code Dump 1.2.1.

For End-to-End App Acceptance exports, source evidence allocation now uses a critical-spine plus breadth-before-depth strategy:

- reserve evidence for connective client/runtime/orchestration files before spending the remaining source budget;
- keep project-wide inventory/tree reconciliation authoritative so inventory-present files are not falsely described as absent;
- preserve breadth across relevant source/config/runtime layers before allocating large amounts of text to a small number of files;
- distinguish files that are present-but-not-inlined from files that are genuinely absent;
- retain omission/reference-only records so the LLM can see why a file was not included as full source;
- continue treating binaries as metadata/reference evidence only, never raw LLM source text.

The existing E2E invariant remains locked: no feature may be marked PASS merely because implementation code, routes, controls, labels, or backend endpoints exist. PASS requires evidence appropriate to the claim; runtime/device behaviour that was not actually executed remains PARTIAL or UNVERIFIABLE.

## Preserved v1.2.0 scope

The following remain intact:

1. Standard Code Dump.
2. 10-Phase Full Application Audit.
3. End-to-End App Acceptance.
4. UI / UX + Mobile.
5. Security.
6. Build / Deployment / Release.
7. Expanded source/config/document/build/test intake recognition.
8. Safe binary metadata/reference handling.
9. Self-contained audit exports containing the relevant prompt, project evidence, inventory/tree, mappings, omission/reference records and validation material.
10. Existing regression protection for empty/tiny evidence, inventory reconciliation, focused modes, broader file types, binary guards and token ceilings.

## Verification

GitHub Actions workflow: `Code Dump v1.2.1 E2E Evidence Build v2`

Verified run: `34136198493`

Carrier commit used by the successful run: `ee15cdf255bee1ab5a1e6b46e7a6d8b44b5c1f89`

Successful gates:

- materialised the verified Code Dump 1.2.0 baseline;
- applied and verified Audit Pack Generator 1.1.1;
- legacy audit regression suite: PASS;
- 501-file end-to-end critical-spine regression: PASS;
- JavaScript static checks: PASS;
- Android project preparation: PASS;
- Android unit tests: PASS;
- Android lint: PASS;
- `assembleDebug`: PASS;
- `assembleRelease`: PASS;
- `bundleRelease`: PASS;
- artifact staging/upload: PASS.

## Verified build artifacts

Artifact bundle: `code-dump-v1.2.1-e2e-evidence-1`

GitHub Actions artifact ID: `10024169586`

Bundle digest: `sha256:bd306d33cdd8d1c3bccf89247b6641acad17134d9397b78e253c20f5e5b55edd`

Contained outputs and SHA-256:

- `app-debug.apk` — `f05d0ca321863cbb63e262e775f9b8c27db97961623c09075a3f60a6c734541c`
- `app-release-unsigned.apk` — `92d684c70f83ddf6587a185056cd01b8532c3d76e6419deeb2b9846390ab2724`
- `app-release.aab` — `7b37ff36365c89f78de98c133f20e2c2758f9ea3c70b43e7b9b56e2b06cbcf1c`

`BUILD_INFO.txt` records Audit Pack Generator 1.1.1, the critical-spine/breadth-before-depth allocator, the regression hash and Android toolchain provenance.

## Completion decision

No known LLM-executable implementation, parser, regression, static, unit, lint or Android build work remains within the requested v1.2.1 audit/intake expansion. Any further acceptance work would be a new requirement or external device/user acceptance testing rather than an unfinished implementation item.