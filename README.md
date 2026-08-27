# Dr Stones Command Centre v1.5.4

Dr Stones Command Centre v1.5.4 is the v1.5 feature release built on the verified v1.4.3 baseline. It preserves the existing four-destination Expo/React Native architecture and all prior authorised features while adding Workspace Memory, Skills, Usage & Cost, Scheduled & Conditional Tasks, and Full Voice Mode.

Dr Stones Command Centre is an Android-first Expo 57 / React Native 0.86 application with four first-class domains: **Chats, Workspaces, Documents and Settings**, including the full **Document Studio Pro** workflow. This repository is prepared for a GitHub Actions APK build using Expo Continuous Native Generation (CNG): native `android/` and `ios/` directories are generated in CI and are intentionally not committed.

## GitHub readiness

**Repository status: READY FOR GITHUB — APK BUILD NOT VERIFIED**

Updated 26/08/2026 from the verified v1.4.3 source handover. Local v1.5.4 source/static verification and deterministic tests are required before publication; a fresh Gradle APK build, Android runtime/device acceptance, physical accessibility and production signing remain CI/device evidence gates and are not claimed as PASS unless executed.

### Repository identity

- App: **Dr Stones Command Centre**
- Package lineage label: **AI Console v1.5.4**
- Version: **1.5.4**
- Android package: `com.nexarenew.aiconsole`
- Android `versionCode`: **19**
- Expo: **57**
- React Native: **0.86.2**
- Node in CI: **24**
- Java in CI: **17 / Temurin**
- Runner: **ubuntu-24.04**
- Appearance: **light only**

## First GitHub build

1. Extract the repository ZIP so `package.json`, `app.json`, `App.js` and `.github/` are at repository root.
2. Commit and push the extracted files to the repository's `main` branch.
3. GitHub Actions runs `.github/workflows/android-apk.yml` automatically on push/PR, or it can be started with **workflow_dispatch**.
4. For a publishable preview candidate use `signing_mode=preview` and keep `run_emulator_checks=true` (the default).
5. Download the `AI_Console_v1.5.4_preview-debug-signed` Actions artefact only after the same workflow run passes both runtime gates **and both positive real-app UI readiness gates**.
6. A manual run may set `run_emulator_checks=false` only for build diagnostics; that mode deliberately does not publish an APK artefact.

## CI gates

The workflow performs exact lockfile installation, production dependency audit, source/static tests, the full zero-skip Node test suite, SDK/package drift checks, pinned Expo Doctor, Android bundle export, clean Expo prebuild, Gradle APK build, APK/package inspection, signer verification, 16-KB ZIP/ELF alignment, mandatory-for-publication Android 16 runtime survival + positive app-ready UI evidence and dedicated 16-KB runtime survival + positive app-ready UI evidence.

GitHub Actions dependencies are pinned to immutable full commit SHAs. Workflow permissions are `contents: read`.

### Preview versus production

Preview mode builds `app:assembleDebug` and requires Android Debug signer evidence. Production mode builds `app:assembleRelease` and requires these GitHub Actions secrets:

- `AI_CONSOLE_ANDROID_KEYSTORE_BASE64`
- `AI_CONSOLE_ANDROID_KEYSTORE_PASSWORD`
- `AI_CONSOLE_ANDROID_KEY_ALIAS`
- `AI_CONSOLE_ANDROID_KEY_PASSWORD`
- `AI_CONSOLE_ANDROID_CERT_SHA256`

Production mode fails closed if any required secret is absent or the resulting signer certificate SHA-256 differs from the authorised certificate.

## APK build-path policy

`npm run build:apk` is intentionally fail-closed and exits non-zero. Publishable APKs must come from `.github/workflows/android-apk.yml` with runtime checks enabled. `npm run build:apk:diagnostic` is EAS diagnostic-only and its output is not release evidence.

## Local verification

With dependencies installed from `package-lock.json`:

```bash
npm ci
npm run check
npm test
node scripts/ci-version-guard.mjs
node scripts/verify-runtime-contract.mjs
npx expo install --check
npx --yes expo-doctor@1.20.2
```

In the current execution environment, clean registry dependency restoration still has not been established. The complete locally executable Node suite nevertheless passes **110/110 with zero skips** when the exact locked `jszip 3.10.1` dependency is supplied from the preinstalled local toolchain. That temporary test-resolution path is not packaged as `node_modules` and is not represented as a clean `npm ci` PASS.

## Documentation

- `docs/AI_CONSOLE_V1_5_0_FULL_BUILD_SPECIFICATION.md`
- `docs/AI_CONSOLE_V1_5_0_FULL_FEATURE_LOCK.md`
- `docs/AI_CONSOLE_V1_5_0_TECHNICAL_SPECIFICATION.md`
- preserved historical v1.4.0 specifications remain in `docs/` for provenance
- `docs/BUILDING.md`
- `docs/RELEASING.md`
- `docs/DEFECT_ID_CROSSWALK.md`
- `V1_4_3_REMEDIATION_REPORT.md`
- `VERIFICATION_STATUS.md`
- `REMEDIATION_REPORT.md`

## Repository hygiene

Generated native trees, `node_modules/`, Expo caches, CI diagnostics, build outputs, APK/AAB files, keystores, private keys and `.env` files are excluded by `.gitignore`. No production credentials are included in this repository package.

No `LICENSE` or `CODEOWNERS` file has been invented because no repository licence or ownership identities were authorised. Add those only when the repository owner chooses them.

## Dual-provider release amendment (v1.5.4)

v1.5.4 adds explicit protected selection between **OpenRouter** and **Together AI**. Each provider has a separate SecureStore credential and provider-specific model catalogue. New Chat, Full Voice, Skill, Task and Document AI requests use the selected provider through the same execution path. Provider failures never trigger automatic cross-provider fallback. Provider identity is retained in usage provenance; monetary cost remains unavailable when the selected provider does not report it.

## Code-dump reconstruction integrity

Code-dump reconstruction is fail-closed. Never reconstruct project source from a `*.code-dump.txt` by copying parsed blocks directly.

Before reconstruction, run:

```bash
npm run code-dump:verify -- path/to/project.code-dump.txt --verify-only
```

To reconstruct only after the complete embedded manifest has validated:

```bash
npm run code-dump:reconstruct -- path/to/project.code-dump.txt path/to/empty-output-directory
```

The integrity gate validates every embedded file's SHA-256 and character count before any write, rejects duplicate or unsafe paths, and rejects reconstruction/redaction sentinels. A failed validation must leave the target directory unchanged.
