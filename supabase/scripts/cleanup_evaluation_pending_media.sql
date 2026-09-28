begin;

-- One-time recovery for reservations left by failed evaluation provisioning.
-- This is deliberately scoped to PENDING rows in the named controlled workspace.
-- Supabase forbids direct writes to storage.objects, so this query only removes
-- the application reservations. Any previously uploaded uniquely named object
-- becomes unreferenced and cannot appear in GariLink.
delete from public.gl_vehicle_media m
using public.gl_workspaces w
where m.workspace_id = w.id
  and w.name = 'GariLink Evaluation Garage'
  and m.status = 'PENDING';

commit;
