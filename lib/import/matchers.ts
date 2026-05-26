export const FOLLOWERS_FILE = /^followers_\d+\.json$/i;
export const FOLLOWING_FILE = /^following\.json$/i;

export function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? normalized : normalized.slice(idx + 1);
}
