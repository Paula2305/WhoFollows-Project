import type { FollowersJson, FollowingJson } from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export function parseFollowers(data: unknown): Set<string> {
  if (!Array.isArray(data)) {
    throw new ParseError(
      "followers JSON must be an array (followers_*.json)",
    );
  }
  const result = new Set<string>();
  for (const entry of data as FollowersJson) {
    const value = entry?.string_list_data?.[0]?.value;
    if (typeof value === "string" && value.length > 0) {
      result.add(value.toLowerCase());
    }
  }
  return result;
}

export function parseFollowing(data: unknown): Set<string> {
  const list = (data as FollowingJson | null)?.relationships_following;
  if (!Array.isArray(list)) {
    throw new ParseError(
      "following JSON must contain a relationships_following array (following.json)",
    );
  }
  const result = new Set<string>();
  for (const entry of list) {
    const title = entry?.title;
    if (typeof title === "string" && title.length > 0) {
      result.add(title.toLowerCase());
    }
  }
  return result;
}

export function mergeFollowers(parts: ReadonlyArray<Set<string>>): Set<string> {
  const merged = new Set<string>();
  for (const part of parts) {
    for (const user of part) merged.add(user);
  }
  return merged;
}
