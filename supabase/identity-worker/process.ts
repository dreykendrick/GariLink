import {createHash} from 'node:crypto';
import {inspectIdentityEvidence,type MalwareScanner} from '../functions/garilink-api/identity_evidence_processor.ts';
import {pngContentValidator} from './png.ts';
import type {createEvidenceDatabase} from './database.ts';
import type {PrivateEvidenceStorage} from './storage.ts';

type Database=ReturnType<typeof createEvidenceDatabase>;
const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

/** Two-phase processing: no database locks during download/decode/scan/seal.
 * SQL rechecks policy/case/version under short locks before atomic finalization. */
export async function inspectSealAndFinalize(input:{documentId:string;caseRevision:number;requestId:string},
  deps:{database:Database;storage:PrivateEvidenceStorage;scanner?:MalwareScanner},signal:AbortSignal){
  if(!deps.scanner)throw new Error('SCANNER_UNAVAILABLE');
  const prior=await deps.database.outcome(input.requestId,input.documentId);
  if(prior){if(prior.caseRevision!==input.caseRevision)throw new Error('FINALIZATION_CONFLICT');return prior;}
  const r=await deps.database.snapshot(input.documentId);
  if(r.caseRevision!==input.caseRevision)throw new Error('CASE_REVISION_CHANGED');
  const bytes=await deps.storage.read('verification-private',r.objectPath,signal);
  if(bytes.length!==r.sizeBytes || bytes.length>r.maxSizeBytes)throw new Error('EVIDENCE_SIZE_MISMATCH');
  if(!await pngContentValidator.validate(bytes,r.mimeType,signal))throw new Error('EVIDENCE_CONTENT_REJECTED');
  const inspection=await inspectIdentityEvidence(bytes,r,deps.scanner);
  if(signal.aborted)throw new Error('PROCESSING_CANCELLED');
  const path=`${r.documentId}/${r.version}/${inspection.actualSha256}.png`;
  try{await deps.storage.create('verification-sealed',path,bytes,signal);}
  catch{
    // Retry/uncertain upload: never overwrite. Only the exact digest may proceed.
    const existing=await deps.storage.read('verification-sealed',path,signal);
    if(digest(existing)!==inspection.actualSha256)throw new Error('SEALED_OBJECT_CONFLICT');
  }
  const sealed=await deps.storage.read('verification-sealed',path,signal);
  if(digest(sealed)!==inspection.actualSha256)throw new Error('SEALED_DIGEST_MISMATCH');
  if(signal.aborted)throw new Error('PROCESSING_CANCELLED');
  const payload={...inspection,documentId:r.documentId,caseRevision:r.caseRevision,policyVersion:r.policyVersion,
    version:r.version,requestId:input.requestId};
  try{await deps.database.finalize(payload);}
  catch{
    // Connection loss may occur after COMMIT. Query the immutable outcome rather
    // than reporting success or blindly generating another operation identity.
    const outcome=await deps.database.outcome(input.requestId,input.documentId).catch(()=>null);
    if(!outcome || outcome.caseRevision!==r.caseRevision || outcome.sha256!==inspection.actualSha256)
      throw new Error('FINALIZATION_UNCERTAIN_RETRY_SAME_REQUEST');
  }
  return {documentId:r.documentId,caseRevision:r.caseRevision,sha256:inspection.actualSha256};
}
