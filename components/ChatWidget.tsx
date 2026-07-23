"use client";

import { useState, useRef, useEffect } from "react";
import { ensureSession } from "@/lib/tracking-client";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: ChatTurn = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de CajaCrédito Demo. Puedo ayudarte a simular un crédito: contame cuánto necesitás y a qué plazo. Recordá que esta simulación es informativa y no constituye una preaprobación.",
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
        {
          role: "assistant",
          content: "Tuvimos un problema de conexión. Intentá de nuevo en un momento.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[32rem] w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Simulá tu crédito</p>
              <p className="text-xs text-brand-100">Asistente virtual · CajaCrédito Demo</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1 text-white hover:bg-brand-800"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          <p className="border-t border-gray-100 bg-white px-4 py-2 text-[11px] text-gray-400">
            Esta simulación es informativa y no vinculante. No sustituye una solicitud formal
            de crédito.
          </p>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-lg transition hover:bg-brand-700"
        aria-label="Abrir chat de simulación"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
