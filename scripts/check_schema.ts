import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: issuesData, error: issuesError } = await supabase.from('issues_852').select('*').limit(1);
  console.log('Issues columns:', issuesData ? Object.keys(issuesData[0] || {}) : 'No data/Error', issuesError?.message);

  const { data: commentsData, error: commentsError } = await supabase.from('issue_comments_852').select('*').limit(1);
  console.log('Comments columns:', commentsData ? Object.keys(commentsData[0] || {}) : 'No data/Error', commentsError?.message);
}

check();
