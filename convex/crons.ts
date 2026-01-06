import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'fetch episodes',
  { minutes: 45 },
  internal.episodes.fetchNewEpisodes
);

// Generate invoices for the previous month
crons.monthly(
  'generateInvoices',
  // Wait a day after the new month starts to generate invoices
  { day: 2, hourUTC: 0, minuteUTC: 0 },
  internal.agent.usage.generateInvoices,
  {}
);

export default crons;
