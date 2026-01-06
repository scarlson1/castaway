// convex.config.ts required to register components (aggregates etc.)

import agent from '@convex-dev/agent/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import rag from '@convex-dev/rag/convex.config';
import workflow from '@convex-dev/workflow/convex.config.js';
import { defineApp } from 'convex/server';

// aggregates: https://www.convex.dev/components/aggregate
// migrations: https://www.convex.dev/components/migrations

const app = defineApp();

app.use(aggregate, { name: 'aggregateByEpisode' });
app.use(aggregate, { name: 'aggregateByPodcast' });
// app.use(aggregate, { name: 'randomPod' });
// app.use(aggregate, { name: 'randomEpisode' });

app.use(agent);
app.use(rag);

app.use(workflow);
app.use(migrations);

export default app;
