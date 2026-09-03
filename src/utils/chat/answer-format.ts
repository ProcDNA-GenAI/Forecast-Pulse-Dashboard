const MARKUP_FENCE_OPENERS = new Map([
  ["```html", "```"],
  ["```xml", "```"],
  ["~~~html", "~~~"],
  ["~~~xml", "~~~"],
]);

const HTML_BLOCK_TAG = /^\s+(?=<\/?(?:response|answer|h[1-6]|p|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|blockquote|div|section|article|br)\b)/i;

function removeMarkupFences(content: string) {
  const output: string[] = [];
  let closingFence = "";

  for (const line of content.split("\n")) {
    const normalizedLine = line.trim().toLowerCase();

    if (!closingFence) {
      const expectedCloser = MARKUP_FENCE_OPENERS.get(normalizedLine);
      if (expectedCloser) {
        closingFence = expectedCloser;
        continue;
      }
    } else if (normalizedLine === closingFence) {
      closingFence = "";
      continue;
    }

    output.push(line);
  }

  return output.join("\n");
}

function unwrapElement(content: string, tagName: string) {
  const trimmed = content.trim();
  const openingTag = `<${tagName}>`;
  const closingTag = `</${tagName}>`;
  const lowerContent = trimmed.toLowerCase();

  if (!lowerContent.startsWith(openingTag) || !lowerContent.endsWith(closingTag)) {
    return trimmed;
  }

  return trimmed.slice(openingTag.length, -closingTag.length).trim();
}

/** Normalizes InsightSphere's HTML/XML without changing ordinary Compass Markdown. */
export function formatDocumentAnswer(content: string) {
  const normalized = removeMarkupFences(content.replaceAll("\r\n", "\n"))
    .split("\n")
    .map((line) => line.replace(HTML_BLOCK_TAG, ""))
    .join("\n")
    .trim();

  return unwrapElement(unwrapElement(normalized, "response"), "answer");
}
