# Known External Gates — v1.5.4 REM002 R4

1. Transfer the exact R4 application/source byte set to an authorised GitHub build source and execute it through the `cstonepts-prog/ai-console` Android workflow. A private branch `v1.5.4-r3-exact-build-source` was created during R4 preparation, but exact source transfer and a remote build have **not** been completed or claimed.
2. Clean lockfile dependency restoration with normal registry/cache access plus `npm audit`, `npx expo install --check`, pinned Expo Doctor and clean Expo prebuild. A temporary exact preinstalled JSZip 3.10.1 resolver may be used for deterministic local tests only; it is not a substitute for clean dependency restoration.
3. Fresh v1.5.4/versionCode 19 APK with Android 16/API-36 real-app readiness, dedicated 16-KB emulator/runtime checks, ZIP/ELF 16-KB checks and signing-identity evidence.
4. Production-signing acceptance when authorised production signing material is available.
5. Physical Android Full Voice acceptance for FL-VOI-D001..D014, including permissions, interim/final STT, manual-stop fallback, repeated turns, auto-send/listen, TTS, Stop/Interrupt/barge-in, recovery, lifecycle, keyboard fallback, accessibility and long-session stability.
6. Physical accessibility acceptance: TalkBack, focus order/restoration, dynamic text, reduced motion, touch targets, Android Back and notification permission UX where applicable.
7. Authorised live OpenRouter and Together model discovery/chat/streaming/usage/provenance plus OpenRouter image-generation acceptance. Together Kimi K2.5 serverless availability must be established from the live model catalogue where provider documentation remains ambiguous.
8. Scheduled Tasks device notification/background/catch-up semantics. Closed-app exact autonomous AI execution remains outside the locked scope.

These are external/tool-surface verification or readiness gates, not known locally actionable application-source defects.
