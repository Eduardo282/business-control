import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import { logger } from "../../services/logger";
import {
  Send,
  MessageCircle,
  Headphones,
  X,
  Clock,
  Star,
  Smile,
  CheckCircle,
  AlertCircle,
} from "@icons";

const API_URL = import.meta.env.VITE_API_URL?.replace("/graphql", "") || "http://localhost:4000";

/**
 * PortalSupport — Real-time support chat for the client portal.
 * Uses Socket.IO for instant bidirectional communication.
 */
export default function PortalSupport() {
  const { contact } = useOutletContext();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [chatState, setChatState] = useState("idle"); // idle | waiting | active | closed
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [agentOnline, setAgentOnline] = useState(true);
  const [toasts, setToasts] = useState([]); // {id, text, type, timestamp}
  const [seen, setSeen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toastIdRef = useRef(0);

  // ── Toast helper ──
  const addToast = useCallback((text, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, type, ts: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ── Connect socket ──
  useEffect(() => {
    const token = sessionStorage.getItem("bc_portal_token");
    if (!token) return;

    const s = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on("connect", () => {
      setConnected(true);
    });

    s.on("disconnect", () => {
      setConnected(false);
      addToast("Se perdió la conexión. ReConectando…", "warn");
    });

    s.on("reconnect", () => {
      addToast("Conexión restablecida", "success");
    });

    s.on("conversation:created", ({ conversation: conv, messages: msgs }) => {
      setConversation(conv);
      setMessages(msgs || []);
      if (conv.status === "ACTIVE") {
        setChatState("active");
      } else if (conv.status === "WAITING") {
        setChatState("waiting");
      } else if (conv.status === "CLOSED") {
        setChatState("closed");
      }
    });

    s.on("conversation:assigned", ({ conversation: conv }) => {
      setConversation(conv);
      setChatState("active");
      setAgentOnline(true);
      addToast("Un agente se ha conectado", "success");
    });

    s.on("conversation:closed", ({ conversation: conv, closedBy }) => {
      if (conv) setConversation(conv);
      setChatState("closed");
      if (closedBy !== "el cliente") {
        addToast("El agente suspendió la conversación", "info");
      }
    });

    s.on("message:new", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setRemoteTyping(false);
      setSeen(false);
      // Play notification sound for agent messages
      if (msg.sender_type === "AGENT") {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "sine";
          gain.gain.value = 0.08;
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        } catch (audioError) {
          logger.warn("Unable to play support notification sound", audioError);
        }
      }
    });

    s.on("typing:start", () => setRemoteTyping(true));
    s.on("typing:stop", () => setRemoteTyping(false));

    s.on("conversation:rated", () => setRated(true));

    // ── Presence events ──
    s.on("user:disconnected", ({ isAgent: agentDisc }) => {
      if (agentDisc) {
        setAgentOnline(false);
        addToast("El agente se ha desconectado temporalmente", "warn");
      }
    });

    s.on("user:reconnected", ({ isAgent: agentRecon }) => {
      if (agentRecon) {
        setAgentOnline(true);
        addToast("El agente se ha reconectado", "success");
      }
    });

    // ── Seen receipt ──
    s.on("messages:seen", ({ seenBy }) => {
      if (seenBy === "AGENT") setSeen(true);
    });

    s.on("error", ({ message }) => {
      logger.error("Socket error", message);
      setChatState((prev) => ["connecting", "waiting"].includes(prev) ? "idle" : prev);
    });

    socketRef.current = s;

    return () => {
      socketRef.current = null;
      s.disconnect();
    };
  }, [addToast]);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteTyping]);

  // ── Mark as seen when messages arrive ──
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && conversation && chatState === "active" && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender_type === "AGENT") {
        socket.emit("messages:seen", { conversationId: conversation.id });
      }
    }
  }, [messages, chatState, conversation]);

  // ── Handle typing ──
  const handleTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !conversation) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", { conversationId: conversation.id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: conversation.id });
    }, 2000);
  }, [conversation, isTyping]);

  const startChat = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setChatState("waiting");
    socket.emit("conversation:start", {
      contactId: contact.id,
      subject: "Soporte General",
    });
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    const socket = socketRef.current;
    if (!inputText.trim() || !socket || !conversation || chatState === "closed") return;
    socket.emit("message:send", {
      conversationId: conversation.id,
      body: inputText.trim(),
    });
    setInputText("");
    setIsTyping(false);
    setSeen(false);
    socket.emit("typing:stop", { conversationId: conversation.id });
    inputRef.current?.focus();
  };

  const handleClose = () => {
    const socket = socketRef.current;
    if (!socket || !conversation || chatState === "closed") return;
    socket.emit("conversation:close", { conversationId: conversation.id });
  };

  const handleRate = (value) => {
    const socket = socketRef.current;
    if (!socket || !conversation) return;
    setRating(value);
    socket.emit("conversation:rate", { conversationId: conversation.id, rating: value });
  };

  const startNewChat = () => {
    setConversation(null);
    setMessages([]);
    setChatState("idle");
    setRating(0);
    setRated(false);
    setSeen(false);
    setAgentOnline(true);
  };

  const fmtTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };
  const isChatClosed = chatState === "closed";
  const isChatVisible = chatState === "active" || isChatClosed;

  return (
    <div className="max-w-4xl mx-auto relative text-zinc-800 dark:text-zinc-100">
      {/* ── Toasts ── */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in-down ${
              t.type === "warn"
                ? "bg-amber-500 dark:bg-amber-400 text-amber-950"
                : t.type === "success"
                ? "bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-950"
                : "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
            }`}
            style={{ animation: "fadeInDown 0.3s ease-out" }}
          >
            {t.type === "warn" && <AlertCircle size={16} />}
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "info" && <MessageCircle size={16} />}
            {t.text}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgDelete {
          to { opacity: 0; transform: scale(0.8) translateX(20px); height: 0; margin: 0; padding: 0; }
        }
        .portal-support-messages {
          scrollbar-width: thin;
          scrollbar-color: #a1a1aa transparent;
        }
        .dark .portal-support-messages {
          scrollbar-color: #52525b transparent;
        }
        .portal-support-messages::-webkit-scrollbar {
          width: 8px;
        }
        .portal-support-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .portal-support-messages::-webkit-scrollbar-thumb {
          background: #a1a1aa;
          border: 2px solid transparent;
          border-radius: 999px;
          background-clip: padding-box;
        }
        .dark .portal-support-messages::-webkit-scrollbar-thumb {
          background: #52525b;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-2xl flex items-center justify-center">
          <Headphones size={24} className="text-black dark:text-zinc-100" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Soporte</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chat con nuestro equipo de soporte</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-block size-2.5 rounded-full ${connected ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600"}`} />
          <span className={`text-xs ${connected ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>{connected ? "Conectado" : "Desconectado"}</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/60 dark:shadow-black/40 border border-zinc-100 dark:border-zinc-700 overflow-hidden">
        {/* ── Idle State ── */}
        {chatState === "idle" && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="size-24 rounded-full flex items-center justify-center mb-6">
              <MessageCircle size={40} className="text-[#1B4733] dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">¿Necesitas ayuda?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md leading-relaxed">
              Nuestro equipo de soporte está listo para ayudarte. Inicia un chat y conectaremos con un agente.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
              {[
                { icon: Clock, label: "Respuesta rápida", sub: "< 2 min" },
                { icon: Headphones, label: "Soporte experto", sub: "24/7" },
                { icon: CheckCircle, label: "Resolución", sub: "98%" },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 flex flex-col items-center gap-1 border border-transparent dark:border-zinc-800">
                  <Icon size={20} className="text-[#1B4733] dark:text-emerald-400 mb-1" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
                  <span className="text-[10px] text-[#1B4733] dark:text-emerald-400 font-bold">{sub}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startChat}
              disabled={!connected}
              className="px-8 py-3.5 bg-[#1B4733] dark:bg-emerald-700 text-white font-bold rounded-2xl hover:bg-[#153828] dark:hover:bg-emerald-600 transition-colors duration-200 disabled:bg-[#1B4733]/50 dark:disabled:bg-emerald-950 disabled:text-white/60 dark:disabled:text-zinc-500 disabled:opacity-100 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30"
            >
              <MessageCircle size={18} />
              Iniciar Chat de Soporte
            </button>
            {!connected && <p className="text-xs text-red-600 dark:text-red-400 mt-3">Conectando al servidor...</p>}
          </div>
        )}

        {/* ── Waiting State ── */}
        {chatState === "waiting" && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="size-20 rounded-full flex items-center justify-center">
                <Headphones size={32} className="text-amber-700 dark:text-amber-300" />
              </div>
              <div className="absolute inset-0 size-20 rounded-full border-2 border-amber-400 dark:border-amber-300 animate-ping opacity-30" />
              <div className="absolute inset-0 size-20 rounded-full border-2 border-amber-400 dark:border-amber-300 animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">Buscando un agente disponible...</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Un agente se conectará contigo en unos momentos.</p>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="size-2 rounded-full bg-amber-500 dark:bg-amber-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active or suspended Chat ── */}
        {isChatVisible && (
          <>
            {/* Chat Header Bar */}
            <div className="bg-[#1B4733] dark:bg-emerald-950 px-6 py-4 flex items-center justify-between border-b border-transparent dark:border-emerald-900">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center backdrop-blur-sm relative">
                  <Headphones size={20} color="white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Chat de Soporte
                  </h3>
                  <span className="text-white/80 text-xs flex items-center gap-1.5">
                    {isChatClosed ? (
                      <>
                        <span className="size-1.5 rounded-full inline-block bg-zinc-300 dark:bg-zinc-500" />
                        Chat suspendido
                      </>
                    ) : (
                      <>
                      <span className={`size-1.5 rounded-full inline-block ${agentOnline ? "bg-green-300 dark:bg-emerald-300 animate-pulse" : "bg-zinc-300 dark:bg-zinc-500"}`} />
                      {agentOnline ? "Agente en línea" : "Agente desconectado"}
                      </>
                    )}
                  </span>
                </div>
              </div>
              {isChatClosed ? (
                <span className="rounded-xl bg-white/10 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 dark:text-white/80">
                  Suspendido
                </span>
              ) : (
                <button onClick={handleClose} className="text-white/70 dark:text-white/70 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-xl p-2 transition-colors" title="Suspender chat">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div
              className="portal-support-messages h-[420px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-950 dark:to-zinc-900"
            >
              {messages.map((msg) => {
                const isClient = msg.sender_type === "CLIENT";
                const isSystem = msg.sender_type === "SYSTEM";

                if (isSystem) {
                  const text = String(msg.body || "").trim();
                  if (text.startsWith("Bienvenido al chat de soporte")) {
                    return null;
                  }
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-4 py-2 rounded-full max-w-sm text-center border border-transparent dark:border-zinc-700">
                        {msg.body}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isClient ? "justify-end" : "justify-start"} group`}
                  >
                    <div className={`max-w-[75%] ${isClient ? "order-1" : ""}`}>
                      <div className={`flex items-end gap-2 ${isClient ? "flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isClient ? "bg-[#1B4733] dark:bg-emerald-700 text-white" : "bg-[#1e3a8a] dark:bg-blue-500 text-white dark:text-blue-950"}`}>
                          {isClient ? (contact?.full_name?.[0] || "C") : <Headphones size={14} />}
                        </div>

                        {/* Bubble */}
                        <div className="relative">
                          <div className={`px-4 py-3 rounded-2xl ${isClient ? "bg-[#1B4733] dark:bg-emerald-700 text-white rounded-br-md" : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-bl-md shadow-sm dark:shadow-black/20"}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className={`text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 ${isClient ? "text-right mr-10" : "ml-10"}`}>
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Seen indicator */}
              {seen && messages.length > 0 && messages[messages.length - 1]?.sender_type === "CLIENT" && (
                <div className="flex justify-end pr-10">
                  <span className="text-[10px] text-[#1B4733] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle size={10} /> Visto
                  </span>
                </div>
              )}

              {/* Typing indicator */}
              {remoteTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Headphones size={14} color="white" />
                    </div>
                    <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm dark:shadow-black/20">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            {isChatClosed ? (
              <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                Este chat está suspendido. El historial permanece guardado.
              </div>
            ) : (
              <form onSubmit={sendMessage} className="border-t border-zinc-100 dark:border-zinc-700 px-4 py-3 flex items-center gap-3 bg-white dark:bg-zinc-900">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Escribe tu mensaje…"
                  className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1B4733]/20 dark:focus:ring-emerald-400/30 focus:border-[#1B4733] dark:focus:border-emerald-400 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  autoFocus
                />
                <button type="submit" disabled={!inputText.trim()} className="size-11 rounded-xl bg-[#1B4733] dark:bg-emerald-700 text-white flex items-center justify-center hover:bg-[#153828] dark:hover:bg-emerald-600 transition-colors disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30">
                  <Send size={18} />
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Rating Only (when closed) ── */}
        {chatState === "closed" && (
          <div className="px-6 py-10 text-center">
            {!rated ? (
              <>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3 flex items-center justify-center gap-2">
                  <Smile size={18} className="text-amber-500 dark:text-amber-300" />
                  ¿Cómo fue tu experiencia?
                </p>
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => handleRate(v)} onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform hover:scale-125">
                      <Star size={28} className={`transition-colors ${v <= (hoverRating || rating) ? "text-amber-400 dark:text-amber-300" : "text-zinc-200 dark:text-zinc-700"}`} strokeWidth={v <= (hoverRating || rating) ? 2.5 : 1.5} />
                    </button>
                  ))}
                </div>
                <button onClick={startNewChat} className="text-sm text-[#1B4733] dark:text-emerald-400 font-semibold hover:text-[#153828] dark:hover:text-emerald-300 transition-colors">
                  Iniciar nuevo chat →
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} size={24} className={v <= rating ? "text-amber-400 dark:text-amber-300" : "text-zinc-200 dark:text-zinc-700"} strokeWidth={v <= rating ? 2.5 : 1.5} />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">¡Gracias por tu calificación!</p>
                <button onClick={startNewChat} className="px-6 py-2.5 font-semibold rounded-xl transition-colors text-sm text-[#1B4733] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15">
                  Iniciar nuevo chat →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Los mensajes se guardan de forma segura para tu referencia futura.</p>
      </div>
    </div>
  );
}
