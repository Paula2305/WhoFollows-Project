import { FOLLOWERS_FILE, FOLLOWING_FILE, basename } from "./matchers";
import { ImportError, type ExtractedExport } from "./types";

export async function extractFromZip(file: File): Promise<ExtractedExport> {
  const { unzip } = await import("fflate");
  const buffer = new Uint8Array(await file.arrayBuffer());

  const entries = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(
        buffer,
        {
          filter: (entry) => {
            const name = basename(entry.name);
            return FOLLOWERS_FILE.test(name) || FOLLOWING_FILE.test(name);
          },
        },
        (err, unzipped) => {
          if (err) reject(err);
          else resolve(unzipped);
        },
      );
    },
  );

  const decoder = new TextDecoder("utf-8");
  const followersChunks: unknown[] = [];
  let following: unknown = undefined;

  const sortedPaths = Object.keys(entries).sort((a, b) =>
    basename(a).localeCompare(basename(b), "en", { numeric: true }),
  );

  for (const path of sortedPaths) {
    const name = basename(path);
    const text = decoder.decode(entries[path]);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ImportError(
        `Could not parse ${name} as JSON`,
        "invalid-json",
      );
    }
    if (FOLLOWERS_FILE.test(name)) {
      followersChunks.push(parsed);
    } else if (FOLLOWING_FILE.test(name)) {
      following = parsed;
    }
  }

  if (followersChunks.length === 0) {
    throw new ImportError(
      "ZIP does not contain any followers_*.json file",
      "no-followers",
    );
  }
  if (following === undefined) {
    throw new ImportError(
      "ZIP does not contain following.json",
      "no-following",
    );
  }

  return { followersChunks, following };
}
