import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Send,
  MessageCircle,
  Headphones,
  X,
  Clock,
  Star,
  Smile,
  CheckCircle,
  Trash2,
  AlertCircle,
} from "@icons";

const API_URL = import.meta.env.VITE_API_URL?.replace("/graphql", "") || "http://localhost:4000";

/**
 * PortalSupport — Real-time support chat for the client portal.
 * Uses Socket.IO for instant bidirectional communication.
 */
export default function PortalSupport() {
  const { contact } = useOutletContext();
  const [socket, setSocket] = useState(null);
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
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
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

    s.on("conversation:closed", ({ closedBy }) => {
      setChatState("closed");
      if (closedBy !== "el cliente") {
        addToast("El agente ha cerrado la conversación", "info");
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
        } catch {}
      }
    });

    s.on("message:deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
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
      console.error("Socket error:", message);
      setChatState((prev) => ["connecting", "waiting"].includes(prev) ? "idle" : prev);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteTyping]);

  // ── Mark as seen when messages arrive ──
  useEffect(() => {
    if (socket && conversation && chatState === "active" && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender_type === "AGENT") {
        socket.emit("messages:seen", { conversationId: conversation.id });
      }
    }
  }, [messages, chatState]);

  // ── Handle typing ──
  const handleTyping = useCallback(() => {
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
  }, [socket, conversation, isTyping]);

  const startChat = () => {
    if (!socket) return;
    setChatState("waiting");
    socket.emit("conversation:start", {
      contactId: contact.id,
      subject: "Soporte General",
    });
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !socket || !conversation) return;
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

  const deleteMessage = (msgId) => {
    if (!socket || !conversation) return;
    socket.emit("message:delete", {
      messageId: msgId,
      conversationId: conversation.id,
    });
  };

  const handleClose = () => {
    if (!socket || !conversation) return;
    socket.emit("conversation:close", { conversationId: conversation.id });
  };

  const handleRate = (value) => {
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

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* ── Toasts ── */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in-down ${
              t.type === "warn"
                ? "bg-amber-500 text-white"
                : t.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-zinc-800 text-white"
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
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Headphones size={24} color="white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800">Soporte</h2>
          <p className="text-sm text-zinc-500">Chat en tiempo real con nuestro equipo</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-block size-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"}`} />
          <span className="text-xs text-zinc-400">{connected ? "Conectado" : "Desconectado"}</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/60 border border-zinc-100 overflow-hidden">
        {/* ── Idle State ── */}
        {chatState === "idle" && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="size-24 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
              <MessageCircle size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-800 mb-2">¿Necesitas ayuda?</h3>
            <p className="text-zinc-500 mb-8 max-w-md leading-relaxed">
              Nuestro equipo de soporte está listo para ayudarte. Inicia un chat y te conectaremos con un agente en tiempo real.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
              {[
                { icon: Clock, label: "Respuesta rápida", sub: "< 2 min" },
                { icon: Headphones, label: "Soporte experto", sub: "24/7" },
                { icon: CheckCircle, label: "Resolución", sub: "98%" },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div key={i} className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center gap-1">
                  <Icon size={20} className="text-emerald-600 mb-1" />
                  <span className="text-xs font-semibold text-zinc-700">{label}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{sub}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startChat}
              disabled={!connected}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MessageCircle size={18} />
              Iniciar Chat de Soporte
            </button>
            {!connected && <p className="text-xs text-red-400 mt-3">Conectando al servidor...</p>}
          </div>
        )}

        {/* ── Waiting State ── */}
        {chatState === "waiting" && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="size-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Headphones size={32} className="text-amber-600" />
              </div>
              <div className="absolute inset-0 size-20 rounded-full border-2 border-amber-400 animate-ping opacity-30" />
              <div className="absolute inset-0 size-20 rounded-full border-2 border-amber-400 animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Buscando un agente disponible...</h3>
            <p className="text-sm text-zinc-500 mb-4">Un agente se conectará contigo en unos momentos.</p>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="size-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active / Closed Chat ── */}
        {(chatState === "active" || chatState === "closed") && (
          <>
            {/* Chat Header Bar */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm relative">
                  <Headphones size={20} color="white" />
                  {chatState === "active" && (
                    <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-emerald-600 ${agentOnline ? "bg-green-400" : "bg-zinc-400"}`} />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {chatState === "active" ? "Chat de Soporte" : "Chat Finalizado"}
                  </h3>
                  <span className="text-emerald-100 text-xs flex items-center gap-1.5">
                    {chatState === "active" && (
                      <>
                        <span className={`size-1.5 rounded-full inline-block ${agentOnline ? "bg-green-300 animate-pulse" : "bg-zinc-300"}`} />
                        {agentOnline ? "Agente en línea" : "Agente desconectado"}
                      </>
                    )}
                    {chatState === "closed" && "Conversación cerrada"}
                  </span>
                </div>
              </div>
              {chatState === "active" && (
                <button onClick={handleClose} className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-colors" title="Cerrar chat">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div
              className="h-[420px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-50/50 to-white"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}
            >
              {messages.map((msg) => {
                const isClient = msg.sender_type === "CLIENT";
                const isSystem = msg.sender_type === "SYSTEM";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-zinc-100 text-zinc-500 text-xs px-4 py-2 rounded-full max-w-sm text-center">
                        {msg.body}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isClient ? "justify-end" : "justify-start"} group`}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    <div className={`max-w-[75%] ${isClient ? "order-1" : ""}`}>
                      <div className={`flex items-end gap-2 ${isClient ? "flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isClient ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"}`}>
                          {isClient ? (contact?.full_name?.[0] || "C") : <Headphones size={14} />}
                        </div>

                        {/* Bubble */}
                        <div className="relative">
                          <div className={`px-4 py-3 rounded-2xl shadow-sm ${isClient ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md" : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-md"}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                          </div>

                          {/* Delete button — only on own messages, only when active */}
                          {isClient && chatState === "active" && hoveredMsgId === msg.id && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 size-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              title="Eliminar mensaje"
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className={`text-[10px] text-zinc-400 mt-1 ${isClient ? "text-right mr-10" : "ml-10"}`}>
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Seen indicator */}
              {seen && messages.length > 0 && messages[messages.length - 1]?.sender_type === "CLIENT" && (
                <div className="flex justify-end pr-10">
                  <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
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
                    <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Rating (when closed) ── */}
            {chatState === "closed" && (
              <div className="px-6 py-6 border-t border-zinc-100 bg-zinc-50/80 text-center">
                {!rated ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-700 mb-3 flex items-center justify-center gap-2">
                      <Smile size={18} className="text-amber-500" />
                      ¿Cómo fue tu experiencia?
                    </p>
                    <div className="flex justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} onClick={() => handleRate(v)} onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform hover:scale-125">
                          <Star size={28} className={`transition-colors ${v <= (hoverRating || rating) ? "text-amber-400" : "text-zinc-200"}`} strokeWidth={v <= (hoverRating || rating) ? 2.5 : 1.5} />
                        </button>
                      ))}
                    </div>
                    <button onClick={startNewChat} className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                      Iniciar nuevo chat →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star key={v} size={24} className={v <= rating ? "text-amber-400" : "text-zinc-200"} strokeWidth={v <= rating ? 2.5 : 1.5} />
                      ))}
                    </div>
                    <p className="text-sm text-zinc-600 mb-4">¡Gracias por tu calificación!</p>
                    <button onClick={startNewChat} className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-md hover:bg-emerald-700 transition-colors text-sm">
                      Iniciar nuevo chat
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Input Area ── */}
            {chatState === "active" && (
              <form onSubmit={sendMessage} className="border-t border-zinc-100 px-4 py-3 flex items-center gap-3 bg-white">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Escribe tu mensaje…"
                  className="flex-1 px-4 py-3 bg-zinc-50 rounded-xl text-sm border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder:text-zinc-400"
                  autoFocus
                />
                <button type="submit" disabled={!inputText.trim()} className="size-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  <Send size={18} />
                </button>
              </form>
            )}

            {/* Waiting input placeholder */}
            {chatState === "waiting" && (
              <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50">
                <div className="px-4 py-3 bg-zinc-100 rounded-xl text-sm text-zinc-400 text-center">
                  Esperando a que un agente se conecte...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-400">Los mensajes se guardan de forma segura para tu referencia futura.</p>
      </div>
    </div>
  );
}
