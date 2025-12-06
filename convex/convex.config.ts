// convex.config.ts required to register components (aggregates etc.)

import aggregate from '@convex-dev/aggregate/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import { defineApp } from 'convex/server';

// aggregates: https://www.convex.dev/components/aggregate
// migrations: https://www.convex.dev/components/migrations

const app = defineApp();

app.use(aggregate, { name: 'aggregateByEpisode' });
app.use(aggregate, { name: 'aggregateByPodcast' });
// app.use(aggregate, { name: 'stats' });

app.use(migrations);

export default app;
