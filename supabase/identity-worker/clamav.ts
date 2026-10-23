import {connect} from 'node:net';
import {createHash} from 'node:crypto';
import type {MalwareScanner} from '../functions/garilink-api/identity_evidence_processor.ts';

/** Unix socket only: ClamD TCP is not authenticated/encrypted. Deploy beside
 * clamd with freshclam, protected socket ownership and process resource limits.
 * No fake CLEAN fallback. This adapter does not install or start a daemon. */
export function createClamAvScanner(socketPath:string,maxSignatureAgeMs:number):MalwareScanner {
  if(!socketPath.startsWith('/') || !Number.isFinite(maxSignatureAgeMs) || maxSignatureAgeMs<=0 || maxSignatureAgeMs>172800000)
    throw new Error('SCANNER_CONFIGURATION_INVALID');
  function command(name:string,bytes:Uint8Array|undefined,signal:AbortSignal):Promise<string>{
    return new Promise((resolve,reject)=>{
      const socket=connect({path:socketPath});let reply='';let settled=false;
      const finish=(error?:Error)=>{if(settled)return;settled=true;signal.removeEventListener('abort',abort);
        socket.destroy();error?reject(error):resolve(reply.slice(0,reply.indexOf('\0')));};
      const abort=()=>finish(new Error('SCANNER_CANCELLED'));
      signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
      socket.setTimeout(8000,()=>finish(new Error('SCANNER_TIMEOUT')));
      socket.once('error',()=>finish(new Error('SCANNER_UNAVAILABLE')));
      socket.once('end',()=>{if(!reply.includes('\0'))finish(new Error('SCANNER_PROTOCOL_ERROR'));});
      socket.on('data',chunk=>{reply+=chunk.toString('utf8');if(reply.length>4096)finish(new Error('SCANNER_PROTOCOL_ERROR'));
        else if(reply.includes('\0'))finish();});
      socket.once('connect',()=>{
        socket.write(`z${name}\0`);
        if(bytes){for(let start=0;start<bytes.length;start+=65536){const chunk=bytes.subarray(start,start+65536);
          const length=Buffer.alloc(4);length.writeUInt32BE(chunk.length);socket.write(length);socket.write(chunk);}
          socket.write(Buffer.alloc(4));}
      });
    });
  }
  return {scan:async(bytes,signal)=>{
    if(!bytes.length||bytes.length>5242880)throw new Error('SCANNER_SIZE_INVALID');
    const version=await command('VERSION',undefined,signal);
    const parts=version.split('/');const databaseDate=Date.parse(parts.slice(2).join('/'));
    if(!version.startsWith('ClamAV ')||!Number.isFinite(databaseDate)||databaseDate>Date.now()||Date.now()-databaseDate>maxSignatureAgeMs)
      throw new Error('SCANNER_DATABASE_STALE');
    const answer=await command('INSTREAM',bytes,signal);
    const result=answer==='stream: OK'?'CLEAN':answer.endsWith(' FOUND')?'UNSAFE':'ERROR';
    const now=Date.now();
    return {result,provider:'ClamAV',attestation:`sha256:${createHash('sha256').update(bytes).digest('hex')};engine:${version}`,
      scannedAt:new Date(now).toISOString(),expiresAt:new Date(now+60000).toISOString()};
  }};
}
