/**
 * Temporary endpoint to apply database migration
 * This is a one-time fix for the missing columns in ai_reports_852
 */

import { getSupabase } from '@/lib/supabase';

export async function POST() {
  try {
    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    // Apply migration using Supabase's SQL execution
    const migrationSQL = `
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS is_master_report BOOLEAN DEFAULT false;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_conversations_all_time INTEGER DEFAULT 0;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_reports_all_time INTEGER DEFAULT 0;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_conversation_id UUID;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_report_id UUID;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS cumulative_insights JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS historical_patterns JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
      CREATE INDEX IF NOT EXISTS idx_ai_reports_master ON ai_reports_852(is_master_report) WHERE is_master_report = true;
      UPDATE ai_reports_852 SET is_master_report = false WHERE is_master_report IS NULL;
    `;

    // Try to execute via RPC
    const { error: rpcError } = await sb.rpc('exec_sql', { sql: migrationSQL });
    
    if (rpcError) {
      // If exec_sql doesn't exist, try individual statements via REST
      console.log('[migration] RPC failed, trying alternative:', rpcError.message);
      
      // Execute each statement individually using raw REST API
      const statements = migrationSQL.split(';').filter(s => s.trim());
      const results = [];
      
      for (const stmt of statements) {
        try {
          // Use the Supabase REST API directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: stmt + ';' }),
          });
          
          results.push({ statement: stmt.substring(0, 50), status: response.status });
        } catch (e) {
          results.push({ statement: stmt.substring(0, 50), error: (e as Error).message });
        }
      }
      
      return Response.json({ 
        success: false, 
        message: 'Migration applied via REST API',
        results,
        note: 'Some statements may have failed. Please apply manually via Supabase SQL Editor.'
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Migration applied successfully via RPC' 
    });
  } catch (error) {
    console.error('[migration] Error:', error);
    return Response.json({ 
      error: 'Failed to apply migration',
      details: (error as Error).message 
    }, { status: 500 });
  }
}
