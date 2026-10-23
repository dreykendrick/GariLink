import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectIdentityEvidence,type MalwareScanner} from '../functions/garilink-api/identity_evidence_processor.ts';

const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3]);
const clean:MalwareScanner={scan:async()=>({result:'CLEAN',provider:'synthetic-disposable-test',
  attestation:'synthetic-attestation-only',scannedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()})};

test('validates actual signature, size, hash and clean scanner attestation',async()=>{
  const result=await inspectIdentityEvidence(png,{mimeType:'image/png',sizeBytes:png.length,maxSizeBytes:100},clean);
  assert.equal(result.actualMimeType,'image/png'); assert.equal(result.actualSha256.length,64);
});
for(const [name,scanner] of [['unavailable',undefined],['unsafe',{scan:async()=>({...await clean.scan(png,new AbortController().signal),result:'UNSAFE' as const})}],
  ['unknown',{scan:async()=>({...await clean.scan(png,new AbortController().signal),result:'UNKNOWN' as const})}] ] as const)
  test(`fails closed when scanner is ${name}`,async()=>assert.rejects(()=>inspectIdentityEvidence(png,{mimeType:'image/png',sizeBytes:png.length,maxSizeBytes:100},scanner)));
test('rejects MIME spoofing and size mismatch',async()=>{
  await assert.rejects(()=>inspectIdentityEvidence(png,{mimeType:'application/pdf',sizeBytes:png.length,maxSizeBytes:100},clean));
  await assert.rejects(()=>inspectIdentityEvidence(png,{mimeType:'image/png',sizeBytes:99,maxSizeBytes:100},clean));
});

test('deadline rejects even when a scanner ignores abort',async()=>{
  let signal:AbortSignal|undefined;
  const stalled:MalwareScanner={scan:async(_,s)=>{signal=s;return new Promise(()=>{});}};
  await assert.rejects(()=>inspectIdentityEvidence(png,{mimeType:'image/png',sizeBytes:png.length,maxSizeBytes:100},stalled,10),/SCANNER_TIMEOUT$/);
  assert.equal(signal?.aborted,true);
});

test('scanner mutation cannot change the attested digest or caller bytes',async()=>{
  const input=png.slice();
  const expected=await inspectIdentityEvidence(input,{mimeType:'image/png',sizeBytes:input.length,maxSizeBytes:100},clean);
  const mutating:MalwareScanner={scan:async(bytes,signal)=>{bytes.fill(0);return clean.scan(bytes,signal);}};
  const actual=await inspectIdentityEvidence(input,{mimeType:'image/png',sizeBytes:input.length,maxSizeBytes:100},mutating);
  assert.equal(actual.actualSha256,expected.actualSha256);
  assert.deepEqual(input,png);
});

test('invalid deadlines are rejected before invoking a scanner',async()=>{
  for(const timeout of [0,-1,NaN,Infinity,30001])
    await assert.rejects(()=>inspectIdentityEvidence(png,{mimeType:'image/png',sizeBytes:png.length,maxSizeBytes:100},clean,timeout),/SCANNER_TIMEOUT_INVALID/);
});
