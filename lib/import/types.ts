export type ExtractedExport = {
  followersChunks: unknown[];
  following: unknown;
};

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "no-followers"
      | "no-following"
      | "invalid-json"
      | "empty-input",
  ) {
    super(message);
    this.name = "ImportError";
  }
}
