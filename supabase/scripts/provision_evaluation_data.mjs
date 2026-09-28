import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const evaluationVehicles = [
  { key:'prado', requestId:'11000000-0000-4000-8000-000000000001', type:'FOR_SALE', title:'2021 Toyota Land Cruiser Prado TX-L', county:'Dar es Salaam', price:168000000,
    vehicle:{make:'Toyota',model:'Land Cruiser Prado TX-L',year:2021,mileage:48000,type:'CAR',fuelType:'DIESEL',transmission:'AUTOMATIC',condition:'FOREIGN_USED'},
    description:'Well-presented seven-seat SUV with a refined cabin, strong road presence and practical long-distance comfort.', files:['prado-front.jpeg','prado-rear.png'] },
  { key:'palisade', requestId:'11000000-0000-4000-8000-000000000002', type:'FOR_HIRE', title:'2022 Hyundai Palisade Signature', county:'Dar es Salaam', price:420000,
    vehicle:{make:'Hyundai',model:'Palisade Signature',year:2022,mileage:36000,type:'CAR',fuelType:'DIESEL',transmission:'AUTOMATIC',condition:'FOREIGN_USED'},
    description:'Spacious premium SUV for family travel, airport transfers and executive journeys. Daily rate excludes fuel and driver.', files:['palisade-front.jpeg','palisade-rear.png'] },
  { key:'mercedes', requestId:'11000000-0000-4000-8000-000000000003', type:'FOR_HIRE', title:'2020 Mercedes-Benz E-Class', county:'Arusha', price:350000,
    vehicle:{make:'Mercedes-Benz',model:'E-Class',year:2020,mileage:52000,type:'CAR',fuelType:'PETROL',transmission:'AUTOMATIC',condition:'FOREIGN_USED'},
    description:'Comfortable performance sedan suited to executive transport and special occasions. Rental requests remain subject to owner approval.', files:['mercedes-front.jpeg','mercedes-rear.png'] },
  { key:'howo', requestId:'11000000-0000-4000-8000-000000000004', type:'FOR_SALE', title:'2021 HOWO 380 6x4 Tipper Truck', county:'Dodoma', price:142000000,
    vehicle:{make:'HOWO',model:'380 6x4 Tipper',year:2021,mileage:76000,type:'TRUCK',fuelType:'DIESEL',transmission:'MANUAL',condition:'LOCAL_USED'},
    description:'Heavy-duty 6x4 tipper configured for construction and aggregate work. Inspection is recommended before purchase.', files:['howo-front.jpeg'] },
  { key:'shacman', requestId:'11000000-0000-4000-8000-000000000005', type:'FOR_SALE', title:'2020 Shacman F3000 8x4 Tipper', county:'Mwanza', price:128000000,
    vehicle:{make:'Shacman',model:'F3000 8x4 Tipper',year:2020,mileage:91000,type:'TRUCK',fuelType:'DIESEL',transmission:'MANUAL',condition:'LOCAL_USED'},
    description:'Commercial tipper for demanding haulage operations, presented as controlled GariLink evaluation inventory.', files:['shacman-front.jpeg'] },
];

const required = (env, name) => { const value=env[name]?.trim(); if(!value) throw new Error(`Missing required environment variable: ${name}`); return value; };
const request = async (fetchImpl, url, options={}, operation='hosted operation') => {
  const response=await fetchImpl(url,options); const text=await response.text(); let body=null;
  try { body=text ? JSON.parse(text) : null; } catch { /* sanitized below */ }
  if(!response.ok) {
    const message=typeof body?.message==='string' && body.message.length<=200
      ? ` ${body.message}` : '';
    throw new Error(`${operation} failed (HTTP ${response.status}).${message}`);
  }
  return body;
};
const dimensions = (bytes) => {
  if(bytes[0]===0x89 && bytes.toString('ascii',1,4)==='PNG') return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),mimeType:'image/png'};
  if(bytes[0]===0xff && bytes[1]===0xd8) { let i=2; while(i<bytes.length-9) { if(bytes[i]!==0xff){i++;continue;} const marker=bytes[i+1],length=bytes.readUInt16BE(i+2); if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return {height:bytes.readUInt16BE(i+5),width:bytes.readUInt16BE(i+7),mimeType:'image/jpeg'}; i+=2+length; } }
  throw new Error('Evaluation media must be a valid JPEG or PNG.');
};

const jwtClaims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
const storagePreflight = async (fetchImpl, root, serviceKey, token, reservation) => {
  const response=await fetchImpl(`${root}/rest/v1/gl_vehicle_media?id=eq.${encodeURIComponent(reservation.id)}&select=created_by,storage_path,status`,{
    headers:{Authorization:`Bearer ${serviceKey}`,apikey:serviceKey},
  });
  if(!response.ok) return 'metadataUnavailable';
  const row=(await response.json())[0], claims=jwtClaims(token);
  if(!row) return 'reservationMissing';
  const encoded=row.storage_path.split('/').map(encodeURIComponent).join('/');
  return `role=${claims.role};actorMatch=${row.created_by===claims.sub};pathMatch=${reservation.uploadUrl.endsWith(`/vehicle-media/${encoded}`)};status=${row.status}`;
};
const uploadedObjectPreflight = async (fetchImpl, root, serviceKey, reservation, expected) => {
  // The reservation's upload URL is authoritative and avoids requiring direct
  // table grants merely to inspect the uploaded Storage object.
  const marker='/storage/v1/object/vehicle-media/';
  const encodedPath=new URL(reservation.uploadUrl).pathname.split(marker)[1];
  if(!encodedPath) return 'reservationPathUnavailable';
  const parts=encodedPath.split('/').map(decodeURIComponent), name=parts.pop(), prefix=parts.join('/');
  const listResponse=await fetchImpl(`${root}/storage/v1/object/list/vehicle-media`,{
    method:'POST',headers:{Authorization:`Bearer ${serviceKey}`,apikey:serviceKey,'Content-Type':'application/json'},
    body:JSON.stringify({prefix,search:name,limit:10}),
  });
  const object=listResponse.ok ? (await listResponse.json()).find((item)=>item.name===name) : null;
  if(!object) return 'uploadedObjectMetadataUnavailable';
  const size=Number(object.metadata?.size), mime=object.metadata?.mimetype??object.metadata?.contentType;
  return `sizeMatch=${size===expected.bytes};mimeMatch=${mime===expected.mimeType};recordedMime=${mime??'missing'}`;
};
const finalizationPreflight = async (fetchImpl, root, anonKey, token, reservation, expected) => {
  const response=await fetchImpl(`${root}/rest/v1/rpc/garilink_finalize_vehicle_media`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,apikey:anonKey,'Content-Type':'application/json'},
    body:JSON.stringify({media_id:reservation.id,byte_size:expected.bytes,width:expected.width,height:expected.height}),
  });
  if(response.ok) return 'directRpcSucceeded';
  const body=await response.json().catch(()=>({}));
  const code=typeof body.code==='string' && /^[A-Z0-9]{5}$/.test(body.code) ? body.code : 'unknown';
  const known={PT404:'mediaMissing',PT409:'uploadIncomplete','22023':'uploadValidationFailed','42702':'ambiguousDatabaseReference','42883':'functionSignatureMismatch'};
  return `databaseCode=${code};diagnosis=${known[code]??'unclassifiedDatabaseFailure'}`;
};
const rpcFailurePreflight = async (fetchImpl, root, anonKey, token, rpc) => {
  const response=await fetchImpl(`${root}/rest/v1/rpc/${rpc}`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,apikey:anonKey,'Content-Type':'application/json'},body:'{}',
  });
  if(response.ok) return 'directRpcSucceeded';
  const body=await response.json().catch(()=>({}));
  const code=typeof body.code==='string' && /^[A-Z0-9]{5}$/.test(body.code) ? body.code : 'unknown';
  const known={'42702':'ambiguousDatabaseReference','42883':'functionSignatureMismatch','42501':'permissionDenied','22023':'invalidDatabaseInput'};
  return `databaseCode=${code};diagnosis=${known[code]??'unclassifiedDatabaseFailure'}`;
};

export async function provisionEvaluationData({env=process.env,fetchImpl=fetch,mediaDirectory=join(process.cwd(),'evaluation-media')}={}) {
  if(env.GARILINK_EVALUATION_CONFIRM !== 'CREATE_CONTROLLED_TEST_USERS') throw new Error('Refusing evaluation data provisioning without explicit confirmation.');
  const root=required(env,'SUPABASE_URL').replace(/\/$/,''), api=`${root}/functions/v1/garilink-api`;
  const serviceKey=required(env,'SUPABASE_SERVICE_ROLE_KEY');
  const login=await request(fetchImpl,`${api}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:required(env,'EVALUATION_SELLER_EMAIL'),password:required(env,'EVALUATION_SELLER_PASSWORD')})},'Seller login');
  const auth={Authorization:`Bearer ${login.accessToken}`,'Content-Type':'application/json'};
  let workspaces=await request(fetchImpl,`${api}/workspaces`,{headers:auth},'Workspace lookup');
  let workspace=workspaces.find((item)=>item.name==='GariLink Evaluation Garage');
  if(!workspace) workspace=await request(fetchImpl,`${api}/workspaces`,{method:'POST',headers:auth,body:JSON.stringify({name:'GariLink Evaluation Garage',type:'DEALERSHIP',description:'Controlled workspace for internal product evaluation.',requestId:'11000000-0000-4000-8000-000000000000'})},'Workspace creation');
  let mine;
  try {
    mine=await request(fetchImpl,`${api}/listings/mine`,{headers:auth},'Seller inventory lookup');
  } catch(error) {
    const diagnosis=await rpcFailurePreflight(fetchImpl,root,serviceKey,login.accessToken,'garilink_my_listings');
    throw new Error(`${error.message} Inventory preflight: ${diagnosis}.`);
  }
  const existing=new Map((mine.data??mine??[]).map((item)=>[item.title,item]));
  for(const spec of evaluationVehicles) {
    let listing=existing.get(spec.title);
    if(!listing) listing=await request(fetchImpl,`${api}/listings/drafts`,{method:'POST',headers:auth,body:JSON.stringify({...spec,workspaceId:workspace.id,requestId:spec.requestId,files:undefined,key:undefined})},`Draft creation (${spec.key})`);
    const currentImages=listing.vehicle?.images??[];
    // Resume the remaining photos after a partially completed earlier run.
    for(const name of spec.files.slice(currentImages.length)) {
      const bytes=await readFile(join(mediaDirectory,name)), meta=dimensions(bytes);
      const reservation=await request(fetchImpl,`${api}/media/reserve`,{method:'POST',headers:auth,body:JSON.stringify({vehicleId:listing.vehicle.id,mimeType:meta.mimeType})},`Media reservation (${spec.key})`);
      const preflight=await storagePreflight(fetchImpl,root,serviceKey,login.accessToken,reservation);
      try {
        await request(fetchImpl,reservation.uploadUrl,{method:'POST',headers:{Authorization:`Bearer ${login.accessToken}`,apikey:reservation.apiKey,'Content-Type':meta.mimeType,'Content-Length':String(bytes.length)},body:bytes},`Storage upload (${spec.key})`);
      } catch(error) {
        throw new Error(`${error.message} Authorization preflight: ${preflight}.`);
      }
      try {
        await request(fetchImpl,`${api}/media/finalize`,{method:'POST',headers:auth,body:JSON.stringify({mediaId:reservation.id,byteSize:bytes.length,width:meta.width,height:meta.height})},`Media finalization (${spec.key})`);
      } catch(error) {
        const uploaded=await uploadedObjectPreflight(fetchImpl,root,serviceKey,reservation,{bytes:bytes.length,mimeType:meta.mimeType});
        const finalized=await finalizationPreflight(fetchImpl,root,reservation.apiKey,login.accessToken,reservation,{bytes:bytes.length,width:meta.width,height:meta.height});
        // If the direct RPC succeeds, the hosted API deployment is stale but the
        // media is finalized; retain it and continue provisioning safely.
        if(finalized==='directRpcSucceeded') continue;
        // Best-effort cleanup prevents failed evaluation attempts from consuming
        // the listing's ten-photo limit. Preserve the original failure details.
        await request(fetchImpl,`${api}/media/${reservation.id}`,{method:'DELETE',headers:auth},`Media cleanup (${spec.key})`).catch(()=>null);
        throw new Error(`${error.message} Uploaded-object preflight: ${uploaded}; finalization preflight: ${finalized}; dimensions=${meta.width}x${meta.height}.`);
      }
    }
    if(listing.status!=='PUBLISHED') await request(fetchImpl,`${api}/listings/${listing.id}/publish`,{method:'POST',headers:auth},`Listing publication (${spec.key})`);
  }
  const publicResult=await request(fetchImpl,`${api}/listings?limit=20`,{},'Public marketplace verification');
  return {workspaceId:workspace.id,total:publicResult.total,provisioned:evaluationVehicles.length};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) provisionEvaluationData()
  .then((result)=>console.log(`Evaluation workspace ready: ${result.provisioned} controlled listings ensured; hosted public total ${result.total}. No credentials were printed.`))
  .catch((error)=>{console.error(error.message);process.exitCode=1;});
