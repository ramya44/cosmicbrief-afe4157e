/**
 * Send feedback email to users who generated a free forecast but didn't purchase
 *
 * Usage:
 *   npx tsx scripts/send-feedback-email.ts --dry-run    # Preview who would receive emails
 *   npx tsx scripts/send-feedback-email.ts              # Actually send emails
 *
 * Required env vars in .env:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) return;

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
  console.error('Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - VITE_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!RESEND_API_KEY) console.error('  - RESEND_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const isDryRun = process.argv.includes('--dry-run');
const testEmailIndex = process.argv.findIndex(arg => arg === '--test');
const testEmail = testEmailIndex !== -1 ? process.argv[testEmailIndex + 1] : null;

// Emails to exclude from sending (family/test accounts)
const EXCLUDED_EMAILS = [
  'ramya44@gmail.com',
  'rick.gibb@gmail.com',
  'lalitha.amancherla@gmail.com',
  'preetam.amancharla@gmail.com',
];

const EMAIL_SUBJECT = "Quick question about your Cosmic Brief experience";

const buildEmailHtml = (name: string | null) => {
  const greeting = name ? `Hi ${name}` : 'Hi there';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting},</p>

  <p>I noticed you generated your free Vedic birth chart on Cosmic Brief recently - thank you for trying it out!</p>

  <p>I'm building this as a solo project and would love to hear your honest feedback:</p>

  <ul>
    <li>What did you think of your free reading?</li>
    <li>Was there anything confusing or that could be improved?</li>
    <li>What held you back from getting the full 2026 forecast (if anything)?</li>
  </ul>

  <p>No pressure at all - I just want to make sure Cosmic Brief is actually helpful for people exploring Vedic astrology.</p>

  <p>As a thank you for sharing your thoughts, I'd be happy to give you the full 2026 forecast for free - just reply to this email and I'll send it your way.</p>

  <p>Thanks so much,<br>
  Maya</p>

  <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
    <a href="https://cosmicbrief.com" style="color: #B8860B;">Cosmic Brief</a> - Vedic astrology for the modern seeker
  </p>
</body>
</html>
`;
};

async function sendEmail(to: string, name: string | null): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Maya from Cosmic Brief <maya@notifications.cosmicbrief.com>',
      to: [to],
      subject: EMAIL_SUBJECT,
      html: buildEmailHtml(name),
      reply_to: 'support@cosmicbrief.com',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  return true;
}

async function main() {
  // Get today's date range (UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Test mode - send to a single email
  if (testEmail) {
    console.log(`🧪 TEST MODE - Sending test email to ${testEmail}\n`);
    try {
      await sendEmail(testEmail, 'Ramya');
      console.log(`✅ Test email sent to ${testEmail}`);
    } catch (err) {
      console.error(`❌ Failed to send test email:`, err);
    }
    return;
  }

  console.log(isDryRun ? '🔍 DRY RUN - No emails will be sent' : '📧 SENDING EMAILS');
  console.log(`📅 Filtering for forecasts created today (${today.toISOString().split('T')[0]})\n`);

  // Query users who have:
  // - An email address
  // - A free forecast
  // - No paid forecast
  // - Created today
  const { data: users, error } = await supabase
    .from('user_kundli_details')
    .select('id, email, name, created_at')
    .not('email', 'is', null)
    .not('free_vedic_forecast', 'is', null)
    .is('paid_vedic_forecast', null)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  // Filter out duplicates by email (keep most recent) and excluded emails
  const seenEmails = new Set<string>();
  const excludedSet = new Set(EXCLUDED_EMAILS.map(e => e.toLowerCase()));
  const uniqueUsers = users?.filter(user => {
    if (!user.email) return false;
    const emailLower = user.email.toLowerCase();
    if (seenEmails.has(emailLower) || excludedSet.has(emailLower)) {
      return false;
    }
    seenEmails.add(emailLower);
    return true;
  }) || [];

  console.log(`Found ${uniqueUsers.length} users with free forecast but no paid forecast\n`);

  if (uniqueUsers.length === 0) {
    console.log('No users to email.');
    return;
  }

  // Show preview
  console.log('Users to email:');
  uniqueUsers.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.email} (${user.name || 'no name'}) - created ${user.created_at}`);
  });
  console.log('');

  if (isDryRun) {
    console.log('✅ Dry run complete. Run without --dry-run to send emails.');
    return;
  }

  // Send emails
  let sent = 0;
  let failed = 0;

  for (const user of uniqueUsers) {
    try {
      await sendEmail(user.email, user.name);
      console.log(`✅ Sent to ${user.email}`);
      sent++;

      // Rate limit: Resend allows 2 req/sec, so wait 600ms to be safe
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (err) {
      console.error(`❌ Failed to send to ${user.email}:`, err);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${sent} sent, ${failed} failed`);
}

main().catch(console.error);
