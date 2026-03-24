import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

// Load .env file
const envContent = readFileSync('/home/enio/852/.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const sb = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔍 Checking database for report...');
  const { data, error } = await sb
    .from('ai_reports_852')
    .select('*')
    .eq('id', 'ddc25d86-18b1-47ae-952b-506c7e5c7a42')
    .single();
  
  console.log('Error:', error);
  console.log('Data:', data ? 'Found' : 'Not found');
  
  if (data) {
    console.log('Keys:', Object.keys(data));
    console.log('Content HTML length:', data.content_html?.length || 0);
    
    if (data.content_html) {
      const outputFile = '/tmp/report_from_db_final_v2.html';
      writeFileSync(outputFile, data.content_html);
      console.log('✅ Report saved to:', outputFile);
      console.log('📊 Size:', data.content_html.length, 'characters');
    }
  }
})();
