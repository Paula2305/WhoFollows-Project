/** A local heuristic, not a live check of whether the profile exists. */
export function isPossiblyDeleted(username: string): boolean {
  return username.toLowerCase().startsWith("__deleted__");
}

export function classifyProfiles(usernames: readonly string[]): {
  regular: string[];
  possiblyDeleted: string[];
} {
  const regular: string[] = [];
  const possiblyDeleted: string[] = [];
  for (const username of usernames) {
    (isPossiblyDeleted(username) ? possiblyDeleted : regular).push(username);
  }
  return { regular, possiblyDeleted };
}
