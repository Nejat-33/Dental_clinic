
"use client";

import { useState, type FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type ChatResponse = {
  reply: string;
  channel: string;
  session_id: string;
};

const CHATBOT_API =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL ??
  "http://127.0.0.1:8000";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! Welcome to our dental clinic. How can I help you today?",
    },
  ]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${CHATBOT_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          channel: "website",
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chatbot request failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Keep the same conversation session for the next message.
      setSessionId(data.session_id);

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);
    } catch (error) {
      console.error("Chatbot request failed:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Sorry, I couldn't connect right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setSessionId(null);
    setInput("");
    setMessages([
      {
        role: "assistant",
        text: "Hello! Welcome to our dental clinic. How can I help you today?",
      },
    ]);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section
          className="mb-3 flex h-[480px] w-[min(360px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          aria-label="Dental clinic chatbot"
        >
          <header className="flex items-center justify-between bg-blue-700 px-4 py-4 text-white">
            <div>
              <h2 className="font-semibold">Dental Clinic Assistant</h2>
              <p className="text-xs text-blue-100">
                How can we help you?
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startNewChat}
                className="rounded-lg px-2 py-1 text-xs hover:bg-blue-600"
                aria-label="Start a new chat"
              >
                New chat
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-1 text-xl hover:bg-blue-600"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-700 text-white"
                      : "border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}

            {loading && (
              <p className="text-sm text-gray-500">
                Assistant is typing...
              </p>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask us something..."
              maxLength={2000}
              disabled={loading}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              aria-label="Your message"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-blue-800"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}
