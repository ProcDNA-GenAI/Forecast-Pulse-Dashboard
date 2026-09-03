"use client";

import { Download, FileText, X } from "lucide-react";
import { useState } from "react";
import { getDocumentDownloadUrl } from "@/utils/chat/api";
import type { DaeChunk } from "@/utils/chat/types";

export function SourceReferenceModal({ chunk, label, onClose }: { chunk?: DaeChunk; label: string; onClose: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    if (!chunk?.document_id) return;
    setIsDownloading(true);
    setError("");
    try {
      const url = await getDocumentDownloadUrl(chunk.document_id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-deep/45 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={`Source ${label}`} className="w-full max-w-xl overflow-hidden rounded-2xl border border-primary/10 bg-surface shadow-[0_26px_80px_rgba(8,50,96,0.25)]">
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{label}</span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-content">{chunk?.document_name || "Source unavailable"}</h3>
            {chunk?.study_name ? <p className="mt-0.5 truncate text-xs text-muted">{chunk.study_name}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close source" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-page hover:text-primary">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {chunk && ["image", "page_image", "chart"].includes(chunk.chunk_type) && chunk.s3_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chunk.s3_url} alt={chunk.document_name} className="w-full rounded-xl border border-border" />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6 text-content">{chunk?.chunk_text || "No preview text is available for this source."}</p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error || chunk?.file_type || "Document"}
          </span>
          {chunk?.document_id ? (
            <button type="button" onClick={() => void download()} disabled={isDownloading} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {isDownloading ? "Preparing…" : "Download original"}
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
