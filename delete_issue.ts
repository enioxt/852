import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const sb = createClient(url, key);

async function run() {
  console.log("Deleting issue matching 'Nomes para Chatbot'...");
  const { data, error } = await sb
    .from('issues_852')
    .delete()
    .ilike('title', '%Nomes para Chatbot%');
  
  if (error) {
    console.error("Error deleting:", error.message);
  } else {
    console.log("Success deleting issue.");
  }
}

run();
