import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    let query = supabase
      .from('transparency_reports')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false });

    if (system) query = query.eq('system', system);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: reports, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ reports: reports || [], total: count || 0, limit, offset });
  } catch (err) {
    console.error('Transparency reports error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, system = '852', agent, triggered_by = 'manual' } = body;

    if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const { data, error } = await supabase
      .from('transparency_reports')
      .insert({ title, description, system, agent, status: 'running', triggered_by, started_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Transparency reports POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
