import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, ScreenHeading, SectionHeading, StateChip, Surface } from '../ui/primitives';
import { IconDocument, IconMemory, IconSpark, IconTask, IconUsage, IconWorkspace } from './Icons';
import { aggregateUsage } from '../usage/usageLedger.mjs';
import { radii } from '../theme';
import { uiTokens } from '../ui/tokens';

const formatWhen = (value) => {
  if (!value) return 'No run scheduled';
  try { return new Date(value).toLocaleString(); } catch (_) { return 'Schedule available'; }
};

export default function WorkspaceCommandOverview({
  workspace,
  workspaces = [],
  documents = [],
  usageLedger = [],
  scheduledTasks = [],
  skillRuns = [],
  activeProviderLabel = 'OpenRouter',
  activeModel = '',
  onOpenIntelligence = () => {},
  onManageWorkspaces = () => {},
  onSelectWorkspace = () => {},
  palette,
}) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!workspace) return <EmptyState title="No workspace selected" detail="Create or select a workspace to establish an operational context." icon={<IconWorkspace size={24} color={palette.textMuted}/>} actionLabel="Manage workspaces" onAction={onManageWorkspaces} palette={palette}/>;

  const memories = workspace.memories || [];
  const activeMemories = memories.filter((memory) => memory.enabled !== false && !memory.archived);
  const workspaceDocuments = documents.filter((doc) => doc.workspaceId === workspace.id && doc.status !== 'ARCHIVED');
  const workspaceTasks = scheduledTasks.filter((task) => !task.workspaceId || task.workspaceId === workspace.id);
  const activeTasks = workspaceTasks.filter((task) => task.enabled !== false);
  const nextTask = activeTasks.filter((task) => Number(task.nextRunAt) > 0).sort((a,b)=>Number(a.nextRunAt)-Number(b.nextRunAt))[0] || null;
  const recentRuns = skillRuns.filter((run) => !run.workspaceId || run.workspaceId === workspace.id).slice().sort((a,b)=>Number(b.finishedAt||b.startedAt||0)-Number(a.finishedAt||a.startedAt||0)).slice(0,3);
  const recentDocuments = workspaceDocuments.slice().sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,3);
  const usage = aggregateUsage(usageLedger, { workspaceId: workspace.id });
  const activeRun = recentRuns.find((run)=>run.status==='RUNNING');

  return <View style={styles.root}>
    <ScreenHeading eyebrow="ACTIVE WORKSPACE" title={workspace.name || 'Workspace'} detail="Command overview for context, AI configuration, active work and recent activity." palette={palette}/>
    <View style={styles.chipRail}>
      <StateChip label={activeProviderLabel} palette={palette}/>
      <StateChip label={activeModel || 'Model not selected'} tone={activeModel?'context':'warning'} palette={palette}/>
      <StateChip label={`Memory ${activeMemories.length}/${memories.length}`} icon={<IconMemory size={14} color={palette.textMuted}/>} palette={palette}/>
      {activeRun?<StateChip label={`Skill running · ${activeRun.skillName || 'Skill'}`} tone="execution" icon={<IconSpark size={14} color={palette.textPrimary}/>} palette={palette}/>:null}
    </View>

    <View style={styles.metricGrid}>
      <Metric icon={<IconWorkspace size={19} color={palette.textPrimary}/>} label="Chats" value={workspace.chatIds?.length || 0} detail="workspace channels" styles={styles}/>
      <Metric icon={<IconDocument size={19} color={palette.textPrimary}/>} label="Documents" value={workspaceDocuments.length} detail="active documents" styles={styles}/>
      <Metric icon={<IconMemory size={19} color={palette.textPrimary}/>} label="Memory" value={activeMemories.length} detail={`${memories.length} total`} styles={styles}/>
      <Metric icon={<IconTask size={19} color={palette.textPrimary}/>} label="Tasks" value={activeTasks.length} detail={`${workspaceTasks.length} configured`} styles={styles}/>
    </View>

    <Surface palette={palette} level="focused" style={styles.nowPanel} accessibilityLabel="Workspace operational status">
      <SectionHeading title="Now & next" detail="Current execution and the next scheduled action." palette={palette}/>
      <StatusRow icon={<IconSpark size={18} color={palette.textPrimary}/>} title="Current activity" detail={activeRun?`${activeRun.skillName || 'Skill'} · ${activeRun.status}`:'No Skill execution is currently recorded as running.'} styles={styles}/>
      <StatusRow icon={<IconTask size={18} color={palette.textPrimary}/>} title="Next task" detail={nextTask?`${nextTask.name} · ${formatWhen(nextTask.nextRunAt)}`:'No enabled task has a future run recorded.'} styles={styles}/>
      <StatusRow icon={<IconUsage size={18} color={palette.textPrimary}/>} title="Usage" detail={`${usage.requests} requests · ${usage.totalTokens.toLocaleString()} tokens · provider cost ${usage.costedRequests?`$${usage.providerCostUsd.toFixed(4)}`:'unavailable'} · estimated ${usage.estimatedRequests?`$${usage.estimatedCostUsd.toFixed(4)}`:'unavailable'}`} styles={styles}/>
    </Surface>

    <View style={styles.twoColumn}>
      <Surface palette={palette} style={styles.flexPanel}><SectionHeading title="Recent Skills" detail="Latest workspace executions." palette={palette}/>{recentRuns.length?recentRuns.map((run)=><View key={run.id} style={styles.compactRow}><Text style={styles.rowTitle} numberOfLines={1}>{run.skillName || 'Skill'}</Text><Text style={styles.meta}>{run.status || 'UNKNOWN'} · {formatWhen(run.finishedAt || run.startedAt)}</Text></View>):<Text style={styles.emptyCopy}>No Skill runs recorded yet.</Text>}</Surface>
      <Surface palette={palette} style={styles.flexPanel}><SectionHeading title="Recent Documents" detail="Latest workspace document activity." palette={palette}/>{recentDocuments.length?recentDocuments.map((doc)=><View key={doc.id} style={styles.compactRow}><Text style={styles.rowTitle} numberOfLines={1}>{doc.title || 'Untitled document'}</Text><Text style={styles.meta}>{doc.sections?.length || 0} sections · {doc.autosaveStatus || 'SAVED'}</Text></View>):<Text style={styles.emptyCopy}>No active documents yet.</Text>}</Surface>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.primary} onPress={onOpenIntelligence} accessibilityRole="button" accessibilityLabel="Open Workspace Intelligence"><Text style={styles.primaryText}>Open Workspace Intelligence</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={onManageWorkspaces} accessibilityRole="button" accessibilityLabel="Manage workspaces"><Text style={styles.secondaryText}>Manage workspaces</Text></TouchableOpacity>
    </View>

    <SectionHeading title="Workspaces" detail="Switch operational context without leaving the command overview." palette={palette}/>
    <View style={styles.workspaceList}>{workspaces.map((item)=><TouchableOpacity key={item.id} onPress={()=>onSelectWorkspace(item.id)} style={[styles.workspaceRow,item.id===workspace.id&&styles.workspaceRowActive]} accessibilityRole="button" accessibilityState={{selected:item.id===workspace.id}}><View style={styles.cardCopy}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.meta}>{item.chatIds?.length || 0} chats · {item.documentIds?.length || 0} documents · {item.memories?.length || 0} memories</Text></View><StateChip label={item.archived?'Archived':item.id===workspace.id?'Active':'Open'} tone={item.id===workspace.id?'success':'context'} palette={palette}/></TouchableOpacity>)}</View>
  </View>;
}

function Metric({icon,label,value,detail,styles}) { return <View style={styles.metric}><View style={styles.metricTop}>{icon}<Text style={styles.metricLabel}>{label}</Text></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.meta}>{detail}</Text></View>; }
function StatusRow({icon,title,detail,styles}) { return <View style={styles.statusRow}><View style={styles.statusIcon}>{icon}</View><View style={styles.cardCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.meta}>{detail}</Text></View></View>; }

const createStyles=(c)=>StyleSheet.create({
  root:{gap:14},chipRail:{flexDirection:'row',flexWrap:'wrap',gap:6},metricGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},metric:{flexGrow:1,flexBasis:138,minHeight:104,padding:12,borderWidth:1,borderColor:c.border,borderRadius:radii.lg,backgroundColor:c.surfaceFocused},metricTop:{flexDirection:'row',alignItems:'center',gap:7},metricLabel:{...uiTokens.typography.metadata,color:c.textMuted},metricValue:{...uiTokens.typography.display,fontSize:23,lineHeight:28,color:c.textPrimary,marginTop:8},meta:{...uiTokens.typography.metadata,color:c.textMuted},nowPanel:{gap:3},statusRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:9,borderTopWidth:1,borderTopColor:c.border,paddingVertical:8},statusIcon:{width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:c.panelAlt},cardCopy:{flex:1,minWidth:0},rowTitle:{...uiTokens.typography.body,fontWeight:'800',color:c.textPrimary},twoColumn:{flexDirection:'row',flexWrap:'wrap',gap:8},flexPanel:{flexGrow:1,flexBasis:240,gap:2},compactRow:{minHeight:52,justifyContent:'center',borderTopWidth:1,borderTopColor:c.border},emptyCopy:{...uiTokens.typography.body,color:c.textFaint,paddingVertical:16},actions:{flexDirection:'row',flexWrap:'wrap',gap:8},primary:{minHeight:50,flexGrow:1,flexBasis:190,paddingHorizontal:14,alignItems:'center',justifyContent:'center',backgroundColor:c.black,borderRadius:radii.md},primaryText:{...uiTokens.typography.action,color:'#fff'},secondary:{minHeight:50,flexGrow:1,flexBasis:150,paddingHorizontal:14,alignItems:'center',justifyContent:'center',backgroundColor:c.panel,borderWidth:1,borderColor:c.border,borderRadius:radii.md},secondaryText:{...uiTokens.typography.action,color:c.textSecondary},workspaceList:{borderWidth:1,borderColor:c.border,borderRadius:radii.lg,overflow:'hidden',backgroundColor:c.panel},workspaceRow:{minHeight:64,padding:10,flexDirection:'row',alignItems:'center',gap:8,borderBottomWidth:1,borderBottomColor:c.border},workspaceRowActive:{backgroundColor:c.cyanDim},
});
