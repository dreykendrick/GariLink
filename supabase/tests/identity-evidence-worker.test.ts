// Synthetic in-memory orchestration tests, NOT SQL/Auth/Storage certification.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processReservedIdentityEvidence, type ReservedEvidence, type StoredEvidence,
  type EvidenceDatabase, type EvidenceObjectStore} from '../functions/garilink-api/identity_evidence_worker.ts';
import type {MalwareScanner} from '../functions/garilink-api/identity_evidence_processor.ts';

const bytes = new Uint8Array([137,80,78,71,13,10,26,10,1]);
const input = {documentId:'synthetic-document',expectedRevision:2,requestId:'synthetic-request'};
function fixture() {
  const reservation:ReservedEvidence={documentId:input.documentId,caseId:'synthetic-case',subjectId:'synthetic-subject',
    objectPath:'opaque/object',version:1,caseRevision:2,policyVersion:1,expiresAt:new Date(Date.now()+60000).toISOString(),
    mimeType:'image/png',sizeBytes:bytes.length,maxSizeBytes:100};
  const object:StoredEvidence={bucket:'verification-private',objectPath:reservation.objectPath,
    objectVersion:'immutable-v1',ownerId:reservation.subjectId,bytes:bytes.slice()};
  const events:string[]=[];
  const database:EvidenceDatabase={transaction:async operation=>{
    try {const result=await operation({lockReservation:async()=>({...reservation}),finalize:async()=>{events.push('finalize');}});
      events.push('commit');return result;}catch(e){events.push('rollback');throw e;}
  }};
  const objects:EvidenceObjectStore={read:async()=>({...object,bytes:object.bytes.slice()})};
  const scanner:MalwareScanner={scan:async()=>({result:'CLEAN',provider:'synthetic-only',attestation:'synthetic-not-a-real-scan',
    scannedAt:new Date(Date.now()-100).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()})};
  return {reservation,object,events,database,objects,scanner,contentValidator:{validate:async()=>true}};
}
test('synthetic reserved bytes are checked then finalized in transaction',async()=>{
  const f=fixture();assert.deepEqual(await processReservedIdentityEvidence(input,f),{documentId:input.documentId,state:'FINALIZED'});
  assert.deepEqual(f.events,['finalize','commit']);
});
for(const field of ['bucket','objectPath','ownerId','objectVersion'] as const)
  test(`rejects wrong object binding: ${field}`,async()=>{
    const f=fixture();f.object[field]=field==='objectVersion'?'':'wrong';
    await assert.rejects(()=>processReservedIdentityEvidence(input,f),/OBJECT_BINDING_MISMATCH/);
    assert.deepEqual(f.events,['rollback']);
  });
test('changed bytes or immutable version cannot be finalized',async()=>{
  for(const kind of ['bytes','version']){
    const f=fixture();let reads=0;
    f.objects.read=async()=>{reads++;return {...f.object,objectVersion:reads===2&&kind==='version'?'v2':'immutable-v1',
      bytes:reads===2&&kind==='bytes'?new Uint8Array(bytes.length):bytes.slice()};};
    await assert.rejects(()=>processReservedIdentityEvidence(input,f),/OBJECT_CHANGED/);
    assert.deepEqual(f.events,['rollback']);
  }
});
test('missing scanner or parser fails closed before database access',async()=>{
  const f=fixture();
  await assert.rejects(()=>processReservedIdentityEvidence(input,{...f,scanner:undefined}),/SCANNER_UNAVAILABLE/);
  await assert.rejects(()=>processReservedIdentityEvidence(input,{...f,contentValidator:undefined}),/CONTENT_VALIDATOR_UNAVAILABLE/);
  assert.deepEqual(f.events,[]);
});
test('invalid content rolls back without finalization',async()=>{
  const f=fixture();f.contentValidator.validate=async()=>false;
  await assert.rejects(()=>processReservedIdentityEvidence(input,f),/EVIDENCE_CONTENT_REJECTED/);
  assert.deepEqual(f.events,['rollback']);
});
for(const result of ['UNSAFE','UNKNOWN','ERROR'] as const)
  test(`scanner ${result} cannot finalize`,async()=>{
    const f=fixture();const clean=f.scanner.scan;
    f.scanner.scan=async(b,s)=>({...await clean(b,s),result});
    await assert.rejects(()=>processReservedIdentityEvidence(input,f),/EVIDENCE_UNSAFE|SCANNER_NOT_CLEAN/);
    assert.deepEqual(f.events,['rollback']);
  });
test('scanner exception and stale result cannot finalize',async()=>{
  for(const kind of ['throw','stale']){
    const f=fixture();const clean=f.scanner.scan;
    f.scanner.scan=async(b,s)=>{if(kind==='throw')throw new Error('provider details must not escape');
      return {...await clean(b,s),expiresAt:new Date(0).toISOString()};};
    await assert.rejects(()=>processReservedIdentityEvidence(input,f),/SCANNER_ERROR|SCANNER_ATTESTATION_STALE/);
    assert.deepEqual(f.events,['rollback']);
  }
});
test('stale reservation and incorrect revisions fail before reading bytes',async()=>{
  for(const kind of ['expiry','revision']){
    const f=fixture();if(kind==='expiry')f.reservation.expiresAt=new Date(0).toISOString();else f.reservation.caseRevision=3;
    await assert.rejects(()=>processReservedIdentityEvidence(input,f),/RESERVATION_INVALID/);
    assert.deepEqual(f.events,['rollback']);
  }
});
test('oversized or mismatched bytes are rejected before content parsing',async()=>{
  const f=fixture();f.reservation.sizeBytes=1;
  f.contentValidator.validate=async()=>{throw new Error('parser must not run');};
  await assert.rejects(()=>processReservedIdentityEvidence(input,f),/EVIDENCE_SIZE_MISMATCH/);
  assert.deepEqual(f.events,['rollback']);
});
test('stalled object read times out and cannot later finalize',async()=>{
  const f=fixture();let release!:(o:StoredEvidence)=>void;
  f.objects.read=()=>new Promise(resolve=>{release=resolve;});
  await assert.rejects(()=>processReservedIdentityEvidence(input,f,10),/PROCESSING_TIMEOUT/);
  release(f.object);await new Promise(resolve=>setTimeout(resolve,5));
  assert.deepEqual(f.events,['rollback']);
});
