import "server-only";

export const PUBLIC_CONNECTOR_TIMEOUT_MS = 8_000;

export function connectorTimeoutSignal(timeoutMs = PUBLIC_CONNECTOR_TIMEOUT_MS) {
  return AbortSignal.timeout(timeoutMs);
}

export async function readBoundedResponseText(response: Response, maxBytes: number, source: string) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`${source} response exceeded the ${maxBytes}-byte safety limit.`);
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  const chunks: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`${source} response exceeded the ${maxBytes}-byte safety limit.`);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}
