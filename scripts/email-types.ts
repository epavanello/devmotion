/**
 * Type-safe email configuration types
 * Auto-infers available templates from templates.ts
 */

import type { EmailTemplate, TemplateDataMap } from '../src/lib/server/email/templates';

/**
 * Recipient with email and template-specific data
 */
export type RecipientWithData<K extends keyof TemplateDataMap> = [
  email: string,
  data: TemplateDataMap[K]
];

/**
 * Custom template data (can be anything)
 */
export type CustomTemplateData = Record<string, unknown>;

/**
 * Recipient with custom template data
 */
export type CustomRecipientWithData = [email: string, data: CustomTemplateData];

/**
 * Email configuration - discriminated union for type safety
 * Automatically infers correct data type based on template name
 */
export type EmailConfig =
  | {
      [K in keyof TemplateDataMap]: {
        type: 'per-recipient';
        template: K;
        recipients: RecipientWithData<K>[];
      };
    }[keyof TemplateDataMap]
  | {
      type: 'custom';
      recipients: CustomRecipientWithData[];
      template: (data: CustomTemplateData) => EmailTemplate;
    };
