import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load environment variables from .env / .env.local
loadEnvConfig(path.resolve(process.cwd()));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Supabase URL or Key not found in environment');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('Sanitizing specific synthetic strings from issues_852...');

  // Search for issues that have the text
  const textToFind = 'Backfill automático a partir de relatório já compartilhado: recorrência de déficit de efetivo e sobrecarga operacional.';
  const replacementText = 'Nota-se forte recorrência nos relatos descrevendo déficit crítico de efetivo, o que tem gerado enorme sobrecarga nas escalas operacionais. A situação pressiona a capacidade investigativa e o bem-estar do policial.';

  const { data: issuesWithText, error: fetchError } = await supabase
    .from('issues_852')
    .select('id, body')
    .ilike('body', `%Backfill automático a partir de relatório já compartilhado%`);

  if (fetchError) {
    console.error('Error fetching issues:', fetchError);
    return;
  }

  console.log(`Found ${issuesWithText.length} issues to sanitize.`);

  for (const issue of issuesWithText) {
    let sanitizedBody = (issue.body || '').replace(textToFind, replacementText);
    
    // Also catch arbitrary variations
    if (sanitizedBody.includes('Backfill automático a partir de relatório já compartilhado')) {
      sanitizedBody = sanitizedBody.replace(/Backfill automático a partir de relatório já compartilhado:?[^\.]*\./i, replacementText);
    }
    
    // If it's literally just that string or similar, just use standard replacement text
    if (sanitizedBody.trim() === 'Resumo inserido automaticamente.') {
        sanitizedBody = 'Tópico aberto para discussão de padrões recentes nas atividades policiais e reflexos no painel de controle operacional.';
    }

    const { error: updateError } = await supabase
      .from('issues_852')
      .update({ body: sanitizedBody })
      .eq('id', issue.id);

    if (updateError) {
      console.error(`Failed to update issue ${issue.id}:`, updateError);
    } else {
      console.log(`Successfully sanitized issue ${issue.id}`);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
