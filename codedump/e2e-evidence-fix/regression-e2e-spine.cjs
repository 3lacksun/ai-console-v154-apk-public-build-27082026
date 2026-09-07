const assert=require('assert');
const path=require('path');
function repeatBlock(block, target){let out=''; let i=0; while(out.length<target){out+=`\n/* block ${i++} */\n`+block;} return out;}
const files=[];
files.push({path:'static/app.js',content:repeatBlock(`document.querySelector('.send-button').addEventListener('click', async () => { const r = await fetch('/api/chat',{method:'POST'}); localStorage.setItem('last', await r.text()); });\nasync function upload(){ await fetch('/api/workspace/upload/session',{method:'POST'}); }`,181000)});
files.push({path:'app.py',content:repeatBlock(`@app.route('/api/chat', methods=['POST'])\ndef chat():\n    data=request.json\n    create_generation(data)\n    return _provider_request(data)\n@app.route('/api/workspace/upload/session', methods=['POST'])\ndef workspace_upload_session_chunk():\n    return {'ok': True}`,260000)});
files.push({path:'v7_runtime.py',content:repeatBlock(`class Orchestrator:\n    def run(self,prompt):\n        return provider_request(prompt)\ndef provider_request(prompt):\n    # retry cancel stream provider orchestration\n    return stream(prompt)`,130000)});
files.push({path:'workspace_core.py',content:repeatBlock(`import sqlite3\ndef save_project(p):\n    db=sqlite3.connect('workspace.db')\n    db.execute('INSERT INTO projects(name) VALUES (?)',(p,))\n    db.commit()`,90000)});
files.push({path:'static/sw.js',content:repeatBlock(`self.addEventListener('fetch', event => { event.respondWith(caches.open('app').then(c=>c.match(event.request))); });\nself.addEventListener('sync', event => event.waitUntil(Promise.resolve()));`,26000)});
files.push({path:'static/styles.css',content:repeatBlock(`.send-button{display:block}.upload-progress{width:50%}.status-card.offline{opacity:.7}.project-card{padding:1rem}`,120000)});
for(let i=0;i<495;i++) files.push({path:`misc/module_${String(i).padStart(3,'0')}.txt`,content:`support record ${i}\n`+('x'.repeat(700+(i%13)))});
(async()=>{
  const mod=process.argv[2];
  const audit=require(path.resolve(mod));
  const res=await audit.generateFocusedAudit(files,'e2e',{projectName:'Synthetic E2E',targetContextTokens:128000,maxPackTokens:95000,reservedTokens:33000,includeDocs:true,includeTests:true,includeDependencyMetadata:true,includeBinaryMetadata:true,duplicateDetection:true,maxChunkTokens:16000,sourceSafetyMarginTokens:1800});
  const must=['static/app.js','app.py','v7_runtime.py','workspace_core.py','static/sw.js'];
  for(const p of must) assert(res.pack.includedPaths.includes(p),`critical end-to-end source omitted: ${p}`);
  assert.strictEqual((res.pack.missingCriticalSpinePaths||[]).length,0,'critical-spine evidence must reconcile');
  assert(res.pack.criticalSpinePaths && must.every(p=>res.pack.criticalSpinePaths.includes(p)),'critical-spine identification missed a required bridge/runtime file');
  assert(res.pack.text.includes('Critical-spine records missing: NONE'),'pack must disclose critical-spine completeness');
  assert(res.pack.includedPaths.length>=5,'focused evidence breadth regressed');
  assert(res.pack.estimatedTokens<=95000,'hard token limit exceeded');
  assert(res.validation.ok,`focused validation failed: ${res.validation.errors.join('; ')}`);
  console.log(JSON.stringify({version:audit.GENERATOR_VERSION,estimatedTokens:res.pack.estimatedTokens,included:res.pack.includedPaths,critical:res.pack.criticalSpinePaths||[],missing:res.pack.missingCriticalSpinePaths||[],validation:res.validation},null,2));
})();
