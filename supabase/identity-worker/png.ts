import {inflateSync} from 'node:zlib';
import type {EvidenceContentValidator} from '../functions/garilink-api/identity_evidence_worker.ts';

// Deliberately narrow test-format policy: PNG RGB/RGBA, 8-bit, non-interlaced,
// IHDR/contiguous IDAT/IEND only. Other valid formats/features fail closed.
export function validateEvidencePng(bytes:Uint8Array):boolean {
  try {
    if(bytes.length>5242880 || bytes.length<57 ||
      ![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return false;
    const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    let offset=8,width=0,height=0,channels=0,idat=false,ended=false;
    const compressed:Uint8Array[]=[];
    while(offset+12<=bytes.length){
      const length=data.getUint32(offset);if(length>5242880 || offset+12+length>bytes.length)return false;
      const start=offset+4,end=start+4+length;
      let crc=0xffffffff;
      for(let i=start;i<end;i++){crc^=bytes[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
      if(((crc^0xffffffff)>>>0)!==data.getUint32(end))return false;
      const kind=String.fromCharCode(...bytes.subarray(start,start+4));
      if(offset===8 && kind!=='IHDR')return false;
      if(kind==='IHDR'){
        if(offset!==8 || length!==13)return false;
        width=data.getUint32(start+4);height=data.getUint32(start+8);
        const depth=bytes[start+12],color=bytes[start+13];channels=color===2?3:color===6?4:0;
        if(!width||!height||width>4096||height>4096||width*height>4000000||depth!==8||!channels||
          bytes[start+14]!==0||bytes[start+15]!==0||bytes[start+16]!==0)return false;
      }else if(kind==='IDAT'){idat=true;compressed.push(bytes.subarray(start+4,end));}
      else if(kind==='IEND'){
        if(length!==0||!idat||end+4!==bytes.length)return false;ended=true;break;
      }else return false;
      offset=end+4;
    }
    if(!ended)return false;
    const expected=(width*channels+1)*height;
    const result=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected,info:true});
    if(result.buffer.length!==expected || result.engine.bytesWritten!==compressed.reduce((n,c)=>n+c.length,0))return false;
    for(let row=0;row<height;row++)if(result.buffer[row*(width*channels+1)]>4)return false;
    return true;
  }catch{return false;}
}
export const pngContentValidator:EvidenceContentValidator={validate:async(bytes,mime,signal)=>
  !signal.aborted && mime==='image/png' && validateEvidencePng(bytes)};
