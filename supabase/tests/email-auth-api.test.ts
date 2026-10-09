import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';
const config={supabaseUrl:'https://project.supabase.co',anonKey:'public',origins:[],authRedirectUrl:'ke.co.garilink.garilink_mobile://auth/auth/email-callback'};
const request=(path:string,body:unknown)=>new Request(`https://project.supabase.co/functions/v1/garilink-api${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('email signup sends only email/password and waits for confirmation',async()=>{
  const api=createApi(config,async(url,init)=>{
    assert.match(String(url),/signup\?redirect_to=/);
    assert.deepEqual(JSON.parse(init!.body as string),{email:'team@example.com',password:'StrongPass123'});
    return Response.json({user:{id:'pending'}});
  });
  const response=await api(request('/auth/register',{email:' TEAM@example.com ',password:'StrongPass123',phoneNumber:'+255700000001',role:'ADMIN'}));
  assert.equal(response.status,202);
  assert.deepEqual(await response.json(),{requiresVerification:true,verificationChannel:'EMAIL',email:'team@example.com'});
});
test('email signup rejects invalid email and weak password before Auth',async()=>{
 const api=createApi(config,async()=>{assert.fail('unexpected Auth call');});
 for(const body of [{email:'broken',password:'StrongPass123'},{email:'a@b.com',password:'weakpassword'},{email:'a@b.com',password:'Short1'}]) assert.equal((await api(request('/auth/register',body))).status,400);
});
test('email signup cannot run without approved callback configuration',async()=>{
 const api=createApi({...config,authRedirectUrl:undefined},async()=>{assert.fail('unexpected Auth call');});
 assert.equal((await api(request('/auth/register',{email:'a@b.com',password:'StrongPass123'}))).status,503);
 assert.throws(()=>createApi({...config,authRedirectUrl:'https://attacker.example'}));
});
test('existing email account receives generic pending response',async()=>{
 const api=createApi(config,async()=>Response.json({error_code:'user_already_exists'},{status:422}));
 assert.equal((await api(request('/auth/register',{email:'a@b.com',password:'StrongPass123'}))).status,202);
});
test('confirmation exchanges signup token only and uses real confirmed session',async()=>{
 const api=createApi(config,async(url,init)=>{
   if(String(url).includes('/auth/v1/verify')) {
     assert.deepEqual(JSON.parse(init!.body as string),{token_hash:'one-time',type:'signup'});
     return Response.json({access_token:'access',refresh_token:'refresh',user:{id:'user',email_confirmed_at:'2026-10-09'}});
   }
   assert.equal(new Headers(init!.headers).get('Authorization'),'Bearer access');
   return Response.json({id:'user',phoneNumber:null,isEmailVerified:true,roles:['CUSTOMER']});
 });
 const response=await api(request('/auth/email/confirm',{tokenHash:'one-time',type:'recovery'}));
 assert.equal(response.status,200); assert.equal((await response.json()).accessToken,'access');
});
test('unconfirmed identity cannot obtain normal authenticated session',async()=>{
 const api=createApi(config,async()=>Response.json({access_token:'a',refresh_token:'r',user:{id:'u'}}));
 assert.equal((await api(request('/auth/email/confirm',{tokenHash:'invalid'}))).status,403);
});
test('expired confirmation and recovery tokens are rejected without updating password',async()=>{
 const api=createApi(config,async(url)=>{
   assert.match(String(url),/verify/); return Response.json({error_code:'otp_expired'},{status:403});
 });
 assert.equal((await api(request('/auth/email/confirm',{tokenHash:'expired'}))).status,403);
 assert.equal((await api(request('/auth/email/reset',{tokenHash:'expired',newPassword:'StrongPass123'}))).status,403);
});
test('recovery uses recovery token, updates password, then invalidates sessions',async()=>{
 const calls:string[]=[];
 const api=createApi(config,async(url,init)=>{
   calls.push(String(url));
   if(String(url).endsWith('/verify')) {
     assert.equal(JSON.parse(init!.body as string).type,'recovery');return Response.json({access_token:'reset-session'});
   }
   assert.equal(new Headers(init!.headers).get('Authorization'),'Bearer reset-session');
   return new Response(null,{status:204});
 });
 assert.equal((await api(request('/auth/email/reset',{tokenHash:'recovery',newPassword:'StrongPass123'}))).status,200);
 assert.equal(calls.length,3); assert.match(calls[2],/scope=global/);
});
test('resend and recovery conceal unknown accounts but preserve provider rate limits',async()=>{
 for(const route of ['/auth/email/resend','/auth/email/recover']) {
   const unknown=createApi(config,async()=>Response.json({},{status:400}));
   assert.equal((await unknown(request(route,{email:'a@b.com'}))).status,200);
   const limited=createApi(config,async()=>Response.json({},{status:429}));
   assert.equal((await limited(request(route,{email:'a@b.com'}))).status,429);
 }
});
