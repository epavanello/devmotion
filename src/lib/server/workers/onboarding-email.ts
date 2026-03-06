import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { getQueue } from '../queue';
import { onboardingEmail, followUpEmail, renderEmailTemplate } from '../email/templates';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

const resend = new Resend(RESEND_API_KEY);

export interface OnboardingEmailJob {
  userId: string;
  email: string;
  name: string;
}

export interface FollowUpEmailJob {
  userId: string;
  email: string;
  name: string;
}

const ONBOARDING_QUEUE = 'onboarding-email';
const FOLLOWUP_QUEUE = 'followup-email';

/**
 * Check if user has email consent
 */
async function hasEmailConsent(userId: string): Promise<boolean> {
  const result = await db
    .select({ emailConsent: user.emailConsent })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0]?.emailConsent ?? false;
}

/**
 * Schedule an onboarding email to be sent 1 hour after signup
 */
export async function scheduleOnboardingEmail(job: OnboardingEmailJob) {
  const queue = getQueue();

  await queue.send(ONBOARDING_QUEUE, job, {
    startAfter: new Date(Date.now() + 10 * 60 * 1000),
    // Retry up to 3 times if failed
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true
  });

  console.log(`✓ Scheduled onboarding email for ${job.email} in 10 minutes`);
}

/**
 * Schedule a follow-up email to be sent 1 week after signup
 */
export async function scheduleFollowUpEmail(job: FollowUpEmailJob) {
  const queue = getQueue();

  await queue.send(FOLLOWUP_QUEUE, job, {
    startAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    // Retry up to 3 times if failed
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true
  });

  console.log(`✓ Scheduled follow-up email for ${job.email} in 7 days`);
}

/**
 * Initialize the onboarding email worker
 * Processes jobs from the queue and sends emails via Resend
 */
export async function startOnboardingEmailWorker() {
  const queue = getQueue();

  // Create the queue if it doesn't exist
  await queue.createQueue(ONBOARDING_QUEUE);

  await queue.work<OnboardingEmailJob>(ONBOARDING_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const { userId, email, name } = job.data;

      try {
        // Check email consent
        const consent = await hasEmailConsent(userId);
        if (!consent) {
          console.log(`⊘ Skipping onboarding email for ${email} (no email consent)`);
          continue;
        }

        // Render email template
        const template = onboardingEmail({ name });
        const { subject, html, text } = renderEmailTemplate(template);

        const { data, error } = await resend.emails.send({
          from: 'Emanuele from DevMotion <hi@devmotion.app>',
          to: [email],
          subject,
          html,
          text
        });

        if (error) {
          console.error('Failed to send onboarding email:', error);
          throw error;
        }

        console.log(`✓ Sent onboarding email to ${email}`, data);
      } catch (error) {
        console.error('Error processing onboarding email job:', error);
        throw error;
      }
    }
  });

  console.log('✓ Onboarding email worker started');
}

/**
 * Initialize the follow-up email worker
 * Processes jobs from the queue and sends follow-up emails via Resend
 */
export async function startFollowUpEmailWorker() {
  const queue = getQueue();

  // Create the queue if it doesn't exist
  await queue.createQueue(FOLLOWUP_QUEUE);

  await queue.work<FollowUpEmailJob>(FOLLOWUP_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const { userId, email, name } = job.data;

      try {
        // Check email consent
        const consent = await hasEmailConsent(userId);
        if (!consent) {
          console.log(`⊘ Skipping follow-up email for ${email} (no email consent)`);
          continue;
        }

        // Render email template
        const template = followUpEmail({ name });
        const { subject, html, text } = renderEmailTemplate(template);

        const { data, error } = await resend.emails.send({
          from: 'Emanuele from DevMotion <hi@devmotion.app>',
          to: [email],
          subject,
          html,
          text
        });

        if (error) {
          console.error('Failed to send follow-up email:', error);
          throw error;
        }

        console.log(`✓ Sent follow-up email to ${email}`, data);
      } catch (error) {
        console.error('Error processing follow-up email job:', error);
        throw error;
      }
    }
  });

  console.log('✓ Follow-up email worker started');
}
