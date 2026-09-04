"use client";

import { Bot, ChevronDown, Copy, Database, Lightbulb, UserRound } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useId, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/utils/auth/types";
import { formatDocumentAnswer } from "@/utils/chat/answer-format";
import type { AnswerDataSource, ChatMessage as ChatMessageModel, DaeChunk } from "@/utils/chat/types";
import { withDisplayProductName } from "@/utils/product-name";
import { ChatChartGroup, StreamingChatChart } from "./ChatChart";
import { ChatProcessing, DocumentProcessing } from "./ChatProcessing";
import { ChatResultTable } from "./ChatResultTable";
import { SourceReferenceModal } from "./SourceReferenceModal";

const citationPattern = /\[([^\[\]]+)\]/g;
const answerSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href || []), "citation"],
  },
};

function markCitations(content: string) {
  return content.replace(citationPattern, (match, label: string) =>
    `<a href="citation://${encodeURIComponent(label)}">${match}</a>`,
  );
}

function answerUrlTransform(url: string) {
  return url.startsWith("citation://") ? url : defaultUrlTransform(url);
}

function sourceName(source: AnswerDataSource) {
  return withDisplayProductName(
    source.full_name || source.full_path || source.table || source.source || source.schema || "Data source",
  );
}

function findCitationChunk(label: string, chunks: DaeChunk[], chunkMap: Record<string, string>) {
  const chunkId = chunkMap[label] || label;
  return chunks.find((chunk) => chunk.chunk_id === chunkId);
}

function Disclosure({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-primary/10 bg-surface shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-controls={contentId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">{icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-primary">{title}</span>
            {subtitle ? <span className="block truncate text-[10px] text-muted">{subtitle}</span> : null}
          </span>
        </button>
        {action}
        <button type="button" onClick={() => setIsOpen((current) => !current)} aria-label={`Toggle ${title}`} className="cursor-pointer text-primary">
          <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      {isOpen ? <div id={contentId} className="border-t border-primary/10 px-3 py-3">{children}</div> : null}
    </section>
  );
}

function DataSources({ sources }: { sources: AnswerDataSource[] }) {
  const names = useMemo(() => Array.from(new Set(sources.map(sourceName))), [sources]);
  if (!names.length) return null;
  return (
    <Disclosure title="Sources" subtitle={`${names.length} data source${names.length === 1 ? "" : "s"}`} icon={<Database className="h-3.5 w-3.5" aria-hidden="true" />}>
      <ul className="space-y-1.5 text-[11px] leading-4 text-content">
        {names.map((name) => <li key={name} className="rounded-lg bg-page px-2.5 py-2 font-medium">{name}</li>)}
      </ul>
    </Disclosure>
  );
}

function SqlDisclosure({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Disclosure
      title="Generated SQL"
      subtitle="Query used for this answer"
      icon={<Database className="h-3.5 w-3.5" aria-hidden="true" />}
      action={
        <button type="button" onClick={() => void copy()} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary/15 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/5">
          <Copy className="h-3 w-3" aria-hidden="true" />{copied ? "Copied" : "Copy"}
        </button>
      }
    >
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-primary-deep p-3 text-[10px] leading-4 text-white"><code>{sql}</code></pre>
    </Disclosure>
  );
}

function Clarification({ prompt, onAsk }: { prompt: string; onAsk: (question: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const answer = value.trim();
    if (!answer) return;
    setValue("");
    onAsk(answer);
  };
  return (
    <div className="mt-3 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3">
      <p className="text-xs font-semibold leading-5 text-content">{prompt}</p>
      <div className="mt-2 flex gap-2">
        <input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="Type your clarification…" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-secondary" />
        <button type="button" disabled={!value.trim()} onClick={submit} className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}

function AssistantAnswer({ message, onAsk }: { message: ChatMessageModel; onAsk: (question: string) => void }) {
  const [citation, setCitation] = useState<{ label: string; chunk?: DaeChunk } | null>(null);
  const meta = message.meta;
  const dae = meta?.dae;
  const isDocumentAnswer = meta?.route === "DAE" || meta?.route === "BR";
  const displayContent = withDisplayProductName(message.content);
  const formattedContent = isDocumentAnswer ? formatDocumentAnswer(displayContent) : displayContent;
  const markdown = isDocumentAnswer ? markCitations(formattedContent) : formattedContent;
  const chartGroups = meta?.chartGroups?.length
    ? meta.chartGroups
    : meta?.charts?.length
      ? [{ recommendedIndex: 0, variants: meta.charts }]
      : [];

  if (isDocumentAnswer && message.status === "streaming" && !formattedContent) {
    return (
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-0.5">
          <DocumentProcessing steps={meta?.processingSteps || []} />
          <p className="mt-1 pl-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
            {meta?.route === "BR" ? "Business rules" : "Market research"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 max-w-[calc(100%-2.625rem)] flex-1">
          <div className={`rounded-2xl rounded-tl-sm border px-3.5 py-3 shadow-sm ${message.status === "error" ? "border-danger/20 bg-danger/5" : "border-primary/10 bg-surface"}`}>
            {!isDocumentAnswer ? (
              <ChatProcessing
                steps={meta?.processingSteps || []}
                isStreaming={message.status === "streaming"}
                confidenceScore={meta?.confidenceScore}
                confidenceReason={meta?.confidenceReason}
              />
            ) : null}

            {meta?.streamingChart ? <StreamingChatChart chart={meta.streamingChart} /> : null}
            {chartGroups.map((group, index) => (
              <ChatChartGroup
                key={`${group.title || "chart"}-${index}`}
                group={group}
                groupIndex={index}
                messageId={message.backendId}
              />
            ))}

            {message.content ? (
              <div className="chat-markdown text-[13px] leading-[1.6] text-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={isDocumentAnswer ? [rehypeRaw, [rehypeSanitize, answerSanitizeSchema]] : []}
                  urlTransform={isDocumentAnswer ? answerUrlTransform : undefined}
                  components={{
                    a: ({ href, children, ...props }) => {
                      if (href?.startsWith("citation://") && dae) {
                        const label = decodeURIComponent(href.slice("citation://".length));
                        return (
                          <button type="button" onClick={() => setCitation({ label, chunk: findCitationChunk(label, dae.chunks, dae.chunkIdMap) })} className="mx-0.5 inline-flex h-5 min-w-5 cursor-pointer items-center justify-center rounded-full bg-primary/10 px-1.5 align-super text-[10px] font-bold leading-none text-primary transition hover:bg-primary/20" aria-label={`Open source ${label}`}>
                            {label}
                          </button>
                        );
                      }
                      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            ) : null}

            {meta?.clarificationNeeded ? (
              <Clarification prompt={withDisplayProductName(meta.clarificationNeeded)} onAsk={onAsk} />
            ) : null}

            {meta?.insights?.length ? (
              <section className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-primary"><Lightbulb className="h-3.5 w-3.5 text-accent" aria-hidden="true" />Key insights</h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-4 text-content">
                  {meta.insights.map((insight, index) => (
                    <li key={`${insight}-${index}`}>{withDisplayProductName(insight)}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {meta?.resultTable ? <ChatResultTable table={meta.resultTable} notes={meta.tableReadingNotes} /> : null}
            {meta?.dataSources?.length ? <DataSources sources={meta.dataSources} /> : null}
            {meta?.sql ? <SqlDisclosure sql={meta.sql} /> : null}

            {typeof meta?.cost?.total_usd === "number" ? (
              <p className="mt-3 text-right text-[9px] font-medium text-muted">Request cost: ${meta.cost.total_usd.toFixed(4)}</p>
            ) : null}
          </div>
          {meta?.route ? <p className="mt-1 pl-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{meta.route === "DAE" ? "Market research" : meta.route === "BR" ? "Business rules" : "Connected data"}</p> : null}
        </div>
      </div>
      {citation ? <SourceReferenceModal chunk={citation.chunk} label={citation.label} onClose={() => setCitation(null)} /> : null}
    </>
  );
}

function UserMessage({ message, user }: { message: ChatMessageModel; user: AuthUser | null }) {
  const initials = (user?.displayName || user?.username || "You")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-primary-deep px-3.5 py-2.5 text-[13px] leading-[1.55] text-white shadow-sm">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary-deep shadow-sm" title={user?.displayName || user?.username || "You"}>
        {initials || <UserRound className="h-4 w-4" aria-hidden="true" />}
      </span>
    </div>
  );
}

export function ChatMessage({ message, user, onAsk }: { message: ChatMessageModel; user: AuthUser | null; onAsk: (question: string) => void }) {
  return message.role === "user"
    ? <UserMessage message={message} user={user} />
    : <AssistantAnswer message={message} onAsk={onAsk} />;
}
