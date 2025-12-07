import type { Id } from 'convex/_generated/dataModel';

export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function withoutSystemFields<
  T extends { _creationTime: number; _id: Id<any> }
>(doc: T) {
  const { _id, _creationTime, ...rest } = doc;
  return rest;
}
