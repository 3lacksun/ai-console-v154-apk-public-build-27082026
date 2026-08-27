# Full Voice Mode — Autonomous LLM Execution Prompt

Use the Full Voice Mode Feature Lock in this handover as the authoritative task-specific lock.

## Mission

Complete, remediate and verify Full Voice Mode in the current authoritative Dr Stones Command Centre v1.5.0 source without rebuilding the application or duplicating already-compliant functionality.

## Execution rules

1. Load current Master governance and project authority before edits.
2. Verify the baseline handover and SHA before implementation.
3. Audit existing Full Voice implementation against every `FL-VOI-*` requirement in the feature lock.
4. Create a stable remediation ledger classifying each item as implemented-and-verified, implemented-not-verified, partial, missing, defective or external-verification-required.
5. Preserve compliant code and existing v1.4.3 Android manual-stop remediation.
6. Remediate every locally actionable gap.
7. Route voice input through the existing shared generation pipeline; do not create a second provider client.
8. Preserve Workspace Memory isolation, Usage & Cost provenance, ordinary chat history, protected settings, privacy and accessibility requirements.
9. Add/repair deterministic tests for the complete `FL-VOI-T*` set and keep prior tests passing.
10. Execute all locally available verification honestly.
11. Build a fresh APK only through the authorised Android build path; never reuse stale APK evidence.
12. Execute physical Android acceptance where available. If unavailable, classify device gates truthfully rather than marking PASS.
13. Remediate discovered defects and repeat targeted/full regressions until local defects are zero or only genuine external gates remain.
14. Freeze final source, regenerate integrity evidence and package one authoritative successor handover only after verification.

## Required end-state report

Report baseline/sha, files changed, requirements status, defects found/fixed, deterministic tests, static/build results, APK status, physical Android/Full Voice/TalkBack status, live-provider status, remaining external gates, source-completion verdict, production-readiness verdict, final handover filename/SHA and persistence/readback status.
