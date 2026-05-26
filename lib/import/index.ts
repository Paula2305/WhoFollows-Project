import { extractFromZip } from "./fromZip";
import { extractFromFiles, collectFilesFromDataTransfer } from "./fromFiles";
import { ImportError, type ExtractedExport } from "./types";

export { ImportError };
export type { ExtractedExport };

export async function extractFromInput(
  input: File | ReadonlyArray<File> | DataTransfer,
): Promise<ExtractedExport> {
  const files =
    input instanceof File
      ? [input]
      : input instanceof DataTransfer
        ? await collectFilesFromDataTransfer(input)
        : Array.from(input);

  if (files.length === 0) {
    throw new ImportError("No files were provided", "empty-input");
  }

  if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
    return extractFromZip(files[0]);
  }

  return extractFromFiles(files);
}
