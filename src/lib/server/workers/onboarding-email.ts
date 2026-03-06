import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { getQueue } from '../queue';

const resend = new Resend(RESEND_API_KEY);

export interface OnboardingEmailJob {
  userId: string;
  email: string;
  name: string;
}

const QUEUE_NAME = 'onboarding-email';

/**
 * Schedule an onboarding email to be sent 1 hour after signup
 */
export async function scheduleOnboardingEmail(job: OnboardingEmailJob) {
  const queue = getQueue();

  await queue.send(QUEUE_NAME, job, {
    startAfter: new Date(Date.now() + 10 * 60 * 1000),
    // Retry up to 3 times if failed
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true
  });

  console.log(`✓ Scheduled onboarding email for ${job.email} in 10 minutes`);
}

/**
 * Initialize the onboarding email worker
 * Processes jobs from the queue and sends emails via Resend
 */
export async function startOnboardingEmailWorker() {
  const queue = getQueue();

  // Create the queue if it doesn't exist
  await queue.createQueue(QUEUE_NAME);

  await queue.work<OnboardingEmailJob>(QUEUE_NAME, async (jobs) => {
    for (const job of jobs) {
      const { email, name } = job.data;

      try {
        const { data, error } = await resend.emails.send({
          from: 'Emanuele from DevMotion <hi@devmotion.app>',
          to: [email],
          subject: 'Welcome to DevMotion 👋',
          text: `Hi ${name},

Emanuele here, founder of devmotion.app. I saw you signed up a few minutes ago. I love working on DevMotion and try every day to make it the best product possible. Any feedback is very appreciated. 🙏🏻

Feel free to reply to this email directly if you have any questions or suggestions.

Best regards,
Emanuele


--
DevMotion - After Effects for the web, powered by AI
https://devmotion.app`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Emanuele here, founder of <a href="https://devmotion.app" style="color: #0066cc; text-decoration: none;">devmotion.app</a>.
                I saw you signed up a few minutes ago. I love working on DevMotion and try every day to make it
                the best product possible. Any feedback is very appreciated. 🙏🏻
              </p>

              <p style="font-size: 16px; margin-bottom: 32px;">
                Feel free to reply to this email directly if you have any questions or suggestions.
              </p>

              <p style="font-size: 16px; margin-bottom: 4px;">Best regards,</p>
              <p style="font-size: 16px; margin-bottom: 0;">Emanuele</p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 20px 0;">

              <p style="font-size: 13px; color: #666; margin-bottom: 0;">
                <strong style="color: #333;">DevMotion</strong> — After Effects for the web, powered by AI<br>
                <a href="https://devmotion.app" style="color: #0066cc; text-decoration: none;">devmotion.app</a>
              </p>
            </div>
          `
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
