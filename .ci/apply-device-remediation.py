from pathlib import Path
import hashlib

BASE = {
    'App.js': '00085bb64cb812b8459401ff9df9384702ba646538892b59e1e51bd2267fd78d',
    'src/components/Icons.js': '578ad7cea3136fb43332af3b947b5beea5c3170bd2df5d9d684a7bfacdbf53f9',
    'tests/precision-command-centre.test.mjs': '6acee1d24722ba75f31cd3e1d98220dad75b8fab790737496c810875c2521d9a',
}
TARGET = {
    'App.js': '49bbe61ded028dffbf56b2b59d9536ef6d17d3b04f4c62f9ce6ee38d5cdb4088',
    'src/components/Icons.js': 'b275ec77a592e2507b967b789374fdc81b23d1672717a2458a17d2fe1b1a5c5b',
    'tests/precision-command-centre.test.mjs': '1761507dfad0a372a78c2c2663eff2784bd0e7bf4e609ebc1c1cfd3e5947874b',
}

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def once(s, old, new, label):
    n=s.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, got {n}')
    return s.replace(old,new,1)

p=Path('App.js'); s=p.read_text()
assert sha(s)==BASE['App.js'], (sha(s), BASE['App.js'])
s=once(s, "IconSettings, IconStop", "IconSettings, IconSpark, IconStop", 'import IconSpark')
s=once(s, "const currentModelName = () => `${activeProviderLabel} · ${Object.values(modelGroups || {}).flat().find((item) => item.id === model)?.name || model}`;", "const currentModelName = () => Object.values(modelGroups || {}).flat().find((item) => item.id === model)?.name || model;", 'model label')
s=once(s, "{primaryDestination === 'documents' ? <IconDocument /> : primaryDestination === 'workspaces' ? <IconWorkspace /> : primaryDestination === 'settings' ? <IconSettings /> : <IconBot />}", "{primaryDestination === 'documents' ? <IconDocument color={palette.black} /> : primaryDestination === 'workspaces' ? <IconWorkspace color={palette.black} /> : primaryDestination === 'settings' ? <IconSettings color={palette.black} /> : <IconBot color={palette.black} />}", 'header logo colours')
s=once(s, "{`${activeWorkspace?.name || 'Workspace'} · ${currentModelName()} · ${APP_RELEASE_LABEL}`}", "{`${activeWorkspace?.name || 'Workspace'} · ${activeProviderLabel}`}", 'header subtitle')
old_actions='''<TouchableOpacity style={styles.miniAction} onPress={()=>setIntelligenceHubOpen(true)} accessibilityRole="button" accessibilityLabel="Open Command Intelligence"><Text style={styles.miniActionText}>Intelligence</Text></TouchableOpacity><TouchableOpacity style={styles.miniAction} onPress={()=>void handleGenerateImage()} disabled={Boolean(imageGeneration)||isLoading} accessibilityRole="button" accessibilityLabel="Create an image from the current message"><Text style={styles.miniActionText}>{imageGeneration?'Creating image…':'Create image'}</Text></TouchableOpacity>'''
s=once(s, old_actions, '', 'remove composer text actions')
old_voice='''<TouchableOpacity ref={fullVoiceScreenTriggerRef} style={[styles.iconInputBtn,fullVoiceSession.enabled&&styles.iconInputBtnActive]} onPress={()=>{if(!fullVoiceSessionRef.current.enabled)updateFullVoiceSettings({enabled:true});setFullVoiceScreenOpen(true);}} accessibilityRole="button" accessibilityLabel="Open Full Voice Mode"><IconVoice size={20} color={fullVoiceSession.enabled?palette.textPrimary:palette.textMuted}/></TouchableOpacity></View><TouchableOpacity onPress={isLoading?stopGeneration:handleSendMessage}'''
new_voice='''<TouchableOpacity ref={fullVoiceScreenTriggerRef} style={[styles.iconInputBtn,fullVoiceSession.enabled&&styles.iconInputBtnActive]} onPress={()=>{if(!fullVoiceSessionRef.current.enabled)updateFullVoiceSettings({enabled:true});setFullVoiceScreenOpen(true);}} accessibilityRole="button" accessibilityLabel="Open Full Voice Mode"><IconVoice size={20} color={fullVoiceSession.enabled?palette.textPrimary:palette.textMuted}/></TouchableOpacity><TouchableOpacity style={[styles.iconInputBtn,imageGeneration&&styles.iconInputBtnActive]} onPress={()=>void handleGenerateImage()} disabled={Boolean(imageGeneration)||isLoading} accessibilityRole="button" accessibilityLabel={imageGeneration?'Creating image':'Create image'}><IconSpark size={20} color={imageGeneration?palette.textPrimary:palette.textMuted}/></TouchableOpacity></View><TouchableOpacity onPress={isLoading?stopGeneration:handleSendMessage}'''
s=once(s, old_voice, new_voice, 'image icon action')
old_help='Stage intelligence: documents and images transmit only for the active command; APK binaries stay local and contribute filename/size context only. Tap to queue an offline transmission.'
new_help='Attachments are request-scoped; APK files stay local. Tap to queue an offline transmission.'
s=once(s, old_help, new_help, 'helper copy')
styles = [
("memoryRequestBar: { minHeight: 42, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }", "memoryRequestBar: { minHeight: 48, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }"),
("memoryRequestHint: { flex: 1, color: colors.textMuted, fontSize: 9, lineHeight: 13 }", "memoryRequestHint: { flex: 1, color: colors.textMuted, fontSize: 10, lineHeight: 14 }"),
("header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10,", "header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8,"),
("headerLeft: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 6 }", "headerLeft: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }"),
("headerLogo: { width: 40, height: 40, borderRadius: 12,", "headerLogo: { width: 38, height: 38, borderRadius: 11,"),
("headerEyebrow: { color: '#b8b8b2', fontSize: 8, fontWeight: '800', letterSpacing: 1.25 }", "headerEyebrow: { color: '#b8b8b2', fontSize: 8, fontWeight: '800', letterSpacing: 1.05 }"),
("headerTitle: { flexShrink: 1, fontSize: 15,", "headerTitle: { flexShrink: 1, fontSize: 14,"),
("headerModel: { flexShrink: 1, fontSize: 9, fontWeight: '700', color: '#d4d4d0', letterSpacing: 0.7,", "headerModel: { flexShrink: 1, fontSize: 8, fontWeight: '700', color: '#d4d4d0', letterSpacing: 0.55,"),
("headerRight: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 5 }", "headerRight: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }"),
("tokenPill: { minHeight: 48, maxWidth: 72, paddingHorizontal: 8,", "tokenPill: { minHeight: 48, maxWidth: 58, paddingHorizontal: 7,"),
("emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }", "emptyState: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 10, gap: 6 }"),
("emptyIcon: { width: 72, height: 72, borderRadius: 24,", "emptyIcon: { width: 50, height: 50, borderRadius: 16,"),
("marginBottom: 6, elevation: 3, shadowColor: colors.shadow, shadowOpacity: 0.18", "marginBottom: 2, elevation: 2, shadowColor: colors.shadow, shadowOpacity: 0.18"),
("emptyEyebrow: { color: colors.cyanBright, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }", "emptyEyebrow: { color: colors.cyanBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }"),
("emptyTitle: { fontSize: 22,", "emptyTitle: { fontSize: 20,"),
("emptySubtitle: { fontSize: 12, color: colors.textFaint, textAlign: 'center', lineHeight: 18 }", "emptySubtitle: { maxWidth: 320, fontSize: 11, color: colors.textFaint, textAlign: 'center', lineHeight: 16 }"),
("emptyBtn: { marginTop: 14, minHeight: 50, paddingHorizontal: 22,", "emptyBtn: { marginTop: 6, minHeight: 48, paddingHorizontal: 20,"),
("inputArea: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8,", "inputArea: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6,"),
("composerMetaRow:{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:7}", "composerMetaRow:{flexDirection:'row',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:5}"),
]
for i,(a,b) in enumerate(styles): s=once(s,a,b,f'style {i}')
p.write_text(s)
print('App', sha(s))

p=Path('src/components/Icons.js'); s=p.read_text(); assert sha(s)==BASE[str(p)]
old='''    <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />\n    <Circle cx="12" cy="12" r="4" />'''
new='''    <Rect x="4" y="7" width="16" height="13" rx="4" />\n    <Path d="M12 3v4" />\n    <Circle cx="9" cy="13" r="1" />\n    <Circle cx="15" cy="13" r="1" />\n    <Path d="M9 17h6" />'''
s=once(s,old,new,'robot icon'); p.write_text(s); print('Icons', sha(s))

p=Path('tests/precision-command-centre.test.mjs'); s=p.read_text(); assert sha(s)==BASE[str(p)]
add='''\n\ntest('360dp device composition keeps header, empty state and composer controls compact and unambiguous',()=>{\n  assert.match(app,/IconBot color=\\{palette\\.black\\}/);\n  assert.match(icons,/Rect x="4" y="7" width="16" height="13"/);\n  assert.match(app,/const currentModelName = \\(\\) => Object\\.values/);\n  assert.doesNotMatch(app,/const currentModelName = \\(\\) => `\\$\\{activeProviderLabel\\}/);\n  assert.match(app,/accessibilityLabel=\\{imageGeneration\\?'Creating image':'Create image'\\}/);\n  assert.doesNotMatch(app,/>Intelligence<\\/Text><\\/TouchableOpacity><TouchableOpacity style=\\{styles\\.miniAction\\} onPress=\\{\\(\\)=>void handleGenerateImage/);\n  assert.match(app,/emptyState: \\{ flex: 1, alignItems: 'center', justifyContent: 'flex-start'/);\n  assert.match(app,/emptyIcon: \\{ width: 50, height: 50/);\n  assert.match(app,/Attachments are request-scoped; APK files stay local\\./);\n});\n'''
s += add; p.write_text(s); print('Tests', sha(s))

for k,v in TARGET.items():
    got=hashlib.sha256(Path(k).read_bytes()).hexdigest()
    if got != v:
        raise SystemExit(f'{k}: target hash mismatch {got} != {v}')
print('ALL TARGET HASHES PASS')
