export type BrowserTargetCommand = (
  method: string,
  params?: Record<string, unknown>,
  timeoutMs?: number,
) => Promise<{
  targetInfos?: Array<{ targetId?: string; type?: string; url?: string }>;
  targetId?: string;
  sessionId?: string;
  [key: string]: unknown;
}>;

export function attachBrowserPageTarget(options: {
  command: BrowserTargetCommand;
  delay?: (milliseconds: number) => Promise<unknown>;
  maxAttempts?: number;
}): Promise<{
  sessionId: string;
  targetId: string;
  targetSource: "existing" | "created";
}>;
