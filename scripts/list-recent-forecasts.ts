import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.trim()) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EXCLUDED_EMAILS = [
  'ramya44@gmail.com',
  'rick.gibb@gmail.com',
  'lalitha.amancherla@gmail.com',
  'preetam.amancharla@gmail.com',
];

async function main() {
  const { data: users, error } = await supabase
    .from('user_kundli_details')
    .select('id, email, name, created_at')
    .not('email', 'is', null)
    .not('free_vedic_forecast', 'is', null)
    .is('paid_vedic_forecast', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const excludedSet = new Set(EXCLUDED_EMAILS.map(e => e.toLowerCase()));
  const seenEmails = new Set<string>();
  const uniqueUsers = users?.filter(user => {
    if (!user.email) return false;
    const emailLower = user.email.toLowerCase();
    if (seenEmails.has(emailLower) || excludedSet.has(emailLower)) return false;
    seenEmails.add(emailLower);
    return true;
  }).slice(0, 11) || [];

  console.log('11 most recent free forecasts (no paid):\n');
  uniqueUsers.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.email} (${user.name || 'no name'}) - ${user.created_at}`);
  });
}

main();
