// Ad segments carry two sets of boundaries: the ones the detection pipeline
// produced, and the ones a user corrected by hand. Anything that acts on an ad
// (skipping, timeline display) must prefer the corrections and must ignore ads
// the listeners voted down, so those rules live here rather than in each caller.

export interface AdLike {
  start: number;
  end: number;
  correctedStart?: number;
  correctedEnd?: number;
  verdict?: 'verified' | 'rejected';
}

export const adBounds = (ad: AdLike) => ({
  start: ad.correctedStart ?? ad.start,
  end: ad.correctedEnd ?? ad.end,
});

export const isSkippableAd = (ad: AdLike) => ad.verdict !== 'rejected';

// Returns ads worth skipping, start/end already resolved to corrected values
// and sorted chronologically.
export const resolveSkippableAds = <T extends AdLike>(
  ads: T[] | undefined | null,
): T[] =>
  (ads ?? [])
    .filter(isSkippableAd)
    .map((ad) => ({ ...ad, ...adBounds(ad) }))
    .sort((a, b) => a.start - b.start);
