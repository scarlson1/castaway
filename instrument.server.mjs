import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  dsn: 'https://e2a118ee2e3bf5449f9a134f77810958@o4509429931442176.ingest.us.sentry.io/4510428280717312',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
