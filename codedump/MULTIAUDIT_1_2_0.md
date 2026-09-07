# Code Dump v1.2.0 — Multi-Audit + Expanded Intake Upgrade

## Scope

Extends the verified Code Dump v1.1.0 / Audit Pack 1.0.1 baseline without rebuilding the application.

Generation modes:

1. Standard Code Dump (unchanged)
2. 10-Phase Full Application Audit
3. End-to-End App Acceptance
4. UI / UX + Mobile
5. Security
6. Build / Deployment / Release

Every audit export is self-contained and carries its LLM audit prompt plus project summary, project-wide tree/inventory, feature/workflow mapping, dependency/cross-reference evidence, omission/reference-only records, binary metadata where enabled, and selected source code within the configured token budget.

## End-to-End acceptance invariant

The dedicated end-to-end audit explicitly forbids marking a feature PASS merely because implementation code exists. It requires tracing entry point, user action, handler, state/data flow, integrations, success/failure state, persistence/recovery and runtime/device evidence. Runtime behaviour without actual runtime evidence must be PARTIAL or UNVERIFIABLE.

The end-to-end audit accounts for the complete project inventory so project-specific feature names cannot silently disappear merely because a keyword classifier did not recognise them.

## Expanded intake recognition

Source/config language recognition now includes additional TypeScript module forms, F#/VB, Objective-C, Fish/batch, JSON5/JSONL, properties/config, Astro, Scala/Groovy, Clojure, Elixir/Erlang, Haskell/OCaml, Nim/Zig, Solidity/Vyper/Move, Protobuf/GraphQL/Prisma, Terraform/HCL/CUE/Rego/Bicep/Nix, CMake/Make fragments, assembly/HDLs, COBOL/Pascal/Tcl/Awk/Sed, LaTeX, Jupyter notebooks, HTTP request files, Gherkin/Robot, and common templating formats.

Additional documentation/log/diff formats and modern dependency/build/config names are recognised. Binary safety remains byte-based; raw binary payloads are never inserted into LLM audit text.

## Regression gates

The regression suite verifies:

- existing Standard Code Dump round-trip/integrity;
- all ten original audit phases;
- all four focused audit modes;
- focused prompt invariants;
- project-wide inventory/tree and omission evidence;
- expanded file-type classification/language mapping;
- tiny two-file shell/checksum packages cannot regress to zero source evidence;
- binary raw payload guard and token ceilings.
