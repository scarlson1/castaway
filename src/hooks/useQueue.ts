import { create } from 'zustand';
import type { EpisodeItem } from '~/lib/podcastIndexTypes';

// TODO: move queue to db

// TODO: queued episode interface

export interface QueueItem extends EpisodeItem {
  podId: string;
  podTitle: string;
}

interface QueueState {
  queue: QueueItem[];
  nowPlaying: QueueItem | null;
  setPlaying: (ep: QueueItem) => void;
  addToQueue: (ep: QueueItem) => void;
}

export const useQueue = create<QueueState>()((set) => ({
  queue: [],
  nowPlaying: null,
  setPlaying: (ep: QueueItem) => set((state) => ({ nowPlaying: ep })),
  addToQueue: (ep: QueueItem) =>
    set(({ queue, nowPlaying }) => ({ nowPlaying, queue: [...queue, ep] })),
}));

// function BearCounter() {
//   const bears = useBear((state) => state.bears)
//   return <h1>{bears} bears around here...</h1>
// }

// function Controls() {
//   const increasePopulation = useBear((state) => state.increasePopulation)
//   return <button onClick={increasePopulation}>one up</button>
// }
