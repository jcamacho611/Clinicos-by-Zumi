"use client";

import { useState } from "react";
import { History, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationMessage = { id: string; role: "user" | "assistant"; text: string };
type ConversationSummary = { id: string; title: string; createdAt: string; lastMessageAt: string };
type LoadedConversation = {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
};

function historyTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function ZumiConversationHistory({
  activeConversationId,
  onLoad,
  onDeleted,
}: {
  activeConversationId: string | null;
  onLoad: (conversation: LoadedConversation) => void;
  onDeleted: (conversationId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/zumi/conversations", { cache: "no-store" });
      const payload = (await response.json()) as { data?: ConversationSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Conversation history is unavailable.");
      setConversations(payload.data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conversation history is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await refresh();
  }

  async function loadConversation(id: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/zumi/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: LoadedConversation; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Conversation could not be loaded.");
      onLoad(payload.data);
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conversation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Delete this Zumi conversation? This removes its encrypted history.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/zumi/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Conversation could not be deleted.");
      onDeleted(id);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conversation could not be deleted.");
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-label="Open Zumi conversation history"
        className={cn("grid size-8 place-items-center rounded-lg text-[#b89f9b] hover:bg-[#e6817b]/10 hover:text-[#f8efed]", open && "bg-[#e6817b]/10 text-[#f8efed]")}
        onClick={() => void toggle()}
        title="Conversation history"
        type="button"
      >
        <History className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e6817b]/18 bg-[#0b0507] shadow-[0_24px_80px_rgba(0,0,0,.55)]">
          <div className="flex items-center gap-3 border-b border-[#e6817b]/12 px-4 py-3">
            <History className="size-4 text-[#e6817b]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#fff8f6]">Conversation history</p>
              <p className="text-[9px] text-[#806965]">Encrypted · private to this Klinikos account</p>
            </div>
            <button aria-label="Close conversation history" className="grid size-7 place-items-center rounded-lg text-[#9f8985] hover:bg-[#e6817b]/10 hover:text-[#fff8f6]" onClick={() => setOpen(false)} type="button"><X className="size-3.5" /></button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading && <div className="flex items-center gap-2 px-3 py-4 text-[10px] text-[#9f8985]"><Loader2 className="size-3.5 motion-safe:animate-spin" />Loading encrypted history…</div>}
            {error && <div className="m-2 rounded-xl border border-[#a53e49]/30 bg-[#2b1015] p-3 text-[10px] text-[#f5c3c0]">{error}</div>}
            {!loading && !error && conversations.length === 0 && <div className="px-3 py-8 text-center text-[10px] leading-5 text-[#806965]">No saved conversations yet. Your first successful Zumi turn will create one.</div>}
            {!loading && conversations.map((conversation) => (
              <div className={cn("group flex items-start gap-2 rounded-xl border p-2.5", activeConversationId === conversation.id ? "border-[#e6817b]/25 bg-[#e6817b]/[.08]" : "border-transparent hover:border-[#e6817b]/10 hover:bg-[#e6817b]/[.04]")} key={conversation.id}>
                <button className="min-w-0 flex-1 text-left" onClick={() => void loadConversation(conversation.id)} type="button">
                  <p className="truncate text-[11px] font-semibold text-[#f8efed]">{conversation.title}</p>
                  <p className="mt-1 text-[9px] text-[#806965]">{historyTime(conversation.lastMessageAt)}</p>
                </button>
                <button aria-label="Delete conversation" className="grid size-7 shrink-0 place-items-center rounded-lg text-[#725d59] opacity-0 transition hover:bg-[#a53e49]/15 hover:text-[#f5c3c0] group-hover:opacity-100 focus:opacity-100" onClick={() => void deleteConversation(conversation.id)} title="Delete conversation" type="button"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
