import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, BackHandler, KeyboardAvoidingView, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import MessageBubble from './src/components/MessageBubble';
import SettingsSheet from './src/components/SettingsSheet';
import LLMSettingsSheet from './src/components/LLMSettingsSheet';
import PinGateModal from './src/components/PinGateModal';
import ModelPicker from './src/components/ModelPicker';
import ChatManager from './src/components/ChatManager';
import WorkspaceManager from './src/components/WorkspaceManager';
import ProtectedWorkspaceTools from './src/components/ProtectedWorkspaceTools';
import AttachmentSourceSheet from './src/components/AttachmentSourceSheet';
import PdfReviewSheet from './src/components/PdfReviewSheet';
import VoiceReviewSheet from './src/components/VoiceReviewSheet';
import DocumentStudio from './src/components/DocumentStudio';
import DocumentTargetSheet from './src/components/DocumentTargetSheet';
import IntelligenceHub from './src/components/IntelligenceHub';
import FullVoiceScreen from './src/components/FullVoiceScreen';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { IconAlert, IconBot, IconChat, IconClose, IconDocument, IconKey, IconMic, IconSend, IconSettings, IconStop, IconUpload, IconWorkspace } from './src/components/Icons';
import { getColors, radii } from './src/theme';
import { DEFAULT_SYSTEM_PROMPT, commitStateTransaction, formatProviderName, getApiKeyResult, getTogetherApiKeyResult, getJSON, getLLMSettingsPin, getVersionedAppStateResult, INITIAL_MODELS, persistAndVerifyVersionedAppState, setApiKey as persistApiKey, setTogetherApiKey as persistTogetherApiKey, setJSON, setLLMSettingsPin } from './src/utils/storage';
import { sanitizeChatsForPersistence } from './src/utils/privacy.mjs';
import { completeChatCompletion, fetchModels, streamChatCompletion } from './src/utils/streamChat';
import { DEFAULT_PROVIDER_MODELS, INITIAL_PROVIDER_MODEL_GROUPS, normaliseProviderId, providerLabel, ProviderId } from './src/providers/providerRegistry.mjs';
import { isLegacyPlainPinRecord, pinVerifierNeedsUpgrade, verifyPinAgainstRecordAsync } from './src/utils/pinVerifier.mjs';
import { pickAndExtractFile, pickApkFile } from './src/utils/fileUpload';
import { captureCameraImage, loadImageDataUrl, pickGalleryImage, pickImageFile } from './src/utils/mediaPicker';
import { apkContextSummary } from './src/utils/uploadPolicy.mjs';
import { DEFAULT_OUTPUT_TOKENS, normaliseOutputTokens } from './src/utils/outputTokens.mjs';
import { activeBranchMessages, appendTurn, branchIds, createChat, createId, editMessageAndBranch, estimateTokens, migratePackageAToB, providerMessagesForTarget, regenerateAssistant, removeMessage, setActiveBranch, updateMessageContent } from './src/domain/conversationSchema.mjs';
import { createWorkflowChildChat, nextWorkflowStatus, setWorkflowStatus } from './src/domain/workflowTree.mjs';
import { assignFolder, bulkArchive, bulkDelete, setArchived, setPinned, setTags } from './src/domain/conversationOrganisation.mjs';
import { QueueStatus, cancelTurn, cleanCompletedTurns, enqueueTurn, markFailed, markSending, markSent, removeQueueForChat, retryTurn } from './src/domain/offlineQueue.mjs';
import { deterministicFilename, exportChatHtml, exportChatMarkdown, exportChatText, parseChatImport, safeChatExport } from './src/export/chatExport.mjs';
import { createChatPdf, PDF_LAYOUTS } from './src/export/pdfExport';
import { createChatDocumentArchive, documentZipFilename } from './src/export/documentArchive.mjs';
import { GenerationManager } from './src/services/generationManager.mjs';
import { addWorkspace, addWorkspaceNote, archiveWorkspace, deleteDocumentFromState, deleteWorkspace, migrateBToC, normaliseCState, renameWorkspace, workspaceChats } from './src/workspaces/workspaceSchema.mjs';
import { addPrompt, createPrompt, deletePrompt, duplicatePrompt, expandPromptVariables, mergePromptLibraries, parsePromptImport, promptAppliesToWorkspace, safePromptExport, updatePrompt } from './src/prompts/promptLibrary.mjs';
import { createOrdinaryBackup, prepareAtomicRestore, previewRestore } from './src/backup/backupService.mjs';
import { addAttachment, createAttachment, createAttachmentSession, removeAttachment, reorderAttachment, updateAttachmentStatus } from './src/attachments/attachmentSession.mjs';
import { bytesToBase64, createProjectArchive, mergeParsedProjectArchive, parseProjectArchive, projectArchiveFilename } from './src/export/projectArchive.mjs';
import { createDocumentProjectArchive, documentProjectFilename, mergeParsedDocumentProjectArchive, parseDocumentProjectArchive } from './src/documents/documentProjectArchive.mjs';
import { appendRevision, applyAiDocumentOperation, applyRevisionHead, createDocument, createRevision, markDocumentSaved, markDocumentSaveFailed, markDocumentSaving, placeVisibleChatMessage } from './src/documents/documentDomain.mjs';
import { exportDocument, previewDocumentPdf } from './src/documents/documentExport';
import { renderDocumentText } from './src/documents/documentRender.mjs';
import { classifyLayout } from './src/ui/responsive.mjs';
import { FeedbackBanner, PrimaryNavigation, triggerHaptic } from './src/ui/primitives';
import { processPdf } from './src/documents/pdfPipeline.mjs';
import { localPdfAdapter } from './src/documents/localPdfAdapter';
import { addDocumentSource, buildContextManifest, createDocumentSession, selectDocumentPages, selectDocumentSources } from './src/documents/contextManifest.mjs';
import { loadSpeechRecognitionModule } from './src/voice/speechRecognitionAdapter.mjs';
import { extractSpeechTranscript, isRecoverableAndroidManualStopError } from './src/voice/manualStopFallback.mjs';
import { normalisePinThrottle, pinThrottleRemainingMs, recordPinFailure, resetPinThrottle } from './src/security/pinThrottle.mjs';
import { addWorkspaceMemory, buildWorkspaceMemoryContext, deleteWorkspaceMemories, deleteWorkspaceMemory, explainWorkspaceMemorySelection, touchWorkspaceMemories, updateWorkspaceMemory } from './src/memory/workspaceMemory.mjs';
import { createDraftFromPublishedSkill, createSkill, createSkillRun, exportSkillDefinition, finishSkillRun, moveSkillStep, normaliseSkill, parseSkillImport, publishSkillDraft, renderSkillTemplate, resolveSkillVersion, retireSkill, skillStepConditionMet, updateSkillDraft, validateSkill } from './src/skills/skillEngine.mjs';
import { appendUsageEvent, createUsageEvent } from './src/usage/usageLedger.mjs';
import { applyEstimatedUsageCost, evaluateUsageBudgets, projectedRequestCostUsd, upsertPricingAssumption, upsertUsageBudget } from './src/usage/usageGuardrails.mjs';
import { DEFAULT_IMAGE_MODEL, extensionForImageMime, fetchOpenRouterImageModels, generateOpenRouterImage } from './src/images/imageGeneration.mjs';
import { completeScheduledTaskRun, createScheduledTask, createTaskRunRecord, isTaskDue, normaliseScheduledTask, skipScheduledTaskRun, taskConditionMet } from './src/tasks/taskScheduler.mjs';
import { beginFullVoiceTurn, callbackBelongsToVoiceRun, createFullVoiceSession, FullVoiceState, recoverFullVoiceAfterLifecycleInterruption, shouldAutoListenAfterSpeech, shouldAutoSendTranscript, shouldSpeakAssistantResponse, splitSpeechSentences, transitionFullVoiceSession, voiceStateAnnouncement } from './src/voice/fullVoiceMode.mjs';

const calculateEstimatedTokens = (text = '') => Math.ceil(String(text).length / 4);
const PIN_THROTTLE_STORAGE_KEY = 'aiConsolePinThrottle';
const APP_RELEASE_LABEL = 'AI Console v1.5.4';
const STARTUP_HYDRATION_TIMEOUT_MS = 6000;
const withStartupTimeout = (promise, timeoutMs = STARTUP_HYDRATION_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    const error = new Error(`Startup data did not respond within ${Math.ceil(timeoutMs / 1000)} seconds.`);
    error.code = 'STARTUP_HYDRATION_TIMEOUT';
    reject(error);
  }, timeoutMs);
  Promise.resolve(promise).then((value) => { clearTimeout(timeout); resolve(value); }, (error) => { clearTimeout(timeout); reject(error); });
});

let cachedSpeechRecognitionModule = null;

function AIConsoleApp() {
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [togetherApiKey, setTogetherApiKeyState] = useState('');
  const [activeProvider, setActiveProvider] = useState(ProviderId.OPENROUTER);
  const [providerModelGroups, setProviderModelGroups] = useState(() => ({ ...INITIAL_PROVIDER_MODEL_GROUPS }));
  const [providerModels, setProviderModels] = useState(() => ({ ...DEFAULT_PROVIDER_MODELS }));
  const [imageModelGroups, setImageModelGroups] = useState({});
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [modelPickerMode, setModelPickerMode] = useState('text');
  const [isFetchingImageModels, setIsFetchingImageModels] = useState(false);
  const [imageGeneration, setImageGeneration] = useState(null);
  const modelGroups = providerModelGroups[activeProvider] || INITIAL_PROVIDER_MODEL_GROUPS[activeProvider] || INITIAL_MODELS;
  const model = providerModels[activeProvider] || DEFAULT_PROVIDER_MODELS[activeProvider];
  const setModel = (value) => setProviderModels((previous) => ({ ...previous, [activeProvider]: value }));
  const activeApiKey = activeProvider === ProviderId.TOGETHER ? togetherApiKey : apiKey;
  const activeProviderLabel = providerLabel(activeProvider);
  const keyForProvider = (providerId) => normaliseProviderId(providerId) === ProviderId.TOGETHER ? togetherApiKey : apiKey;
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_OUTPUT_TOKENS);
  const [colorMode, setColorMode] = useState('light');
  const [conversationState, setConversationState] = useState(() => normaliseCState({}));
  const [input, setInput] = useState('');
  const [attachmentSession, setAttachmentSession] = useState(() => createAttachmentSession());
  const [editSourceMessageId, setEditSourceMessageId] = useState(null);
  const [generations, setGenerations] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState('');
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState(false);
  const [pinGateOpen, setPinGateOpen] = useState(false);
  const [pinGateMode, setPinGateMode] = useState('unlock');
  const [openProtectedAfterPin, setOpenProtectedAfterPin] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);
  const [isWorkspaceManagerOpen, setIsWorkspaceManagerOpen] = useState(false);
  const [isProtectedWorkspaceToolsOpen, setIsProtectedWorkspaceToolsOpen] = useState(false);
  const [isAttachmentSourceOpen, setIsAttachmentSourceOpen] = useState(false);
  const [pdfReview, setPdfReview] = useState(null);
  const [pdfSelectedPages, setPdfSelectedPages] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState('en-GB');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [offlineMode, setOfflineMode] = useState(false);
  const [primaryDestination, setPrimaryDestination] = useState('chats');
  const [apiKeyPersistenceStatus, setApiKeyPersistenceStatus] = useState('UNKNOWN');
  const [togetherApiKeyPersistenceStatus, setTogetherApiKeyPersistenceStatus] = useState('UNKNOWN');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [documentTargetOpen, setDocumentTargetOpen] = useState(false);
  const [documentTargetMessage, setDocumentTargetMessage] = useState(null);
  const [pendingPromptContext, setPendingPromptContext] = useState(null);
  const [bookmarkViewerOpen, setBookmarkViewerOpen] = useState(false);
  const [documentGeneration, setDocumentGeneration] = useState(null);
  const [intelligenceHubOpen, setIntelligenceHubOpen] = useState(false);
  const [memoryRequestPanelOpen, setMemoryRequestPanelOpen] = useState(false);
  const [requestMemoryOff, setRequestMemoryOff] = useState(false);
  const [requestMemoryExcludedIds, setRequestMemoryExcludedIds] = useState([]);
  const [fullVoiceScreenOpen, setFullVoiceScreenOpen] = useState(false);
  const [fullVoiceSession, setFullVoiceSession] = useState(() => createFullVoiceSession());
  const [speechVoices, setSpeechVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const generationRequestsRef = useRef(new Map());
  const imageAbortRef = useRef(null);
  const conversationStateRef = useRef(conversationState);
  const skipInitialApiKeyPersistRef = useRef(true);
  const skipInitialTogetherApiKeyPersistRef = useRef(true);
  const apiKeyReadHealthyRef = useRef(true);
  const apiKeyPersistRevisionRef = useRef(0);
  const togetherApiKeyPersistRevisionRef = useRef(0);
  const statePersistRevisionRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const documentGenerationRef = useRef(null);
  const hydrationDegradedRef = useRef(false);
  const pinThrottleRef = useRef(resetPinThrottle());
  const chatManagerTriggerRef = useRef(null);
  const workspaceManagerTriggerRef = useRef(null);
  const settingsTriggerRef = useRef(null);
  const protectedSettingsTriggerRef = useRef(null);
  const attachmentTriggerRef = useRef(null);
  const voiceTriggerRef = useRef(null);
  const messageInputRef = useRef(null);
  const { width } = useWindowDimensions();
  const layout = classifyLayout(width);
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  // Retained as a compatibility guard: both generation identity and stream cancellation remain chat-scoped.
  const streamRefs = useRef(new Map());
  const generationManagerRef = useRef(null);
  const attachmentExtractsRef = useRef(new Map());
  const voiceDraftRef = useRef('');
  const voiceManualStopRef = useRef(false);
  const fullVoiceSessionRef = useRef(fullVoiceSession);
  const schedulerBusyRef = useRef(new Set());
  const previousWorkspaceIdRef = useRef(null);
  const fullVoiceTranscriptHandlerRef = useRef(null);
  const voiceRecognitionRunRef = useRef(null);
  const voiceTtsRunRef = useRef(null);
  const fullVoiceGenerationRef = useRef(null);
  const voiceAutoListenTimerRef = useRef(null);
  const fullVoiceScreenTriggerRef = useRef(null);
  const intelligenceTriggerRef = useRef(null);
  const palette = useMemo(() => getColors(colorMode), [colorMode]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const chats = workspaceChats(conversationState);
  const activeChatId = conversationState.activeChatId;
  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) || chats[0] || null, [chats, activeChatId]);
  const activeWorkspace = useMemo(() => conversationState.workspaces.find((workspace) => workspace.id === conversationState.activeWorkspaceId) || conversationState.workspaces[0] || null, [conversationState.workspaces, conversationState.activeWorkspaceId]);
  const messages = useMemo(() => activeBranchMessages(activeChat), [activeChat]);
  const activeGeneration = activeChat ? generations[activeChat.id] : null;
  const headerUsageTokens = useMemo(() => (conversationState.usageLedger || []).filter((event)=>!activeWorkspace?.id || event.workspaceId===activeWorkspace.id).reduce((sum,event)=>sum+Number(event.totalTokens||0),0), [conversationState.usageLedger, activeWorkspace?.id]);
  const isLoading = Boolean(activeGeneration && !['COMPLETE', 'FAILED', 'CANCELLED'].includes(activeGeneration.status));
  const activeDocument = useMemo(() => (conversationState.documents || []).find((doc) => doc.id === conversationState.activeDocumentId) || null, [conversationState.documents, conversationState.activeDocumentId]);
  const activeDocumentGeneration = useMemo(() => (documentGeneration?.documentId === activeDocument?.id ? documentGeneration : (conversationState.documentGenerationJobs || []).find((job) => job.documentId === activeDocument?.id) || null), [documentGeneration, conversationState.documentGenerationJobs, activeDocument?.id]);
  const activeBranches = useMemo(() => branchIds(activeChat), [activeChat]);
  const requestMemoryPreview = useMemo(() => explainWorkspaceMemorySelection(activeWorkspace?.memories || [], { query: input, excludedIds: requestMemoryExcludedIds, disabled: requestMemoryOff }), [activeWorkspace?.memories, input, requestMemoryExcludedIds, requestMemoryOff]);
  const activeQueuedTurns = useMemo(() => (conversationState.offlineQueue || []).filter((turn) => turn.chatId === activeChat?.id), [conversationState.offlineQueue, activeChat?.id]);
  const anyGeneration = useMemo(() => Object.values(generations).find((job) => job && !['COMPLETE','FAILED','CANCELLED'].includes(job.status)) || null, [generations]);
  const activeSkillRun = useMemo(() => (conversationState.skillRuns || []).find((run) => run.status === 'RUNNING') || null, [conversationState.skillRuns]);
  const activeTaskRun = useMemo(() => (conversationState.taskRuns || []).find((run) => run.status === 'RUNNING') || null, [conversationState.taskRuns]);
  const executionStatus = anyGeneration ? `Chat generation · ${anyGeneration.status}` : activeSkillRun ? `Skill · ${activeSkillRun.skillName} · RUNNING` : activeTaskRun ? `Task · ${activeTaskRun.taskName} · RUNNING` : activeDocumentGeneration && ['QUEUED','STREAMING'].includes(activeDocumentGeneration.status) ? `Document AI · ${activeDocumentGeneration.status}` : imageGeneration && ['QUEUED','RUNNING'].includes(imageGeneration.status) ? `Image generation · ${imageGeneration.status}` : '';
  const navigationItems = useMemo(() => [{ id: 'chats', label: 'Chats', icon: <IconChat size={20} color={palette.textMuted} /> }, { id: 'workspaces', label: 'Workspaces', icon: <IconWorkspace size={20} color={palette.textMuted} /> }, { id: 'documents', label: 'Documents', icon: <IconDocument size={20} color={palette.textMuted} /> }, { id: 'settings', label: 'Settings', icon: <IconSettings size={20} color={palette.textMuted} /> }], [palette]);

  if (!generationManagerRef.current) {
    const manager = new GenerationManager({
      onStateChange: (chatId, job, snapshot) => { setGenerations(snapshot); if (job && ['COMPLETE','FAILED','CANCELLED'].includes(job.status)) { streamRefs.current.delete(chatId); const request=generationRequestsRef.current.get(chatId); if (request?.queueId) setConversationState((previous)=>({...previous,offlineQueue: job.status==='COMPLETE'?cleanCompletedTurns(markSent(previous.offlineQueue,request.queueId)):markFailed(previous.offlineQueue,request.queueId,job.error||`Generation ${String(job.status).toLowerCase()}.`)})); if (job.status === 'COMPLETE') generationRequestsRef.current.delete(chatId); } },
    });
    manager.setDeltaHandler((chatId, job, delta) => setConversationState((previous) => {
      const currentChat = previous.chats.find((chat) => chat.id === chatId);
      if (!currentChat || !currentChat.messages.some((message) => message.messageId === job.targetMessageId)) return previous;
      const current = currentChat.messages.find((message) => message.messageId === job.targetMessageId);
      return updateMessageContent(previous, chatId, job.targetMessageId, `${current.content || ''}${delta}`);
    }));
    generationManagerRef.current = manager;
  }

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const [storedKeyResult, storedTogetherKeyResult, storedProviderGroups, storedProviderModels, storedActiveProvider, storedGroups, storedModel, storedImageModelGroups, storedImageModel, storedPrompt, storedTemp, storedMaxTokens, storedChats, storedActiveId, storedMessages, storedTokens, storedMode, versionedResult, storedLocale, storedPlaybackSpeed, storedDestination, storedHaptics, storedFullVoiceEnabled, storedFullVoiceAutoSend, storedFullVoiceAutoListen, storedFullVoiceSpeakResponses, storedVoiceId] = await withStartupTimeout(Promise.all([
          getApiKeyResult(), getTogetherApiKeyResult(), getJSON('providerModelGroups', null), getJSON('providerModels', null), getJSON('activeProvider', ProviderId.OPENROUTER), getJSON('modelGroups', INITIAL_MODELS), getJSON('activeModel', 'openrouter/auto'), getJSON('imageModelGroups', {}), getJSON('imageModel', DEFAULT_IMAGE_MODEL), getJSON('systemPrompt', DEFAULT_SYSTEM_PROMPT), getJSON('temperature', 0.2), getJSON('maxTokens', DEFAULT_OUTPUT_TOKENS), getJSON('chats', []), getJSON('activeChatId', ''), getJSON('chatHistory', []), getJSON('estimatedTokens', 0), getJSON('colorMode', 'light'), getVersionedAppStateResult(), getJSON('voiceLocale', 'en-GB'), getJSON('playbackSpeed', 1), getJSON('primaryDestination', 'chats'), getJSON('hapticsEnabled', true), getJSON('fullVoiceEnabled', false), getJSON('fullVoiceAutoSend', true), getJSON('fullVoiceAutoListen', true), getJSON('fullVoiceSpeakResponses', true), getJSON('selectedVoiceId', ''),
        ]));
        const legacy = { chats: storedChats, activeChatId: storedActiveId, chatHistory: storedMessages, estimatedTokens: storedTokens };
        let state;
        if (versionedResult.ok && versionedResult.state) state = normaliseCState(versionedResult.state);
        else if (!versionedResult.ok && versionedResult.backupState) { hydrationDegradedRef.current = true; state = normaliseCState(versionedResult.backupState); setError('Startup recovery mode: a verified previous state was loaded read-only. Automatic writes are blocked until a deliberate restore/import action succeeds.'); }
        else if (!versionedResult.ok) { hydrationDegradedRef.current = true; state = normaliseCState(migrateBToC(migratePackageAToB(legacy))); setError('Startup recovery mode: durable state is unreadable and no verified backup is available. Automatic writes are blocked.'); }
        else state = normaliseCState(migrateBToC(migratePackageAToB(legacy)));
        state = { ...state, documentGenerationJobs: (state.documentGenerationJobs || []).map((job) => job.status === 'STREAMING' ? { ...job, status: 'FAILED', error: 'Interrupted by application restart.', updatedAt: Date.now() } : job) };
        if (!mounted) return;
        apiKeyReadHealthyRef.current = storedKeyResult.ok && storedTogetherKeyResult.ok;
        setApiKeyState(storedKeyResult.value);
        setTogetherApiKeyState(storedTogetherKeyResult.value);
        setApiKeyPersistenceStatus(storedKeyResult.ok ? 'READ_OK' : 'READ_FAILED');
        setTogetherApiKeyPersistenceStatus(storedTogetherKeyResult.ok ? 'READ_OK' : 'READ_FAILED');
        const providerAtHydration = normaliseProviderId(storedActiveProvider);
        const migratedGroups = storedProviderGroups && typeof storedProviderGroups === 'object'
          ? { ...INITIAL_PROVIDER_MODEL_GROUPS, ...storedProviderGroups }
          : { ...INITIAL_PROVIDER_MODEL_GROUPS, [ProviderId.OPENROUTER]: storedGroups && typeof storedGroups === 'object' ? storedGroups : INITIAL_MODELS };
        const migratedModels = storedProviderModels && typeof storedProviderModels === 'object'
          ? { ...DEFAULT_PROVIDER_MODELS, ...storedProviderModels }
          : { ...DEFAULT_PROVIDER_MODELS, [ProviderId.OPENROUTER]: storedModel || DEFAULT_PROVIDER_MODELS[ProviderId.OPENROUTER] };
        setActiveProvider(providerAtHydration);
        setProviderModelGroups(migratedGroups);
        setProviderModels(migratedModels);
        setImageModelGroups(storedImageModelGroups && typeof storedImageModelGroups === 'object' ? storedImageModelGroups : {});
        setImageModel(typeof storedImageModel === 'string' && storedImageModel.trim() ? storedImageModel : DEFAULT_IMAGE_MODEL);
        setSystemPrompt(storedPrompt);
        setTemperature(Number(storedTemp) || 0.2);
        setMaxTokens(normaliseOutputTokens(storedMaxTokens));
        setConversationState(state);
        setColorMode('light');
        setVoiceLocale(typeof storedLocale === 'string' ? storedLocale : 'en-GB');
        setPlaybackSpeed(Number(storedPlaybackSpeed) || 1);
        setPrimaryDestination(['chats', 'workspaces', 'documents', 'settings'].includes(storedDestination) ? storedDestination : 'chats');
        setHapticsEnabled(storedHaptics !== false);
        setFullVoiceSession(createFullVoiceSession({ enabled: storedFullVoiceEnabled === true, autoSend: storedFullVoiceAutoSend !== false, autoListen: storedFullVoiceAutoListen !== false, speakResponses: storedFullVoiceSpeakResponses !== false }));
        setSelectedVoiceId(typeof storedVoiceId === 'string' ? storedVoiceId : '');
        void Speech.getAvailableVoicesAsync().then((voices) => { if (mounted) setSpeechVoices(Array.isArray(voices) ? voices.filter((voice) => !voiceLocale || !voice.language || String(voice.language).toLowerCase().startsWith(String(voiceLocale).slice(0,2).toLowerCase())) : []); }).catch(() => {});
      } catch (hydrateError) {
        if (!mounted) return;
        hydrationDegradedRef.current = true;
        apiKeyReadHealthyRef.current = false;
        setApiKeyPersistenceStatus('READ_FAILED');
        setTogetherApiKeyPersistenceStatus('READ_FAILED');
        setError(hydrateError?.code === 'STARTUP_HYDRATION_TIMEOUT'
          ? 'Startup recovery mode: saved data did not respond in time. Dr Stones Command Centre opened with a safe in-memory session; restart to retry access to saved data.'
          : `Startup recovery mode: saved state could not be restored safely${hydrateError?.message ? ` (${hydrateError.message})` : ''}. Existing durable state has not been overwritten.`);
      } finally {
        if (mounted) setHydrated(true);
      }
    };
    void hydrate();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!openProtectedAfterPin || pinGateOpen) return;
    setOpenProtectedAfterPin(false);
    setIsLLMSettingsOpen(true);
  }, [openProtectedAfterPin, pinGateOpen]);

  useEffect(() => {
    if (!hydrated || hydrationDegradedRef.current) return;
    if (skipInitialApiKeyPersistRef.current) {
      skipInitialApiKeyPersistRef.current = false;
      return;
    }
    const revision = ++apiKeyPersistRevisionRef.current;
    persistApiKey(apiKey).then((result) => {
      if (revision !== apiKeyPersistRevisionRef.current) return;
      setApiKeyPersistenceStatus(result.status);
    });
  }, [apiKey, hydrated]);
  useEffect(() => {
    if (!hydrated || hydrationDegradedRef.current) return;
    if (skipInitialTogetherApiKeyPersistRef.current) {
      skipInitialTogetherApiKeyPersistRef.current = false;
      return;
    }
    const revision = ++togetherApiKeyPersistRevisionRef.current;
    persistTogetherApiKey(togetherApiKey).then((result) => {
      if (revision !== togetherApiKeyPersistRevisionRef.current) return;
      setTogetherApiKeyPersistenceStatus(result.status);
    });
  }, [togetherApiKey, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) { setJSON('providerModelGroups', providerModelGroups); setJSON('modelGroups', providerModelGroups[ProviderId.OPENROUTER] || INITIAL_MODELS); } }, [providerModelGroups, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) { setJSON('providerModels', providerModels); setJSON('activeModel', providerModels[ProviderId.OPENROUTER] || DEFAULT_PROVIDER_MODELS[ProviderId.OPENROUTER]); } }, [providerModels, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('activeProvider', activeProvider); }, [activeProvider, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('imageModelGroups', imageModelGroups); }, [imageModelGroups, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('imageModel', imageModel); }, [imageModel, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('systemPrompt', systemPrompt); }, [systemPrompt, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('temperature', temperature); }, [temperature, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('maxTokens', maxTokens); }, [maxTokens, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('colorMode', colorMode); }, [colorMode, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('voiceLocale', voiceLocale); }, [voiceLocale, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('playbackSpeed', playbackSpeed); }, [playbackSpeed, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('primaryDestination', primaryDestination); }, [primaryDestination, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('hapticsEnabled', hapticsEnabled); }, [hapticsEnabled, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('fullVoiceEnabled', fullVoiceSession.enabled); }, [fullVoiceSession.enabled, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('fullVoiceAutoSend', fullVoiceSession.autoSend); }, [fullVoiceSession.autoSend, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('fullVoiceAutoListen', fullVoiceSession.autoListen); }, [fullVoiceSession.autoListen, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('fullVoiceSpeakResponses', fullVoiceSession.speakResponses); }, [fullVoiceSession.speakResponses, hydrated]);
  useEffect(() => { if (hydrated && !hydrationDegradedRef.current) setJSON('selectedVoiceId', selectedVoiceId); }, [selectedVoiceId, hydrated]);
  useEffect(() => { void Speech.getAvailableVoicesAsync().then((voices) => setSpeechVoices(Array.isArray(voices) ? voices.filter((voice) => !voiceLocale || !voice.language || String(voice.language).toLowerCase().startsWith(String(voiceLocale).slice(0,2).toLowerCase())) : [])).catch(() => {}); }, [voiceLocale]);
  useEffect(() => { conversationStateRef.current = conversationState; }, [conversationState]);
  useEffect(() => { fullVoiceSessionRef.current = fullVoiceSession; }, [fullVoiceSession]);
  useEffect(() => {
    if (!hydrated || typeof AccessibilityInfo.announceForAccessibility !== 'function') return;
    const labels = { chats: 'Chats', workspaces: 'Workspaces', documents: 'Documents', settings: 'Settings' };
    AccessibilityInfo.announceForAccessibility(`${labels[primaryDestination] || 'AI Console'} screen`);
  }, [primaryDestination, hydrated]);
  useEffect(() => { if (!hydrated || hydrationDegradedRef.current) return; const revision=++statePersistRevisionRef.current; void persistAndVerifyVersionedAppState(conversationState).then((result)=>{ if (revision===statePersistRevisionRef.current && !result.ok) setError(result.error || 'Application state could not be durably verified.'); }); void setJSON('chats', sanitizeChatsForPersistence(conversationState.chats)); void setJSON('activeChatId', activeChatId); }, [conversationState, activeChatId, hydrated]);
  useEffect(() => {
    if (!hydrated || hydrationDegradedRef.current) return undefined;
    const dirty = (conversationState.documents || []).find((doc) => doc.autosaveStatus === 'DIRTY');
    if (!dirty) return undefined;
    const dirtyId = dirty.id;
    const timer = setTimeout(async () => {
      const current = conversationStateRef.current;
      const liveDirty = (current.documents || []).find((doc) => doc.id === dirtyId && doc.autosaveStatus === 'DIRTY');
      if (!liveDirty) return;
      const revision = createRevision(liveDirty, { label: 'Autosave', kind: 'AUTOSAVE' });
      const savingDoc = applyRevisionHead(markDocumentSaving(liveDirty), revision);
      const candidate = { ...current, documents: current.documents.map((doc) => doc.id === dirtyId ? savingDoc : doc), documentRevisions: appendRevision(current.documentRevisions || [], revision) };
      conversationStateRef.current = candidate;
      setConversationState(candidate);
      const result = await persistAndVerifyVersionedAppState(candidate);
      setConversationState((latest) => {
        const next = { ...latest, documents: latest.documents.map((doc) => { if (doc.id !== dirtyId) return doc; const exactCandidate = doc.revisionHeadId === revision.id && Number(doc.updatedAt) === Number(savingDoc.updatedAt); if (!exactCandidate) return doc; return result.ok ? markDocumentSaved(doc) : markDocumentSaveFailed(doc); }) };
        conversationStateRef.current = next;
        return next;
      });
      if (!result.ok) setError(result.error || 'Document autosave failed.');
    }, 650);
    return () => clearTimeout(timer);
  }, [conversationState.documents, hydrated]);

  useEffect(() => {
    let disposed = false;
    let resultSubscription; let errorSubscription; let endSubscription;
    void loadSpeechRecognitionModule().then((loaded) => {
      if (disposed) return;
      if (!loaded.ok) { cachedSpeechRecognitionModule = null; return; }
      const speechRecognition = loaded.module;
      cachedSpeechRecognitionModule = speechRecognition;
      try {
        resultSubscription = speechRecognition.addListener('result', (event) => {
          const run = voiceRecognitionRunRef.current;
          const session = fullVoiceSessionRef.current;
          if (!run?.active) return;
          if (run.fullVoice && run.sessionId !== session.sessionId) return;
          const transcript = extractSpeechTranscript(event);
          if (transcript) { voiceDraftRef.current = transcript; setVoiceDraft(transcript); }
          if (run.fullVoice && event?.isFinal === true && transcript && !run.finalDelivered) {
            run.finalDelivered = true;
            run.active = false;
            voiceManualStopRef.current = false;
            setIsListening(false);
            try { speechRecognition.abort?.(); } catch (_) {}
            fullVoiceTranscriptHandlerRef.current?.(transcript);
          }
        });
        errorSubscription = speechRecognition.addListener('error', (event) => {
          const run = voiceRecognitionRunRef.current;
          if (!run?.active) return;
          const session = fullVoiceSessionRef.current;
          if (run.fullVoice && run.sessionId !== session.sessionId) return;
          const transcript = voiceDraftRef.current.trim();
          const recoverableManualStop = isRecoverableAndroidManualStopError({ event, manualStopRequested: voiceManualStopRef.current, transcript: voiceDraftRef.current, platform: Platform.OS });
          run.active = false;
          voiceManualStopRef.current = false;
          setIsListening(false);
          if (recoverableManualStop) { if (fullVoiceTranscriptHandlerRef.current?.(transcript)) return; setVoiceReviewOpen(true); return; }
          if (event.error === 'aborted' || event.error === 'no-speech') {
            if (session.enabled && !run.finalDelivered) setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.STOPPED,{recognitionRunId:null,stopReason:event.error}));
            return;
          }
          if (session.enabled) setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.STT_ERROR,{error:event.message||'Speech recognition is unavailable.',recognitionRunId:null}));
          setError(event.message || 'Speech recognition is unavailable. Typing remains available.');
        });
        endSubscription = speechRecognition.addListener('end', () => {
          const run = voiceRecognitionRunRef.current;
          if (!run?.active) return;
          const session = fullVoiceSessionRef.current;
          if (run.fullVoice && run.sessionId !== session.sessionId) return;
          run.active = false;
          voiceManualStopRef.current = false;
          setIsListening(false);
          const transcript=voiceDraftRef.current.trim();
          if (transcript && !run.finalDelivered) { if (fullVoiceTranscriptHandlerRef.current?.(transcript)) return; setVoiceReviewOpen(true); }
          else if (session.enabled) setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.STOPPED,{recognitionRunId:null,stopReason:'Recognition ended.'}));
        });
      } catch (_) { cachedSpeechRecognitionModule = null; setError('Speech recognition is unavailable in this build. Typing remains available.'); }
    });
    return () => { disposed = true; voiceManualStopRef.current = false; if (voiceRecognitionRunRef.current) voiceRecognitionRunRef.current.active = false; try { resultSubscription?.remove?.(); } catch (_) {} try { errorSubscription?.remove?.(); } catch (_) {} try { endSubscription?.remove?.(); } catch (_) {} try { cachedSpeechRecognitionModule?.abort?.(); } catch (_) {} };
  }, []);


  // Explicit stream cleanup contract retained for CI/static verification and unmount safety.
  useEffect(() => () => { for (const entry of streamRefs.current.values()) entry.stream?.cancel?.(); streamRefs.current.clear(); }, []);

  useEffect(() => {
    const lifecycleSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      generationManagerRef.current?.recoverAfterLifecycleTransition();
      if (voiceAutoListenTimerRef.current) { clearTimeout(voiceAutoListenTimerRef.current); voiceAutoListenTimerRef.current = null; }
      const recognitionRun = voiceRecognitionRunRef.current;
      if (recognitionRun) recognitionRun.active = false;
      voiceRecognitionRunRef.current = null;
      voiceManualStopRef.current = false;
      try { cachedSpeechRecognitionModule?.abort?.(); } catch (_) {}
      setIsListening(false);
      const ttsRun = voiceTtsRunRef.current;
      if (ttsRun) ttsRun.stopReason = 'lifecycle';
      void Speech.stop().catch(() => {});
      if (fullVoiceSessionRef.current.enabled) setFullVoiceSession((session) => recoverFullVoiceAfterLifecycleInterruption(session));
    });
    return () => {
      lifecycleSubscription.remove();
      if (voiceAutoListenTimerRef.current) clearTimeout(voiceAutoListenTimerRef.current);
      void Speech.stop().catch(() => {});
      try { cachedSpeechRecognitionModule?.abort?.(); } catch (_) {}
      for (const entry of streamRefs.current.values()) entry.stream?.cancel?.();
      streamRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!fullVoiceSession.enabled) return;
    const announcement = voiceStateAnnouncement(fullVoiceSession.state);
    if (announcement) AccessibilityInfo.announceForAccessibility?.(announcement);
  }, [fullVoiceSession.state, fullVoiceSession.enabled]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => { if (fullVoiceScreenOpen) { void stopFullVoiceSession(); setFullVoiceScreenOpen(false); return true; } if (intelligenceHubOpen) { setIntelligenceHubOpen(false); return true; } if (documentTargetOpen) { setDocumentTargetOpen(false); return true; } if (isChatManagerOpen) { setIsChatManagerOpen(false); return true; } if (isWorkspaceManagerOpen) { setIsWorkspaceManagerOpen(false); return true; } if (voiceReviewOpen) { setVoiceReviewOpen(false); return true; } if (pdfReview) { setPdfReview(null); return true; } if (isAttachmentSourceOpen) { setIsAttachmentSourceOpen(false); return true; } if (isProtectedWorkspaceToolsOpen) { setIsProtectedWorkspaceToolsOpen(false); return true; } if (isSettingsOpen || isLLMSettingsOpen) { setIsSettingsOpen(false); setIsLLMSettingsOpen(false); return true; } if (primaryDestination !== 'chats') { requestPrimaryDestination('chats'); return true; } return false; });
    return () => backSubscription.remove();
  }, [fullVoiceScreenOpen, intelligenceHubOpen, documentTargetOpen, isChatManagerOpen, isWorkspaceManagerOpen, isProtectedWorkspaceToolsOpen, isAttachmentSourceOpen, pdfReview, voiceReviewOpen, isSettingsOpen, isLLMSettingsOpen, primaryDestination, activeDocument?.autosaveStatus]);

  const scrollToBottom = useCallback(() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80), []);
  const currentModelName = () => `${activeProviderLabel} · ${Object.values(modelGroups || {}).flat().find((item) => item.id === model)?.name || model}`;
  const currentImageModelName = () => Object.values(imageModelGroups || {}).flat().find((item) => item.id === imageModel)?.name || imageModel;
  const effectiveSystemPrompt = (query = '', workspaceId = activeWorkspace?.id, memoryOptions = {}) => {
    const state = conversationStateRef.current;
    const workspace = (state.workspaces || []).find((item) => item.id === workspaceId) || activeWorkspace;
    const project = String(workspace?.projectAIConfiguration?.systemInstructions || '').trim();
    const memoryContext = buildWorkspaceMemoryContext(workspace, query, memoryOptions);
    const parts = [systemPrompt];
    if (project) parts.push(`Project instructions:
${project}`);
    if (memoryContext.text) parts.push(memoryContext.text);
    if (memoryContext.entries.length && workspace?.id) {
      const ids = memoryContext.entries.map((entry) => entry.id);
      setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((item) => item.id === workspace.id ? touchWorkspaceMemories(item, ids) : item) }));
    }
    return parts.join('\n\n');
  };
  const updateChat = (chatId, updater) => setConversationState((previous) => ({ ...previous, chats: previous.chats.map((chat) => chat.id === chatId ? { ...updater(chat), updatedAt: Date.now() } : chat) }));
  const selectWorkspace = (workspaceId) => setConversationState((previous) => { const workspace = previous.workspaces.find((item) => item.id === workspaceId); if (!workspace) return previous; const nextChat = previous.chats.find((chat) => chat.workspaceId === workspaceId); const nextDocument = (previous.documents || []).find((doc) => doc.workspaceId === workspaceId && doc.status !== 'ARCHIVED'); return { ...previous, activeWorkspaceId: workspace.id, activeChatId: nextChat?.id || '', activeDocumentId: nextDocument?.id || null }; });
  const updateWorkspace = (workspaceId, updater) => setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((workspace) => workspace.id === workspaceId ? { ...updater(workspace), updatedAt: Date.now() } : workspace) }));
  const commitCandidateState = async (candidate) => {
    const previous = conversationStateRef.current;
    const result = await commitStateTransaction(previous, normaliseCState(candidate));
    if (!result.ok) throw new Error(result.error || 'State transaction failed and rollback could not be verified.');
    hydrationDegradedRef.current = false;
    conversationStateRef.current = result.state;
    setConversationState(result.state);
    return result.state;
  };
  const validateArchivePickerSize = async (asset, maxBytes = 25 * 1024 * 1024) => {
    const info = await FileSystem.getInfoAsync(asset?.uri || '', { size: true });
    const size = Number(info?.size);
    if (!info?.exists || !Number.isFinite(size) || size < 0) throw new Error('Archive size could not be verified safely.');
    if (size > maxBytes) throw new Error(`Archive exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB source-size limit.`);
    return size;
  };
  const requestPrimaryDestination = (destination) => {
    if (destination === primaryDestination) return;
    if (primaryDestination !== 'documents' || !activeDocument || !['DIRTY','SAVING','SAVE_FAILED'].includes(activeDocument.autosaveStatus)) { setPrimaryDestination(destination); return; }
    if (activeDocument.autosaveStatus === 'SAVING') { Alert.alert('Document save in progress', 'Stay in Document Studio until the current durable write finishes.', [{ text: 'OK' }]); return; }
    const discard = () => {
      const head = (conversationState.documentRevisions || []).find((revision) => revision.id === activeDocument.revisionHeadId && revision.documentId === activeDocument.id);
      if (!head?.snapshot) { Alert.alert('No durable revision available', 'This document has no verified revision to discard back to. Retry the save instead.'); return; }
      setConversationState((previous) => ({ ...previous, documents: previous.documents.map((doc) => doc.id === activeDocument.id ? { ...head.snapshot, autosaveStatus: 'SAVED', lastSavedAt: head.createdAt, updatedAt: head.createdAt } : doc) }));
      setPrimaryDestination(destination);
    };
    const retry = async () => {
      try {
        const state = conversationStateRef.current;
        const doc = (state.documents || []).find((item) => item.id === activeDocument.id);
        if (!doc) return;
        const saving = markDocumentSaving(doc);
        const candidate = { ...state, documents: state.documents.map((item) => item.id === doc.id ? saving : item) };
        const result = await persistAndVerifyVersionedAppState(candidate);
        if (!result.ok) throw new Error(result.error || 'Save could not be durably verified.');
        setConversationState((previous) => ({ ...previous, documents: previous.documents.map((item) => item.id === doc.id ? markDocumentSaved(item) : item) }));
        setPrimaryDestination(destination);
      } catch (saveError) { setError(saveError.message || 'Document save failed.'); }
    };
    Alert.alert('Unsaved document changes', 'Choose how to resolve this document before leaving Document Studio.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: discard }, { text: 'Retry save', onPress: () => void retry() }]);
  };
  const stopGenerationForChat = (chatId) => { generationManagerRef.current?.cancel(chatId); streamRefs.current.get(chatId)?.stream?.cancel?.(); streamRefs.current.delete(chatId); };
  const stopGeneration = () => { if (activeChat) stopGenerationForChat(activeChat.id); };

  const requestProtectedSettingsAccess = async () => { try { const storedPin = await getLLMSettingsPin(); setPinGateMode(storedPin ? 'unlock' : 'create'); setPinGateOpen(true); } catch (_) { setError('Protected settings are unavailable because secure device storage could not be opened.'); } };
  const handlePinSubmit = async (pin) => {
    try {
      if (pinGateMode === 'unlock') {
        const now = Date.now();
        const persistedThrottle = normalisePinThrottle(await getJSON(PIN_THROTTLE_STORAGE_KEY, pinThrottleRef.current), now);
        pinThrottleRef.current = persistedThrottle;
        const remainingMs = pinThrottleRemainingMs(persistedThrottle, now);
        if (remainingMs > 0) return `Too many incorrect PIN attempts. Try again in ${Math.max(1, Math.ceil(remainingMs / 60000))} minute(s).`;
        const storedPin = await getLLMSettingsPin();
        if (!storedPin || !(await verifyPinAgainstRecordAsync(pin, storedPin))) {
          const nextThrottle = recordPinFailure(persistedThrottle, now);
          pinThrottleRef.current = nextThrottle;
          await setJSON(PIN_THROTTLE_STORAGE_KEY, nextThrottle);
          const lockedMs = pinThrottleRemainingMs(nextThrottle, now);
          return lockedMs > 0 ? `Too many incorrect PIN attempts. Locked for ${Math.ceil(lockedMs / 60000)} minutes.` : 'Incorrect PIN.';
        }
        pinThrottleRef.current = resetPinThrottle();
        await setJSON(PIN_THROTTLE_STORAGE_KEY, pinThrottleRef.current);
        if (isLegacyPlainPinRecord(storedPin) || pinVerifierNeedsUpgrade(storedPin)) await setLLMSettingsPin(pin);
      } else {
        await setLLMSettingsPin(pin);
        pinThrottleRef.current = resetPinThrottle();
        await setJSON(PIN_THROTTLE_STORAGE_KEY, pinThrottleRef.current);
      }
      setPinGateOpen(false);
      setOpenProtectedAfterPin(true);
      return '';
    } catch (pinError) { return pinError.message || 'Unable to access protected settings.'; }
  };

  const preflightUsageBudget = ({ workspaceId = null, provider = activeProviderLabel, requestModel = model, requestMessages = [], maxCompletionTokens = maxTokens, projectedCostOverride = null } = {}) => {
    const state = conversationStateRef.current;
    const promptTokens = calculateEstimatedTokens(JSON.stringify(requestMessages || []));
    const projectedCostUsd = projectedCostOverride == null
      ? projectedRequestCostUsd({ provider, model: requestModel, promptTokens, maxCompletionTokens }, state.pricingAssumptions || [])
      : Math.max(0, Number(projectedCostOverride) || 0);
    const evaluation = evaluateUsageBudgets({ events: state.usageLedger || [], budgets: state.usageBudgets || [], workspaceId, projectedCostUsd });
    if (!evaluation.allowed) {
      const block = evaluation.blocks[0];
      const scope = block?.budget?.scope === 'WORKSPACE' ? 'Workspace' : 'Global';
      throw new Error(`${scope} ${String(block?.budget?.period || 'monthly').toLowerCase()} budget reached. Request blocked before the provider call.`);
    }
    if (evaluation.warnings.length) {
      const warning = evaluation.warnings[0];
      setError(`Budget warning: ${warning.budget.scope === 'WORKSPACE' ? 'workspace' : 'global'} spend is ${Math.round(warning.percent)}% of its ${String(warning.budget.period || 'monthly').toLowerCase()} limit.`);
    }
    return evaluation;
  };

  const recordUsage = ({ workspaceId = null, chatId = null, skillId = null, taskId = null, origin = null, voiceSessionId = null, voiceTurnId = null, correlationId = null, outputRef = null, requestKind = 'chat', usage = null, responseText = '', requestMessages = [], latencyMs = null, status = 'complete', provider = activeProviderLabel, requestModel = model } = {}) => {
    const rawEvent = createUsageEvent({ workspaceId, chatId, skillId, taskId, origin, voiceSessionId, voiceTurnId, correlationId, outputRef, model: requestModel, provider, requestKind, usage, estimatedPromptTokens: calculateEstimatedTokens(JSON.stringify(requestMessages || [])), estimatedCompletionTokens: calculateEstimatedTokens(responseText), latencyMs, status });
    const event = applyEstimatedUsageCost(rawEvent, conversationStateRef.current.pricingAssumptions || []);
    setConversationState((previous) => ({ ...previous, usageLedger: appendUsageEvent(previous.usageLedger || [], event) }));
    return event;
  };

  const startGeneration = (chatId, targetMessageId, apiMessages, options = {}) => {
    const requestProvider = normaliseProviderId(options.provider || activeProvider);
    const requestModel = options.model || providerModels[requestProvider] || DEFAULT_PROVIDER_MODELS[requestProvider];
    const requestApiKey = keyForProvider(requestProvider);
    const requestProviderLabel = providerLabel(requestProvider);
    const budgetWorkspaceId = conversationStateRef.current.chats.find((item) => item.id === chatId)?.workspaceId || conversationStateRef.current.activeWorkspaceId;
    try {
      preflightUsageBudget({ workspaceId: budgetWorkspaceId, provider: requestProviderLabel, requestModel, requestMessages: apiMessages });
    } catch (budgetError) {
      setConversationState((previous) => updateMessageContent(previous, chatId, targetMessageId, budgetError.message || 'Request blocked by usage budget.'));
      setError(budgetError.message || 'Request blocked by usage budget.');
      options.onError?.(budgetError);
      return false;
    }
    generationRequestsRef.current.set(chatId, { targetMessageId, apiMessages, queueId: options.queueId || null, provider: requestProvider, model: requestModel });
    let response = '';
    let providerUsage = null;
    let providerMeta = { model: requestModel, provider: requestProviderLabel, providerId: requestProvider };
    const startedAt = Date.now();
    generationManagerRef.current.start({ chatId, targetMessageId, streamFactory: (callbacks) => {
      const requestId = `request-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const isCurrentRequest = () => streamRefs.current.get(chatId)?.requestId === requestId;
      const stream = streamChatCompletion({
        provider: requestProvider, apiKey: requestApiKey, model: requestModel, messages: apiMessages, temperature, maxTokens,
        onDelta: (delta) => { if (isCurrentRequest()) { response += delta; callbacks.onDelta(delta); } },
        onUsage: (usage, meta) => { if (isCurrentRequest()) { providerUsage = usage; providerMeta = { ...providerMeta, ...(meta || {}) }; } },
        onMeta: (meta) => { if (isCurrentRequest()) providerMeta = { ...providerMeta, ...(meta || {}) }; },
        onDone: () => {
          if (!isCurrentRequest()) return;
          const chat = conversationStateRef.current.chats.find((item) => item.id === chatId);
          recordUsage({ workspaceId: chat?.workspaceId || conversationStateRef.current.activeWorkspaceId, chatId, skillId: options.skillId || null, taskId: options.taskId || null, origin: options.origin || null, voiceSessionId: options.voiceSessionId || null, voiceTurnId: options.voiceTurnId || null, requestKind: options.requestKind || 'chat', usage: providerUsage, responseText: response, requestMessages: apiMessages, latencyMs: Date.now() - startedAt, provider: providerMeta.provider || requestProviderLabel, requestModel: providerMeta.model || requestModel });
          options.onComplete?.(response, providerUsage, providerMeta);
          callbacks.onDone();
        },
        onError: (streamError) => {
          if (isCurrentRequest()) {
            const chat = conversationStateRef.current.chats.find((item) => item.id === chatId);
            recordUsage({ workspaceId: chat?.workspaceId || conversationStateRef.current.activeWorkspaceId, chatId, skillId: options.skillId || null, taskId: options.taskId || null, origin: options.origin || null, voiceSessionId: options.voiceSessionId || null, voiceTurnId: options.voiceTurnId || null, requestKind: options.requestKind || 'chat', responseText: response, requestMessages: apiMessages, latencyMs: Date.now() - startedAt, status: 'failed', provider: requestProviderLabel, requestModel });
            setError(`${requestProviderLabel} API Error: ${streamError.message}`); callbacks.onError(streamError); options.onError?.(streamError);
          }
        },
      });
      streamRefs.current.set(chatId, { requestId, stream });
      return stream;
    } });
    return true;
  };

  const buildProviderRequest = (chat, targetMessageId, promptContext = pendingPromptContext, memoryOptions = { excludedIds: requestMemoryExcludedIds, disabled: requestMemoryOff }) => {
    const scoped = providerMessagesForTarget(chat, targetMessageId);
    const query = scoped.filter((message) => message.role === 'user').at(-1)?.content || '';
    const preamble = [{ role: 'system', content: effectiveSystemPrompt(typeof query === 'string' ? query : JSON.stringify(query), chat.workspaceId, memoryOptions) }];
    if (promptContext && ['system','developer'].includes(promptContext.role) && promptContext.content.trim()) preamble.push({ role: promptContext.role, content: promptContext.content });
    return [...preamble, ...scoped];
  };
  const addMemoryToWorkspace = (values) => {
    if (!activeWorkspace) return;
    try { setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((workspace) => workspace.id === activeWorkspace.id ? addWorkspaceMemory(workspace, values) : workspace) })); }
    catch (memoryError) { setError(memoryError.message || 'Memory could not be saved.'); }
  };
  const updateMemoryInWorkspace = (memoryId, patch) => { if (activeWorkspace) setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((workspace) => workspace.id === activeWorkspace.id ? updateWorkspaceMemory(workspace, memoryId, patch) : workspace) })); };
  const deleteMemoryFromWorkspace = (memoryId) => { if (activeWorkspace) setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((workspace) => workspace.id === activeWorkspace.id ? deleteWorkspaceMemory(workspace, memoryId) : workspace) })); };
  const bulkDeleteMemoriesFromWorkspace = (memoryIds) => { if (activeWorkspace) setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((workspace) => workspace.id === activeWorkspace.id ? deleteWorkspaceMemories(workspace, memoryIds) : workspace) })); };
  const upsertBudgetInState = (values) => setConversationState((previous) => normaliseCState({ ...previous, usageBudgets: upsertUsageBudget(previous.usageBudgets || [], values) }));
  const deleteBudgetFromState = (budgetId) => setConversationState((previous) => normaliseCState({ ...previous, usageBudgets: (previous.usageBudgets || []).filter((budget) => budget.id !== budgetId) }));
  const upsertPricingInState = (values) => setConversationState((previous) => normaliseCState({ ...previous, pricingAssumptions: upsertPricingAssumption(previous.pricingAssumptions || [], values) }));
  const deletePricingFromState = (pricingId) => setConversationState((previous) => normaliseCState({ ...previous, pricingAssumptions: (previous.pricingAssumptions || []).filter((pricing) => pricing.id !== pricingId) }));
  const clearLocalUsageHistory = () => setConversationState((previous) => normaliseCState({ ...previous, usageLedger: [] }));
  const createCustomSkill = (values = {}) => setConversationState((previous) => ({ ...previous, skills: [...(previous.skills || []), createSkill({ ...values, description: values.description || 'Custom Command Centre Skill', workspaceScope: previous.activeWorkspaceId, output: values.output || 'chat', steps: values.steps || [{ name: 'Generate', type: 'generate', prompt: values.prompt || '{{input}}' }] })] }));
  const toggleSkillEnabled = (skillId, enabled) => setConversationState((previous) => ({ ...previous, skills: (previous.skills || []).map((skill) => skill.id === skillId ? normaliseSkill({ ...skill, enabled, updatedAt: Date.now() }) : skill) }));
  const duplicateSkillById = (skillId) => setConversationState((previous) => { const source=(previous.skills||[]).find((skill)=>skill.id===skillId); if(!source) return previous; const copy=createSkill({ ...source, id: undefined, name: `${source.name} copy`, builtIn:false, status:'DRAFT', workspaceScope: previous.activeWorkspaceId, version:1, publishedVersions:[], createdAt:Date.now(), updatedAt:Date.now(), steps:(source.steps||[]).map((step)=>({...step,id:undefined})) }); return {...previous,skills:[...(previous.skills||[]),copy]}; });
  const updateSkillDraftById = (skillId, patch) => setConversationState((previous) => ({ ...previous, skills:(previous.skills||[]).map((skill)=>{ if(skill.id!==skillId)return skill; const draft=skill.status==='DRAFT'?skill:createDraftFromPublishedSkill(skill); return updateSkillDraft(draft,patch); }) }));
  const publishSkillById = (skillId) => setConversationState((previous) => ({ ...previous, skills:(previous.skills||[]).map((skill)=>skill.id===skillId?publishSkillDraft(skill):skill) }));
  const newSkillDraftById = (skillId) => setConversationState((previous) => ({ ...previous, skills:(previous.skills||[]).map((skill)=>skill.id===skillId?createDraftFromPublishedSkill(skill):skill) }));
  const retireSkillById = (skillId) => setConversationState((previous) => ({ ...previous, skills:(previous.skills||[]).map((skill)=>skill.id===skillId?retireSkill(skill):skill), scheduledTasks:(previous.scheduledTasks||[]).map((task)=>task.skillId===skillId?{...task,enabled:false,lastStatus:'RETIRED_SKILL',lastError:'Pinned Skill was retired.',updatedAt:Date.now()}:task) }));
  const moveSkillStepById = (skillId, stepId, direction) => setConversationState((previous) => ({ ...previous, skills:(previous.skills||[]).map((skill)=>skill.id===skillId?moveSkillStep(skill.status==='DRAFT'?skill:createDraftFromPublishedSkill(skill),stepId,direction):skill) }));
  const importSkillText = (text) => { try { const imported=parseSkillImport(text); setConversationState((previous)=>({...previous,skills:[...(previous.skills||[]),{...imported,workspaceScope:previous.activeWorkspaceId}]})); return {ok:true}; } catch(importError){ setError(importError.message||'Skill import failed.'); return {ok:false,error:importError.message}; } };
  const exportSkillText = (skillId) => { const skill=(conversationStateRef.current.skills||[]).find((item)=>item.id===skillId); return skill?exportSkillDefinition(skill):''; };
  const deleteSkillById = (skillId) => setConversationState((previous) => ({ ...previous, skills: (previous.skills || []).filter((skill) => skill.id !== skillId || skill.builtIn), scheduledTasks: (previous.scheduledTasks || []).map((task) => task.skillId === skillId ? { ...task, enabled: false, lastStatus: 'DISABLED_SKILL', lastError: 'Referenced Skill was deleted.', updatedAt: Date.now() } : task) }));

  const runSkillById = async (skillId, inputText = '', { taskId = null, requestedVersion = null, correlationId = null, workspaceId = null } = {}) => {
    const stateAtStart = conversationStateRef.current;
    const sourceSkill = (stateAtStart.skills || []).find((item) => item.id === skillId);
    const workspace = (stateAtStart.workspaces || []).find((item) => item.id === (workspaceId || stateAtStart.activeWorkspaceId));
    if (!sourceSkill || !sourceSkill.enabled || sourceSkill.status === 'RETIRED') throw new Error('Skill is unavailable, retired or disabled.');
    if (sourceSkill.workspaceScope !== 'all' && sourceSkill.workspaceScope !== workspace?.id) throw new Error('Skill is not available in this workspace.');
    const skill = requestedVersion == null ? sourceSkill : resolveSkillVersion(sourceSkill, requestedVersion);
    const validation = validateSkill(skill);
    if (!validation.ok) throw new Error(validation.errors[0]?.message || 'Skill validation failed.');
    const needsProvider = (skill.steps || []).some((step) => step.type === 'generate');
    if (needsProvider && !activeApiKey.trim()) throw new Error(`${activeProviderLabel} API key is required to run this Skill.`);
    if (needsProvider && offlineMode) throw new Error('Skill generation requires an online provider connection.');
    const run = createSkillRun({ skill, workspaceId: workspace?.id, input: inputText, taskId, requestedVersion: requestedVersion || skill.version, ...(correlationId ? { correlationId } : {}) });
    setConversationState((previous) => ({ ...previous, skillRuns: [...(previous.skillRuns || []), run].slice(-500) }));
    let previousOutput = '';
    const variables = {};
    const stepResults = [];
    try {
      const memoryContext = buildWorkspaceMemoryContext(workspace, inputText).text;
      for (const step of skill.steps || []) {
        const templateContext = { input: inputText, previous: previousOutput, workspace, memory: memoryContext, variables };
        const conditionContext = { previous: previousOutput, variables, online: !offlineMode };
        if (step.type !== 'condition' && !skillStepConditionMet(step.condition, conditionContext)) {
          stepResults.push({ stepId: step.id, name: step.name, type:step.type, status: 'SKIPPED', output: '' });
          continue;
        }
        let stepOutput = previousOutput;
        let extra = {};
        if (step.type === 'prompt') {
          stepOutput = renderSkillTemplate(step.prompt, templateContext);
        } else if (step.type === 'generate') {
          const prompt = renderSkillTemplate(step.prompt, templateContext);
          const skillMessages = [{ role: 'system', content: effectiveSystemPrompt(inputText, workspace?.id) }, { role: 'user', content: prompt }];
          preflightUsageBudget({ workspaceId: workspace?.id, provider: activeProviderLabel, requestModel: model, requestMessages: skillMessages });
          const startedAt = Date.now();
          const result = await completeChatCompletion({ provider: activeProvider, apiKey: activeApiKey, model, temperature, maxTokens, messages: skillMessages });
          stepOutput = result.text;
          recordUsage({ workspaceId: workspace?.id, skillId: skill.id, taskId, correlationId:run.correlationId, outputRef:run.id, requestKind: taskId ? 'scheduled-skill' : 'skill', usage: result.usage, responseText: result.text, requestMessages: [{ role:'user',content:prompt }], latencyMs: Date.now() - startedAt, provider: result.meta?.provider || activeProviderLabel, requestModel: result.meta?.model || model });
        } else if (step.type === 'condition') {
          const matched = skillStepConditionMet(step.condition, conditionContext);
          stepResults.push({ stepId:step.id, name:step.name, type:step.type, status:matched?'COMPLETE':'SKIPPED', output:matched?'true':'false' });
          if (step.outputVariable) variables[step.outputVariable] = matched;
          continue;
        } else if (step.type === 'set_variable') {
          const variableName = step.variableName || step.outputVariable;
          stepOutput = renderSkillTemplate(step.value || step.prompt || '{{previous}}', templateContext);
          if (variableName) variables[variableName] = stepOutput;
        } else if (step.type === 'save_memory') {
          stepOutput = renderSkillTemplate(step.prompt || '{{previous}}', templateContext) || previousOutput;
          if (stepOutput.trim()) setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((item) => item.id === workspace.id ? addWorkspaceMemory(item, { content: stepOutput, type: step.memoryType || 'fact', source: 'skill', sourceRef: skill.id }) : item) }));
        } else if (step.type === 'write_document') {
          stepOutput = renderSkillTemplate(step.prompt || '{{previous}}', templateContext) || previousOutput;
          const doc = applyAiDocumentOperation(createDocument({ workspaceId: workspace.id, title: `${skill.name} · ${new Date().toLocaleDateString()}` }), { operation:'append', text:stepOutput });
          setConversationState((previous) => normaliseCState({ ...previous, documents:[...(previous.documents||[]),doc], activeDocumentId:doc.id }));
          extra = { documentId: doc.id };
        } else if (step.type === 'notify') {
          stepOutput = renderSkillTemplate(step.notificationText || step.value || '{{previous}}', templateContext) || previousOutput;
          setError(stepOutput || `Skill notification: ${skill.name}`);
        }
        previousOutput = String(stepOutput ?? '');
        if (step.outputVariable) variables[step.outputVariable] = previousOutput;
        stepResults.push({ stepId: step.id, name: step.name, type:step.type, status: 'COMPLETE', output: previousOutput, ...extra });
      }
      const output = previousOutput;
      if (skill.output === 'memory' && output.trim()) setConversationState((previous) => ({ ...previous, workspaces: previous.workspaces.map((item) => item.id === workspace.id ? addWorkspaceMemory(item, { content: output, type: 'fact', source: 'skill', sourceRef: skill.id }) : item) }));
      if (skill.output === 'document' && output.trim()) {
        const doc = applyAiDocumentOperation(createDocument({ workspaceId: workspace.id, title: `${skill.name} · ${new Date().toLocaleDateString()}` }), { operation:'append', text:output });
        setConversationState((previous) => normaliseCState({ ...previous, documents:[...(previous.documents||[]),doc], activeDocumentId:doc.id }));
      }
      if (skill.output === 'chat' && output.trim()) {
        setConversationState((previous) => {
          let chat = previous.chats.find((item) => item.id === previous.activeChatId && item.workspaceId === workspace.id);
          let base = previous;
          if (!chat) { chat = { ...createChat(skill.name), workspaceId: workspace.id }; base = normaliseCState({ ...previous, chats:[...previous.chats,chat], activeChatId:chat.id }); }
          let next = appendTurn(base, chat.id, { role:'user', content:`Skill · ${skill.name}${inputText.trim()?`\n${inputText.trim()}`:''}`, apiContent:`Skill · ${skill.name}${inputText.trim()?`\n${inputText.trim()}`:''}` });
          const nextChat = next.chats.find((item) => item.id === chat.id); const target = nextChat.messages.at(-1);
          return updateMessageContent(next, chat.id, target.messageId, output);
        });
      }
      const finished = finishSkillRun(run, { output, stepResults });
      setConversationState((previous) => ({ ...previous, skillRuns: (previous.skillRuns || []).map((item) => item.id === run.id ? finished : item) }));
      setError(`Skill complete: ${skill.name}`);
      return { output, run: finished };
    } catch (skillError) {
      const failed = finishSkillRun(run, { output: previousOutput, stepResults, error: skillError.message || 'Skill failed.' });
      setConversationState((previous) => ({ ...previous, skillRuns: (previous.skillRuns || []).map((item) => item.id === run.id ? failed : item) }));
      throw skillError;
    }
  };

  const createTask = (values) => setConversationState((previous) => ({ ...previous, scheduledTasks: [...(previous.scheduledTasks || []), createScheduledTask({ ...values, workspaceId: previous.activeWorkspaceId })] }));
  const updateTask = (taskId, patch) => setConversationState((previous) => ({ ...previous, scheduledTasks:(previous.scheduledTasks||[]).map((task)=>task.id===taskId?normaliseScheduledTask({...task,...patch,id:task.id,createdAt:task.createdAt,updatedAt:Date.now(),...(patch.schedule?{nextRunAt:null}:{})}):task) }));
  const duplicateTask = (taskId) => setConversationState((previous) => { const source=(previous.scheduledTasks||[]).find((task)=>task.id===taskId); if(!source)return previous; const copy=createScheduledTask({...source,id:undefined,name:`${source.name} copy`,workspaceId:previous.activeWorkspaceId,enabled:false,now:Date.now()}); return {...previous,scheduledTasks:[...(previous.scheduledTasks||[]),copy]}; });
  const toggleTask = (taskId, enabled) => setConversationState((previous) => ({ ...previous, scheduledTasks: (previous.scheduledTasks || []).map((task) => task.id === taskId ? { ...task, enabled, updatedAt: Date.now() } : task) }));
  const deleteTask = (taskId) => setConversationState((previous) => ({ ...previous, scheduledTasks: (previous.scheduledTasks || []).filter((task) => task.id !== taskId) }));
  const requestTaskNotificationPermission = async () => {
    if (Platform.OS !== 'android') return { status:'NOT_APPLICABLE' };
    if (Number(Platform.Version) < 33) return { status:'GRANTED_BY_PLATFORM' };
    try { const result=await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS); return {status:result}; }
    catch(permissionError){ setError(permissionError.message||'Notification permission request failed.'); return {status:'ERROR'}; }
  };
  const runScheduledTask = async (task, { manual = false, event = null } = {}) => {
    if (!task || schedulerBusyRef.current.has(task.id)) return null;
    schedulerBusyRef.current.add(task.id);
    const state = conversationStateRef.current;
    const workspace = (state.workspaces || []).find((item) => item.id === (task.workspaceId || state.activeWorkspaceId));
    const workspaceUsageSpendUsd = (state.usageLedger || []).filter((item)=>!workspace?.id || item.workspaceId===workspace.id).reduce((sum,item)=>sum+Number(item.costUsd ?? item.estimatedCostUsd ?? 0),0);
    const conditionContext = { online: !offlineMode, activeWorkspaceId: state.activeWorkspaceId, memoryCount: workspace?.memories?.filter((memory)=>memory.enabled&&!memory.archived).length || 0, event, usageSpendUsd:workspaceUsageSpendUsd };
    if (!manual && !taskConditionMet(task, conditionContext)) {
      const skippedRecord = createTaskRunRecord({ task, status:'SKIPPED', error:'Condition not met.', executionEnvironment:'FOREGROUND' });
      setConversationState((previous) => ({ ...previous, scheduledTasks:(previous.scheduledTasks||[]).map((item)=>item.id===task.id?skipScheduledTaskRun(item,{reason:'Condition not met.'}):item), taskRuns:[...(previous.taskRuns||[]),skippedRecord].slice(-500) }));
      schedulerBusyRef.current.delete(task.id); return { status:'SKIPPED' };
    }
    const scheduledAt = manual ? Date.now() : task.nextRunAt;
    const running = createTaskRunRecord({ task, scheduledAt, executionEnvironment:'FOREGROUND' });
    if (!manual && (state.taskRuns || []).some((item)=>item.runKey===running.runKey && ['RUNNING','COMPLETE','NOTIFIED'].includes(item.status))) {
      schedulerBusyRef.current.delete(task.id); return { status:'DUPLICATE_SUPPRESSED', runKey:running.runKey };
    }
    if (task.executionPolicy === 'NOTIFY_ONLY') {
      const notified={...running,status:'NOTIFIED',output:'Task is due. Open the app to run the configured action.',completedAt:Date.now()};
      setConversationState((previous)=>({...previous,scheduledTasks:(previous.scheduledTasks||[]).map((item)=>item.id===task.id?completeScheduledTaskRun(item,{status:'NOTIFIED',scheduledAt}):item),taskRuns:[...(previous.taskRuns||[]),notified].slice(-500)}));
      setError(`Task due: ${task.name}. Notify-only policy did not call an AI provider.`);
      schedulerBusyRef.current.delete(task.id); return {status:'NOTIFIED'};
    }
    setConversationState((previous) => ({ ...previous, taskRuns:[...(previous.taskRuns||[]),running].slice(-500) }));
    try {
      let output = '';
      if (task.skillId) output = (await runSkillById(task.skillId, task.prompt || task.name, { taskId:task.id, requestedVersion:task.skillVersion, correlationId:running.correlationId, workspaceId:workspace?.id })).output;
      else {
        if (!activeApiKey.trim()) throw new Error(`${activeProviderLabel} API key is required to run this task.`);
        if (offlineMode) throw new Error('Task requires an online provider connection.');
        const prompt = task.prompt || task.name; const taskMessages=[{role:'system',content:effectiveSystemPrompt(prompt,workspace?.id)},{role:'user',content:prompt}];
        preflightUsageBudget({ workspaceId: workspace?.id, provider: activeProviderLabel, requestModel: model, requestMessages: taskMessages });
        const startedAt=Date.now();
        const result = await completeChatCompletion({ provider: activeProvider, apiKey: activeApiKey, model, temperature, maxTokens, messages:taskMessages });
        output=result.text; recordUsage({ workspaceId:workspace?.id, taskId:task.id, correlationId:running.correlationId, outputRef:running.id, requestKind:'scheduled-task', usage:result.usage, responseText:result.text, requestMessages:[{role:'user',content:prompt}], latencyMs:Date.now()-startedAt, provider:result.meta?.provider||activeProviderLabel, requestModel:result.meta?.model||model });
      }
      const completedRecord={...running,status:'COMPLETE',output,completedAt:Date.now()};
      setConversationState((previous)=>({...previous,scheduledTasks:(previous.scheduledTasks||[]).map((item)=>item.id===task.id?completeScheduledTaskRun(item,{status:'COMPLETE',scheduledAt}):item),taskRuns:(previous.taskRuns||[]).map((item)=>item.id===running.id?completedRecord:item)}));
      setError(`Task complete: ${task.name}`); return {status:'COMPLETE',output};
    } catch(taskError) {
      const failedRecord={...running,status:offlineMode?'FOREGROUND_REQUIRED':'FAILED',error:taskError.message||'Task failed.',completedAt:Date.now()};
      setConversationState((previous)=>({...previous,scheduledTasks:(previous.scheduledTasks||[]).map((item)=>item.id===task.id?completeScheduledTaskRun(item,{status:failedRecord.status,error:taskError.message,scheduledAt}):item),taskRuns:(previous.taskRuns||[]).map((item)=>item.id===running.id?failedRecord:item)}));
      setError(`Task failed: ${taskError.message || task.name}`); return {status:failedRecord.status,error:taskError};
    } finally { schedulerBusyRef.current.delete(task.id); }
  };

  const runTaskById = (taskId) => { const task=(conversationStateRef.current.scheduledTasks||[]).find((item)=>item.id===taskId); if(task) void runScheduledTask(task,{manual:true}); };
  useEffect(() => {
    if (!hydrated) return undefined;
    const tick = () => { const now=Date.now(); for (const task of conversationStateRef.current.scheduledTasks || []) if (isTaskDue(task,now)) void runScheduledTask(task); };
    tick(); const timer=setInterval(tick,30000); return () => clearInterval(timer);
  }, [hydrated, apiKey, offlineMode, conversationState.scheduledTasks, conversationState.activeWorkspaceId]);
  useEffect(() => {
    if (!hydrated) return undefined;
    const subscription=AppState.addEventListener('change',(state)=>{ if(state==='active'){ const now=Date.now(); for(const task of conversationStateRef.current.scheduledTasks||[]) if(isTaskDue(task,now)) void runScheduledTask(task,{event:'APP_RESUMED'}); }});
    return ()=>subscription.remove();
  }, [hydrated, apiKey, offlineMode, conversationState.scheduledTasks, conversationState.activeWorkspaceId]);
  useEffect(() => {
    if (!hydrated) return;
    const previousWorkspaceId = previousWorkspaceIdRef.current;
    previousWorkspaceIdRef.current = conversationState.activeWorkspaceId;
    if (!previousWorkspaceId || previousWorkspaceId === conversationState.activeWorkspaceId) return;
    for (const task of conversationStateRef.current.scheduledTasks || []) {
      if (task.enabled && task.schedule?.type === 'condition' && task.condition?.type === 'workspace_changed') void runScheduledTask(task,{event:'WORKSPACE_CHANGED'});
    }
  }, [hydrated, conversationState.activeWorkspaceId]);

  const updateFullVoiceSettings = (patch) => {
    if (patch.enabled === false && fullVoiceSessionRef.current.enabled) {
      if (voiceAutoListenTimerRef.current) { clearTimeout(voiceAutoListenTimerRef.current); voiceAutoListenTimerRef.current = null; }
      if (voiceRecognitionRunRef.current) voiceRecognitionRunRef.current.active=false;
      voiceRecognitionRunRef.current=null; voiceManualStopRef.current=false; setIsListening(false);
      try { cachedSpeechRecognitionModule?.abort?.(); } catch (_) {}
      if (voiceTtsRunRef.current) voiceTtsRunRef.current.active=false; voiceTtsRunRef.current=null; void Speech.stop().catch(()=>{});
      const generation=fullVoiceGenerationRef.current; if(generation){stopGenerationForChat(generation.chatId);fullVoiceGenerationRef.current=null;}
    }
    setFullVoiceSession((current) => {
      const nextEnabled = patch.enabled == null ? current.enabled : Boolean(patch.enabled);
      if (nextEnabled !== current.enabled) return createFullVoiceSession({ ...current, ...patch, enabled: nextEnabled, state: nextEnabled ? FullVoiceState.IDLE : FullVoiceState.STOPPED, sessionId: undefined, recognitionRunId: null, ttsRunId: null, autoListenPending: false });
      return { ...current, ...patch, enabled: nextEnabled };
    });
  };
  const clearVoiceAutoListenTimer = () => { if (voiceAutoListenTimerRef.current) { clearTimeout(voiceAutoListenTimerRef.current); voiceAutoListenTimerRef.current = null; } };
  const scheduleVoiceAutoListen = ({ sessionId, voiceTurnId }) => {
    clearVoiceAutoListenTimer();
    const current = fullVoiceSessionRef.current;
    if (!shouldAutoListenAfterSpeech(current)) return;
    setFullVoiceSession((session) => callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? { ...session, autoListenPending:true } : session);
    voiceAutoListenTimerRef.current = setTimeout(() => {
      voiceAutoListenTimerRef.current = null;
      const live = fullVoiceSessionRef.current;
      if (!callbackBelongsToVoiceRun(live,{sessionId,voiceTurnId}) || !live.enabled || !live.autoListen || live.state === FullVoiceState.STOPPED) return;
      setFullVoiceSession((session)=>({ ...session, autoListenPending:false }));
      void startSpeechRecognition();
    }, 500);
  };
  const speakFullVoiceResponse = async (response, { startSentenceIndex = 0, sessionId = fullVoiceSessionRef.current.sessionId, voiceTurnId = fullVoiceSessionRef.current.voiceTurnId } = {}) => {
    const current = fullVoiceSessionRef.current;
    if (!callbackBelongsToVoiceRun(current,{sessionId,voiceTurnId})) return;
    if (!shouldSpeakAssistantResponse(current, response)) {
      setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(session,FullVoiceState.IDLE,{lastResponse:response,ttsRunId:null}) : session);
      scheduleVoiceAutoListen({sessionId,voiceTurnId});
      return;
    }
    const sentences = splitSpeechSentences(response);
    if (!sentences.length) return;
    const ttsRunId=`tts-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const run={id:ttsRunId,sessionId,voiceTurnId,sentences,active:true,stopReason:null,sentenceIndex:Math.min(Math.max(0,startSentenceIndex),sentences.length-1)};
    voiceTtsRunRef.current=run;
    try { await Speech.stop(); } catch (_) {}
    setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(session,FullVoiceState.SPEAKING,{lastResponse:response,ttsRunId,speechSentenceIndex:run.sentenceIndex,autoListenPending:false}) : session);
    const speakSentence=(index)=>{
      if (!run.active || voiceTtsRunRef.current?.id!==ttsRunId) return;
      run.sentenceIndex=index;
      setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? {...session,speechSentenceIndex:index,ttsRunId} : session);
      Speech.speak(sentences[index], { language:voiceLocale, rate:playbackSpeed, ...(selectedVoiceId?{voice:selectedVoiceId}:{}),
        onDone:()=>{
          if (!run.active || voiceTtsRunRef.current?.id!==ttsRunId) return;
          if (index+1<sentences.length) { speakSentence(index+1); return; }
          run.active=false; voiceTtsRunRef.current=null;
          setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(session,FullVoiceState.IDLE,{lastResponse:response,ttsRunId:null,speechSentenceIndex:0}) : session);
          scheduleVoiceAutoListen({sessionId,voiceTurnId});
        },
        onStopped:()=>{
          if (!run.active || voiceTtsRunRef.current?.id!==ttsRunId) return;
          run.active=false; voiceTtsRunRef.current=null;
          const next=run.stopReason==='interrupt' ? FullVoiceState.INTERRUPTING : FullVoiceState.STOPPED;
          setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(session,next,{ttsRunId:null,speechSentenceIndex:index,stopReason:run.stopReason||'Playback stopped.'}) : session);
        },
        onError:()=>{
          if (!run.active || voiceTtsRunRef.current?.id!==ttsRunId) return;
          run.active=false; voiceTtsRunRef.current=null;
          setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(session,FullVoiceState.TTS_ERROR,{error:'Text-to-speech playback failed.',ttsRunId:null}) : session);
        }
      });
    };
    speakSentence(run.sentenceIndex);
  };
  const sendFullVoiceTranscript = (transcript) => {
    const text=String(transcript||'').trim(); if(!text) return;
    let session=fullVoiceSessionRef.current;
    if (!session.voiceTurnId || session.lastTranscript!==text) { session=beginFullVoiceTurn(session,text); fullVoiceSessionRef.current=session; setFullVoiceSession(session); }
    const sessionId=session.sessionId, voiceTurnId=session.voiceTurnId;
    const state=conversationStateRef.current; const chat=state.chats.find((item)=>item.id===state.activeChatId && item.workspaceId===state.activeWorkspaceId);
    if(!chat || !activeApiKey.trim() || offlineMode) { setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.GENERATION_ERROR,{error:!activeApiKey.trim()?`${activeProviderLabel} API key is required.`:offlineMode?'Voice generation requires an online connection.':'Open a chat before using Full Voice.'})); return; }
    let next=appendTurn(state,chat.id,{role:'user',content:text,apiContent:text}); const nextChat=next.chats.find((item)=>item.id===chat.id); const target=nextChat.messages.at(-1);
    conversationStateRef.current=next; setConversationState(next);
    setFullVoiceSession((current)=>callbackBelongsToVoiceRun(current,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(current,FullVoiceState.GENERATING,{lastTranscript:text}) : current);
    fullVoiceGenerationRef.current={sessionId,voiceTurnId,chatId:chat.id,targetMessageId:target.messageId};
    const request=buildProviderRequest(nextChat,target.messageId,null);
    startGeneration(chat.id,target.messageId,request,{requestKind:'voice',origin:'VOICE',voiceSessionId:sessionId,voiceTurnId,
      onComplete:(response)=>{ const run=fullVoiceGenerationRef.current; if(!run||run.sessionId!==sessionId||run.voiceTurnId!==voiceTurnId)return; fullVoiceGenerationRef.current=null; void speakFullVoiceResponse(response,{sessionId,voiceTurnId}); },
      onError:(generationError)=>{ const run=fullVoiceGenerationRef.current; if(!run||run.sessionId!==sessionId||run.voiceTurnId!==voiceTurnId)return; fullVoiceGenerationRef.current=null; setFullVoiceSession((current)=>callbackBelongsToVoiceRun(current,{sessionId,voiceTurnId}) ? transitionFullVoiceSession(current,FullVoiceState.GENERATION_ERROR,{error:generationError.message||'Voice generation failed.'}) : current); }
    });
  };
  fullVoiceTranscriptHandlerRef.current = (transcript) => {
    const session=fullVoiceSessionRef.current; const text=String(transcript||'').trim(); if(!session.enabled||!text) return false;
    const prepared=beginFullVoiceTurn(session,text); fullVoiceSessionRef.current=prepared; setFullVoiceSession(prepared);
    if(shouldAutoSendTranscript(prepared,text)) { sendFullVoiceTranscript(text); return true; }
    setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.READY_TO_SEND,{lastTranscript:text}));
    setVoiceReviewOpen(true); return true;
  };
  const stopFullVoiceSession = async () => {
    clearVoiceAutoListenTimer();
    const recognition=voiceRecognitionRunRef.current; if(recognition) recognition.active=false; voiceRecognitionRunRef.current=null;
    voiceManualStopRef.current=false; try { cachedSpeechRecognitionModule?.abort?.(); } catch (_) {} setIsListening(false);
    const tts=voiceTtsRunRef.current; if(tts){tts.stopReason='stop';tts.active=false;} voiceTtsRunRef.current=null; try { await Speech.stop(); } catch (_) {}
    const generation=fullVoiceGenerationRef.current; if(generation){stopGenerationForChat(generation.chatId);fullVoiceGenerationRef.current=null;}
    setFullVoiceSession((session)=>session.enabled ? transitionFullVoiceSession(session,FullVoiceState.STOPPED,{recognitionRunId:null,ttsRunId:null,autoListenPending:false,stopReason:'Stopped by user.'}) : session);
  };
  const interruptFullVoice = async () => {
    clearVoiceAutoListenTimer();
    const tts=voiceTtsRunRef.current; if(tts){tts.stopReason='interrupt';tts.active=false;} voiceTtsRunRef.current=null;
    const interrupted=transitionFullVoiceSession(fullVoiceSessionRef.current,FullVoiceState.INTERRUPTING,{ttsRunId:null,autoListenPending:false});
    fullVoiceSessionRef.current=interrupted; setFullVoiceSession(interrupted);
    try { await Speech.stop(); } catch (_) {}
    await startSpeechRecognition();
  };
  const replayFullVoiceResponse = async () => {
    const session=fullVoiceSessionRef.current; if(!session.lastResponse)return;
    const startIndex=session.state===FullVoiceState.STOPPED ? session.speechSentenceIndex : 0;
    if(session.state!==FullVoiceState.IDLE && session.state!==FullVoiceState.STOPPED && session.state!==FullVoiceState.TTS_ERROR) await stopFullVoiceSession();
    const live=fullVoiceSessionRef.current;
    if(live.state===FullVoiceState.STOPPED) setFullVoiceSession((current)=>transitionFullVoiceSession(current,FullVoiceState.IDLE));
    await speakFullVoiceResponse(session.lastResponse,{startSentenceIndex:startIndex,sessionId:session.sessionId,voiceTurnId:session.voiceTurnId});
  };

  const handleSendMessage = (attachmentConsentGranted = false) => {
    if (!activeChat || (!input.trim() && !attachmentSession.files.length) || isLoading) return;
    const text = input.trim(); const files = attachmentSession.files; const attachment = files[0] || null;
    if (offlineMode) {
      const draftId=`draft-${Date.now()}`;
      setConversationState((previous)=>({...previous,offlineQueue:enqueueTurn(previous.offlineQueue,{chatId:activeChat.id,messageId:draftId,content:text,attachments:files,providerContextRequired:files.length>0})}));
      setInput(''); setAttachmentSession(createAttachmentSession()); attachmentExtractsRef.current.clear();
      setError(files.length ? 'Draft queued. Attachment metadata is retained, but files must be reattached before sending after restart.' : 'Draft queued for delivery when online.');
      return;
    }
    if (!activeApiKey.trim()) { requestProtectedSettingsAccess(); return; }
    const externalFiles = files.filter((file) => file.kind !== 'apk');
    if (externalFiles.length && !attachmentConsentGranted) {
      const names = externalFiles.slice(0, 3).map((file) => file.name).join(', ');
      const remainder = externalFiles.length > 3 ? ` and ${externalFiles.length - 3} more` : '';
      Alert.alert(
        `Send attachment to ${activeProviderLabel}?`,
        `${names}${remainder} will be sent to your configured ${activeProviderLabel} model for this request. The content is not retained in local chat storage. Android APK binaries stay on this device; only their filename and size are shared.`,
        [{ text: 'Keep editing', style: 'cancel' }, { text: 'Send attachment', onPress: () => handleSendMessage(true) }],
      );
      return;
    }
    const textParts=[]; const imageParts=[];
    for (const file of files) {
      const context=attachmentExtractsRef.current.get(file.id);
      if (context && typeof context==='object' && context.type==='image_url') imageParts.push(context);
      else textParts.push(`[Attachment: ${file.name}]\n${String(context||'')}`);
    }
    const visibleText=text || `Attached ${files.length} file${files.length===1?'':'s'}`;
    const promptText=textParts.length?`${text || `Please review the ${files.length} attached file${files.length===1?'':'s'}.`}\n\n${textParts.join('\n\n')}`:text;
    const apiContent=imageParts.length?[{type:'text',text:promptText||'Please review the attached image.'},...imageParts]:promptText;
    let nextState;
    if (editSourceMessageId) {
      nextState=editMessageAndBranch(conversationState,activeChat.id,editSourceMessageId,visibleText);
      const editedChat=nextState.chats.find(c=>c.id===activeChat.id), assistant=editedChat.messages.at(-1), editedId=assistant.parentMessageId;
      nextState={...nextState,chats:nextState.chats.map(c=>c.id===activeChat.id?{...c,messages:c.messages.map(m=>m.messageId===editedId?{...m,apiContent,attachment:attachment?{name:attachment.name,kind:attachment.kind,size:attachment.size}:undefined}:m)}:c)};
    } else nextState=appendTurn(conversationState,activeChat.id,{role:'user',content:visibleText,apiContent,attachment:attachment?{name:attachment.name,kind:attachment.kind,size:attachment.size}:null});
    const nextChat=nextState.chats.find(c=>c.id===activeChat.id),target=nextChat.messages.at(-1);
    setConversationState(nextState); setInput(''); setAttachmentSession(createAttachmentSession()); attachmentExtractsRef.current.clear(); setEditSourceMessageId(null);
    const request=buildProviderRequest(nextChat,target.messageId,null,{excludedIds:requestMemoryExcludedIds,disabled:requestMemoryOff}); setPendingPromptContext(null); setRequestMemoryExcludedIds([]); setRequestMemoryOff(false); setMemoryRequestPanelOpen(false); startGeneration(activeChat.id,target.messageId,request);
  };
  const handleRegenerate = (message) => { if (!activeChat || isLoading || !activeApiKey.trim()) return; try { const next=regenerateAssistant(conversationState,activeChat.id,message.messageId); const nextChat=next.chats.find(c=>c.id===activeChat.id),target=nextChat.messages.at(-1); setConversationState(next); startGeneration(activeChat.id,target.messageId,buildProviderRequest(nextChat,target.messageId,null)); } catch(e){setError(e.message);} };
  const handleRetryGeneration = (message) => {
    if (!activeChat) return;
    const prior = generationRequestsRef.current.get(activeChat.id);
    if (!prior || prior.targetMessageId !== message.messageId) { setError('No failed or cancelled request is available to retry for this response.'); return; }
    const retryProvider = normaliseProviderId(prior.provider || activeProvider);
    const retryKey = keyForProvider(retryProvider);
    const retryModel = prior.model || providerModels[retryProvider] || DEFAULT_PROVIDER_MODELS[retryProvider];
    if (!retryKey.trim()) { setError(`${providerLabel(retryProvider)} API key is required to retry this response.`); return; }
    try { preflightUsageBudget({ workspaceId: activeChat.workspaceId, provider: providerLabel(retryProvider), requestModel: retryModel, requestMessages: prior.apiMessages }); }
    catch (budgetError) { setError(budgetError.message || 'Retry blocked by usage budget.'); return; }
    setConversationState((previous) => updateMessageContent(previous, activeChat.id, message.messageId, ''));
    try {
      const retryStartedAt = Date.now();
      let retryResponse = '';
      let retryUsage = null;
      let retryMeta = { provider: providerLabel(retryProvider), providerId: retryProvider, model: retryModel };
      generationManagerRef.current.retry(activeChat.id, (callbacks) => {
        const requestId = `retry-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        const isCurrentRequest = () => streamRefs.current.get(activeChat.id)?.requestId === requestId;
        const stream = streamChatCompletion({
          provider: retryProvider, apiKey: retryKey, model: retryModel, messages: prior.apiMessages, temperature, maxTokens,
          onDelta: (delta) => { if (isCurrentRequest()) { retryResponse += delta; callbacks.onDelta(delta); } },
          onUsage: (usage, meta) => { if (isCurrentRequest()) { retryUsage = usage; retryMeta = { ...retryMeta, ...(meta || {}) }; } },
          onMeta: (meta) => { if (isCurrentRequest()) retryMeta = { ...retryMeta, ...(meta || {}) }; },
          onDone: () => {
            if (!isCurrentRequest()) return;
            recordUsage({ workspaceId: activeChat.workspaceId, chatId: activeChat.id, requestKind: 'retry', usage: retryUsage, responseText: retryResponse, requestMessages: prior.apiMessages, latencyMs: Date.now() - retryStartedAt, provider: retryMeta.provider || providerLabel(retryProvider), requestModel: retryMeta.model || retryModel });
            callbacks.onDone();
          },
          onError: (e) => {
            if (!isCurrentRequest()) return;
            recordUsage({ workspaceId: activeChat.workspaceId, chatId: activeChat.id, requestKind: 'retry', responseText: retryResponse, requestMessages: prior.apiMessages, latencyMs: Date.now() - retryStartedAt, status: 'failed', provider: providerLabel(retryProvider), requestModel: retryModel });
            callbacks.onError(e);
          },
        });
        streamRefs.current.set(activeChat.id, { requestId, stream });
        return stream;
      });
    } catch(e) { setError(e.message || 'Retry failed.'); }
  };
  const dispatchQueuedTurn = (turn) => { if (offlineMode || !activeApiKey.trim() || !turn || turn.status!==QueueStatus.QUEUED) return; if (turn.providerContextRequired) { setConversationState(previous=>({...previous,offlineQueue:markFailed(markSending(previous.offlineQueue,turn.id),turn.id,'Attachments must be reattached before this queued draft can be sent.')})); return; } const current=conversationStateRef.current,chat=current.chats.find(c=>c.id===turn.chatId); if(!chat){setConversationState(previous=>({...previous,offlineQueue:markFailed(markSending(previous.offlineQueue,turn.id),turn.id,'Destination chat no longer exists.')}));return;} let next={...current,offlineQueue:markSending(current.offlineQueue,turn.id)}; next=appendTurn(next,chat.id,{role:'user',content:turn.content,apiContent:turn.content}); const nextChat=next.chats.find(c=>c.id===chat.id),target=nextChat.messages.at(-1); conversationStateRef.current=next;setConversationState(next);startGeneration(chat.id,target.messageId,buildProviderRequest(nextChat,target.messageId,null),{queueId:turn.id}); };
  const retryQueuedTurn=(id)=>setConversationState(previous=>({...previous,offlineQueue:retryTurn(previous.offlineQueue,id)}));
  const cancelQueuedTurn=(id)=>setConversationState(previous=>({...previous,offlineQueue:cancelTurn(previous.offlineQueue,id)}));
  useEffect(() => { if (!hydrated || offlineMode || !activeApiKey.trim()) return; const next = (conversationState.offlineQueue || []).find((turn) => turn.status === QueueStatus.QUEUED); if (next) dispatchQueuedTurn(next); }, [hydrated, offlineMode, activeApiKey, activeProvider, conversationState.offlineQueue]);
  const handleDeleteChat = (chatId) => { stopGenerationForChat(chatId); generationManagerRef.current?.cancelForDeletedChat(chatId); setConversationState((previous) => { const remaining = previous.chats.filter((chat) => chat.id !== chatId); const activeWorkspaceHasChat = remaining.some((chat) => chat.workspaceId === previous.activeWorkspaceId); const replacement = activeWorkspaceHasChat ? [] : [{ ...createChat(), workspaceId: previous.activeWorkspaceId }]; const nextChats = [...remaining, ...replacement].map((chat) => chat.workflowParentId === chatId ? { ...chat, workflowParentId: null } : chat); const nextActive = previous.activeChatId === chatId ? (nextChats.find((chat) => chat.workspaceId === previous.activeWorkspaceId) || nextChats[0]).id : previous.activeChatId; return { ...previous, chats: nextChats, activeChatId: nextActive, offlineQueue: removeQueueForChat(previous.offlineQueue, chatId), workspaces: previous.workspaces.map((workspace) => workspace.id === previous.activeWorkspaceId ? { ...workspace, chatIds: nextChats.filter((chat) => chat.workspaceId === workspace.id).map((chat) => chat.id), updatedAt: Date.now() } : workspace) }; }); };
  const handleBulkDeleteChats = (chatIds = []) => { const scopedIds = new Set((conversationStateRef.current.chats || []).filter((chat) => chat.workspaceId === conversationStateRef.current.activeWorkspaceId).map((chat) => chat.id)); const selected = Array.from(new Set(chatIds)).filter((id) => scopedIds.has(id)); for (const chatId of selected) { stopGenerationForChat(chatId); generationManagerRef.current?.cancelForDeletedChat(chatId); } setConversationState((previous) => { const selectedSet = new Set(selected); const remaining = bulkDelete(previous.chats, selected).map((chat) => selectedSet.has(chat.workflowParentId) ? { ...chat, workflowParentId: null } : chat); const replacement = remaining.some((chat) => chat.workspaceId === previous.activeWorkspaceId) ? [] : [{ ...createChat(), workspaceId: previous.activeWorkspaceId }]; const chats = [...remaining, ...replacement]; const activeChatId = selectedSet.has(previous.activeChatId) ? (chats.find((chat) => chat.workspaceId === previous.activeWorkspaceId) || chats[0])?.id || '' : previous.activeChatId; const offlineQueue = selected.reduce((queue, chatId) => removeQueueForChat(queue, chatId), previous.offlineQueue); return normaliseCState({ ...previous, chats, activeChatId, offlineQueue }); }); };
  const handleCreateChat = () => { const chat = { ...createChat(), workspaceId: conversationState.activeWorkspaceId }; setConversationState((previous) => ({ ...previous, chats: [chat, ...previous.chats], activeChatId: chat.id, workspaces: previous.workspaces.map((workspace) => workspace.id === chat.workspaceId ? { ...workspace, chatIds: [...workspace.chatIds, chat.id], updatedAt: Date.now() } : workspace) })); setInput(''); setAttachmentSession(createAttachmentSession()); attachmentExtractsRef.current.clear(); };
  const handleCreateWorkflowChild = (parentChatId) => { setConversationState((previous) => { const parent = previous.chats.find((chat) => chat.id === parentChatId); if (!parent) return previous; const child = createWorkflowChildChat(parent); return { ...previous, chats: [child, ...previous.chats], activeChatId: child.id, workspaces: previous.workspaces.map((workspace) => workspace.id === child.workspaceId ? { ...workspace, chatIds: [...workspace.chatIds, child.id], updatedAt: Date.now() } : workspace) }; }); setInput(''); setAttachmentSession(createAttachmentSession()); attachmentExtractsRef.current.clear(); };
  const handleCycleWorkflowStatus = (chatId) => setConversationState((previous) => ({ ...previous, chats: previous.chats.map((chat) => chat.id === chatId ? setWorkflowStatus(chat, nextWorkflowStatus(chat.workflowStatus)) : chat) }));
  const handleExport = async (format = 'txt', selected = messages) => { if (!activeChat) return; try { const output = format === 'json' ? JSON.stringify(safeChatExport({ ...activeChat, messages: selected }), null, 2) : format === 'md' ? exportChatMarkdown(activeChat, selected) : format === 'html' ? exportChatHtml(activeChat, selected) : exportChatText(activeChat, selected); const extension = format === 'json' ? 'json' : format === 'md' ? 'md' : format === 'html' ? 'html' : 'txt'; const uri = `${FileSystem.cacheDirectory}${deterministicFilename(activeChat, extension)}`; await FileSystem.writeAsStringAsync(uri, output, { encoding: FileSystem.EncodingType.UTF8 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: format === 'html' ? 'text/html' : 'text/plain' }); else setError(`Export saved to ${uri}`); } catch (_) { setError('Unable to create a safe chat export.'); } };
  const handleExportPdf = async (layout = PDF_LAYOUTS.POLISHED) => { if (!activeChat) return; try { const pdf = await createChatPdf(activeChat, messages, { layout }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', dialogTitle: `Export ${pdf.filename}` }); else setError(`PDF created at ${pdf.uri}`); } catch (pdfError) { setError(pdfError.message || 'Unable to create a local chat PDF.'); } };
  const handleCreateDocumentZip = async () => { if (!activeChat) return; try { const base64 = await createChatDocumentArchive(activeChat, messages); const filename = documentZipFilename(activeChat); const uri = `${FileSystem.cacheDirectory}${filename}`; await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: `Export ${filename}` }); else setError(`Document ZIP created at ${uri}`); } catch (archiveError) { setError(archiveError.message || 'Unable to create a safe local document ZIP.'); } };
  const handleImport = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (picked.canceled) return; const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri); const chat = parseChatImport(raw); chat.id = createChat().id; chat.workspaceId = conversationState.activeWorkspaceId; const current = conversationStateRef.current; const candidate = normaliseCState({ ...current, chats: [chat, ...current.chats], activeChatId: chat.id, workspaces: current.workspaces.map((workspace) => workspace.id === chat.workspaceId ? { ...workspace, chatIds: [...workspace.chatIds, chat.id], updatedAt: Date.now() } : workspace) }); await commitCandidateState(candidate); setError('Chat import committed after durable read-back verification.'); } catch (importError) { setError(importError.message || 'Unable to import this chat export. Existing data was retained where rollback verified.'); } };
  const handleBackup = async () => { try { const backup = createOrdinaryBackup(conversationState); const uri = `${FileSystem.cacheDirectory}AI_Console_Backup_${Date.now()}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), { encoding: FileSystem.EncodingType.UTF8 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json' }); else setError(`Backup saved to ${uri}`); } catch (backupError) { setError(backupError.message || 'Unable to create validated ordinary backup.'); } };
  const handleRestore = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (picked.canceled) return; const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri); const backup = JSON.parse(raw); const preview = previewRestore(conversationStateRef.current, backup); const prepared = prepareAtomicRestore(conversationStateRef.current, backup); if (prepared.error) throw new Error(prepared.error); Alert.alert('Restore backup?', `Current: ${preview.currentChats} chats, ${preview.currentWorkspaces} workspaces, ${preview.currentDocuments} documents. Incoming: ${preview.incomingChats} chats, ${preview.incomingWorkspaces} workspaces, ${preview.incomingDocuments} documents.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Restore', style: 'destructive', onPress: () => { void commitCandidateState(prepared.nextState).then(() => setError('Backup durably restored and read-back verified.')).catch((restoreError) => setError(restoreError.message || 'Backup restore failed; rollback was attempted.')); } }]); } catch (restoreError) { setError(restoreError.message || 'Backup restore validation failed.'); } };
  const handleSyncModels = async () => {
    if (isFetchingModels) return;
    setIsFetchingModels(true);
    try {
      const data = await fetchModels(activeApiKey, activeProvider);
      const grouped = {};
      (data.data || []).forEach((item) => {
        const organisation = formatProviderName(item.organization || item.id.split('/')[0]);
        const group = activeProvider === ProviderId.TOGETHER ? `Together AI · ${organisation}` : organisation;
        (grouped[group] ||= []).push({ id: item.id, name: item.name });
      });
      Object.keys(grouped).forEach((key) => grouped[key].sort((a, b) => a.name.localeCompare(b.name)));
      if (Object.keys(grouped).length) {
        setProviderModelGroups((previous) => ({ ...previous, [activeProvider]: grouped }));
        const available = Object.values(grouped).flat();
        if (!available.some((item) => item.id === model) && available[0]?.id) setModel(available[0].id);
      } else setError(`${activeProviderLabel} returned an empty chat-model list.`);
    } catch (syncError) { setError(syncError.message || `Unable to sync models from ${activeProviderLabel}.`); }
    finally { setIsFetchingModels(false); }
  };
  const handleSyncImageModels = async () => {
    if (isFetchingImageModels) return;
    setIsFetchingImageModels(true);
    try {
      const models = await fetchOpenRouterImageModels(apiKey);
      const grouped = {};
      for (const item of models) {
        const group = formatProviderName(item.organization || item.id.split('/')[0]);
        (grouped[group] ||= []).push({ id:item.id, name:item.name });
      }
      Object.keys(grouped).forEach((key) => grouped[key].sort((a,b)=>a.name.localeCompare(b.name)));
      if (!Object.keys(grouped).length) { setError('OpenRouter returned an empty image-model list.'); return; }
      setImageModelGroups(grouped);
      const available = Object.values(grouped).flat();
      if (!available.some((item)=>item.id===imageModel) && available[0]?.id) setImageModel(available[0].id);
      setError(`OpenRouter image models synced: ${available.length}.`);
    } catch (syncError) { setError(syncError.message || 'Unable to sync OpenRouter image models.'); }
    finally { setIsFetchingImageModels(false); }
  };

  const updateGeneratedImageMessage = (chatId, messageId, patch) => setConversationState((previous) => ({
    ...previous,
    chats: (previous.chats || []).map((chat) => chat.id === chatId ? { ...chat, updatedAt:Date.now(), messages:(chat.messages || []).map((message) => message.messageId === messageId ? { ...message, ...patch, updatedAt:Date.now() } : message) } : chat),
  }));

  const cancelImageGeneration = () => {
    imageAbortRef.current?.abort?.();
  };

  const handleGenerateImage = async () => {
    const prompt = input.trim();
    const chat = activeChat;
    if (!chat) { setError('Open a chat before creating an image.'); return; }
    if (!prompt) { setError('Enter an image description before creating an image.'); return; }
    if (isLoading || imageGeneration) { setError('Finish or stop the current generation before creating another image.'); return; }
    if (offlineMode) { setError('Image generation requires an online OpenRouter connection.'); return; }
    if (!apiKey.trim()) { setError('OpenRouter API key is required to create an image.'); requestProtectedSettingsAccess(); return; }

    const requestMessages = [{ role:'user', content:prompt }];
    try { preflightUsageBudget({ workspaceId:chat.workspaceId, provider:'OpenRouter', requestModel:imageModel, requestMessages, maxCompletionTokens:0 }); }
    catch (budgetError) { setError(budgetError.message || 'Image request blocked by usage budget.'); return; }

    const correlationId = createId('image-request');
    const now = Date.now();
    let next = appendTurn(conversationStateRef.current, chat.id, { role:'user', content:prompt, apiContent:prompt }, now);
    const nextChat = next.chats.find((item)=>item.id===chat.id);
    const target = nextChat?.messages?.at(-1);
    if (!target) { setError('Image generation could not create a response target.'); return; }
    next = updateMessageContent(next, chat.id, target.messageId, `Creating image · ${imageModel}`);
    conversationStateRef.current = next;
    setConversationState(next);
    setInput('');

    const controller = new AbortController();
    imageAbortRef.current = controller;
    const job = { id:correlationId, chatId:chat.id, targetMessageId:target.messageId, prompt, model:imageModel, status:'GENERATING', startedAt:Date.now() };
    setImageGeneration(job);
    const startedAt = Date.now();
    try {
      const result = await generateOpenRouterImage({ apiKey, model:imageModel, prompt, signal:controller.signal });
      if (controller.signal.aborted) throw Object.assign(new Error('Image generation cancelled.'), { name:'AbortError' });
      const image = result.images[0];
      if (!FileSystem.documentDirectory) throw new Error('Durable local image storage is unavailable on this device.');
      const extension = extensionForImageMime(image.mimeType);
      const fileName = `generated-image-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${extension}`;
      const uri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, image.base64, { encoding: FileSystem.EncodingType.Base64 });
      const info = await FileSystem.getInfoAsync(uri, { size:true });
      if (!info?.exists) throw new Error('Generated image could not be verified after local save.');
      const attachment = { id:createId('generated-image'), name:fileName, uri, mimeType:image.mimeType, size:Number(info.size)||0, kind:'image', source:'generated', status:'READY', provider:'OpenRouter', model:imageModel, correlationId, generatedAt:Date.now() };
      updateGeneratedImageMessage(chat.id, target.messageId, { content:`Generated image · ${imageModel}`, attachment });
      recordUsage({ workspaceId:chat.workspaceId, chatId:chat.id, requestKind:'chat-image', usage:result.usage, responseText:'', requestMessages, latencyMs:Date.now()-startedAt, provider:'OpenRouter', requestModel:imageModel });
      setError('Image generated and saved to this conversation.');
      triggerHaptic(hapticsEnabled);
    } catch (imageError) {
      const cancelled = controller.signal.aborted || imageError?.name === 'AbortError';
      const message = cancelled ? 'Image generation cancelled.' : `Image generation failed: ${imageError.message || 'Unknown image-provider error.'}`;
      updateGeneratedImageMessage(chat.id, target.messageId, { content:message, attachment:undefined });
      recordUsage({ workspaceId:chat.workspaceId, chatId:chat.id, requestKind:'chat-image', responseText:'', requestMessages, latencyMs:Date.now()-startedAt, status:cancelled?'cancelled':'failed', provider:'OpenRouter', requestModel:imageModel });
      setError(message);
    } finally {
      if (imageAbortRef.current === controller) imageAbortRef.current = null;
      setImageGeneration((current)=>current?.id===correlationId?null:current);
    }
  };

  const handleShareGeneratedImage = async (message) => {
    const attachment = message?.attachment;
    if (attachment?.source !== 'generated' || !attachment.uri) { await handleExport('txt', [message]); return; }
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(attachment.uri, { mimeType:attachment.mimeType || 'image/png', dialogTitle:attachment.name || 'Generated image' });
      else setError(`Generated image saved at ${attachment.uri}`);
    } catch (shareError) { setError(shareError.message || 'Unable to share the generated image.'); }
  };

  const handlePickFile = async () => { if (isLoading) return; try { const selected = await pickAndExtractFile(); if (!selected) return; const file = createAttachment({ name: selected.attachment?.name, uri: selected.attachment?.uri || selected.pdfAsset?.uri || null, size: selected.attachment?.size, kind: selected.attachment?.kind || 'document', mimeType: selected.attachment?.type || selected.pdfAsset?.mimeType || '', source: 'document' }); if (selected.pdfAsset) { setAttachmentSession((previous) => addAttachment(previous, { ...file, status: 'PROCESSING' })); const job = await processPdf({ file: { ...selected.pdfAsset, name: file.name, uri: file.uri }, adapter: localPdfAdapter }); if (job.status !== 'READY') { setAttachmentSession((previous) => updateAttachmentStatus(previous, file.id, 'FAILED', job.error)); throw new Error(job.error || 'PDF text extraction failed.'); } setPdfReview({ attachmentId: file.id, job }); setPdfSelectedPages(job.pages.map((page) => page.pageNumber)); return; } attachmentExtractsRef.current.set(file.id, selected.context || ''); setAttachmentSession((previous) => addAttachment(previous, { ...file, status: 'READY' })); } catch (uploadError) { setError(uploadError.message || 'Unable to prepare this file.'); } };
  const addImageAttachment = async (asset) => { if (!asset) return; const dataUrl = await loadImageDataUrl(asset); const file = createAttachment(asset); attachmentExtractsRef.current.set(file.id, { type: 'image_url', image_url: { url: dataUrl } }); setAttachmentSession((previous) => addAttachment(previous, { ...file, status: 'READY' })); };
  const handleAddImageFile = async () => { try { await addImageAttachment(await pickImageFile()); } catch (imageError) { setError(imageError.message || 'Unable to prepare this image.'); } };
  const handleAddCamera = async () => { try { await addImageAttachment(await captureCameraImage()); } catch (cameraError) { setError(cameraError.message || 'Unable to use the camera.'); } };
  const handleAddGallery = async () => { try { await addImageAttachment(await pickGalleryImage()); } catch (galleryError) { setError(galleryError.message || 'Unable to open the gallery.'); } };
  const handlePickApk = async () => { if (isLoading) return; try { const selected = await pickApkFile(); if (!selected) return; const file = createAttachment(selected); attachmentExtractsRef.current.set(file.id, apkContextSummary(file)); setAttachmentSession((previous) => addAttachment(previous, { ...file, status: 'READY' })); } catch (apkError) { setError(apkError.message || 'Unable to prepare this Android APK.'); } };
  const handleTogglePdfPage = (pageNumber) => setPdfSelectedPages((previous) => previous.includes(pageNumber) ? previous.filter((page) => page !== pageNumber) : [...previous, pageNumber].sort((a, b) => a - b));
  const handleCancelPdfReview = () => { if (pdfReview?.attachmentId) { attachmentExtractsRef.current.delete(pdfReview.attachmentId); setAttachmentSession((previous) => removeAttachment(previous, pdfReview.attachmentId)); } setPdfReview(null); setPdfSelectedPages([]); };
  const handleUsePdfPages = () => { if (!pdfReview) return; const selected = pdfReview.job.pages.filter((page) => pdfSelectedPages.includes(page.pageNumber)); const context = selected.map((page) => `[PDF: ${pdfReview.job.file.name} · Page ${page.pageNumber}]\n${page.text?.trim() || 'No extractable text was found on this page.'}`).join('\n\n'); attachmentExtractsRef.current.set(pdfReview.attachmentId, context); setAttachmentSession((previous) => updateAttachmentStatus(previous, pdfReview.attachmentId, 'READY')); setConversationState((previous) => { let session = createDocumentSession(); const source = { id: pdfReview.attachmentId, filename: pdfReview.job.file.name, status: 'READY', pages: pdfReview.job.pages, retained: false }; session = addDocumentSource(session, source); session = selectDocumentSources(session, [source.id]); session = selectDocumentPages(session, pdfSelectedPages.map((pageNumber) => ({ sourceId: source.id, pageNumber }))); session = buildContextManifest(session, { maxCharacters: 60000 }); return { ...previous, documentSession: session }; }); setPdfReview(null); setPdfSelectedPages([]); };
  const handleMoveAttachment = (id, direction) => setAttachmentSession((previous) => { const index = previous.files.findIndex((file) => file.id === id); const destination = index + direction; if (index < 0 || destination < 0 || destination >= previous.files.length) return previous; return reorderAttachment(previous, id, destination); });
  const handleSpeakMessage = async (message) => { try { await Speech.stop(); Speech.speak(String(message?.content || ''), { language: voiceLocale, rate: playbackSpeed, onError: () => setError('Text-to-speech playback failed.') }); } catch (_) { setError('Text-to-speech playback failed.'); } };
  const handleStopSpeech = async () => { try { await Speech.stop(); } catch (_) { setError('Unable to stop text to speech.'); } };
  const handleExportProject = async (workspaceId) => { try { const workspace = conversationState.workspaces.find((item) => item.id === workspaceId); const bytes = await createProjectArchive(conversationState, workspaceId); const filename = projectArchiveFilename(workspace); const uri = `${FileSystem.cacheDirectory}${filename}`; await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: `Export ${workspace?.name || 'workspace'}` }); else setError(`Project archive created at ${uri}`); } catch (projectError) { setError(projectError.message || 'Project export failed.'); } };
  const handleImportProject = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: ['application/zip', 'application/octet-stream'], copyToCacheDirectory: true }); if (picked.canceled) return; await validateArchivePickerSize(picked.assets[0]); const base64 = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 }); const parsed = await parseProjectArchive(base64); const candidate = mergeParsedProjectArchive(conversationStateRef.current, parsed); await commitCandidateState(candidate); setIsWorkspaceManagerOpen(false); setError('Project archive transaction committed and durable read-back verified.'); } catch (projectError) { setError(projectError.message || 'Project archive rejected; existing state was retained where rollback verified.'); } };
  const handleExportPrompts = async () => { try { const payload = safePromptExport(conversationState.promptLibrary); const uri = `${FileSystem.cacheDirectory}AI_Console_Protected_Prompts_${Date.now()}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2), { encoding: FileSystem.EncodingType.UTF8 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json' }); else setError(`Protected prompt export created at ${uri}`); } catch (promptError) { setError(promptError.message || 'Protected prompt export failed.'); } };
  const handleImportPrompts = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (picked.canceled) return; const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri); const prompts = parsePromptImport(raw, true); const current = conversationStateRef.current; const candidate = { ...current, promptLibrary: mergePromptLibraries(current.promptLibrary, prompts) }; await commitCandidateState(candidate); setError('Protected prompt import merged transactionally and durable read-back verified.'); } catch (promptError) { setError(promptError.message || 'Protected prompt import failed; existing library was retained where rollback verified.'); } };
  const handleDurableWorkspaceRename = async (id, name) => { try { const candidate = renameWorkspace(conversationStateRef.current, id, name); await commitCandidateState(candidate); triggerHaptic(hapticsEnabled); } catch (renameError) { setError(renameError.message || 'Workspace rename could not be durably verified.'); } };
  const handleAddMessageToDocument = (message) => { setDocumentTargetMessage(message); setDocumentTargetOpen(true); };
  const commitMessageToDocument = (documentId, placement = { mode: 'append' }) => { const doc = (conversationState.documents || []).find((item) => item.id === documentId); if (!doc || !documentTargetMessage) return; const updated = placeVisibleChatMessage(doc, documentTargetMessage, placement); setConversationState((previous) => normaliseCState({ ...previous, activeDocumentId: documentId, documents: previous.documents.map((item) => item.id === documentId ? updated : item) })); setDocumentTargetMessage(null); setPrimaryDestination('documents'); triggerHaptic(hapticsEnabled); };
  const createDocumentFromMessage = () => { if (!documentTargetMessage) return; const doc = createDocument({ workspaceId: conversationState.activeWorkspaceId, title: 'Chat extract' }); const updated = placeVisibleChatMessage(doc, documentTargetMessage); setConversationState((previous) => normaliseCState({ ...previous, documents: [...(previous.documents || []), updated], activeDocumentId: updated.id })); setDocumentTargetMessage(null); setPrimaryDestination('documents'); triggerHaptic(hapticsEnabled); };
  const handleDocumentPreview = async (doc) => { try { await previewDocumentPdf(doc); } catch (previewError) { setError(previewError.message || 'Document preview failed.'); } };
  const handleDocumentExport = async (doc, format) => { try { const output = await exportDocument(doc, format); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(output.uri, { mimeType: output.mimeType, dialogTitle: `Export ${output.filename}` }); else setError(`Document exported to ${output.uri}`); } catch (exportError) { setError(exportError.message || 'Document export failed.'); } };
  const handleDocumentProjectExport = async (doc) => { try { const bytes = await createDocumentProjectArchive(conversationState, doc.id); const filename = documentProjectFilename(doc); const uri = `${FileSystem.cacheDirectory}${filename}`; await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: `Export ${filename}` }); else setError(`Document project exported to ${uri}`); } catch (exportError) { setError(exportError.message || 'Document project export failed.'); } };
  const handleDocumentProjectImport = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: ['application/zip','application/octet-stream'], copyToCacheDirectory: true }); if (picked.canceled) return; await validateArchivePickerSize(picked.assets[0]); const base64 = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 }); const parsed = await parseDocumentProjectArchive(base64); const current = conversationStateRef.current; const candidate = mergeParsedDocumentProjectArchive(current, parsed, current.activeWorkspaceId); await commitCandidateState(candidate); setError('Document project transaction committed and durable read-back verified.'); } catch (importError) { setError(importError.message || 'Document project archive rejected; existing state was retained where rollback verified.'); } };
  const updateDocumentGenerationJob = (job) => {
    setDocumentGeneration(job);
    if (!job) return;
    setConversationState((previous) => ({ ...previous, documentGenerationJobs: [...(previous.documentGenerationJobs || []).filter((item) => item.id !== job.id && item.documentId !== job.documentId), { id: job.id, documentId: job.documentId, sectionId: job.sectionId || null, operation: job.operation, status: job.status, createdAt: job.createdAt, updatedAt: Date.now(), error: job.error || null }] }));
  };
  const handleAiDocumentOperation = (operation, doc, sectionId = null) => {
    if (!activeApiKey.trim()) { requestProtectedSettingsAccess(); return; }
    if (!doc || (operation !== 'append' && !sectionId)) { setError(`Choose a target section before AI ${operation}.`); return; }
    if (documentGenerationRef.current?.stream && documentGenerationRef.current?.job?.status === 'STREAMING') { setError('A document generation is already active. Stop it before starting another.'); return; }
    const job = { id: `docjob-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, documentId: doc.id, sectionId, operation, status: 'STREAMING', createdAt: Date.now(), baseUpdatedAt: doc.updatedAt, error: null };
    updateDocumentGenerationJob(job);
    let result = '';
    const instruction = `Perform a ${operation} document operation. Return only the replacement or inserted document text.\n\nVisible document:\n${renderDocumentText(doc)}`;
    const documentProvider = activeProvider; const documentModel = model; const documentApiKey = activeApiKey; const documentProviderLabel = activeProviderLabel;
    let providerUsage=null; let providerMeta={model:documentModel,provider:documentProviderLabel,providerId:documentProvider}; const startedAt=Date.now();
    const documentMessages = [{ role:'system', content:effectiveSystemPrompt(instruction, doc.workspaceId) }, { role:'user', content:instruction }];
    try { preflightUsageBudget({ workspaceId: doc.workspaceId, provider: documentProviderLabel, requestModel: documentModel, requestMessages: documentMessages }); }
    catch (budgetError) { const failed={...job,status:'FAILED',error:budgetError.message || 'Document AI request blocked by usage budget.'}; documentGenerationRef.current=null; updateDocumentGenerationJob(failed); setError(failed.error); return; }
    const stream = streamChatCompletion({
      provider: documentProvider, apiKey: documentApiKey, model: documentModel, temperature, maxTokens, messages: documentMessages,
      onDelta:(delta)=>{ if (documentGenerationRef.current?.job?.id === job.id) { result += delta; setDocumentGeneration((current) => current?.id === job.id ? { ...current, receivedCharacters: result.length } : current); } },
      onUsage:(usage,meta)=>{providerUsage=usage;providerMeta={...providerMeta,...(meta||{})};}, onMeta:(meta)=>{providerMeta={...providerMeta,...(meta||{})};},
      onDone:()=>{ recordUsage({workspaceId:doc.workspaceId,requestKind:'document',usage:providerUsage,responseText:result,requestMessages:documentMessages,latencyMs:Date.now()-startedAt,provider:providerMeta.provider||documentProviderLabel,requestModel:providerMeta.model||documentModel}); const currentState = conversationStateRef.current; const currentDoc = (currentState.documents || []).find((item) => item.id === job.documentId); const targetExists = operation === 'append' || currentDoc?.sections?.some((section) => section.id === job.sectionId); if (!currentDoc || currentDoc.updatedAt !== job.baseUpdatedAt || !targetExists) { const failed={...job,status:'FAILED',error:'Document changed while AI generation was running; stale output was not applied.'}; documentGenerationRef.current=null; updateDocumentGenerationJob(failed); setError(failed.error); return; } setConversationState((previous)=>({ ...previous, documents: previous.documents.map((item)=>item.id===job.documentId?applyAiDocumentOperation(item,{operation,text:result,sectionId:job.sectionId}):item) })); const complete={...job,status:'COMPLETE'}; documentGenerationRef.current=null; updateDocumentGenerationJob(complete); },
      onError:(aiError)=>{ recordUsage({workspaceId:doc.workspaceId,requestKind:'document',responseText:result,requestMessages:documentMessages,latencyMs:Date.now()-startedAt,status:'failed',provider:documentProviderLabel,requestModel:documentModel}); const failed={...job,status:'FAILED',error:aiError.message || 'AI document operation failed.'}; documentGenerationRef.current=null; updateDocumentGenerationJob(failed); setError(failed.error); }
    });
    documentGenerationRef.current = { job, stream };
  };
  const stopDocumentGeneration = () => { const active = documentGenerationRef.current; if (!active?.job) return; try { active.stream?.cancel?.(); } catch (_) {} const cancelled={...active.job,status:'CANCELLED',error:'Stopped by user.'}; documentGenerationRef.current=null; updateDocumentGenerationJob(cancelled); };
  const retryDocumentGeneration = () => { const job = documentGeneration || (conversationState.documentGenerationJobs || []).find((item) => item.documentId === activeDocument?.id && ['FAILED','CANCELLED'].includes(item.status)); if (!job) return; const doc=(conversationStateRef.current.documents || []).find((item)=>item.id===job.documentId); if (!doc) { setError('The document for this generation no longer exists.'); return; } handleAiDocumentOperation(job.operation, doc, job.sectionId); };

  const startSpeechRecognition = async () => {
    const speechRecognition = cachedSpeechRecognitionModule;
    if (voiceRecognitionRunRef.current?.active || isListening) return;
    const sessionAtStart=fullVoiceSessionRef.current;
    if (!speechRecognition || typeof speechRecognition.requestPermissionsAsync !== 'function' || typeof speechRecognition.start !== 'function') {
      setError('Speech recognition is unavailable in this build. Text input remains available.');
      if(sessionAtStart.enabled)setFullVoiceSession((session)=>transitionFullVoiceSession(session,FullVoiceState.STT_ERROR,{error:'Speech recognition is unavailable in this build.',recognitionRunId:null}));
      setIsListening(false); return;
    }
    const runId=`stt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const run={id:runId,sessionId:sessionAtStart.sessionId,fullVoice:sessionAtStart.enabled,active:true,finalDelivered:false};
    voiceRecognitionRunRef.current=run;
    if(run.fullVoice)setFullVoiceSession((session)=>transitionFullVoiceSession(session,FullVoiceState.REQUESTING_PERMISSION,{recognitionRunId:runId,permissionStatus:'requesting',autoListenPending:false}));
    try {
      const permission = await speechRecognition.requestPermissionsAsync();
      if (!run.active || voiceRecognitionRunRef.current?.id!==runId) return;
      if (run.fullVoice && fullVoiceSessionRef.current.sessionId!==run.sessionId) { run.active=false; return; }
      if (!permission.granted) {
        run.active=false; voiceRecognitionRunRef.current=null;
        setError('Microphone permission is required for speech-to-text.');
        if(run.fullVoice)setFullVoiceSession((session)=>transitionFullVoiceSession(session,FullVoiceState.PERMISSION_DENIED,{error:'Microphone permission is required.',permissionStatus:'denied',recognitionRunId:null}));
        return;
      }
      voiceManualStopRef.current = false; voiceDraftRef.current = ''; setVoiceDraft(''); setVoiceReviewOpen(false);
      const speechOptions = { lang: 'en-GB', interimResults: true, addsPunctuation: true, continuous: true }; speechOptions.lang = voiceLocale || speechOptions.lang;
      speechRecognition.start(speechOptions); setIsListening(true);
      if(run.fullVoice)setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId:run.sessionId}) ? transitionFullVoiceSession(session,FullVoiceState.LISTENING,{permissionStatus:'granted',recognitionRunId:runId,error:null}) : session);
    } catch (speechError) {
      run.active=false; voiceRecognitionRunRef.current=null; voiceManualStopRef.current = false; setIsListening(false);
      setError('Speech recognition is unavailable on this device. Text input remains available.');
      if(run.fullVoice)setFullVoiceSession((session)=>callbackBelongsToVoiceRun(session,{sessionId:run.sessionId}) ? transitionFullVoiceSession(session,FullVoiceState.STT_ERROR,{error:speechError?.message||'Speech recognition is unavailable on this device.',recognitionRunId:null}) : session);
    }
  };
  const toggleSpeechRecognition = async () => {
    const speechRecognition = cachedSpeechRecognitionModule;
    if (fullVoiceSessionRef.current.enabled && fullVoiceSessionRef.current.state === FullVoiceState.SPEAKING) { await interruptFullVoice(); return; }
    if (isListening) {
      voiceManualStopRef.current = true;
      try {
        speechRecognition?.stop?.();
        if(fullVoiceSessionRef.current.enabled)setFullVoiceSession((session)=>transitionFullVoiceSession(session,FullVoiceState.FINALIZING_STT));
      } catch (_) {
        if (voiceRecognitionRunRef.current) voiceRecognitionRunRef.current.active=false;
        voiceManualStopRef.current = false; setIsListening(false); setError('Speech recognition could not be stopped cleanly.');
        const transcript=voiceDraftRef.current.trim(); if (transcript && !fullVoiceTranscriptHandlerRef.current?.(transcript)) setVoiceReviewOpen(true);
      }
      return;
    }
    await startSpeechRecognition();
  };
  const acceptVoiceTranscript = () => {
    const transcript = voiceDraft.trim();
    if (fullVoiceSessionRef.current.enabled && transcript) sendFullVoiceTranscript(transcript);
    else if (transcript) setInput((current) => current.trim() ? `${current.trim()}\n${transcript}` : transcript);
    voiceDraftRef.current = ''; setVoiceDraft(''); setVoiceReviewOpen(false);
  };
  const cancelVoiceTranscript = () => {
    voiceDraftRef.current = ''; setVoiceDraft(''); setVoiceReviewOpen(false);
    if(fullVoiceSessionRef.current.enabled && fullVoiceSessionRef.current.state===FullVoiceState.READY_TO_SEND)setFullVoiceSession((session)=>transitionFullVoiceSession(session,FullVoiceState.STOPPED,{stopReason:'Transcript discarded.'}));
  };
  const retryVoiceTranscript = async () => { cancelVoiceTranscript(); await startSpeechRecognition(); };

  if (!hydrated) return <View style={[styles.appRoot, styles.startupScreen]} testID="dr-stones-startup-screen"><StatusBar style="dark" /><View style={styles.startupMark}><IconBot size={24} color="#ffffff" /></View><Text style={styles.startupEyebrow}>DR STONES // COMMAND CENTRE</Text><Text style={styles.startupTitle}>Establishing command link</Text><Text style={styles.startupDetail}>Securing your local workspace…</Text></View>;
  return <View style={styles.appRoot} testID="ai-console-app-ready"><StatusBar style={colorMode === 'light' ? 'dark' : 'light'} /><KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}><View style={[styles.safe, { paddingTop: insets.top }]}>
    <View style={styles.header}><TouchableOpacity ref={chatManagerTriggerRef} style={styles.headerLeft} onPress={() => primaryDestination === 'chats' ? setIsChatManagerOpen(true) : requestPrimaryDestination('chats')} accessibilityLabel={primaryDestination === 'chats' ? 'Manage conversations' : 'Return to chats'} accessibilityRole="button"><View style={styles.headerLogo}>{primaryDestination === 'documents' ? <IconDocument /> : primaryDestination === 'workspaces' ? <IconWorkspace /> : primaryDestination === 'settings' ? <IconSettings /> : <IconBot />}</View><View style={styles.headerCopy}><Text style={styles.headerEyebrow}>DR STONES // COMMAND CENTRE</Text><Text style={styles.headerTitle} numberOfLines={1}>{primaryDestination === 'chats' ? (activeChat?.title || 'Command channel') : primaryDestination === 'documents' ? (activeDocument?.title || 'Document Studio') : primaryDestination === 'workspaces' ? (activeWorkspace?.name || 'Workspaces') : 'Settings'}</Text><Text style={styles.headerModel} numberOfLines={1}>{`${activeWorkspace?.name || 'Workspace'} · ${currentModelName()} · ${APP_RELEASE_LABEL}`}</Text></View></TouchableOpacity><View style={styles.headerRight}><TouchableOpacity style={styles.tokenPill} onPress={()=>setIntelligenceHubOpen(true)} accessibilityRole="button" accessibilityLabel="Open usage and cost"><Text style={styles.tokenText}>{primaryDestination==='chats'?`TKS:${estimateTokens(messages)}`:`USE:${headerUsageTokens}`}</Text></TouchableOpacity><TouchableOpacity ref={intelligenceTriggerRef} style={styles.settingsBtn} onPress={() => setIntelligenceHubOpen(true)} accessibilityLabel="Open Command Intelligence" accessibilityRole="button"><IconBot size={18} color="#ffffff" /></TouchableOpacity><TouchableOpacity ref={protectedSettingsTriggerRef} style={styles.settingsBtn} onPress={requestProtectedSettingsAccess} accessibilityLabel="Open PIN protected AI and prompt settings" accessibilityRole="button"><IconKey size={19} color="#ffffff" /></TouchableOpacity></View></View>
    {executionStatus && <View style={styles.executionBanner} accessibilityLiveRegion="polite"><Text style={styles.executionBannerText}>{executionStatus}</Text></View>}
    <FeedbackBanner message={error} tone={/fail|error|reject|unable|incorrect/i.test(error) ? 'error' : 'info'} onClose={() => setError('')} palette={palette} />
    {anyGeneration && <FeedbackBanner message={`Generation ${String(anyGeneration.status || '').toLowerCase().replace('_',' ')}${anyGeneration.chatId === activeChat?.id ? '' : ' in another chat'}.`} tone={anyGeneration.status === 'FAILED' ? 'error' : 'info'} actionLabel={['QUEUED','STREAMING','CANCELLING'].includes(anyGeneration.status) ? 'Stop' : undefined} onAction={['QUEUED','STREAMING','CANCELLING'].includes(anyGeneration.status) ? () => stopGenerationForChat(anyGeneration.chatId) : undefined} palette={palette} />}
    <View style={[styles.mainShell, layout !== 'compact' && styles.mainShellWide]}>
      {layout !== 'compact' && <PrimaryNavigation items={navigationItems} active={primaryDestination} onSelect={(id) => { triggerHaptic(hapticsEnabled); requestPrimaryDestination(id); }} palette={palette} vertical />}
      <View style={styles.destinationArea}>
      {primaryDestination === 'chats' && <><View style={styles.conversationArea}>{activeBranches.length > 1 && <View style={styles.branchBar} accessibilityLabel="Conversation branches"><Text style={styles.branchLabel}>Branch</Text>{activeBranches.map((id,index)=><TouchableOpacity key={id} style={[styles.branchChip,activeChat?.activeBranchId===id&&styles.branchChipActive]} onPress={()=>setConversationState((previous)=>setActiveBranch(previous,activeChat.id,id))} accessibilityRole="button" accessibilityState={{selected:activeChat?.activeBranchId===id}}><Text style={styles.branchChipText}>{index===0?'Main':`Branch ${index}`}</Text></TouchableOpacity>)}</View>}{bookmarkViewerOpen && <View style={styles.bookmarkPanel}><View style={styles.bookmarkHeader}><Text style={styles.branchLabel}>Bookmarks</Text><TouchableOpacity style={styles.miniAction} onPress={()=>setBookmarkViewerOpen(false)} accessibilityRole="button"><Text style={styles.miniActionText}>Close</Text></TouchableOpacity></View>{(activeChat?.bookmarks||[]).length===0?<Text style={styles.queueText}>No bookmarks in this chat.</Text>:(activeChat.bookmarks||[]).map((id)=>{const item=activeChat.messages.find((message)=>message.messageId===id);return item?<Text key={id} style={styles.queueText} numberOfLines={3}>{item.role}: {item.content}</Text>:null;})}</View>}{messages.length === 0 ? <View style={styles.emptyState}><View style={styles.emptyIcon}><IconBot color={palette.cyanBright} /></View><Text style={styles.emptyEyebrow}>DR STONES // COMMAND CENTRE</Text><Text style={styles.emptyTitle}>Command link ready</Text><Text style={styles.emptySubtitle}>Open a secure command channel, stage local intelligence, or coordinate a workflow. Your project data remains organised on this device.</Text><TouchableOpacity style={styles.emptyBtn} onPress={handleCreateChat} accessibilityRole="button"><Text style={styles.emptyBtnText}>Open command channel</Text></TouchableOpacity></View> : <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.messageId} renderItem={({ item }) => <MessageBubble message={item} isStreamingEmpty={isLoading && item.messageId === activeGeneration?.targetMessageId && !item.content} retryAvailable={['FAILED','CANCELLED'].includes(activeGeneration?.status) && activeGeneration?.targetMessageId === item.messageId} palette={palette} onRetry={() => handleRetryGeneration(item)} onRegenerate={() => handleRegenerate(item)} onDownload={() => item.attachment?.source === 'generated' ? void handleShareGeneratedImage(item) : handleExport('md', [item])} onShare={() => item.attachment?.source === 'generated' ? void handleShareGeneratedImage(item) : handleExport('txt', [item])} onContinue={() => setInput('Continue the previous response.')} onBranch={() => { if (item.role === 'assistant') handleRegenerate(item); else { setInput(item.content); setEditSourceMessageId(item.messageId); } }} onBookmark={() => updateChat(activeChat.id, (chat) => ({ ...chat, bookmarks: Array.from(new Set([...(chat.bookmarks || []), item.messageId])) }))} onQuote={() => setInput(`> ${item.content}\n\n`)} onEdit={() => { setInput(item.content); setEditSourceMessageId(item.messageId); }} onResubmit={() => { setInput(item.content); setEditSourceMessageId(item.messageId); }} onSpeak={() => handleSpeakMessage(item)} onAddToDocument={() => handleAddMessageToDocument(item)} onDelete={() => Alert.alert('Delete message?', 'Delete this message and all descendant branch messages?', [{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setConversationState((previous)=>removeMessage(previous,activeChat.id,item.messageId))}])} />} contentContainerStyle={styles.messageList} onScroll={(event)=>{const {contentOffset,contentSize,layoutMeasurement}=event.nativeEvent;isNearBottomRef.current=(contentSize.height-layoutMeasurement.height-contentOffset.y)<96;}} scrollEventThrottle={100} onContentSizeChange={()=>{if(isNearBottomRef.current)scrollToBottom();}} />}</View>
      <View style={styles.composerAvoider}><View style={styles.inputArea}><View style={styles.composerMetaRow}><TouchableOpacity style={styles.miniAction} onPress={()=>setIntelligenceHubOpen(true)} accessibilityRole="button"><Text style={styles.miniActionText}>Intelligence</Text></TouchableOpacity><TouchableOpacity ref={fullVoiceScreenTriggerRef} style={styles.miniAction} onPress={()=>{ if(!fullVoiceSessionRef.current.enabled) updateFullVoiceSettings({enabled:true}); setFullVoiceScreenOpen(true); }} accessibilityRole="button" accessibilityLabel="Open Full Voice Mode"><Text style={styles.miniActionText}>Voice mode</Text></TouchableOpacity><TouchableOpacity style={styles.miniAction} onPress={()=>void handleGenerateImage()} disabled={Boolean(imageGeneration)||isLoading} accessibilityRole="button" accessibilityLabel="Create an image from the current message"><Text style={styles.miniActionText}>{imageGeneration?'Creating image…':'Create image'}</Text></TouchableOpacity>{imageGeneration&&<View style={styles.promptStage}><Text style={styles.promptStageText}>Image · {imageGeneration.model}</Text><TouchableOpacity onPress={cancelImageGeneration} style={styles.miniAction} accessibilityRole="button" accessibilityLabel="Stop image generation"><Text style={styles.miniActionText}>Stop</Text></TouchableOpacity></View>}{fullVoiceSession.enabled&&<View style={styles.promptStage}><Text style={styles.promptStageText}>Full Voice · {fullVoiceSession.state}</Text><TouchableOpacity onPress={()=>updateFullVoiceSettings({enabled:false})} style={styles.miniAction} accessibilityRole="button"><Text style={styles.miniActionText}>Off</Text></TouchableOpacity></View>}{(activeChat?.bookmarks||[]).length>0&&<TouchableOpacity style={styles.miniAction} onPress={()=>setBookmarkViewerOpen((value)=>!value)} accessibilityRole="button"><Text style={styles.miniActionText}>{(activeChat.bookmarks||[]).length} bookmarks</Text></TouchableOpacity>}{pendingPromptContext&&<View style={styles.promptStage}><Text style={styles.promptStageText}>{pendingPromptContext.role}: {pendingPromptContext.name}</Text><TouchableOpacity onPress={()=>setPendingPromptContext(null)} style={styles.miniAction} accessibilityRole="button"><Text style={styles.miniActionText}>Clear</Text></TouchableOpacity></View>}</View>{activeQueuedTurns.map((turn)=><View key={turn.id} style={styles.queueRow}><View style={styles.queueBody}><Text style={styles.queueTitle}>{turn.status} draft</Text><Text style={styles.queueText} numberOfLines={2}>{turn.content || (turn.attachments||[]).map((file)=>file.name).join(', ') || 'Attachment draft'}</Text>{turn.error&&<Text style={styles.queueError}>{turn.error}</Text>}</View>{['FAILED','CANCELLED'].includes(turn.status)&&<TouchableOpacity style={styles.miniAction} onPress={()=>retryQueuedTurn(turn.id)} accessibilityRole="button"><Text style={styles.miniActionText}>Retry</Text></TouchableOpacity>}{!['SENT','CANCELLED'].includes(turn.status)&&<TouchableOpacity style={styles.miniAction} onPress={()=>cancelQueuedTurn(turn.id)} accessibilityRole="button"><Text style={styles.miniActionText}>Cancel</Text></TouchableOpacity>}</View>)}{attachmentSession.files.map((file) => { const localOnly = file.kind === 'apk'; const transport = localOnly ? 'Local only · filename and size context' : `Sent to ${activeProviderLabel} after you confirm`; return <View key={file.id} style={[styles.attachmentChip, localOnly && styles.attachmentChipLocal]}><View style={styles.attachmentInfo}><Text style={styles.attachmentText} numberOfLines={1}>{file.kind}: {file.name} · {file.status.toLowerCase()}</Text><Text style={[styles.attachmentPolicy, localOnly && styles.attachmentPolicyLocal]} numberOfLines={1}>{transport}</Text></View><TouchableOpacity style={styles.attachmentMove} onPress={() => handleMoveAttachment(file.id, -1)} accessibilityRole="button" accessibilityLabel={`Move ${file.name} earlier`}><Text style={styles.attachmentMoveText}>↑</Text></TouchableOpacity><TouchableOpacity style={styles.attachmentMove} onPress={() => handleMoveAttachment(file.id, 1)} accessibilityRole="button" accessibilityLabel={`Move ${file.name} later`}><Text style={styles.attachmentMoveText}>↓</Text></TouchableOpacity><TouchableOpacity style={styles.inlineClose} onPress={() => { attachmentExtractsRef.current.delete(file.id); setAttachmentSession((previous) => removeAttachment(previous, file.id)); }} accessibilityRole="button" accessibilityLabel={`Remove attachment ${file.name}`}><IconClose size={16} color={palette.textMuted} /></TouchableOpacity></View>; })}{isListening && <Text style={styles.listeningText} accessibilityLiveRegion="polite">Listening in {voiceLocale}… {voiceDraft ? `“${voiceDraft}”` : 'tap the microphone again to stop and review.'}</Text>}{offlineMode && <Text style={styles.offlineText} accessibilityLiveRegion="polite">Offline mode: drafts queue locally. Visible attachment metadata is retained; files must be reattached before a queued attachment draft can send.</Text>}<View style={styles.memoryRequestBar}><TouchableOpacity style={styles.miniAction} onPress={()=>setMemoryRequestPanelOpen((value)=>!value)} accessibilityRole="button" accessibilityLabel="Workspace Memory controls for this request"><Text style={styles.miniActionText}>{requestMemoryOff?'Memory off':`Memory ${requestMemoryPreview.selected.length} selected`}</Text></TouchableOpacity><Text style={styles.memoryRequestHint}>{requestMemoryOff?'No durable memory will be injected into this request.':`${requestMemoryPreview.manifest.filter((item)=>!item.selected).length} excluded · bounded context budget`}</Text></View>{memoryRequestPanelOpen&&<View style={styles.memoryRequestPanel}><View style={styles.promptStage}><Text style={styles.promptStageText}>Per-request Workspace Memory</Text><TouchableOpacity style={styles.miniAction} onPress={()=>setRequestMemoryOff((value)=>!value)} accessibilityRole="switch" accessibilityState={{checked:requestMemoryOff}}><Text style={styles.miniActionText}>{requestMemoryOff?'Turn memory on':'Memory off'}</Text></TouchableOpacity></View><Text style={styles.uploadHint}>Why selected? Pinned/high-priority and relevant memories are chosen deterministically within the context budget. Overrides below affect this request only.</Text>{requestMemoryPreview.manifest.slice(0,20).map((item)=>{const memory=(activeWorkspace?.memories||[]).find((entry)=>entry.id===item.id);return <TouchableOpacity key={item.id} style={styles.memoryRequestItem} onPress={()=>setRequestMemoryExcludedIds((ids)=>ids.includes(item.id)?ids.filter((id)=>id!==item.id):[...ids,item.id])} disabled={requestMemoryOff} accessibilityRole="checkbox" accessibilityState={{checked:item.selected}}><View style={{flex:1}}><Text style={styles.memoryRequestTitle}>{memory?.title||memory?.content?.slice(0,48)||'Memory'}</Text><Text style={styles.memoryRequestHint}>{item.reason}</Text></View><Text style={styles.memoryRequestMark}>{item.selected?'✓':'—'}</Text></TouchableOpacity>})}</View>}{isLoading && <View style={styles.haltRow}><TouchableOpacity style={styles.haltBtn} onPress={stopGeneration} accessibilityRole="button"><IconStop /><Text style={styles.haltBtnText}>Stop Generating</Text></TouchableOpacity></View>}<View style={styles.inputRow}><TouchableOpacity ref={attachmentTriggerRef} onPress={() => setIsAttachmentSourceOpen(true)} disabled={isLoading} style={styles.iconInputBtn} accessibilityLabel="Add document, image, Android APK, camera or gallery attachment" accessibilityRole="button"><IconUpload size={19} color={palette.textMuted} /></TouchableOpacity><TextInput ref={messageInputRef} value={input} onChangeText={setInput} placeholder={editSourceMessageId ? 'Revise transmission before resubmitting…' : 'Issue a command…'} placeholderTextColor={palette.textFaint} editable={!isLoading} multiline onFocus={() => requestAnimationFrame(scrollToBottom)} style={styles.textInput} accessibilityLabel="Message" /><TouchableOpacity ref={voiceTriggerRef} onPress={toggleSpeechRecognition} disabled={isLoading} style={[styles.iconInputBtn, isListening && styles.micBtnActive]} accessibilityLabel={isListening ? 'Stop speech recognition' : 'Start speech recognition'} accessibilityRole="button"><IconMic size={19} color={isListening ? '#ffffff' : palette.textMuted} /></TouchableOpacity><TouchableOpacity onPress={handleSendMessage} disabled={isLoading || (!input.trim() && !attachmentSession.files.length)} style={[styles.sendBtn, (isLoading || (!input.trim() && !attachmentSession.files.length)) && styles.sendBtnDisabled]} accessibilityLabel="Send message" accessibilityRole="button"><IconSend /></TouchableOpacity></View><TouchableOpacity style={styles.offlineToggle} onPress={() => setOfflineMode((value) => !value)} accessibilityRole="switch" accessibilityState={{ checked: offlineMode }}><Text style={styles.uploadHint}>{offlineMode ? 'Offline drafts enabled — tap to resume online sending' : 'Stage intelligence: documents and images transmit only for the active command; APK binaries stay local and contribute filename/size context only. Tap to queue an offline transmission.'}</Text></TouchableOpacity></View></View></>}
      {primaryDestination === 'workspaces' && <ScrollView contentContainerStyle={styles.domainPage}><Text style={styles.domainTitle}>Workspaces</Text><Text style={styles.domainDetail}>Organise chats, documents, persistent memory, Skills, automation and project exports. AI configuration remains PIN protected.</Text><TouchableOpacity style={styles.domainPrimary} onPress={() => setIntelligenceHubOpen(true)} accessibilityRole="button"><Text style={styles.domainPrimaryText}>Open Workspace Intelligence</Text></TouchableOpacity><TouchableOpacity ref={workspaceManagerTriggerRef} style={styles.domainPrimary} onPress={() => setIsWorkspaceManagerOpen(true)} accessibilityRole="button" accessibilityLabel="Open workspace manager"><Text style={styles.domainPrimaryText}>Manage workspaces</Text></TouchableOpacity>{conversationState.workspaces.map((workspace) => <TouchableOpacity key={workspace.id} onPress={() => { selectWorkspace(workspace.id); triggerHaptic(hapticsEnabled); }} style={[styles.domainCard, workspace.id === conversationState.activeWorkspaceId && styles.domainCardActive]} accessibilityRole="button" accessibilityState={{selected:workspace.id===conversationState.activeWorkspaceId}}><Text style={styles.domainCardTitle}>{workspace.name}</Text><Text style={styles.domainDetail}>{workspace.chatIds?.length || 0} chats · {workspace.documentIds?.length || 0} documents · {workspace.memories?.length || 0} memories · {workspace.archived ? 'Archived' : 'Active'}</Text></TouchableOpacity>)}</ScrollView>}
      {primaryDestination === 'documents' && <DocumentStudio documents={conversationState.documents || []} revisions={conversationState.documentRevisions || []} activeDocumentId={conversationState.activeDocumentId} workspaceId={conversationState.activeWorkspaceId} onSelectDocument={(id) => setConversationState((previous) => ({...previous,activeDocumentId:id}))} onChangeDocuments={(documents) => setConversationState((previous) => normaliseCState({...previous,documents}))} onChangeRevisions={(documentRevisions) => setConversationState((previous) => ({...previous,documentRevisions}))} onPreview={handleDocumentPreview} onExport={handleDocumentExport} onExportProject={handleDocumentProjectExport} onImportProject={handleDocumentProjectImport} onAiOperation={handleAiDocumentOperation} documentGeneration={activeDocumentGeneration} onStopAi={stopDocumentGeneration} onRetryAi={retryDocumentGeneration} onDeleteDocument={(id) => setConversationState((previous) => deleteDocumentFromState(previous, id))} palette={palette} layout={layout} />}
      {primaryDestination === 'settings' && <ScrollView contentContainerStyle={styles.domainPage}><Text style={styles.domainTitle}>Settings</Text><Text style={styles.domainDetail}>General device, accessibility, voice, export and backup controls are separate from protected AI & Prompt Settings.</Text><TouchableOpacity ref={settingsTriggerRef} style={styles.domainPrimary} onPress={() => setIsSettingsOpen(true)} accessibilityRole="button"><Text style={styles.domainPrimaryText}>Open app settings</Text></TouchableOpacity><TouchableOpacity style={styles.domainCard} onPress={()=>setIntelligenceHubOpen(true)} accessibilityRole="button"><Text style={styles.domainCardTitle}>Command Intelligence</Text><Text style={styles.domainDetail}>Workspace Memory, Skills, Usage & Cost, Scheduled Tasks and Full Voice Mode.</Text></TouchableOpacity><TouchableOpacity style={styles.domainCard} onPress={requestProtectedSettingsAccess} accessibilityRole="button"><Text style={styles.domainCardTitle}>AI & Prompt Settings</Text><Text style={styles.domainDetail}>PIN protected provider, model, generation, prompt and project-AI configuration.</Text></TouchableOpacity><View style={styles.domainCard}><Text style={styles.domainCardTitle}>Dual-provider configuration</Text><Text style={styles.domainDetail}>Active: {activeProviderLabel} · OpenRouter key: {apiKeyPersistenceStatus === 'SAVED_SECURELY' ? 'saved' : apiKeyPersistenceStatus === 'READ_OK' ? 'read' : apiKeyPersistenceStatus.toLowerCase()} · Together key: {togetherApiKeyPersistenceStatus === 'SAVED_SECURELY' ? 'saved' : togetherApiKeyPersistenceStatus === 'READ_OK' ? 'read' : togetherApiKeyPersistenceStatus.toLowerCase()}. No automatic provider fallback.</Text></View></ScrollView>}
      </View>
    </View>
    {layout === 'compact' && <View style={[styles.compactNavSafe, { paddingBottom: Math.max(insets.bottom, 8) }]}><PrimaryNavigation items={navigationItems} active={primaryDestination} onSelect={(id) => { triggerHaptic(hapticsEnabled); requestPrimaryDestination(id); }} palette={palette} /></View>}
  </View></KeyboardAvoidingView>
  <FullVoiceScreen visible={fullVoiceScreenOpen} session={fullVoiceSession} transcript={voiceDraft} onListen={startSpeechRecognition} onStopListening={toggleSpeechRecognition} onInterrupt={interruptFullVoice} onStopAll={stopFullVoiceSession} onReplay={replayFullVoiceResponse} onKeyboard={()=>{ void stopFullVoiceSession(); setFullVoiceScreenOpen(false); requestAnimationFrame(()=>messageInputRef.current?.focus?.()); }} onControls={()=>{ void stopFullVoiceSession(); setFullVoiceScreenOpen(false); setIntelligenceHubOpen(true); }} onClose={()=>{ void stopFullVoiceSession(); setFullVoiceScreenOpen(false); }} returnFocusRef={fullVoiceScreenTriggerRef} palette={palette} />
  <IntelligenceHub visible={intelligenceHubOpen} onClose={() => setIntelligenceHubOpen(false)} workspace={activeWorkspace} skills={conversationState.skills || []} skillRuns={conversationState.skillRuns || []} usageLedger={conversationState.usageLedger || []} usageBudgets={conversationState.usageBudgets || []} pricingAssumptions={conversationState.pricingAssumptions || []} scheduledTasks={conversationState.scheduledTasks || []} taskRuns={conversationState.taskRuns || []} onAddMemory={addMemoryToWorkspace} onUpdateMemory={updateMemoryInWorkspace} onDeleteMemory={deleteMemoryFromWorkspace} onBulkDeleteMemories={bulkDeleteMemoriesFromWorkspace} onCreateSkill={createCustomSkill} onDuplicateSkill={duplicateSkillById} onDeleteSkill={deleteSkillById} onToggleSkill={toggleSkillEnabled} onUpdateSkillDraft={updateSkillDraftById} onPublishSkill={publishSkillById} onNewSkillDraft={newSkillDraftById} onRetireSkill={retireSkillById} onMoveSkillStep={moveSkillStepById} onImportSkillText={importSkillText} onExportSkillText={exportSkillText} onRunSkill={(skillId, skillInput) => void runSkillById(skillId, skillInput).catch((skillError) => setError(skillError.message || 'Skill failed.'))} onCreateTask={createTask} onUpdateTask={updateTask} onDuplicateTask={duplicateTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} onRunTask={runTaskById} onRequestNotificationPermission={requestTaskNotificationPermission} onUpsertBudget={upsertBudgetInState} onDeleteBudget={deleteBudgetFromState} onUpsertPricingAssumption={upsertPricingInState} onDeletePricingAssumption={deletePricingFromState} onClearUsage={clearLocalUsageHistory} activeProviderLabel={activeProviderLabel} activeModel={model} fullVoice={fullVoiceSession} onFullVoiceChange={updateFullVoiceSettings} voices={speechVoices} selectedVoiceId={selectedVoiceId} onVoiceIdChange={setSelectedVoiceId} playbackSpeed={playbackSpeed} onPlaybackSpeedChange={setPlaybackSpeed} returnFocusRef={intelligenceTriggerRef} palette={palette} />
  <SettingsSheet visible={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onExportChat={() => handleExport('txt')} onExportPdf={() => handleExportPdf(PDF_LAYOUTS.POLISHED)} onExportPdfCompact={() => handleExportPdf(PDF_LAYOUTS.COMPACT)} onCreateDocumentZip={handleCreateDocumentZip} onClearChat={() => { if (activeChat) Alert.alert('Clear chat?', 'Delete every message in this chat? This cannot be undone.', [{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>{stopGenerationForChat(activeChat.id);updateChat(activeChat.id,(chat)=>({...chat,messages:[],bookmarks:[]}));}}]); }} onExportData={() => handleExport('json')} onImportData={handleImport} onBackup={handleBackup} onRestore={handleRestore} dataStats={{ chats: chats.length, archived: chats.filter((chat) => chat.archived).length, attachments: chats.reduce((total, chat) => total + chat.messages.filter((message) => message.attachment).length, 0), queued: conversationState.offlineQueue.length, schema: conversationState.storageSchemaVersion }} colorMode={colorMode} onToggleColorMode={() => setColorMode('light')} voiceLocale={voiceLocale} onChangeVoiceLocale={setVoiceLocale} playbackSpeed={playbackSpeed} onChangePlaybackSpeed={setPlaybackSpeed} onStopSpeech={handleStopSpeech} hapticsEnabled={hapticsEnabled} onToggleHaptics={setHapticsEnabled} returnFocusRef={settingsTriggerRef} palette={palette} />
  <LLMSettingsSheet visible={isLLMSettingsOpen} onClose={() => { setIsModelPickerOpen(false); setIsLLMSettingsOpen(false); }} activeProvider={activeProvider} onChangeProvider={(providerId) => { setIsModelPickerOpen(false); setModelPickerMode('text'); setActiveProvider(normaliseProviderId(providerId)); }} apiKey={apiKey} onChangeApiKey={setApiKeyState} togetherApiKey={togetherApiKey} onChangeTogetherApiKey={setTogetherApiKeyState} currentModelName={currentModelName()} onOpenModelPicker={() => { setModelPickerMode('text'); setIsModelPickerOpen(true); }} imageModelName={currentImageModelName()} onOpenImageModelPicker={() => { setModelPickerMode('image'); setIsModelPickerOpen(true); }} isFetchingImageModels={isFetchingImageModels} onSyncImageModels={handleSyncImageModels} systemPrompt={systemPrompt} onChangeSystemPrompt={setSystemPrompt} temperature={temperature} onChangeTemperature={setTemperature} maxTokens={maxTokens} onChangeMaxTokens={(value) => setMaxTokens(normaliseOutputTokens(value))} isFetchingModels={isFetchingModels} onSyncModels={handleSyncModels} onChangePin={() => { setIsLLMSettingsOpen(false); setPinGateMode('change'); setPinGateOpen(true); }} onOpenProtectedWorkspaceTools={() => setIsProtectedWorkspaceToolsOpen(true)} apiKeyPersistenceStatus={apiKeyPersistenceStatus} togetherApiKeyPersistenceStatus={togetherApiKeyPersistenceStatus} returnFocusRef={protectedSettingsTriggerRef} palette={palette} />
  <AttachmentSourceSheet visible={isAttachmentSourceOpen} onClose={() => setIsAttachmentSourceOpen(false)} onDocument={handlePickFile} onImage={handleAddImageFile} onApk={handlePickApk} onCamera={handleAddCamera} onGallery={handleAddGallery} returnFocusRef={attachmentTriggerRef} palette={palette} />
  <PdfReviewSheet visible={Boolean(pdfReview)} job={pdfReview?.job} selectedPages={pdfSelectedPages} onTogglePage={handleTogglePdfPage} onUse={handleUsePdfPages} onCancel={handleCancelPdfReview} returnFocusRef={attachmentTriggerRef} palette={palette} />
  <VoiceReviewSheet visible={voiceReviewOpen} transcript={voiceDraft} onChangeTranscript={(value) => { voiceDraftRef.current = value; setVoiceDraft(value); }} onAccept={acceptVoiceTranscript} onRetry={retryVoiceTranscript} onCancel={cancelVoiceTranscript} returnFocusRef={voiceTriggerRef} palette={palette} />
  <DocumentTargetSheet visible={documentTargetOpen} documents={(conversationState.documents || []).filter((doc) => doc.workspaceId === conversationState.activeWorkspaceId && doc.status !== 'ARCHIVED')} onClose={() => setDocumentTargetOpen(false)} onSelect={commitMessageToDocument} onCreateNew={createDocumentFromMessage} palette={palette} />
  <PinGateModal visible={pinGateOpen} mode={pinGateMode} onClose={() => { setOpenProtectedAfterPin(false); setPinGateOpen(false); }} onSubmit={handlePinSubmit} returnFocusRef={protectedSettingsTriggerRef} palette={palette} /><ModelPicker visible={isModelPickerOpen && isLLMSettingsOpen} onClose={() => setIsModelPickerOpen(false)} modelGroups={modelPickerMode === 'image' ? imageModelGroups : modelGroups} selectedId={modelPickerMode === 'image' ? imageModel : model} onSelect={modelPickerMode === 'image' ? setImageModel : setModel} returnFocusRef={protectedSettingsTriggerRef} palette={palette} /><ChatManager visible={isChatManagerOpen} onClose={() => setIsChatManagerOpen(false)} chats={chats} activeChatId={activeChat?.id} generationChatIds={Object.values(generations).filter((job) => !['COMPLETE', 'FAILED', 'CANCELLED'].includes(job.status)).map((job) => job.chatId)} onSelect={(id) => { setConversationState((previous) => ({ ...previous, activeChatId: id })); setInput(''); setAttachmentSession(createAttachmentSession()); attachmentExtractsRef.current.clear(); }} onCreate={handleCreateChat} onRename={(id, title) => updateChat(id, (chat) => ({ ...chat, title }))} onDelete={handleDeleteChat} onTogglePin={(id, value) => updateChat(id, (chat) => setPinned(chat, value))} onToggleArchive={(id, value) => updateChat(id, (chat) => setArchived(chat, value))} onSetTags={(id, tags) => updateChat(id, (chat) => setTags(chat, tags))} onAssignFolder={(id, folder) => { setConversationState((previous) => ({ ...previous, folders: previous.folders.some((item) => item.id === folder.id) ? previous.folders : [...previous.folders, folder] })); updateChat(id, (chat) => assignFolder(chat, folder)); }} onBulkArchive={(ids) => setConversationState((previous) => { const scoped = new Set(previous.chats.filter((chat) => chat.workspaceId === previous.activeWorkspaceId).map((chat) => chat.id)); return { ...previous, chats: bulkArchive(previous.chats, ids.filter((id) => scoped.has(id))) }; })} onBulkDelete={handleBulkDeleteChats} onCreateWorkflowChild={handleCreateWorkflowChild} onCycleWorkflowStatus={handleCycleWorkflowStatus} folders={conversationState.folders} returnFocusRef={chatManagerTriggerRef} palette={palette} />
  <WorkspaceManager visible={isWorkspaceManagerOpen} onClose={() => setIsWorkspaceManagerOpen(false)} workspaces={conversationState.workspaces} activeWorkspaceId={conversationState.activeWorkspaceId} onCreate={(name) => setConversationState((previous) => addWorkspace(previous, { name }))} onSelect={selectWorkspace} onRename={handleDurableWorkspaceRename} onArchive={(id, archived) => setConversationState((previous) => archiveWorkspace(previous, id, archived))} onDelete={(id) => setConversationState((previous) => deleteWorkspace(previous, id))} onAddNote={(id, content) => setConversationState((previous) => addWorkspaceNote(previous, id, content))} onExport={handleExportProject} onImport={handleImportProject} returnFocusRef={workspaceManagerTriggerRef} palette={palette} />
  <ProtectedWorkspaceTools visible={isLLMSettingsOpen && isProtectedWorkspaceToolsOpen} onClose={() => setIsProtectedWorkspaceToolsOpen(false)} promptLibrary={conversationState.promptLibrary} workspaces={conversationState.workspaces} activeWorkspaceId={conversationState.activeWorkspaceId} onAddPrompt={(values) => setConversationState((previous) => ({ ...previous, promptLibrary: addPrompt(previous.promptLibrary, createPrompt(values), true) }))} onDeletePrompt={(id) => setConversationState((previous) => ({ ...previous, promptLibrary: deletePrompt(previous.promptLibrary, id, true) }))} onUpdatePrompt={(id, patch) => setConversationState((previous) => ({ ...previous, promptLibrary: updatePrompt(previous.promptLibrary, id, patch, true) }))} onDuplicatePrompt={(id) => setConversationState((previous) => ({ ...previous, promptLibrary: duplicatePrompt(previous.promptLibrary, id, true) }))} onExportPrompts={handleExportPrompts} onImportPrompts={handleImportPrompts} onUsePrompt={(prompt, substitutions = {}) => { if (!promptAppliesToWorkspace(prompt, conversationState.activeWorkspaceId)) { setError('This prompt is not authorised for the active workspace.'); return; } const expanded = expandPromptVariables(prompt, substitutions); if (['system','developer'].includes(prompt.role)) { setPendingPromptContext({ role: prompt.role, content: expanded, name: prompt.name }); setError(`${prompt.role} prompt staged for the next provider request.`); } else { setPendingPromptContext(null); setInput(expanded); } setIsProtectedWorkspaceToolsOpen(false); }} onUpdateProjectAI={(workspaceId, projectAIConfiguration) => updateWorkspace(workspaceId, (workspace) => ({ ...workspace, projectAIConfiguration }))} returnFocusRef={protectedSettingsTriggerRef} palette={palette} />
  </View>;
}

export default function App() {
  return <SafeAreaProvider><AppErrorBoundary><AIConsoleApp /></AppErrorBoundary></SafeAreaProvider>;
}

const createStyles = (colors) => StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: colors.bg }, executionBanner: { minHeight: 34, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: colors.cyanDim, borderBottomWidth: 1, borderBottomColor: colors.border }, executionBannerText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' }, memoryRequestBar: { minHeight: 42, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }, memoryRequestHint: { flex: 1, color: colors.textMuted, fontSize: 9, lineHeight: 13 }, memoryRequestPanel: { maxHeight: 260, padding: 10, gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.panelAlt }, memoryRequestItem: { minHeight: 46, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border }, memoryRequestTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '800' }, memoryRequestMark: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' }, keyboardAvoider: { flex: 1 }, centerFill: { alignItems: 'center', justifyContent: 'center' }, startupScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: colors.bg }, startupMark: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black, marginBottom: 18 }, startupEyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.15 }, startupTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 7 }, startupDetail: { color: colors.textFaint, fontSize: 12, marginTop: 7 }, safe: { flex: 1, minHeight: 0 }, compactNavSafe: { backgroundColor: colors.bgHeader, borderTopWidth: 1, borderTopColor: colors.border }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.black, backgroundColor: colors.black, elevation: 3, shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, zIndex: 2 }, headerLeft: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 6 }, headerLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: colors.shadow, shadowOpacity: 0.24, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, headerCopy: { flex: 1, minWidth: 0, gap: 1 }, headerEyebrow: { color: '#b8b8b2', fontSize: 8, fontWeight: '800', letterSpacing: 1.25 }, headerTitle: { flexShrink: 1, fontSize: 15, fontWeight: '800', letterSpacing: -0.15, color: '#ffffff' }, headerModel: { flexShrink: 1, fontSize: 9, fontWeight: '700', color: '#d4d4d0', letterSpacing: 0.7, textTransform: 'uppercase' }, headerRight: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 5 }, tokenPill: { maxWidth: 64, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#242422', borderWidth: 1, borderColor: '#5f5f5a', borderRadius: radii.pill }, tokenText: { fontSize: 9, fontFamily: 'monospace', color: '#ffffff', fontWeight: '700' }, settingsBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#242422', borderWidth: 1, borderColor: '#5f5f5a', borderRadius: 12, elevation: 1, shadowColor: colors.shadow, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }, workspaceButtonText: { color: colors.cyanBright, fontSize: 10, fontWeight: '800' }, toast: { position: 'absolute', top: 68, left: 12, right: 12, backgroundColor: colors.roseToast, borderRadius: radii.md, paddingLeft: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 30 }, toastText: { flex: 1, color: '#ffffff', fontSize: 12, fontWeight: '600' }, toastClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }, emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.cyanBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 6, elevation: 3, shadowColor: colors.shadow, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, emptyEyebrow: { color: colors.cyanBright, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, emptyTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.25, color: colors.textPrimary }, emptySubtitle: { fontSize: 12, color: colors.textFaint, textAlign: 'center', lineHeight: 18 }, emptyBtn: { marginTop: 14, minHeight: 50, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: colors.cyan, borderWidth: 1, borderColor: colors.cyan, borderRadius: 16, elevation: 3, shadowColor: colors.shadow, shadowOpacity: 0.24, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } }, emptyBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff' }, conversationArea: { flex: 1, minHeight: 0 }, messageList: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 28 }, composerAvoider: { flexShrink: 0 }, inputArea: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }, attachmentChip: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, alignSelf: 'stretch', maxWidth: '100%', marginBottom: 8, paddingLeft: 12, paddingVertical: 7, backgroundColor: colors.cyanDim, borderWidth: 1, borderColor: colors.cyanBorder, borderRadius: radii.lg }, attachmentChipLocal: { backgroundColor: colors.panelAlt, borderColor: colors.border }, attachmentInfo: { flex: 1, minWidth: 0, gap: 3 }, attachmentText: { minWidth: 0, fontSize: 11, fontWeight: '700', color: colors.textSecondary }, attachmentPolicy: { color: colors.textMuted, fontSize: 9, fontWeight: '700' }, attachmentPolicyLocal: { color: colors.cyanBright }, attachmentMove: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, attachmentMoveText: { color: colors.cyanBright, fontSize: 16, fontWeight: '800' }, inlineClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, listeningText: { marginBottom: 8, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.rose }, offlineText: { marginBottom: 8, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.cyanBright }, haltRow: { alignItems: 'center', marginBottom: 10 }, haltBtn: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 16, borderRadius: radii.pill }, haltBtnText: { fontSize: 11, fontWeight: '700', color: colors.rose }, inputRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 22, paddingHorizontal: 5, paddingVertical: 5, elevation: 5, shadowColor: colors.shadow, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, iconInputBtn: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md }, micBtnActive: { backgroundColor: colors.rose }, textInput: { flex: 1, maxHeight: 120, minHeight: 48, paddingVertical: 10, color: colors.textSecondary, fontSize: 14 }, sendBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, borderRadius: 16, marginLeft: 2, elevation: 2, shadowColor: colors.shadow, shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, sendBtnDisabled: { backgroundColor: colors.border }, uploadHint: { marginTop: 6, textAlign: 'center', fontSize: 10, color: colors.textFaint }, offlineToggle: { minHeight: 48, justifyContent: 'center' }, branchBar:{minHeight:52,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:colors.border,backgroundColor:colors.bg},branchLabel:{color:colors.textMuted,fontSize:10,fontWeight:'800',textTransform:'uppercase'},branchChip:{minHeight:40,paddingHorizontal:10,justifyContent:'center',borderRadius:radii.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.panel},branchChipActive:{borderColor:colors.cyanBright,backgroundColor:colors.cyanDim},branchChipText:{color:colors.textSecondary,fontSize:10,fontWeight:'700'},bookmarkPanel:{padding:10,gap:6,borderBottomWidth:1,borderBottomColor:colors.border,backgroundColor:colors.panelAlt},bookmarkHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},composerMetaRow:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4},miniAction:{minHeight:40,paddingHorizontal:10,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:radii.pill,backgroundColor:colors.panelAlt},miniActionText:{color:colors.cyanBright,fontSize:10,fontWeight:'700'},promptStage:{flex:1,minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,paddingLeft:10,borderWidth:1,borderColor:colors.cyanBorder,borderRadius:radii.pill,backgroundColor:colors.cyanDim},promptStageText:{flex:1,color:colors.textSecondary,fontSize:10,fontWeight:'700'},queueRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:6,padding:8,marginBottom:6,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,backgroundColor:colors.panelAlt},queueBody:{flex:1,minWidth:0},queueTitle:{color:colors.textSecondary,fontSize:10,fontWeight:'800'},queueText:{color:colors.textMuted,fontSize:10,lineHeight:15},queueError:{color:colors.rose,fontSize:10,lineHeight:15}, mainShell: { flex: 1, minHeight: 0 }, mainShellWide: { flexDirection: 'row' }, destinationArea: { flex: 1, minWidth: 0, minHeight: 0 }, domainPage: { padding: 16, gap: 12, paddingBottom: 64 }, domainTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' }, domainDetail: { color: colors.textMuted, fontSize: 12, lineHeight: 18 }, domainPrimary: { minHeight: 50, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, borderRadius: radii.lg }, domainPrimaryText: { color: '#ffffff', fontSize: 13, fontWeight: '800' }, domainCard: { minHeight: 72, padding: 14, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surfaceElevated }, domainCardActive: { borderColor: colors.cyanBright, backgroundColor: colors.cyanDim }, domainCardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 3 },
});
