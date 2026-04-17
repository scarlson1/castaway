import { describe, expect, it } from 'vitest';
import { isNotNullish, withoutSystemFields } from '../utils/helpers';
import type { Id } from '../_generated/dataModel';

describe('isNotNullish', () => {
  it('returns true for defined values', () => {
    expect(isNotNullish('hello')).toBe(true);
    expect(isNotNullish(0)).toBe(true);
    expect(isNotNullish(false)).toBe(true);
    expect(isNotNullish({})).toBe(true);
    expect(isNotNullish([])).toBe(true);
  });

  it('returns false for null', () => {
    expect(isNotNullish(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNotNullish(undefined)).toBe(false);
  });

  it('works as a type-guard filter predicate', () => {
    const arr: (string | null | undefined)[] = ['a', null, 'b', undefined, 'c'];
    const result = arr.filter(isNotNullish);
    expect(result).toEqual(['a', 'b', 'c']);
  });
});

describe('withoutSystemFields', () => {
  it('removes _id and _creationTime', () => {
    const doc = {
      _id: 'abc123' as Id<'episodes'>,
      _creationTime: 1700000000000,
      title: 'My Episode',
      podcastId: 'pod-1',
    };
    const result = withoutSystemFields(doc);
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('_creationTime');
  });

  it('preserves all other fields', () => {
    const doc = {
      _id: 'abc123' as Id<'episodes'>,
      _creationTime: 1700000000000,
      title: 'My Episode',
      podcastId: 'pod-1',
      publishedAt: 1700000000000,
    };
    const result = withoutSystemFields(doc);
    expect(result).toEqual({
      title: 'My Episode',
      podcastId: 'pod-1',
      publishedAt: 1700000000000,
    });
  });

  it('handles documents with only system fields', () => {
    const doc = {
      _id: 'abc123' as Id<'episodes'>,
      _creationTime: 1700000000000,
    };
    const result = withoutSystemFields(doc);
    expect(result).toEqual({});
  });
});
