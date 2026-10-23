import postgres from 'postgres';
import type {ReservedEvidence} from '../functions/garilink-api/identity_evidence_worker.ts';

/** Dedicated least-privilege LOGIN, member of garilink_evidence_worker only.
 * Never use postgres/service_role, never expose this DSN to the Edge/client. */
export function createEvidenceDatabase(connectionString:string) {
  const url=new URL(connectionString);
  if(['postgres','service_role','supabase_admin'].includes(decodeURIComponent(url.username)))
    throw new Error('NARROW_WORKER_IDENTITY_REQUIRED');
  const local=['127.0.0.1','localhost'].includes(url.hostname);
  const sql=postgres(connectionString,{max:2,connect_timeout:5,idle_timeout:10,ssl:local?false:'verify-full',
    onnotice:()=>{},debug:false});
  async function verifyIdentity(){
    const [role]=await sql`select pg_has_role(current_user,'garilink_evidence_worker','MEMBER')
      and not (rolsuper or rolbypassrls or rolcreatedb or rolcreaterole)
      and not has_table_privilege(current_user,'garilink_private.verification_documents','INSERT,UPDATE,DELETE')
      and not has_function_privilege(current_user,
        'garilink_private.identity_record_inspection(uuid,text,text,integer,text,text,text,text,timestamptz,timestamptz)','EXECUTE')
      as allowed from pg_roles where rolname=current_user`;
    if(!role?.allowed)throw new Error('NARROW_WORKER_IDENTITY_REQUIRED');
  }
  return {
    async snapshot(documentId:string):Promise<ReservedEvidence>{
      await verifyIdentity();
      const [row]=await sql`select garilink_private.identity_worker_snapshot(${documentId}::uuid) as value`;
      return row.value;
    },
    async outcome(requestId:string,documentId:string):Promise<{documentId:string;caseRevision:number;sha256:string}|null>{
      await verifyIdentity();
      const [row]=await sql`select garilink_private.identity_worker_outcome(${requestId}::uuid,${documentId}::uuid) as value`;
      return row.value;
    },
    async finalize(payload:Record<string,unknown>){
      await verifyIdentity();
      // Only final revalidation/receipt/audit uses a transaction. No external IO.
      await sql.begin(async tx=>{
        await tx`set local lock_timeout='2s'`;
        await tx`set local statement_timeout='5s'`;
        await tx`select garilink_private.identity_worker_commit(${tx.json(payload)}::jsonb)`;
      });
    },
    async close(){await sql.end({timeout:5});},
  };
}
