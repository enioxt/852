import { getSupabase } from './src/lib/supabase';
import { issueEmailVerification } from './src/lib/user-auth';

async function run() {
  const sb = getSupabase();
  if (!sb) {
    console.error('Failed to init Supabase client');
    process.exit(1);
  }

  // Find users who haven't verified their emails
  const { data: users, error } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name')
    .is('email_verified_at', null);

  if (error) {
    console.error('Database query error:', error);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No unverified users found in the database. Creating a manual dispatch for the target email.');
    
    const mockRes = await issueEmailVerification({
      userId: 'mock-test-id-1234',
      email: 'enioxt@gmail.com',
      displayName: 'Enio',
      baseUrl: process.env.PUBLIC_BASE_URL || 'https://852.egos.ia.br'
    });
    console.log('Test dispatch to enioxt@gmail.com:', mockRes);
    process.exit(0);
  }

  console.log(`Found ${users.length} unverified users. Sending activation emails...`);
  
  for (const user of users) {
    console.log(`Dispatching to: ${user.email} (ID: ${user.id})`);
    const res = await issueEmailVerification({
      userId: user.id,
      email: user.email,
      displayName: user.display_name || 'Agente',
      baseUrl: process.env.PUBLIC_BASE_URL || 'https://852.egos.ia.br'
    });
    
    if (res && res.error) {
      console.error(`❌ Failed to send to ${user.email}:`, res.error);
    } else {
      console.log(`✅ Sent to ${user.email}`);
    }
  }

  console.log('Done!');
}

run();
