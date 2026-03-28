import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system') || '852';
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const { data, error } = await supabase
      .from('transparency_logs')
      .select('*')
      .eq('system', system)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ logs: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
