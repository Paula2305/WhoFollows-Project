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

/** Preserve the exported profile URL, including URLs for deleted accounts. */
export function parseFollowingLinks(data: unknown): Map<string, string> {
  const list = (data as FollowingJson | null)?.relationships_following;
  if (!Array.isArray(list)) {
    throw new ParseError("following JSON must contain a relationships_following array (following.json)");
  }
  const links = new Map<string, string>();
  for (const entry of list) {
    if (typeof entry?.title !== "string" || !entry.title || !Array.isArray(entry.string_list_data)) continue;
    for (const item of entry.string_list_data) {
      if (typeof item?.href !== "string") continue;
      try {
        const url = new URL(item.href);
        if (url.protocol === "https:" &&
          (url.hostname === "instagram.com" || url.hostname === "www.instagram.com") &&
          !url.username && !url.password) {
          links.set(entry.title.toLowerCase(), item.href);
          break;
        }
      } catch {
        // An invalid exported URL should not prevent analysis of the account.
      }
    }
  }
  return links;
}
