/**
 * Type-safe email configuration types
 * Auto-infers available templates from templates.ts
 */

import type { EmailTemplate, TemplateDataMap } from '../src/lib/server/email/templates';

/**
 * Standard template configurations
 * Automatically generates discriminated union from TemplateDataMap
 */
export type StandardTemplateConfig = {
  [K in keyof TemplateDataMap]: {
    template: K;
    data: TemplateDataMap[K];
  };
}[keyof TemplateDataMap];

/**
 * Email configuration - discriminated union for type safety
 */
export type EmailConfig =
  | ({
      type: 'standard';
      recipients: string[];
    } & StandardTemplateConfig)
  | {
      type: 'custom';
      recipients: string[];
      template: EmailTemplate;
    };
