import type { AnalysisResult } from "./types";

export function findNonFollowers(
  following: Set<string>,
  followers: Set<string>,
): AnalysisResult {
  const notFollowingBack: string[] = [];
  for (const user of following) {
    if (!followers.has(user)) notFollowingBack.push(user);
  }
  notFollowingBack.sort();
  return {
    notFollowingBack,
    followingCount: following.size,
    followersCount: followers.size,
  };
}
