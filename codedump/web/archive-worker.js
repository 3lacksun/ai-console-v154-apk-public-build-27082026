'use strict';
importScripts('./vendor/jszip.min.js', './core.js', './archive-core.js');

const cancelledJobs = new Set();

self.onmessage = async function(event) {
  const msg = event.data || {};
  if (msg.type === 'cancel') { cancelledJobs.add(msg.jobId); return; }
  const phase = msg.phase || msg.type;
  if (phase !== 'preflight' && phase !== 'extract') return;
  const jobId = msg.jobId;
  if (jobId == null || !msg.buffer) {
    self.postMessage({ type:'error', jobId:jobId == null ? null : jobId, operation:phase, error:{ code:'BAD_REQUEST', message:'Missing worker job data.' }, message:'Missing worker job data.' });
    return;
  }
  cancelledJobs.delete(jobId);
  const isCancelled = () => cancelledJobs.has(jobId);
  const progress = data => self.postMessage({ type:'progress', jobId, operation:phase, data });
  try {
    const policy = CodeDumpArchive.immutableSafetyPolicy(msg.policy || msg.settings || {});
    const fn = phase === 'preflight' ? CodeDumpArchive.preflightZip : CodeDumpArchive.extractZip;
    const result = await fn(msg.buffer, policy, JSZip, progress, isCancelled, msg.rootPrefix || '', msg.ledger || null);
    if (isCancelled()) throw new CodeDumpArchive.CancelledError();
    self.postMessage({ type:'result', jobId, operation:phase, phase, result, ledger:result.ledger });
  } catch (err) {
    const error = {
      code:err && err.code ? err.code : 'ARCHIVE_ERROR',
      message:err && err.message ? err.message : String(err),
      fatal:Boolean(err && err.fatal),
      details:err && err.details ? err.details : null
    };
    self.postMessage({ type:'error', jobId, operation:phase, phase, cancelled:err && err.name === 'CancelledError', error, message:error.message });
  } finally {
    cancelledJobs.delete(jobId);
  }
};
