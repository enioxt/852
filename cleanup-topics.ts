import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Cleaning up generic 'Discussão Relevante' issues...");
  const { data: issuesDel, error: e1 } = await sb.from('issues_852').delete().eq('source', 'ai_report').select();
  console.log('Deleted issues:', issuesDel?.length || 0, e1 || 'OK');

  console.log('Cleaning up backfilled reports...');
  // Unfortunately Supabase JS .contains() on JSONB isn't always straightforward if the structure varies, 
  // but we can delete where metadata->>backfilled = 'true'
  const { data: reportsDel, error: e2 } = await sb
    .from('reports_852')
    .delete()
    .eq('metadata->>backfilled', 'true')
    .select();
  console.log('Deleted backfilled reports:', reportsDel?.length || 0, e2 || 'OK');
}

run().catch(console.error);
