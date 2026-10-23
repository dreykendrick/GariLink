// Real parser execution + HTTP contract tests. NOT real Supabase certification.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {validateEvidencePng} from '../identity-worker/png.ts';
import {PrivateEvidenceStorage} from '../identity-worker/storage.ts';
import {createClamAvScanner} from '../identity-worker/clamav.ts';
import {createApi} from '../functions/garilink-api/handler.ts';

function chunk(kind:string,body:Uint8Array){
  const data=Buffer.concat([Buffer.from(kind),body]);let crc=0xffffffff;
  for(const v of data){crc^=v;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const length=Buffer.alloc(4);length.writeUInt32BE(body.length);const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([length,data,tail]);
}
const ihdr=Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0]);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),
  chunk('IDAT',deflateSync(Buffer.from([0,12,34,56]))),chunk('IEND',Buffer.alloc(0))]);
const scoped=(role:string)=>`header.${Buffer.from(JSON.stringify({role})).toString('base64url')}.synthetic-test`;
test('full PNG validator decodes actual generated image and rejects truncated/corrupt/polyglot bytes',()=>{
  assert.equal(validateEvidencePng(png),true);
  assert.equal(validateEvidencePng(png.subarray(0,png.length-1)),false);
  const corrupt=Buffer.from(png);corrupt[45]^=1;assert.equal(validateEvidencePng(corrupt),false);
  assert.equal(validateEvidencePng(Buffer.concat([png,Buffer.from('hidden payload')])),false);
  assert.equal(validateEvidencePng(new Uint8Array([137,80,78,71,13,10,26,10,1])),false);
});
test('private Storage adapter refuses service role and creates without upsert',async()=>{
  assert.throws(()=>new PrivateEvidenceStorage('https://project.supabase.co','public',scoped('service_role')),/SCOPED/);
  let calls=0;
  const store=new PrivateEvidenceStorage('https://project.supabase.co','public',scoped('garilink_evidence_sealer'),async(url,init)=>{
    calls++;assert.equal(new URL(String(url)).pathname,'/storage/v1/object/verification-sealed/document/1/digest.png');
    assert.equal(new Headers(init?.headers).get('x-upsert'),'false');assert.equal(init?.method,'POST');return Response.json({});
  });
  await store.create('verification-sealed','document/1/digest.png',png,new AbortController().signal);
  assert.equal(calls,1);
  await assert.rejects(()=>store.read('verification-sealed','../escape',new AbortController().signal),/INVALID_STORAGE/);
});
test('Storage failure diagnostics retain status/code without leaking provider details',async()=>{
  for(const fixture of [
    {bucket:'verification-sealed',stage:'sealed-read',status:404,detail:{code:'NoSuchKey',message:'private path and sensitive provider details'},code:'NoSuchKey'},
    {bucket:'verification-private',stage:'quarantine-read',status:403,detail:{error:'AccessDenied',message:'synthetic-secret-token'},code:'AccessDenied'},
    {bucket:'verification-sealed',stage:'sealed-read',status:401,detail:{code:'private/path/synthetic-secret-token',message:'applicant identity'},code:'UNSPECIFIED'},
    {bucket:'verification-sealed',stage:'sealed-read',status:500,detail:'sensitive non-JSON provider response',code:'UNSPECIFIED'},
    {bucket:'verification-sealed',stage:'sealed-read',status:500,detail:{code:'InternalError',message:'private backend details'},code:'InternalError'},
    {bucket:'verification-sealed',stage:'sealed-read',status:500,detail:{code:'UnknownError',message:'private database details'},code:'UnknownError'},
  ]){
    let calls=0;
    const store=new PrivateEvidenceStorage('https://project.supabase.co','public',scoped('garilink_evidence_sealer'),async()=>{
      calls++;return typeof fixture.detail==='string'?new Response(fixture.detail,{status:fixture.status}):Response.json(fixture.detail,{status:fixture.status});
    });
    await assert.rejects(()=>store.read(fixture.bucket,'document/1/digest.png',new AbortController().signal),
      error=>error instanceof Error && error.message===`STORAGE_READ_REJECTED stage=${fixture.stage} status=${fixture.status} code=${fixture.code}`);
    assert.equal(calls,1,'diagnostics must not retry Storage operations');
  }
});
test('ClamAV adapter rejects TCP configuration and missing daemon without CLEAN fallback',async()=>{
  assert.throws(()=>createClamAvScanner('127.0.0.1:3310',60000),/CONFIGURATION/);
  const scanner=createClamAvScanner(`/tmp/garilink-no-daemon-${crypto.randomUUID()}.sock`,60000);
  await assert.rejects(()=>scanner.scan(png,new AbortController().signal),/SCANNER_UNAVAILABLE/);
});
const config={supabaseUrl:'https://project.supabase.co',anonKey:'test-public',origins:[],identityEvidenceEnabled:true,
  identityReadToken:scoped('garilink_evidence_reader')};
const reviewerRequest=()=>new Request('https://project.supabase.co/functions/v1/garilink-api/verification/identity/reviewer/evidence',{
  method:'POST',headers:{Authorization:'Bearer ordinary-reviewer','Content-Type':'application/json'},
  body:JSON.stringify({caseId:'11111111-1111-4111-8111-111111111111',requestId:crypto.randomUUID()})});
const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',png))].map(v=>v.toString(16).padStart(2,'0')).join('');
for(const denial of ['revoked authority','wrong reviewer','cross-case','expired assignment'])
  test(`proxy denies ${denial} before accessing Storage`,async()=>{
    let reads=0;const api=createApi(config,async(url)=>{
      if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'reviewer'});
      if(String(url).includes('/rpc/garilink_identity_reviewer_sealed'))return Response.json({code:'42501'},{status:403});
      reads++;throw new Error('Must not read Storage');
    });
    assert.equal((await api(reviewerRequest())).status,403);assert.equal(reads,0);
  });
test('proxy serves verified bytes without signed URLs and rechecks authority',async()=>{
  let checks=0;const api=createApi(config,async(url)=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'reviewer'});
    if(String(url).includes('/rpc/garilink_identity_proxy_resolve'))return Response.json({objectPath:'document/1/digest.png'});
    if(String(url).includes('/rpc/garilink_identity_reviewer_sealed')){checks++;
      return Response.json({documentId:'document',objectPath:'document/1/digest.png',sha256:hash,mimeType:'image/png',sizeBytes:png.length});}
    return new Response(png);
  });
  const response=await api(reviewerRequest());assert.equal(response.status,200);assert.equal(checks,2);
  assert.match(response.headers.get('cache-control')??'',/no-store/);assert.equal(response.headers.get('location'),null);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(png));
});
test('proxy denies revocation during retrieval and changed bytes',async()=>{
  for(const scenario of ['revocation','digest']){
    let checks=0;const api=createApi(config,async(url)=>{
      if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'reviewer'});
      if(String(url).includes('/rpc/garilink_identity_proxy_resolve'))return Response.json({objectPath:'document/1/digest.png'});
      if(String(url).includes('/rpc/garilink_identity_reviewer_sealed')){checks++;
        if(scenario==='revocation' && checks>1)return Response.json({code:'42501'},{status:403});
        return Response.json({documentId:'document',objectPath:'document/1/digest.png',sha256:hash,mimeType:'image/png',sizeBytes:png.length});}
      return new Response(scenario==='digest'?Buffer.from('wrong'):png);
    });
    assert.equal((await api(reviewerRequest())).status,scenario==='digest'?503:403);
  }
});
const doc='11111111-1111-4111-8111-111111111111';
const uploadRequest=()=>new Request('https://project.supabase.co/functions/v1/garilink-api/verification/identity/evidence/upload',{
  method:'POST',headers:{Authorization:'Bearer applicant','Content-Type':'image/png',
    'x-evidence-document-id':doc,'x-evidence-revision':'1'},body:png});
test('server-mediated upload rechecks reservation without issuing Storage tokens',async()=>{
  let checks=0,writes=0;
  const api=createApi({...config,identityIngestToken:scoped('garilink_evidence_ingest')},async(url,init)=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'applicant'});
    if(String(url).includes('/rpc/garilink_identity_upload_authorize')){checks++;return Response.json({sizeBytes:png.length,objectPath:'opaque/object'});}
    assert.equal(new URL(String(url)).pathname,'/storage/v1/object/verification-private/opaque/object');
    assert.equal(new Headers(init?.headers).get('x-upsert'),'false');writes++;return Response.json({});
  });
  const response=await api(uploadRequest());assert.equal(response.status,201);assert.equal(checks,3);assert.equal(writes,1);
  assert.deepEqual(await response.json(),{documentId:doc,state:'UPLOADED',accepted:false});
});
test('expiry before upload or after body receipt denies Storage write',async()=>{
  for(const denyAt of [1,2]){
    let checks=0,writes=0;
    const api=createApi({...config,identityIngestToken:scoped('garilink_evidence_ingest')},async(url)=>{
      if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'applicant'});
      if(String(url).includes('/rpc/garilink_identity_upload_authorize')){checks++;
        return checks>=denyAt?Response.json({code:'42501'},{status:403}):Response.json({sizeBytes:png.length,objectPath:'opaque/object'});}
      writes++;throw new Error('Expired upload must not reach Storage');
    });
    assert.equal((await api(uploadRequest())).status,403);assert.equal(writes,0);
  }
});
test('reviewer range requests never bypass per-read authorization or expose a bearer URL',async()=>{
  const request=reviewerRequest();request.headers.set('range','bytes=0-3');
  const api=createApi(config,async url=>{assert.ok(String(url).endsWith('/auth/v1/user'));return Response.json({id:'reviewer'});});
  assert.equal((await api(request)).status,416);
});
