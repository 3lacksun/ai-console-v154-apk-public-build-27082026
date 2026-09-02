import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CompactWidthBand, compactComposition } from '../src/ui/responsive.mjs';

const read=(rel)=>fs.readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
const app=read('App.js');
const tokens=read('src/ui/tokens.js');
const theme=read('src/theme.js');
const primitives=read('src/ui/primitives.js');
const icons=read('src/components/Icons.js');
const workspace=read('src/components/WorkspaceCommandOverview.js');
const intelligence=read('src/components/IntelligenceHub.js');
const voice=read('src/components/FullVoiceScreen.js');
const documentStudio=read('src/components/DocumentStudio.js');
const settings=read('src/components/LLMSettingsSheet.js');
const motion=read('src/ui/motion.mjs');

test('Precision foundation exposes semantic typography, three surface levels and 48dp touch baseline',()=>{
  for(const role of ['display','screenTitle','body','action','metadata']) assert.match(tokens,new RegExp(`${role}:`));
  assert.match(tokens,/minimum:\s*48/);
  for(const surface of ['surfacePage','surfaceGrouped','surfaceFocused']) assert.match(theme,new RegExp(surface));
  assert.match(primitives,/export const Surface=/);
  assert.match(primitives,/export const StateChip=/);
  assert.match(primitives,/export const ScreenHeading=/);
});

test('Primary navigation remains exactly the four locked destinations with coherent native active treatment',()=>{
  for(const label of ['Chats','Workspaces','Documents','Settings']) assert.match(app,new RegExp(`label: '${label}'`));
  assert.match(primitives,/React\.cloneElement/);
  assert.match(primitives,/navIndicator/);
  assert.match(primitives,/minHeight:60/);
});

test('Composer keeps message input dominant and exposes frequent actions plus truthful Send to Stop transition',()=>{
  assert.match(app,/composerShell/);
  assert.match(app,/multiline/);
  assert.match(app,/accessibilityLabel="Add attachment"/);
  assert.match(app,/Start dictation/);
  assert.match(app,/Open Full Voice Mode/);
  assert.match(app,/isLoading\?stopGeneration:handleSendMessage/);
  assert.match(app,/accessibilityLabel=\{isLoading\?'Stop generation':'Send message'\}/);
  assert.match(app,/StateChip label=\{activeProviderLabel\}/);
  assert.match(app,/tone="execution"/);
});

test('Workspace overview uses only current project state and reports operational context without fabricated metrics',()=>{
  assert.match(workspace,/aggregateUsage\(usageLedger, \{ workspaceId: workspace\.id \}\)/);
  for(const title of ['Now & next','Recent Skills','Recent Documents','Workspaces']) assert.match(workspace,new RegExp(title.replace('&','&')));
  assert.match(workspace,/provider cost .*unavailable/);
  assert.match(workspace,/estimated .*unavailable/);
  assert.doesNotMatch(workspace,/Math\.random|fake|mock/i);
});

test('Full Voice instrument panel is driven by actual state and has no decorative fake waveform',()=>{
  for(const state of ['IDLE','LISTENING','GENERATING','SPEAKING','INTERRUPTING','STOPPED']) assert.match(voice,new RegExp(state));
  assert.match(voice,/accessibilityLiveRegion="polite"/);
  assert.match(voice,/Interrupt/);
  assert.match(voice,/Return to typing|Keyboard/);
  assert.doesNotMatch(voice,/activityDot|waveform|fake/i);
});

test('Usage and Cost visually separates reported, estimated and unavailable provenance',()=>{
  for(const label of ['Provider reported','Local estimate','Cost unavailable']) assert.match(intelligence,new RegExp(label));
  assert.match(intelligence,/costSource==='provider'/);
  assert.match(intelligence,/costSource==='estimated'/);
  assert.doesNotMatch(intelligence,/dollars\(group\.costUsd\)/);
  assert.match(intelligence,/No usage in this period/);
});

test('Important empty states have purposeful descriptions and real next actions when the action exists',()=>{
  assert.match(intelligence,/No workspace memory yet/);
  assert.match(intelligence,/Add memory/);
  assert.match(intelligence,/memoryContentRef\.current\?\.focus/);
  assert.match(intelligence,/No matching Skills/);
  assert.match(intelligence,/Create Skill/);
  assert.match(intelligence,/No scheduled tasks/);
  assert.match(intelligence,/Create task/);
  assert.match(intelligence,/No usage in this period/);
  assert.match(intelligence,/Return to Chat/);
  assert.doesNotMatch(intelligence,/onAction=\{[^}]*=>\{\}\}/);
});

test('Shared motion is restrained and reduced-motion aware',()=>{
  assert.match(motion,/fast:140|MotionKind/);
  assert.match(motion,/if \(reduced\) return uiTokens\.motion\.reduced/);
  assert.match(motion,/if \(reduced\) return 'none'/);
  assert.match(primitives,/modalAnimation\(MotionKind\./);
  assert.match(voice,/modalAnimation\(MotionKind\.SCREEN,reducedMotion\)/);
});

test('Compact width profiles cover 320, 360, 384 and 412dp without horizontal-rail dependence',()=>{
  const cases=[[320,CompactWidthBand.NARROW],[360,CompactWidthBand.TIGHT],[384,CompactWidthBand.STANDARD],[412,CompactWidthBand.COMFORTABLE]];
  for(const [width,band] of cases){const profile=compactComposition(width);assert.equal(profile.band,band);assert.equal(profile.allowHorizontalRail,false);assert.ok(profile.horizontalPadding>=12&&profile.horizontalPadding<=16);}
  assert.equal(compactComposition(412,1.4).stackDenseControls,true);
  assert.doesNotMatch(intelligence,/ScrollView horizontal/);
  assert.doesNotMatch(documentStudio,/ScrollView horizontal/);
  assert.doesNotMatch(settings,/ScrollView horizontal/);
  assert.match(intelligence,/flexWrap:'wrap'/);
  assert.match(documentStudio,/flexWrap:'wrap'/);
  assert.match(settings,/flexWrap: 'wrap'/);
});



test('Core light-theme text and semantic state colours meet static contrast targets',()=>{
  const hex=(name)=>{const match=theme.match(new RegExp(`${name}: '([#][0-9a-fA-F]{6})'`));assert.ok(match,`missing ${name}`);return match[1];};
  const lum=(value)=>{const rgb=[1,3,5].map((i)=>parseInt(value.slice(i,i+2),16)/255).map((v)=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];};
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
  for(const [fg,bg] of [['textPrimary','surfacePage'],['textSecondary','surfacePage'],['textMuted','surfacePage'],['textFaint','surfacePage'],['warning','warningBg'],['danger','dangerBg'],['success','successBg']]) assert.ok(ratio(hex(fg),hex(bg))>=4.5,`${fg}/${bg} below 4.5:1`);
});
test('Icon additions stay in the existing monochrome SVG family and semantic states are not colour-only',()=>{
  for(const name of ['IconVoice','IconMemory','IconTask','IconUsage','IconSpark']) assert.match(icons,new RegExp(`export const ${name}`));
  assert.match(primitives,/stateChipText/);
  assert.match(primitives,/accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(intelligence,/Blocked|Warning|Within budget/);
});
