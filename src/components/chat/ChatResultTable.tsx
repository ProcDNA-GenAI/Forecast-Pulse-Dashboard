"use client";

import { ChevronDown, Download, Table2 } from "lucide-react";
import { useId, useState } from "react";
import type { ResultTablePayload } from "@/utils/chat/types";

function formatHeader(value: string) {
  return value.split("_").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return String(value);
}

function downloadCsv(table: ResultTablePayload) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    table.columns.map(escape).join(","),
    ...table.rows.map((row) => table.columns.map((column) => escape(row[column])).join(",")),
  ];
  const url = URL.createObjectURL(new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "forecast-pulse-results.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ChatResultTable({ table, notes = [] }: { table: ResultTablePayload; notes?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-primary/10 bg-surface shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-primary">Data table</span>
            <span className="block text-[10px] text-muted">{table.totalRowCount.toLocaleString("en-US")} results</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(table)}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-primary/15 bg-page px-2 py-1.5 text-[10px] font-semibold text-primary hover:border-secondary"
        >
          <Download className="h-3 w-3" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => setIsOpen((current) => !current)} aria-label="Toggle data table" className="cursor-pointer text-primary">
          <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {isOpen ? (
        <div id={contentId} className="border-t border-primary/10">
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full border-collapse text-[10px]">
              <thead className="sticky top-0 z-10 bg-primary-deep text-white">
                <tr>{table.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{formatHeader(column)}</th>)}</tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border last:border-0 even:bg-page/60">
                    {table.columns.map((column) => <td key={column} className="max-w-[220px] px-3 py-2 align-top text-content">{formatCell(row[column])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.incompleteNote ? <p className="border-t border-warning/20 bg-warning/5 px-3 py-2 text-[10px] font-semibold text-content">{table.incompleteNote}</p> : null}
          {notes.length ? (
            <div className="border-t border-primary/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">How to read the table</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[10px] leading-4 text-muted">
                {notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
