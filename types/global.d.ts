declare global {
  var reportCache: Map<string, {
    timestamp?: Date;
    report: Record<string, unknown>;
    filePath?: string;
    format?: string;
    createdAt?: Date;
  }> | undefined;
}

export {};