#!/usr/bin/env node
/**
 * Script para criar admin inicial no 852
 * Usage: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function createAdmin() {
  const email = 'enioxt@gmail.com';
  const password = process.env.ADMIN_PASSWORD || '852Admin@2026'; // Change this!
  const name = 'Enio Admin';

  console.log('🔐 Criando admin:', email);

  // Check if admin already exists
  const { data: existing } = await sb
    .from('admin_users_852')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    console.log('⚠️ Admin já existe:', existing.email);
    
    // Update to ensure active
    const { error: updateError } = await sb
      .from('admin_users_852')
      .update({ is_active: true, name })
      .eq('id', existing.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Admin atualizado e ativado');
    return;
  }

  const passwordHash = await hashPassword(password);

  const { error } = await sb.from('admin_users_852').insert({
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: name || null,
    role: 'admin',
    is_active: true,
  });

  if (error) {
    if (error.code === '23505') {
      console.error('❌ Email já cadastrado');
    } else {
      console.error('❌ Erro ao criar admin:', error.message);
    }
    process.exit(1);
  }

  console.log('✅ Admin criado com sucesso!');
  console.log('📧 Email:', email);
  console.log('🔑 Senha temporária:', password);
  console.log('⚠️ Altere a senha após o primeiro login!');
}

createAdmin().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
