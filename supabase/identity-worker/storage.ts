/** Real Storage HTTP transport. Credentials stay in the isolated server process.
 * Use separate, short-lived, role-scoped ingest and sealer tokens, never the
 * service-role key. Database-owner/Storage-admin compromise remains out of scope. */
export class PrivateEvidenceStorage {
  private readonly base: URL;
  private readonly apiKey:string;
  private readonly token:string;
  private readonly transport:typeof fetch;
  constructor(url: string, apiKey: string, token: string, transport: typeof fetch = fetch) {
    this.apiKey=apiKey;this.token=token;this.transport=transport;
    this.base = new URL(url);
    if (this.base.protocol !== 'https:' && !['127.0.0.1','localhost'].includes(this.base.hostname))
      throw new Error('STORAGE_HTTPS_REQUIRED');
    const claims = JSON.parse(atob((token.split('.')[1] ?? '').replace(/-/g,'+').replace(/_/g,'/')));
    if (!['garilink_evidence_ingest','garilink_evidence_sealer','garilink_evidence_reader'].includes(claims.role))
      throw new Error('SCOPED_STORAGE_IDENTITY_REQUIRED');
  }
  private url(bucket:string,path:string) {
    if (!['verification-private','verification-sealed'].includes(bucket) ||
        !/^[a-zA-Z0-9/-]+(?:\.png)?$/.test(path) || path.split('/').some(p=>!p || p==='.' || p==='..'))
      throw new Error('INVALID_STORAGE_BINDING');
    return new URL(`/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`,this.base);
  }
  async create(bucket:string,path:string,bytes:Uint8Array,signal:AbortSignal) {
    if (!bytes.length || bytes.length>5242880) throw new Error('EVIDENCE_SIZE_MISMATCH');
    const response=await this.transport(this.url(bucket,path),{method:'POST',redirect:'error',signal,
      headers:{apikey:this.apiKey,Authorization:`Bearer ${this.token}`,'Content-Type':'image/png','x-upsert':'false'},body:bytes});
    if (!response.ok) {await response.body?.cancel();throw new Error('STORAGE_CREATE_REJECTED');}
    await response.body?.cancel();
  }
  async read(bucket:string,path:string,signal:AbortSignal):Promise<Uint8Array> {
    const url=this.url(bucket,path);url.pathname=url.pathname.replace('/object/','/object/authenticated/');
    const response=await this.transport(url,{redirect:'error',signal,
      headers:{apikey:this.apiKey,Authorization:`Bearer ${this.token}`}});
    if(!response.ok || !response.body){
      // Preserve status + a bounded machine code, never provider messages,
      // object paths, document bytes, tokens or credentials.
      const detail=await response.json().catch(()=>null);
      const candidate=detail?.code??detail?.error;
      const safeCodes=new Set(['NoSuchKey','NoSuchBucket','AccessDenied','Unauthorized','InvalidJWT',
        'InvalidSignature','SignatureDoesNotMatch','InvalidKey','StorageBackendError','DatabaseError','42501',
        'InternalError','UnknownError']);
      const code=typeof candidate==='string' && safeCodes.has(candidate)?candidate:'UNSPECIFIED';
      const stage=bucket==='verification-sealed'?'sealed-read':'quarantine-read';
      throw new Error(`STORAGE_READ_REJECTED stage=${stage} status=${response.status} code=${code}`);
    }
    const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
    try {
      while(true){const next=await reader.read();if(next.done)break;
        size+=next.value.length;if(size>5242880)throw new Error('STORAGE_OBJECT_TOO_LARGE');chunks.push(next.value);}
    }catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;
  }
}
