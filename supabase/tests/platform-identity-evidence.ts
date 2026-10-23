/** REAL disposable Supabase/ClamAV run, not part of unit glob. No hosted target,
 * no synthetic CLEAN provider. The entire runner's services are destroyed by
 * CI cleanup; immutable identity histories are never deleted to remove users. */
import {spawnSync} from 'node:child_process';
import {createHmac,randomBytes,randomUUID} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {createApi} from '../functions/garilink-api/handler.ts';
import {createEvidenceDatabase} from '../identity-worker/database.ts';
import {PrivateEvidenceStorage} from '../identity-worker/storage.ts';
import {createClamAvScanner} from '../identity-worker/clamav.ts';
import {inspectSealAndFinalize} from '../identity-worker/process.ts';

if(process.env.GITHUB_ACTIONS!=='true' || process.env.GARILINK_DISPOSABLE_IDENTITY!=='true')
  throw new Error('Explicit disposable GitHub runner required');
const status=spawnSync('npx',['--yes','supabase@2.114.0','status','-o','json'],{encoding:'utf8'});
if(status.status!==0)throw new Error('Disposable status failed');
const config=JSON.parse(status.stdout);
if(config.API_URL!=='http://127.0.0.1:54321' || !config.JWT_SECRET ||
  !String(config.DB_URL).startsWith('postgresql://postgres:postgres@127.0.0.1:54322/'))
  throw new Error('Exact disposable infrastructure required');
if(!process.env.GARILINK_CLAMD_SOCKET?.startsWith('/tmp/garilink-'))throw new Error('Private disposable scanner socket required');
const sql=postgres(config.DB_URL,{max:3,onnotice:()=>{}});
const password=randomBytes(32).toString('hex');
let worker:ReturnType<typeof createEvidenceDatabase>|undefined;
let assertions=0;
const pass=(value:unknown,label:string)=>{assert.ok(value,label);assertions++;};
function scoped(role:string){
  const now=Math.floor(Date.now()/1000);
  const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const message=`${encode({alg:'HS256',typ:'JWT'})}.${encode({role,iss:'supabase',sub:randomUUID(),iat:now,exp:now+600})}`;
  return `${message}.${createHmac('sha256',config.JWT_SECRET).update(message).digest('base64url')}`;
}
async function call(path:string,token:string,body?:unknown,admin=false){
  const response=await fetch(`${config.API_URL}${path}`,{method:body===undefined?'GET':'POST',redirect:'error',
    signal:AbortSignal.timeout(10000),headers:{apikey:admin?config.SERVICE_ROLE_KEY:config.ANON_KEY,
      Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!response.ok){await response.body?.cancel();throw new Error(`Disposable HTTP operation failed ${response.status}`);}
  return response.json();
}
async function identity(){
  const email=`identity-${randomUUID()}@example.invalid`,password=randomBytes(32).toString('hex');
  await call('/auth/v1/admin/users',config.SERVICE_ROLE_KEY,{email,password,email_confirm:true},true);
  const session=await call('/auth/v1/token?grant_type=password',config.ANON_KEY,{email,password});
  await call('/rest/v1/rpc/garilink_me',session.access_token,{});
  return {id:session.user.id,token:session.access_token};
}
function chunk(kind:string,body:Uint8Array){
  const value=Buffer.concat([Buffer.from(kind),body]);let crc=0xffffffff;
  for(const b of value){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const n=Buffer.alloc(4);n.writeUInt32BE(body.length);const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([n,value,tail]);
}
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0])),
  chunk('IDAT',deflateSync(Buffer.from([0,1,2,3]))),chunk('IEND',Buffer.alloc(0))]);
try{
  await sql.unsafe(`create role garilink_identity_processor login inherit password '${password}'`);
  await sql`grant garilink_evidence_worker to garilink_identity_processor`;
  const dsn=new URL(config.DB_URL);dsn.username='garilink_identity_processor';dsn.password=password;
  worker=createEvidenceDatabase(dsn.toString());
  const scanner=createClamAvScanner(process.env.GARILINK_CLAMD_SOCKET!,86400000);
  const safety=await scanner.scan(png,AbortSignal.timeout(10000));pass(safety.result==='CLEAN','Actual ClamAV clean PNG');
  const eicar=Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
  pass((await scanner.scan(eicar,AbortSignal.timeout(10000))).result==='UNSAFE','Actual ClamAV detects harmless EICAR test');
  const applicant=await identity(),reviewer=await identity();
  // Explicit disposable policy values only. No production policy activation.
  await sql`update garilink_private.identity_evidence_policies set approved=true,retention_seconds=7200,
    allowed_mime_types=array['image/png'] where policy_version=1`;
  await sql`update garilink_private.identity_collection_control set enabled=true where singleton`;
  const ingest=scoped('garilink_evidence_ingest'),sealer=scoped('garilink_evidence_sealer'),reader=scoped('garilink_evidence_reader');
  const api=createApi({supabaseUrl:config.API_URL,anonKey:config.ANON_KEY,origins:[],identityEvidenceEnabled:true,
    identityIngestToken:ingest,identityReadToken:reader});
  const apiRequest=(path:string,token:string,body:unknown)=>api(new Request(`${config.API_URL}/functions/v1/garilink-api${path}`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)}));
  // Independent HTTP calls reach separate database transactions/connections.
  const creates=await Promise.allSettled([1,2].map(()=>call('/rest/v1/rpc/garilink_identity_create_case',
    applicant.token,{input_value:{requestId:randomUUID(),policyVersion:1}})));
  const winner=creates.find(x=>x.status==='fulfilled');
  pass(creates.filter(x=>x.status==='fulfilled').length===1 && creates.some(x=>x.status==='rejected' &&
    x.reason instanceof Error && x.reason.message==='Disposable HTTP operation failed 409'),'Concurrent case creation serializes');
  if(!winner || winner.status!=='fulfilled')throw new Error('No controlled case');const c=winner.value;
  const reservationResponse=await apiRequest('/verification/identity/evidence/reserve',applicant.token,
    {caseId:c.caseId,expectedRevision:1,expectedPolicy:1,requestId:randomUUID(),mimeType:'image/png',sizeBytes:png.length});
  pass(reservationResponse.status===201,'Real reservation');const r=await reservationResponse.json();
  pass(!r.uploadUrl && !r.objectPath,'No Storage bearer upload capability leaked');
  const upload=(token:string)=>api(new Request(`${config.API_URL}/functions/v1/garilink-api/verification/identity/evidence/upload`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'image/png','x-evidence-document-id':r.documentId,'x-evidence-revision':'1'},body:png}));
  pass((await upload(reviewer.token)).status===403,'Cross-applicant upload denied');
  pass((await upload(applicant.token)).status===201,'Actual authenticated quarantine upload');
  const storage=new PrivateEvidenceStorage(config.API_URL,config.ANON_KEY,sealer);
  const operation={documentId:r.documentId,caseRevision:1,requestId:randomUUID()};
  const finalizations=await Promise.all([1,2].map(()=>inspectSealAndFinalize(operation,
    {database:worker!,storage,scanner},AbortSignal.timeout(20000))));
  const finalized=finalizations[0];
  pass(finalizations[1].sha256===finalized.sha256,'Concurrent exact finalization has one immutable outcome');
  pass(finalized.documentId===r.documentId,'Actual bytes decoded/scanned/sealed/finalized');
  const repeated=await inspectSealAndFinalize(operation,{database:worker,storage,scanner},AbortSignal.timeout(20000));
  pass(repeated.sha256===finalized.sha256,'Exact finalization replay');
  pass((await upload(applicant.token)).status===403,'Finalized upload reservation not reusable');
  const pending=await call('/rest/v1/rpc/garilink_identity_submit',applicant.token,
    {case_key:c.caseId,expected_revision:1,expected_policy:1,request_key:randomUUID()});
  pass(pending.state==='PENDING_REVIEW','Actual finalized evidence submitted');
  const authority=randomUUID();
  await sql`select garilink_private.identity_reviewer_authority(${reviewer.id}::uuid,${reviewer.id}::uuid,
    now()+interval '1 hour',false,${authority}::uuid)`;
  await sql`select garilink_private.identity_assign(${c.caseId}::uuid,${reviewer.id}::uuid,${reviewer.id}::uuid,now()+interval '30 minutes')`;
  const evidence=()=>apiRequest('/verification/identity/reviewer/evidence',reviewer.token,{caseId:c.caseId,requestId:randomUUID()});
  const delivered=await evidence();pass(delivered.status===200,'Authorized reviewer receives sealed bytes');
  pass(Buffer.from(await delivered.arrayBuffer()).equals(png),'Delivered exact scanned bytes');
  pass(!delivered.headers.has('location') && delivered.headers.get('cache-control')?.includes('no-store'),'No bearer redirect/cache');
  await sql`select garilink_private.identity_reviewer_authority(${reviewer.id}::uuid,${reviewer.id}::uuid,
    now()+interval '1 hour',true,${randomUUID()}::uuid)`;
  pass((await evidence()).status===403,'New read denied after real authority revocation');
  await sql`select garilink_private.identity_reviewer_authority(${reviewer.id}::uuid,${reviewer.id}::uuid,
    now()+interval '1 hour',false,${randomUUID()}::uuid)`;
  const decisions=await Promise.allSettled(['APPROVED','REJECTED'].map(result=>call('/rest/v1/rpc/garilink_identity_decide',
    reviewer.token,{case_key:c.caseId,expected_revision:2,expected_policy:1,request_key:randomUUID(),
      decision_result:result,decision_reason:result==='APPROVED'?'EVIDENCE_ACCEPTED':'EVIDENCE_MISMATCH',
      approval_until:result==='APPROVED'?new Date(Date.now()+600000).toISOString():null})));
  pass(decisions.filter(x=>x.status==='fulfilled').length===1 && decisions.some(x=>x.status==='rejected' &&
    x.reason instanceof Error && x.reason.message==='Disposable HTTP operation failed 409'),'Conflicting decisions serialize');
  const summary=await call('/rest/v1/rpc/garilink_identity_status',applicant.token,{});
  pass(['APPROVED','REJECTED'].includes(summary.state) && summary.eligible===false,'Applicant sees authoritative decision with enforcement inactive');
  console.log(`PASS real disposable identity evidence: ${assertions} assertions; normal Auth, Storage, ClamAV, SQL and proxy`);
}finally{
  // History/FKs deliberately retained until CI destroys the disposable stack.
  await sql`update garilink_private.identity_collection_control set enabled=false where singleton`.catch(()=>{});
  await worker?.close();await sql.end({timeout:5});
}
