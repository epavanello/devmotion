import mjml2html from 'mjml';
import { convert } from 'html-to-text';
import { BRAND_COLORS } from '$lib/constants/branding';

export interface EmailTemplate {
  subject: string;
  mjml: string;
}

export interface OnboardingEmailData {
  name: string;
}

export interface FollowUpEmailData {
  name: string;
}

/**
 * Template name to data type mapping
 * Add new templates here - email-types.ts will auto-infer them
 */
export type TemplateDataMap = {
  onboarding: OnboardingEmailData;
  'follow-up': FollowUpEmailData;
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const emailHead = () => `
  <mj-head>
    <mj-attributes>
      <mj-text font-family="${FONT}" font-size="16px" color="#1f2937" line-height="1.6" padding-bottom="20px" />
      <mj-all font-family="${FONT}" />
    </mj-attributes>
    <mj-style>
      a { color: ${BRAND_COLORS.blue}; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </mj-style>
  </mj-head>
`;

const emailFooter = () => `
  <mj-divider border-color="#e5e7eb" border-width="1px" padding="32px 0 20px 0" />
  <mj-text font-size="13px" color="#6b7280" align="center">
    <strong style="color: #1f2937;">DevMotion</strong> — After Effects for the web, powered by AI<br/>
    <a href="https://devmotion.app" style="color: ${BRAND_COLORS.blue}; text-decoration: none;">devmotion.app</a>
  </mj-text>
  <mj-text font-size="12px" color="#9ca3af" align="center" padding-top="16px">
    You're receiving this email because you signed up for DevMotion.<br/>
    <a href="${process.env.PUBLIC_BASE_URL}/profile" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
  </mj-text>
`;

const emailWrapper = (content: string) => `
  <mjml>
    ${emailHead()}
    <mj-body background-color="#f9fafb">
      <mj-section background-color="#ffffff" padding="40px 20px" border-radius="8px">
        <mj-column>
          ${content}
          ${emailFooter()}
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`;

type TextProps = {
  paddingTop?: number;
  paddingBottom?: number;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

const text = (content: string, props: TextProps = {}) => {
  const attrs = [];
  if (props.paddingTop) attrs.push(`padding-top="${props.paddingTop}px"`);
  if (props.paddingBottom) attrs.push(`padding-bottom="${props.paddingBottom}px"`);
  if (props.fontSize) attrs.push(`font-size="${props.fontSize}px"`);
  if (props.color) attrs.push(`color="${props.color}"`);
  if (props.align) attrs.push(`align="${props.align}"`);

  return `<mj-text${attrs.length ? ' ' + attrs.join(' ') : ''}>${content}</mj-text>`;
};

const button = (label: string, href: string) => `
  <mj-button href="${href}" background-color="${BRAND_COLORS.blue}" color="#ffffff" border-radius="6px" padding="12px 24px" font-size="16px" font-weight="600">
    ${label}
  </mj-button>
`;

const signature = (name: string, opts: { paddingTop?: number } = {}) => `
  ${text('Best regards,', { paddingTop: opts.paddingTop, paddingBottom: 4 })}
  ${text(name)}
`;

export function onboardingEmail(data: OnboardingEmailData): EmailTemplate {
  return {
    subject: 'Welcome to DevMotion 👋',
    mjml: emailWrapper(`
      ${text(`Hey ${data.name},`, { paddingBottom: 20 })}
      ${text(
        `
        Emanuele here, founder of <a href="https://devmotion.app">DevMotion</a>.
        I saw you just signed up — welcome aboard! I'm working every day to make DevMotion
        the best animation tool out there, and your feedback is incredibly valuable. 🙏🏻
      `,
        { paddingBottom: 20 }
      )}
      ${text(
        `
        Have a feature idea or something that could be better?
        <a href="https://devmotion.canny.io/feature-requests">Vote or request features</a> on our public roadmap,
        or simply reply to this email — I read every message personally.
      `,
        { paddingBottom: 20 }
      )}
      ${text('Looking forward to seeing what you create!', { paddingBottom: 32 })}
      ${signature('Emanuele')}
    `)
  };
}

export function followUpEmail(data: FollowUpEmailData): EmailTemplate {
  return {
    subject: "How's your DevMotion experience going?",
    mjml: emailWrapper(`
      ${text(`Hey ${data.name},`, { paddingBottom: 20 })}
      ${text("It's been about a week since you joined DevMotion. First off — thank you for being here! 🙏", { paddingBottom: 20 })}
      ${text(
        `
        I'm curious to hear how things are going for you. Have you had a chance to explore the platform?
        Is there anything you'd like to see improved or added?
      `,
        { paddingBottom: 20 }
      )}
      ${text(
        `
        Your feedback directly shapes what we build next. You can
        <a href="https://devmotion.canny.io/feature-requests">vote on features</a> you'd love to see,
        request new ones on our public roadmap, or simply reply to this email with your thoughts.
      `,
        { paddingBottom: 20 }
      )}
      ${text('Every suggestion helps make DevMotion better for everyone. Looking forward to hearing from you!', { paddingBottom: 32 })}
      ${button('Vote on Features', 'https://devmotion.canny.io/feature-requests')}
      ${signature('Emanuele', { paddingTop: 32 })}
    `)
  };
}

/**
 * Render an email template to HTML and text
 */
export function renderEmailTemplate(template: EmailTemplate): {
  subject: string;
  html: string;
  text: string;
} {
  const { html } = mjml2html(template.mjml, {
    minify: true,
    validationLevel: 'soft'
  });

  const text = convert(html, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { ignoreHref: false } },
      { selector: 'img', format: 'skip' }
    ]
  });

  return {
    subject: template.subject,
    html,
    text
  };
}
