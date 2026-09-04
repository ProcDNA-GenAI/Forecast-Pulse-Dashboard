import * as echarts from "echarts";
import { apiUrl, fetchWithSession, readApiError } from "@/utils/api/client";
import type { ChartPayload } from "./types";

const PPTX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function safeFilename(value: string, extension: string) {
  const normalized = Array.from(value.toLowerCase(), (character) => {
    const code = character.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isLetter = code >= 97 && code <= 122;
    return isDigit || isLetter ? character : "_";
  }).join("");
  const compact = normalized.split("_").filter(Boolean).join("_") || "chart";
  return `${compact}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function contentDispositionFilename(value: string | null) {
  if (!value) return null;

  const utf8Marker = "filename*=UTF-8''";
  const utf8Start = value.toLowerCase().indexOf(utf8Marker.toLowerCase());
  if (utf8Start >= 0) {
    const encoded = value.slice(utf8Start + utf8Marker.length).split(";")[0].trim();
    if (encoded) {
      try {
        return decodeURIComponent(encoded);
      } catch {
        return encoded;
      }
    }
  }

  const filenameMarker = "filename=";
  const filenameStart = value.toLowerCase().indexOf(filenameMarker);
  if (filenameStart < 0) return null;
  return value
    .slice(filenameStart + filenameMarker.length)
    .split(";")[0]
    .trim()
    .replaceAll('"', "") || null;
}

export function downloadChartPng(chartElement: HTMLDivElement | null, title: string) {
  if (!chartElement) {
    throw new Error("The chart is not ready to download yet.");
  }

  const instance = echarts.getInstanceByDom(chartElement);
  if (!instance) {
    throw new Error("The chart is not ready to download yet.");
  }

  const dataUrl = instance.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = safeFilename(title, "png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadChartPptx({
  messageId,
  chartGroupIndex,
  chartIndex,
  chart,
}: {
  messageId: number;
  chartGroupIndex: number;
  chartIndex: number;
  chart: ChartPayload;
}) {
  const response = await fetchWithSession(apiUrl(`/dashboard/messages/${messageId}/export-pptx`), {
    method: "POST",
    headers: {
      accept: PPTX_MIME_TYPE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chart_group_index: chartGroupIndex,
      chart_index: chartIndex,
      chart,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(readApiError(bodyText, "Unable to download PowerPoint."));
  }

  const blob = await response.blob();
  const filename = contentDispositionFilename(response.headers.get("content-disposition"))
    || safeFilename(chart.title || "chart_export", "pptx");
  downloadBlob(blob, filename);
}
