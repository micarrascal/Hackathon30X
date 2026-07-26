"use client";

import { useState, useRef, useEffect } from "react";
import { ensureSession } from "@/lib/tracking-client";
import WoopyMascot from "@/components/woop/WoopyMascot";
import { Y, R, T, I, C } from "@/components/woop/tokens";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: ChatTurn = {
  role: "assistant",
  content:
    "¡Hola! 👋 Soy Woopy, tu asistente de créditos. Contame cuánto necesitás y a qué plazo, y te ayudo a simularlo. Recordá que esta simulación es informativa y no constituye una preaprobación.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: ChatTurn[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { userId, sessionId } = await ensureSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userId, sessionId }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Tuvimos un problema de conexión. Intentá de nuevo en un momento." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      {open && (
        <div
          className="mb-3 flex h-[34rem] w-80 flex-col overflow-hidden rounded-3xl shadow-2xl sm:w-96"
          style={{ background: C }}
        >
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: `linear-gradient(160deg, ${I} 0%, #0F2460 100%)` }}>
            <div className="relative">
              <WoopyMascot size={40} mood="wave" />
              <div
                className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                style={{ background: "#22c55e" }}
              />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-white">Woopy ✨</p>
              <p className="font-data text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Asistente de créditos Colsubsidio
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1.5 text-white transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mt-1 shrink-0">
                    <WoopyMascot size={28} />
                  </div>
                )}
                <div
                  className="max-w-[80%] whitespace-pre-wrap px-4 py-2.5 text-sm font-data leading-relaxed"
                  style={{
                    background: m.role === "assistant" ? "white" : `linear-gradient(135deg, ${Y}, ${R})`,
                    color: m.role === "assistant" ? I : "white",
                    borderRadius: m.role === "assistant" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                    boxShadow: "0 2px 8px rgba(22,41,77,0.08)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <WoopyMascot size={28} />
                <div className="flex gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full"
                      style={{ background: `${I}50`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="border-t border-black/5 bg-white px-4 py-2 font-data text-[11px]" style={{ color: `${I}50` }}>
            Simulación informativa y no vinculante. No sustituye una solicitud formal de crédito.
          </p>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-black/5 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí un mensaje a Woopy..."
              className="font-data flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
              style={{ background: C, border: `1.5px solid ${I}12`, color: I }}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white transition active:scale-95 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${Y}, ${R})` }}
            >
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-lg transition active:scale-95"
        style={{ background: `linear-gradient(135deg, ${Y}, ${R})`, boxShadow: "0 12px 32px rgba(255,107,74,0.4)" }}
        aria-label="Abrir chat de simulación"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
