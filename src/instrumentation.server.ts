import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://8b58b8af2fbd3d102e8f4a544da7fbbe@o4506769124622336.ingest.us.sentry.io/4510999895474176',

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: import.meta.env.DEV,
});
