const fs=require('fs');
const path=require('path');
const target=path.resolve(process.argv[2]||'web/audit-pack.js');
let s=fs.readFileSync(target,'utf8');
function once(oldText,newText,label){
  const i=s.indexOf(oldText);
  if(i<0) throw new Error(`E2E fix anchor not found: ${label}`);
  if(s.indexOf(oldText,i+1)>=0) throw new Error(`E2E fix anchor not unique: ${label}`);
  s=s.slice(0,i)+newText+s.slice(i+oldText.length);
}
once("const GENERATOR_VERSION = '1.1.0';","const GENERATOR_VERSION = '1.1.1';",'generator version');
once(
`  function focusedCandidateSegments(records, spec, relevant) {
    const relevantSet=new Set(relevant.map(r=>r.path));
    const primary=new Set(spec.primaryPhases||[]);
    const out=[];
`,
`  function focusedE2ECriticalScore(record) {
    const p=String(record.path||'').toLowerCase();
    let score=0;
    if(/(?:^|\\/)(?:app|main|index|client|frontend)\\.(?:js|ts|jsx|tsx|py|php|rb|go|java|kt|swift)$/u.test(p)) score=100;
    if(/(?:service[-_.]?worker|(?:^|\\/)sw\\.(?:js|ts)$)/u.test(p)) score=Math.max(score,98);
    if(/(?:runtime|orchestrat|workspace[_-]?core|app[_-]?core|(?:^|\\/)core\\.(?:js|ts|py|php))/u.test(p)) score=Math.max(score,94);
    if(/(?:router|routes|controller|provider|repository|database|storage|state|store)/u.test(p)) score=Math.max(score,86);
    score+=Math.min(8,((record.dependencies||[]).length+(record.referencedBy||[]).length)*.35);
    score+=Math.min(5,(record.routes||[]).length*.5);
    return score;
  }

  function focusedCandidateSegments(records, spec, relevant, options) {
    const relevantSet=new Set(relevant.map(r=>r.path));
    const primary=new Set(spec.primaryPhases||[]);
    const criticalPaths=spec.id==='e2e'?new Set(relevant.filter(r=>!r.binary && r.contentAvailable && !r.excludedReason && !r.duplicateOf && focusedE2ECriticalScore(r)>0).sort((a,b)=>focusedE2ECriticalScore(b)-focusedE2ECriticalScore(a)||a.path.localeCompare(b.path)).slice(0,10).map(r=>r.path)):new Set();
    const out=[];
`,'candidate prelude');
once(
`      let priority=4;
      if(record.explicitlyIncluded || record.sharedCore || CONFIG_PATH_RE.test(record.path) || ENTRY_PATH_RE.test(record.path) || primary.has(record.classification.primaryPhase)) priority=1;
      else if(record.classification.secondaryPhases.some(id=>primary.has(id)) || TEST_PATH_RE.test(record.path) || record.dependencies.length || record.referencedBy.length) priority=2;
      else if(roleForRecord(record)==='UI' || /(?:utils?|helpers?|styles?|theme)/iu.test(record.path)) priority=3;
      const chunks=record.chunks.length?record.chunks:[{index:1,total:1,startLine:1,endLine:1,text:record.content,estimatedTokens:estimateTokens(record.content),semantic:true}];
      const ranked=chunks.map(chunk=>({record,chunk,priority,score:score + Math.min(4,estimateTokens(chunk.text)/4000)}))
        .sort((a,b)=>b.score-a.score || a.chunk.index-b.chunk.index);
      const keepCount=priority===1?ranked.length:Math.max(1,Math.ceil(ranked.length*.65));
      out.push(...ranked.slice(0,keepCount));
    }
    return out.sort((a,b)=>a.priority-b.priority || b.score-a.score || a.record.path.localeCompare(b.record.path) || a.chunk.index-b.chunk.index);
`,
`      let priority=4;
      if(criticalPaths.has(record.path)) priority=0;
      else if(record.explicitlyIncluded || record.sharedCore || CONFIG_PATH_RE.test(record.path) || ENTRY_PATH_RE.test(record.path) || primary.has(record.classification.primaryPhase)) priority=1;
      else if(record.classification.secondaryPhases.some(id=>primary.has(id)) || TEST_PATH_RE.test(record.path) || record.dependencies.length || record.referencedBy.length) priority=2;
      else if(roleForRecord(record)==='UI' || /(?:utils?|helpers?|styles?|theme)/iu.test(record.path)) priority=3;
      const chunkCap=spec.id==='e2e'?5500:Math.min(Number(options&&options.maxChunkTokens)||16000,10000);
      const chunks=makeChunks(record,chunkCap);
      const ranked=chunks.map(chunk=>({record,chunk,priority,critical:criticalPaths.has(record.path),score:score + Math.min(4,estimateTokens(chunk.text)/4000)}))
        .sort((a,b)=>b.score-a.score || a.chunk.index-b.chunk.index);
      const keepCount=priority<=1?ranked.length:Math.max(1,Math.ceil(ranked.length*.55));
      ranked.slice(0,keepCount).forEach((entry,round)=>out.push({...entry,round}));
    }
    return out.sort((a,b)=>a.priority-b.priority || a.round-b.round || b.score-a.score || a.record.path.localeCompare(b.record.path) || a.chunk.index-b.chunk.index);
`,'candidate allocation');
once('const candidates=focusedCandidateSegments(records,spec,relevant);','const candidates=focusedCandidateSegments(records,spec,relevant,options);','candidate options');
const swaps=[
  [".slice(0,220)",".slice(0,160)",'binary cap'],
  ["quota(.08),'project-wide file-tree'","quota(.03),'project-wide file-tree'",'project tree'],
  ["quota(.06),'focused file-tree'","quota(.02),'focused file-tree'",'focused tree'],
  ["quota(.11),'feature/workflow map'","quota(.05),'feature/workflow map'",'feature map'],
  ["quota(.09),'dependency-map'","quota(.04),'dependency-map'",'dependency map'],
  ["quota(.08),'route/data/symbol evidence'","quota(.03),'route/data/symbol evidence'",'signal map'],
  ["quota(.11),'project-wide inventory'","quota(.05),'project-wide inventory'",'project inventory'],
  ["quota(.08),'focused inventory'","quota(.03),'focused inventory'",'focused inventory'],
  ["quota(.04),'binary metadata'","quota(.01),'binary metadata'",'binary metadata'],
  ["quota(.03),'error-ledger'","quota(.01),'error-ledger'",'error ledger'],
  ["const metadataReserve=Math.max(600,Math.floor(options.maxPackTokens*.18));","const metadataReserve=Math.max(400,Math.floor(options.maxPackTokens*.025));",'metadata reserve'],
  ["quota(.11),'omission-ledger'","quota(.05),'omission-ledger'",'omission ledger']
];
for(const [a,b,l] of swaps) { if(!s.includes(a)) throw new Error(`E2E fix anchor not found: ${l}`); s=s.split(a).join(b); }
once(
`Relevant records not represented as source: \${Math.max(0,relevant.length-includedPaths.size)}
Complete inventory included: YES`,
`Relevant records not represented as source: \${Math.max(0,relevant.length-includedPaths.size)}
Critical-spine policy: E2E conventional client/API/runtime/core bridge files are source-priority evidence and must not be omitted when eligible.
Complete inventory included: YES`,'manifest policy');
once(
`    return {auditType:spec.id,filename:spec.filename,name:spec.name,text,estimatedTokens:estimateTokens(text),includedPaths:[...includedPaths].sort(),relevantPaths:relevant.map(r=>r.path),sourceSectionCount:sourceSections.length};
`,
`    const criticalPaths=spec.id==='e2e'?relevant.filter(r=>!r.binary && r.contentAvailable && !r.excludedReason && !r.duplicateOf && focusedE2ECriticalScore(r)>0).sort((a,b)=>focusedE2ECriticalScore(b)-focusedE2ECriticalScore(a)||a.path.localeCompare(b.path)).slice(0,10).map(r=>r.path):[];
    const missingCriticalPaths=criticalPaths.filter(p=>!includedPaths.has(p));
    text += \`\\n\\nCRITICAL-SPINE EVIDENCE RECONCILIATION\\nCritical-spine records identified: \${criticalPaths.length}\\nCritical-spine records missing: \${missingCriticalPaths.length?missingCriticalPaths.join(', '):'NONE'}\`;
    return {auditType:spec.id,filename:spec.filename,name:spec.name,text,estimatedTokens:estimateTokens(text),includedPaths:[...includedPaths].sort(),relevantPaths:relevant.map(r=>r.path),sourceSectionCount:sourceSections.length,criticalSpinePaths:criticalPaths,missingCriticalSpinePaths:missingCriticalPaths};
`,'critical reconciliation');
once(
`    if(spec.id==='e2e' && !pack.text.includes('NO FEATURE MAY BE MARKED PASS MERELY BECAUSE IMPLEMENTATION CODE EXISTS.')) errors.push('End-to-end audit lacks the mandatory no-code-presence-pass rule.');
`,
`    if(spec.id==='e2e' && !pack.text.includes('NO FEATURE MAY BE MARKED PASS MERELY BECAUSE IMPLEMENTATION CODE EXISTS.')) errors.push('End-to-end audit lacks the mandatory no-code-presence-pass rule.');
    if(spec.id==='e2e' && pack.missingCriticalSpinePaths && pack.missingCriticalSpinePaths.length) errors.push(\`End-to-end audit omitted critical workflow-spine source: \${pack.missingCriticalSpinePaths.join(', ')}\`);
`,'critical validation');
once(
`      relevantPaths:pack.relevantPaths,
      settings:{targetContextTokens`,
`      relevantPaths:pack.relevantPaths,
      criticalSpinePaths:pack.criticalSpinePaths||[],
      missingCriticalSpinePaths:pack.missingCriticalSpinePaths||[],
      settings:{targetContextTokens`,'manifest critical paths');
fs.writeFileSync(target,s);
