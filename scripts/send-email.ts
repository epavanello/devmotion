/**
 * Send emails based on email-config.ts
 *
 * This script reads configuration from email-config.ts and sends
 * emails to the specified recipients using the configured template.
 *
 * Usage:
 *   1. Copy email-config.example.ts to email-config.ts
 *   2. Edit email-config.ts with your recipients and template
 *   3. Run: pnpm email:send
 *
 * Environment variables required:
 *   RESEND_API_KEY - Your Resend API key
 */

import { Resend } from 'resend';
import {
  type EmailTemplate,
  followUpEmail,
  onboardingEmail,
  renderEmailTemplate
} from '../src/lib/server/email/templates';
import { existsSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
import type { EmailConfig } from './email-types';
dotenvConfig();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Emanuele from DevMotion <hi@devmotion.app>';
const CONFIG_PATH = join(process.cwd(), 'scripts', 'email-config.ts');

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error('❌ Configuration file not found: scripts/email-config.ts');
    console.log('\nPlease create it first:');
    console.log('  cp scripts/email-config.example.ts scripts/email-config.ts');
    console.log('  # Then edit email-config.ts with your recipients and template\n');
    process.exit(1);
  }

  const configModule = await import('./email-config');
  return configModule.config as EmailConfig;
}

function getTemplate(config: EmailConfig): EmailTemplate {
  if (config.type === 'custom') {
    return config.template;
  }

  // Standard templates - fully type-safe
  switch (config.template) {
    case 'onboarding': {
      return onboardingEmail(config.data);
    }
    case 'follow-up': {
      return followUpEmail(config.data);
    }
    default: {
      // TypeScript ensures this is exhaustive
      const _exhaustive: never = config;
      throw new Error(`Unknown template: ${_exhaustive}`);
    }
  }
}

async function sendEmail(recipient: string, config: EmailConfig) {
  const resend = new Resend(RESEND_API_KEY);

  // Get template - fully type-safe based on config.type
  const template = getTemplate(config);

  // Render to HTML and text
  const { subject, html, text } = renderEmailTemplate(template);

  console.log(`\n📧 Sending to: ${recipient}`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipient],
      subject,
      html,
      text
    });

    if (error) {
      console.error(`   ❌ Failed:`, error);
      return false;
    }

    console.log(`   ✅ Sent successfully (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  DevMotion Email Sender                ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Validate API key
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY environment variable is not set');
    console.log('\nMake sure your .env file contains:');
    console.log('  RESEND_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  // Load configuration
  const config = await loadConfig();

  console.log(`📋 Configuration loaded:`);
  console.log(`   Type: ${config.type}`);
  if (config.type === 'standard') {
    console.log(`   Template: ${config.template}`);
  } else {
    console.log(`   Template: Custom MJML`);
  }
  console.log(`   Recipients: ${config.recipients.length}\n`);

  // Validate recipients
  if (config.recipients.length === 0) {
    console.error('❌ No recipients configured in email-config.ts');
    process.exit(1);
  }

  // Confirm before sending
  console.log('⚠️  This will send real emails to the configured recipients.');
  console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Send to all recipients
  let successCount = 0;
  for (const recipient of config.recipients) {
    const success = await sendEmail(recipient, config);
    if (success) successCount++;

    // Small delay between emails to avoid rate limiting
    if (config.recipients.indexOf(recipient) < config.recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(
    `\n${successCount === config.recipients.length ? '✅' : '⚠️'} Sent ${successCount}/${config.recipients.length} emails successfully\n`
  );
}

main().catch(console.error);
