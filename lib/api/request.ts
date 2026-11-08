import { MAX_REQUEST_BYTES, REQUEST_BODY_TIMEOUT_MS } from "@/lib/config";
import { ApiError } from "./errors";

export async function readJson(request: Request): Promise<unknown> {
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
  }
  const tooLarge = () => new ApiError(413, "PAYLOAD_TOO_LARGE", `Request body must not exceed ${MAX_REQUEST_BYTES} bytes.`);
  const length = request.headers.get("content-length");
  if (length && /^\d+$/.test(length) && Number(length) > MAX_REQUEST_BYTES) {
    throw tooLarge();
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  // One fixed buffer also bounds memory for streams delivering many tiny/empty chunks.
  const bytes = new Uint8Array(MAX_REQUEST_BYTES);
  let size = 0;
  let chunksRead = 0;
  const cancel = () => {
    try { void reader.cancel().catch(() => {}); } catch { /* Never log raw stream errors. */ }
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new ApiError(400, "INVALID_JSON", "Request body could not be read."));
      cancel();
    }, REQUEST_BODY_TIMEOUT_MS);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      if (++chunksRead > MAX_REQUEST_BYTES * 2) {
        cancel();
        throw new ApiError(400, "INVALID_JSON", "Request body could not be read.");
      }
      if (value.byteLength > MAX_REQUEST_BYTES - size) {
        cancel();
        throw tooLarge();
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function assertNoQuery(request?: Request): void {
  if (request && new URL(request.url).search) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.");
  }
}
