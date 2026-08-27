import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import crypto from 'node:crypto';
const root=process.cwd(), read=(f)=>fs.readFileSync(path.join(root,f),'utf8'), json=(f)=>JSON.parse(read(f)), assert=(c,m)=>{if(!c)throw new Error(m)};
const pkg=json('package.json'),lock=json('package-lock.json'),app=json('app.json'),source=read('App.js'),readIf=(f)=>fs.existsSync(path.join(root,f))?read(f):'';
const verifyChecksumManifest=(name)=>{
  const full=path.join(root,name); if(!fs.existsSync(full)) return;
  const lines=fs.readFileSync(full,'utf8').split(/\r?\n/).filter(Boolean);
  for(const line of lines){
    const m=line.match(/^([a-f0-9]{64})  (.+)$/); assert(m,`Invalid checksum manifest line in ${name}: ${line}`);
    const rel=m[2].replace(/^\.\//,''); const target=path.join(root,rel); assert(fs.existsSync(target),`${name} references missing file: ${rel}`);
    const actual=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'); assert(actual===m[1],`${name} checksum mismatch: ${rel}`);
  }
};
verifyChecksumManifest('HANDOVER_SHA256SUMS.txt'); verifyChecksumManifest('SHA256SUMS_EXEC002.txt');

// Release-integrity guard: active executable/configuration text must never contain
// reconstruction redaction sentinels. Historical documentation/evidence is excluded
// deliberately so preserved provenance is not rewritten merely to satisfy this gate.
const redactionSentinel='[RE'+'DACTED:';
const activeIntegrityFiles=['App.js','index.js','package.json','package-lock.json','app.json','eas.json','babel.config.js'];
const activeIntegrityDirs=['.github','src','scripts','tests','plugins'];
const activeIntegrityExtensions=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.json','.yml','.yaml']);
const redactionHits=[];
const scanIntegrityFile=(rel)=>{
  const full=path.join(root,rel); if(!fs.existsSync(full)||!fs.statSync(full).isFile()) return;
  if(!activeIntegrityExtensions.has(path.extname(rel))&&!activeIntegrityFiles.includes(rel)) return;
  if(fs.readFileSync(full,'utf8').includes(redactionSentinel)) redactionHits.push(rel);
};
const scanIntegrityDir=(rel)=>{
  const full=path.join(root,rel); if(!fs.existsSync(full)) return;
  for(const entry of fs.readdirSync(full,{withFileTypes:true})){
    if(['node_modules','.git','dist-ci','android'].includes(entry.name)) continue;
    const child=path.join(rel,entry.name); entry.isDirectory()?scanIntegrityDir(child):scanIntegrityFile(child);
  }
};
activeIntegrityFiles.forEach(scanIntegrityFile); activeIntegrityDirs.forEach(scanIntegrityDir);
assert(redactionHits.length===0,`Active source/config contains reconstruction redaction sentinel: ${redactionHits.join(',')}`);
const codeDumpGuard=read('scripts/code-dump-integrity.mjs');
assert(codeDumpGuard.includes('@@CODE-DUMP-MANIFEST ')&&codeDumpGuard.includes('Verify the entire dump before any write')&&codeDumpGuard.includes('SHA-256 mismatch')&&codeDumpGuard.includes('Unsafe code-dump path'),'fail-closed code-dump reconstruction integrity guard missing');
assert(pkg.scripts?.['code-dump:verify']==='node scripts/code-dump-integrity.mjs'&&pkg.scripts?.['code-dump:reconstruct']==='node scripts/code-dump-integrity.mjs'&&pkg.scripts?.pretest==='npm run check','code-dump integrity guard is not wired into package test/reconstruction commands');
assert(fs.existsSync(path.join(root,'tests/codeDumpIntegrity.test.mjs')),'code-dump integrity regression tests missing');


const workflow=readIf('.github/workflows/android-apk.yml') || readIf('../.github/workflows/android-apk.yml'),readme=read('README.md'),workspace=read('src/workspaces/workspaceSchema.mjs'),backup=read('src/backup/backupService.mjs'),storage=read('src/utils/storage.js'),project=read('src/export/projectArchive.mjs'),docProject=read('src/documents/documentProjectArchive.mjs'),docStudio=read('src/components/DocumentStudio.js'),docTarget=read('src/components/DocumentTargetSheet.js'),protectedTools=read('src/components/ProtectedWorkspaceTools.js'),bubble=read('src/components/MessageBubble.js'),messageActions=read('src/components/MessageActionSheet.js'),primitives=read('src/ui/primitives.js'),responsive=read('src/ui/responsive.mjs'),settings=read('src/components/SettingsSheet.js'),protectedSettings=read('src/components/LLMSettingsSheet.js');
assert(pkg.version==='1.5.4'&&lock.version==='1.5.4'&&lock.packages[''].version==='1.5.4','v1.5.4 package identity drift');
assert(app.expo.version==='1.5.4'&&app.expo.android.versionCode===19&&app.expo.android.package==='com.nexarenew.aiconsole','Expo/Android release identity drift');
assert(app.expo.orientation==='default'&&app.expo.android.softwareKeyboardLayoutMode==='resize','adaptive orientation/IME contract missing');
assert(app.expo.userInterfaceStyle==='light'&&app.expo.backgroundColor==='#f8fafc','light-only app appearance contract missing');
assert(fs.existsSync(path.join(root,'.htaccess')),'.htaccess missing');
assert(readme.includes('AI Console v1.5.4')&&readme.includes('Document Studio Pro'),'README identity stale');
assert(workspace.includes('STORAGE_SCHEMA_VERSION_C = 6')&&workspace.includes('documentRevisions')&&workspace.includes('activeDocumentId')&&workspace.includes('usageLedger')&&workspace.includes('scheduledTasks'),'schema v6 merged intelligence state missing');
assert(storage.includes('SAVED_SECURELY')&&storage.includes('SESSION_ONLY')&&storage.includes('getApiKeyResult')&&storage.includes('READ_FAILED')&&storage.includes('persistAndVerifyVersionedAppState'),'SecureStore/durable state result contract missing');
assert(backup.includes('commitPreparedRestore')&&backup.includes('Rollback read-back verification failed'),'transactional restore verification missing');
assert(project.includes('rawZipPreflight')&&project.includes("import('jszip')")&&project.includes('documentRevisions')&&project.includes('PROJECT_ARCHIVE_SCHEMA_VERSION = 3')&&project.includes('IMPORTED_PAUSED'),'workspace archive v3/intelligence contract missing');

const intelligence=read('src/components/IntelligenceHub.js'),streamChat=read('src/utils/streamChat.js'),memory=read('src/memory/workspaceMemory.mjs'),skills=read('src/skills/skillEngine.mjs'),usage=read('src/usage/usageLedger.mjs'),tasks=read('src/tasks/taskScheduler.mjs'),fullVoice=read('src/voice/fullVoiceMode.mjs');
const providerRegistry=read('src/providers/providerRegistry.mjs');
assert(providerRegistry.includes("OPENROUTER: 'openrouter'")&&providerRegistry.includes("TOGETHER: 'together'")&&providerRegistry.includes('https://api.together.ai/v1/chat/completions')&&providerRegistry.includes('https://api.together.ai/v1/models'),'dual-provider registry contract missing');
assert(storage.includes('togetherApiKey')&&storage.includes('getTogetherApiKeyResult')&&storage.includes('setTogetherApiKey'),'Together SecureStore contract missing');
assert(protectedSettings.includes('Together AI API Key')&&protectedSettings.includes('never falls back to the other provider automatically'),'dual-provider protected-settings contract missing');
assert(source.includes('activeProvider')&&source.includes('activeApiKey')&&source.includes('providerModelGroups')&&source.includes('togetherApiKey'),'dual-provider App wiring missing');
for(const label of ['Memory','Skills','Usage','Tasks','Voice']) assert(intelligence.includes(label),`Command Intelligence surface missing: ${label}`);
assert(memory.includes('buildWorkspaceMemoryContext')&&memory.includes('workspaceId')&&memory.includes('pinned'),'Workspace Memory contract missing');
assert(skills.includes('SKILL_SCHEMA_VERSION')&&skills.includes('ai_prompt')&&skills.includes('save_memory')&&skills.includes('create_document'),'Skills engine contract missing');
assert(usage.includes('costUsd')&&usage.includes('costSource')&&usage.includes("'provider'"),'Usage/cost provenance contract missing');
assert(tasks.includes('TASK_SCHEMA_VERSION')&&tasks.includes('interval')&&tasks.includes('daily')&&tasks.includes('weekly'),'Scheduled task contract missing');
assert(fullVoice.includes('FullVoiceState')&&fullVoice.includes('REQUESTING_PERMISSION')&&fullVoice.includes('SPEAKING')&&fullVoice.includes('INTERRUPTING')&&fullVoice.includes('STOPPED'),'Full Voice state-machine contract missing');
assert(streamChat.includes('providerChatBody')&&streamChat.includes('onUsage')&&providerRegistry.includes('body.usage = { include: true }'),'provider usage telemetry request/parser missing');
assert(source.includes('buildWorkspaceMemoryContext')&&source.includes('runSkillById')&&source.includes('runScheduledTask')&&source.includes('IntelligenceHub'),'v1.5 integration wiring missing');
const imageGeneration=read('src/images/imageGeneration.mjs'),guardrails=read('src/usage/usageGuardrails.mjs');
assert(imageGeneration.includes('https://openrouter.ai/api/v1/images')&&imageGeneration.includes('allow_fallbacks: false')&&source.includes('handleGenerateImage')&&protectedSettings.includes('OpenRouter image model'),'v1.5.4 image-generation contract missing');
assert(guardrails.includes('evaluateUsageBudgets')&&guardrails.includes('projectedRequestCostUsd')&&source.includes('preflightUsageBudget')&&source.includes('usageBudgets')&&source.includes('pricingAssumptions'),'v1.5.4 usage guardrail/budget contract missing');
assert(memory.includes('deleteWorkspaceMemories')&&memory.includes('filterWorkspaceMemories')&&intelligence.includes('Delete selected memories?'),'v1.5.4 memory-management contract missing');
assert(usage.includes('estimatedCostUsd')&&usage.includes("costSource: providerCost != null ? 'provider'"),'v1.5.4 estimated-cost provenance contract missing');

assert(docProject.includes('rawZipPreflight')&&docProject.includes("import('jszip')")&&docProject.includes('mergeParsedDocumentProjectArchive'),'document project archive contract missing');
for(const f of ['src/providers/providerRegistry.mjs','src/memory/workspaceMemory.mjs','src/skills/skillEngine.mjs','src/usage/usageLedger.mjs','src/tasks/taskScheduler.mjs','src/voice/fullVoiceMode.mjs','src/components/IntelligenceHub.js','src/documents/documentDomain.mjs','src/documents/documentTemplates.mjs','src/documents/documentRender.mjs','src/documents/documentExport.js','src/components/DocumentStudio.js','src/components/MessageActionSheet.js','src/components/DocumentTargetSheet.js','src/ui/tokens.js','src/ui/primitives.js','src/ui/responsive.mjs','src/domain/generationPresentation.mjs','src/voice/manualStopFallback.mjs']) assert(fs.existsSync(path.join(root,f)),`Missing v1.5.4 module: ${f}`);
for(const label of ['General Report','Technical Specification','Audit Report','Implementation Plan','Memorandum','Proposal','Formal Letter']) assert(read('src/documents/documentTemplates.mjs').includes(label),`Missing document template ${label}`);
for(const term of ['Undo','Redo','Find in document','Create snapshot','Compare latest','Restore non-destructively','Preview PDF','DOCX: PARTIAL','AI append','AI insert','AI replace','Standard margins','Delete document','target section']) assert(docStudio.includes(term),`Document Studio contract missing: ${term}`);
assert(docStudio.includes("['pdf','md','txt','html']")&&docStudio.includes('onExport(active,f)'), 'Document Studio export format controls missing');
assert(source.includes("primaryDestination")&&source.includes("'documents'")&&source.includes('DocumentStudio'),'Documents not first-class navigation domain');
assert(source.includes('generationRequestsRef')&&source.includes('.retry(activeChat.id'),'Retry is not distinct GenerationManager retry');
assert(source.includes('conversationStateRef.current')&&source.includes('liveDirty'),'Document autosave stale-state protection missing');
assert(source.includes('handleBulkDeleteChats')&&source.includes('cancelForDeletedChat(chatId)'),'Bulk-delete generation/state cleanup missing');
assert(source.includes('deleteDocumentFromState')&&source.includes('placeVisibleChatMessage')&&docTarget.includes('Create new document')&&docTarget.includes("mode: 'append'"),'Document CRUD/chat targeting contract incomplete');
assert(source.includes('expandPromptVariables(prompt, substitutions)')&&protectedTools.includes('Fill prompt variables')&&protectedTools.includes('workspaceIds'),'Prompt variable/workspace execution contract incomplete');
assert(workspace.includes('projectAIConfiguration')&&backup.includes('projectAIConfiguration'),'Protected project AI persistence/export separation missing');
assert(bubble.includes('onLongPress')&&bubble.includes('MessageActionSheet')&&messageActions.includes('Add to document'),'long-press contextual message actions missing');
assert(primitives.includes('BottomActionSheet')&&primitives.includes('FeedbackBanner')&&primitives.includes('AccessibleReorderControls')&&primitives.includes('PrimaryNavigation'),'shared UI primitives incomplete');
assert(responsive.includes('COMPACT')&&responsive.includes('MEDIUM')&&responsive.includes('EXPANDED')&&responsive.includes('classifyLayout'),'responsive classifiers missing');
assert(source.includes("primaryDestination !== 'documents'")&&source.includes('Unsaved document changes')&&source.includes('Retry save')&&source.includes("text: 'Discard'")&&source.includes("primaryDestination !== 'chats'"),'Android Back/document dirty resolution guard missing');
assert(source.includes('persistAndVerifyVersionedAppState(candidate)')&&source.includes('handleDurableWorkspaceRename'),'durable rename/import verification missing');
assert(source.includes('commitStateTransaction')&&source.includes('prepareAtomicRestore')&&source.includes('commitCandidateState(prepared.nextState)'),'App not using transactional restore/rollback boundary');
assert(settings.includes('Haptic feedback')&&settings.includes('minHeight: 48'),'haptic/touch target settings missing');
assert(protectedSettings.includes('apiKeyPersistenceStatus')&&protectedSettings.includes('Session only'),'SecureStore failure not surfaced');
assert(!settings.includes('OpenRouter API Key')&&!settings.includes('System prompt')&&!settings.includes('Select Model'),'protected AI configuration leaked into general settings');
assert(workflow.includes('cache-dependency-path: package-lock.json')&&workflow.includes('AI_Console_v1.5.4_preview-debug-signed')&&workflow.includes('AI_Console_v1.5.4_production-release-signed')&&workflow.includes('android/app/build/outputs/apk/release/app-release.apk')&&workflow.includes("versionName='1.5.4'")&&!workflow.includes("versionName='1.5.3'"),'CI path/artifact identity drift');
assert(workflow.includes('actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803')&&workflow.includes('actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38')&&workflow.includes('actions/setup-java@b6effb05e454b25005698d916606bdc6ffcbf961')&&workflow.includes('android-actions/setup-android@40fd30fb8d7440372e1316f5d1809ec01dcd3699')&&workflow.includes('actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f'),'immutable GitHub Action SHA pinning missing or drifted');
assert(workflow.includes('android-actions/setup-android@40fd30fb8d7440372e1316f5d1809ec01dcd3699')&&workflow.includes('command -v sdkmanager')&&workflow.includes('ANDROID_SDK_ROOT'),'Android SDK command-line tool bootstrap is missing');
assert(workflow.includes('default: true')&&workflow.includes("github.event_name != 'workflow_dispatch' || inputs.run_emulator_checks")&&workflow.includes('Release runtime acceptance gate')&&workflow.includes("success() && env.RUN_EMULATOR_CHECKS == 'true'")&&workflow.includes('no APK artefact will be published'),'runtime emulator/16-KB release acceptance must default on and APK publication must fail closed when disabled');
assert(source.includes("const APP_RELEASE_LABEL = 'AI Console v1.5.4'")&&source.includes('testID=\"ai-console-app-ready\"')&&!source.includes('AI Console v1.4.0'),'real-app readiness/version marker missing or stale');
assert(workflow.includes('uiautomator dump')&&workflow.includes('node scripts/verify-app-ready-ui.mjs')&&workflow.includes('ANDROID_16_APP_READY=PASS')&&workflow.includes('ANDROID_16K_APP_READY=PASS')&&workflow.includes('FAIL_RECOVERY_SHELL'),'release runtime gate does not positively distinguish the real app from recovery shells');
assert(read('scripts/verify-app-ready-ui.mjs').includes('RECOVERY_SHELL')&&read('scripts/verify-app-ready-ui.mjs').includes('READY_MARKER_NOT_FOUND'),'executable app-ready UI classifier missing');
assert(pkg.scripts?.['build:apk']==='node scripts/build-apk-policy.mjs'&&pkg.scripts?.['build:apk:diagnostic']==='eas build -p android --profile diagnostic-preview','APK build scripts permit an ambiguous/unverified release path');
assert(workflow.includes('node scripts/verify-runtime-contract.mjs'),'runtime contract verifier is not wired into CI');
assert(!workflow.includes('generated-android-prebuild.tgz')&&workflow.includes('generated-android-config'),'CI diagnostics must exclude the generated Android build tree/APK duplication');

assert(!read('src/documents/pdfTextExtract.mjs').match(/new\s+TextDecoder\(\s*['\"]latin1['\"]/i),'Hermes-unsupported latin1 TextDecoder remains on the startup import path');
assert(!source.includes("from 'expo-speech-recognition'")&&!source.includes("require('expo-speech-recognition')")&&source.includes('loadSpeechRecognitionModule')&&source.includes('speechRecognitionAdapter.mjs'),'speech recognition must be loaded only through the validated startup-safe adapter');
assert(source.includes("import AppErrorBoundary from './src/components/AppErrorBoundary'")&&source.includes('<AppErrorBoundary><AIConsoleApp /></AppErrorBoundary>'),'root React error boundary missing');
assert(source.includes('Startup recovery mode: saved state could not be restored safely')&&source.includes('hydrationDegradedRef.current'),'startup hydration recovery/overwrite protection missing');
const speechPlugin=(app.expo.plugins||[]).find((entry)=>Array.isArray(entry)&&entry[0]==='expo-speech-recognition'); assert(speechPlugin?.[1]?.androidSpeechServicePackages?.includes('com.google.android.googlequicksearchbox')&&speechPlugin?.[1]?.androidSpeechServicePackages?.includes('com.google.android.tts'),'Android speech service package visibility is incomplete');
assert(workflow.includes('node-version: ${{ env.NODE_VERSION }}')&&workflow.includes('NODE_VERSION: "24"')&&workflow.includes('runs-on: ubuntu-24.04')&&workflow.includes('expo install --check')&&workflow.includes('expo-doctor@1.20.2')&&workflow.includes('npm audit --omit=dev --audit-level=high')&&workflow.includes('system-images;android-36;google_apis;x86_64')&&workflow.includes('system-images;android-35;google_apis_ps16k;x86_64')&&workflow.includes('ANDROID_16_PROCESS_SURVIVAL=PASS')&&workflow.includes('ANDROID_16K_PROCESS_SURVIVAL=PASS'),'SDK 57 / reproducible runner / Android 16 + dedicated 16-KB runtime CI gates missing');
assert(workflow.includes('Release-critical test skip detected')&&workflow.includes('npm-test.txt'),'CI no-skip test gate missing');
assert(workflow.includes('APK_ZIPALIGN_16K')&&workflow.includes('APK_NATIVE_ELF_16K')&&workflow.includes('EMULATOR_PAGE_SIZE_16K')&&workflow.includes('ANDROID_16_PROCESS_SURVIVAL')&&workflow.includes('ANDROID_16K_PROCESS_SURVIVAL')&&workflow.includes('app:assembleDebug')&&workflow.includes('app:assembleRelease')&&workflow.includes('android/app/build/outputs/apk/debug/app-debug.apk')&&workflow.includes('android/app/build/outputs/apk/release/app-release.apk')&&workflow.includes('zipalign')&&workflow.includes('-P 16')&&workflow.includes('readelf -lW'),'Android APK variant / 16-KB / runtime gate split missing');
assert(workflow.includes('AI_CONSOLE_ANDROID_KEYSTORE_BASE64')&&workflow.includes('AI_CONSOLE_ANDROID_CERT_SHA256')&&workflow.includes('PRODUCTION_SIGNING_PREFLIGHT=FAIL')&&workflow.includes('Signing certificate SHA-256 does not match')&&workflow.includes('Android Debug'),'production signing gate missing');
const buildProperties=(app.expo.plugins||[]).find((entry)=>Array.isArray(entry)&&entry[0]==='expo-build-properties'); assert(buildProperties?.[1]?.android?.compileSdkVersion===36&&buildProperties?.[1]?.android?.targetSdkVersion===36&&buildProperties?.[1]?.android?.buildToolsVersion==='36.0.0'&&workflow.includes('compileSdk(Version)?[ =]+36')&&workflow.includes('targetSdk(Version)?[ =]+36'),'explicit Android API 36 configuration or portable Gradle gate missing');
const splashLintPlugin=read('plugins/withAndroidSplashLintTargetApi.cjs'); assert((app.expo.plugins||[]).includes('./plugins/withAndroidSplashLintTargetApi')&&splashLintPlugin.includes('withAndroidStyles')&&splashLintPlugin.includes("'tools:targetApi': '33'"),'Android splash lint annotation plugin missing');
const embeddedBundlePlugin=read('plugins/withEmbeddedDebugBundle.cjs'); assert((app.expo.plugins||[]).includes('./plugins/withEmbeddedDebugBundle')&&embeddedBundlePlugin.includes('withAppBuildGradle')&&embeddedBundlePlugin.includes('debuggableVariants = []'),'standalone debug bundle plugin missing');
const modalLiteralAnimations=[]; for(const name of fs.readdirSync(path.join(root,'src/components'))){if(!name.endsWith('.js'))continue;const body=read(`src/components/${name}`);if(/<Modal[^>]*animationType="(?:slide|fade)"/.test(body))modalLiteralAnimations.push(name);}assert(modalLiteralAnimations.length===0,`reduced-motion bypass remains in modals: ${modalLiteralAnimations.join(',')}`);
assert(primitives.includes("reduced?'none':'fade'")&&primitives.includes("reduced?'none':'slide'"),'shared modal reduced-motion contract missing');
assert(primitives.includes('useModalAccessibilityFocus')&&primitives.includes('setAccessibilityFocus')&&source.includes('announceForAccessibility'),'modal focus/screen announcement accessibility contract missing');
assert(docStudio.includes('Heading level')&&docStudio.includes('Move editor to this heading'),'document outline accessibility semantics missing');
const forbiddenFiles=[]; const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','dist-ci','android'].includes(e.name))continue;const p=path.join(dir,e.name); if(e.isDirectory())walk(p);else if(/\.(jks|keystore|p12|pfx|env)$/i.test(e.name)||e.name==='.env')forbiddenFiles.push(p)}};walk(root);assert(forbiddenFiles.length===0,`private signing/secret files packaged: ${forbiddenFiles.join(',')}`);


const voiceFallback=read('src/voice/manualStopFallback.mjs');
assert(source.includes('voiceManualStopRef.current = true')&&source.includes('isRecoverableAndroidManualStopError')&&voiceFallback.includes("platform !== 'android'")&&voiceFallback.includes("event?.error === 'client'")&&voiceFallback.includes('Number(event?.code) === 5'),'Android speech manual-stop transcript preservation contract missing');

const queue=read('src/domain/offlineQueue.mjs'),conversation=read('src/domain/conversationSchema.mjs'),rawZip=read('src/utils/rawZipPreflight.mjs'),pinThrottle=read('src/security/pinThrottle.mjs');
assert(app.expo.android.blockedPermissions?.includes('android.permission.SYSTEM_ALERT_WINDOW'),'unnecessary SYSTEM_ALERT_WINDOW permission is not blocked');
assert(pinThrottle.includes('maxFailures: 5')&&pinThrottle.includes('lockMs: 5 * 60 * 1000')&&source.includes('PIN_THROTTLE_STORAGE_KEY'),'persistent PIN attempt throttling contract missing');
assert(conversation.includes('while(changed)')&&conversation.includes('removed.has(m.parentMessageId)'),'descendant message deletion cascade missing');
assert(queue.includes("CANCELLED:['QUEUED']")&&queue.includes('recoverInterruptedTurns'),'offline queue retry/restart recovery contract missing');
assert(workspace.includes('activeWorkspaceChatIds')&&workspace.includes("activeChatId = activeWorkspaceChatIds.has"),'workspace active-chat scoping missing');
assert(rawZip.includes('boundedBase64ToBytes')&&project.includes('boundedBase64ToBytes')&&docProject.includes('boundedBase64ToBytes'),'pre-base64-decode archive source bound missing');
assert(!source.includes('useEffect(() => { if (messages.length) scrollToBottom(); }'),'forced message-count autoscroll regression remains');

console.log('STATIC_CHECK: PASS');
