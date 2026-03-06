/**
 * Email test configuration
 *
 * Copy this file to email-config.ts and customize it for your tests
 *
 * Usage:
 *   cp scripts/email-config.example.ts scripts/email-config.ts
 *   # Edit email-config.ts with your recipients and template
 *   pnpm email:send
 */

import type { EmailConfig } from './email-types';

/**
 * OPTION 1: Use a standard template (onboarding, etc.)
 */
export const config: EmailConfig = {
  type: 'standard',
  recipients: ['test@example.com'],
  template: 'onboarding',
  data: {
    name: 'Test User'
  }
};

/**
 * OPTION 2: Use a custom MJML template
 */
// export const config: EmailConfig = {
//   type: 'custom',
//   recipients: ['test@example.com'],
//   template: {
//     subject: 'Custom Test Email',
//     mjml: `
//       <mjml>
//         <mj-head>
//           <mj-attributes>
//             <mj-text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" color="#333333" line-height="1.6" />
//             <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
//           </mj-attributes>
//         </mj-head>
//         <mj-body background-color="#f5f5f5">
//           <mj-section background-color="#ffffff" padding="40px 20px">
//             <mj-column>
//               <mj-text font-size="20px" font-weight="bold" padding-bottom="20px">
//                 Custom Test Email
//               </mj-text>
//
//               <mj-text font-size="16px" padding-bottom="20px">
//                 This is a custom test email. You can modify this MJML directly.
//               </mj-text>
//
//               <mj-button href="https://devmotion.app" background-color="#0066cc" padding="20px 0">
//                 Visit DevMotion
//               </mj-button>
//
//               <mj-divider border-color="#eeeeee" border-width="1px" padding="32px 0 20px 0" />
//
//               <mj-text font-size="13px" color="#666666">
//                 <strong style="color: #333;">DevMotion</strong> — After Effects for the web, powered by AI<br/>
//                 <a href="https://devmotion.app" style="color: #0066cc; text-decoration: none;">devmotion.app</a>
//               </mj-text>
//             </mj-column>
//           </mj-section>
//         </mj-body>
//       </mjml>
//     `
//   }
// };
