import { create } from 'zustand';

// TODO: move queue to db

// TODO: queued episode interface

interface Temp {
  image: string;
  episodeId: string;
  title: string;
  audioUrl: string;
  releaseDateMs: number;
  podName: string;
}

// export interface QueueItem extends EpisodeItem {
//   podId: string;
//   podTitle: string;
// }

// export interface QueueItemAlt extends Doc<'episodes'> {
//   podId: string;
//   podTitle: string;
// }

// type QueueItemCombined = QueueItem & QueueItemAlt

interface QueueState {
  queue: Temp[];
  nowPlaying: Temp | null;
  setPlaying: (ep: Temp) => void;
  addToQueue: (ep: Temp) => void;
}

export const useQueueStore = create<QueueState>()((set) => ({
  queue: [],
  nowPlaying: null,
  setPlaying: (ep: Temp) => set((state) => ({ nowPlaying: ep })),
  addToQueue: (ep: Temp) =>
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
