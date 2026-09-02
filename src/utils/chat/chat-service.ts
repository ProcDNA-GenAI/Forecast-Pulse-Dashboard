import type { ChatTransport } from "./types";

function waitForPreviewResponse(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("The chat request was cancelled.", "AbortError"));
    };

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, 650);

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

/**
 * Single integration point for the future chat API. It can return a complete
 * response or call options.onChunk as streaming fragments arrive.
 */
export const sendDashboardChat: ChatTransport = async (_messages, options) => {
  await waitForPreviewResponse(options?.signal);

  return {
    content:
      "<p><strong>Your message was received.</strong></p><p>The assistant panel is currently using its local preview adapter. Connect the chat endpoint in <code>src/utils/chat/chat-service.ts</code> when the API contract is available; the UI already supports both complete and streamed HTML responses.</p>",
    contentType: "html",
  };
};
