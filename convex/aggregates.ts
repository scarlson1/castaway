import { TableAggregate } from '@convex-dev/aggregate';
import { components } from 'convex/_generated/api';
import type { DataModel } from 'convex/_generated/dataModel';

export const episodeAggregate = new TableAggregate<{
  //   Namespace: string | undefined;
  Key: [number, string];
  DataModel: DataModel;
  TableName: 'episodeStats';
}>(components.aggregateByEpisode, {
  // namespace: (doc) => doc.podcastId,
  sortKey: (doc) => [-doc.playCount, doc.episodeId], // largest --> smallest (podcast ID to simplify populating episode details)
  sumValue: (doc) => doc.playCount, // use for total podcast streams ?? namespace: podId
});

export const podcastAggregate = new TableAggregate<{
  Key: [number, string];
  DataModel: DataModel;
  TableName: 'podcastStats';
}>(components.aggregateByPodcast, {
  sortKey: (doc) => [-doc.playCount, doc.podcastId], // largest --> smallest (podcast ID to simplify populating pod details)
});
