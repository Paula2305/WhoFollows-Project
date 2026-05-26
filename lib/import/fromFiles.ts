import { FOLLOWERS_FILE, FOLLOWING_FILE, basename } from "./matchers";
import { ImportError, type ExtractedExport } from "./types";

export async function extractFromFiles(
  files: ReadonlyArray<File>,
): Promise<ExtractedExport> {
  const followersFiles: File[] = [];
  let followingFile: File | undefined;

  for (const file of files) {
    const name = basename(file.name);
    if (FOLLOWERS_FILE.test(name)) {
      followersFiles.push(file);
    } else if (FOLLOWING_FILE.test(name) && !followingFile) {
      followingFile = file;
    }
  }

  if (followersFiles.length === 0) {
    throw new ImportError(
      "No followers_*.json file was found in the selection",
      "no-followers",
    );
  }
  if (!followingFile) {
    throw new ImportError(
      "No following.json file was found in the selection",
      "no-following",
    );
  }

  followersFiles.sort((a, b) =>
    a.name.localeCompare(b.name, "en", { numeric: true }),
  );

  const followersChunks: unknown[] = [];
  for (const file of followersFiles) {
    followersChunks.push(await readJson(file));
  }
  const following = await readJson(followingFile);

  return { followersChunks, following };
}

async function readJson(file: File): Promise<unknown> {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new ImportError(
      `Could not parse ${file.name} as JSON`,
      "invalid-json",
    );
  }
}

export async function collectFilesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  const items = Array.from(dataTransfer.items).filter(
    (it) => it.kind === "file",
  );

  const hasDirectory = items.some((it) => {
    const entry = (it as DataTransferItem & {
      webkitGetAsEntry?: () => FileSystemEntry | null;
    }).webkitGetAsEntry?.();
    return entry?.isDirectory ?? false;
  });

  if (!hasDirectory) {
    return Array.from(dataTransfer.files);
  }

  const collected: File[] = [];
  for (const item of items) {
    const entry = (item as DataTransferItem & {
      webkitGetAsEntry?: () => FileSystemEntry | null;
    }).webkitGetAsEntry?.();
    if (entry) await walkEntry(entry, collected);
  }
  return collected;
}

async function walkEntry(
  entry: FileSystemEntry,
  out: File[],
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    out.push(file);
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllEntries(reader);
    for (const child of children) await walkEntry(child, out);
  }
}

function readAllEntries(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const acc: FileSystemEntry[] = [];
    const step = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(acc);
        else {
          acc.push(...batch);
          step();
        }
      }, reject);
    };
    step();
  });
}
