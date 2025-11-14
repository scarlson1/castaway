import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'fetch episodes',
  { minutes: 45 },
  internal.episodes.fetchNewEpisodes
);

export default crons;
