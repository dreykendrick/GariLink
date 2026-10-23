import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';
const config={supabaseUrl:'https://project.supabase.co',anonKey:'test-public',origins:[]};
const req=(path:string,body?:unknown,token='test-user')=>new Request(`https://project.supabase.co/functions/v1/garilink-api${path}`,{
  method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
});
test('identity preparation requires authenticated ordinary session',async()=>{
  const api=createApi(config,async()=>{throw new Error('No anonymous upstream call allowed')});
  assert.equal((await api(req('/verification/identity',undefined,''))).status,401);
});
test('identity case route rejects subject/workspace/approval claims',async()=>{
  const api=createApi(config,async url=>{
    assert.ok(String(url).endsWith('/auth/v1/user')); return Response.json({id:'actor'});
  });
  for(const field of ['subjectId','workspaceId','vehicleId','state','reviewerId']) {
    assert.equal((await api(req('/verification/identity/cases',{requestId:'request',policyVersion:1,[field]:'forged'}))).status,400);
  }
});
test('identity creation forwards only input and caller token, never service role',async()=>{
  const body={requestId:'71111111-1111-4111-8111-111111111111',policyVersion:1};
  const api=createApi(config,async(url,init)=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'actor'});
    assert.ok(String(url).endsWith('/rpc/garilink_identity_create_case'));
    assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer test-user');
    assert.deepEqual(JSON.parse(init?.body as string),{input_value:body});
    return Response.json({state:'DRAFT',eligible:false,collectionEnabled:false});
  });
  assert.equal((await api(req('/verification/identity/cases',body))).status,200);
});
