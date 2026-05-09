import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../../context/AuthContext";
import { Headphones, MessageCircle, Send, Clock, User, X, CheckCircle, Inbox, Mail, Trash2, AlertCircle } from "@icons";

const API_URL = import.meta.env.VITE_API_URL?.replace("/graphql", "") || "http://localhost:4000";

export default function AgentSupport() {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConv, setCurrentConv] = useState(null);
  const [clientOnline, setClientOnline] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [seen, setSeen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toastIdRef = useRef(0);
  const selectedConvIdRef = useRef(null);

  // Keep ref in sync for closures
  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);

  const addToast = useCallback((text, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("bc_token");
    if (!token) return;
    const s = io(API_URL, { auth: { token }, transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });

    s.on("connect", () => { setConnected(true); s.emit("queue:list"); });
    s.on("disconnect", () => { setConnected(false); addToast("Conexión perdida. Reconectando...", "warn"); });

    s.on("queue:update", (q) => setWaitingQueue(q));
    s.on("agent:active", (a) => setActiveChats(a));

    s.on("conversation:created", ({ conversation: conv, messages: msgs }) => {
      setCurrentConv(conv); setMessages(msgs || []); setSelectedConvId(conv.id);
      setWaitingQueue((p) => p.filter((c) => c.id !== conv.id));
      setActiveChats((p) => p.some((c) => c.id === conv.id) ? p : [conv, ...p]);
    });

    s.on("conversation:assigned", ({ conversation: conv }) => {
      setCurrentConv(conv);
      setWaitingQueue((p) => p.filter((c) => c.id !== conv.id));
      setActiveChats((p) => p.some((c) => c.id === conv.id) ? p : [conv, ...p]);
    });

    s.on("message:new", (msg) => {
      setMessages((p) => p.some((m) => m.id === msg.id) ? p : [...p, msg]);
      setRemoteTyping(false); setSeen(false);
      if (msg.sender_type === "CLIENT") {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 660; osc.type = "sine"; gain.gain.value = 0.08;
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
        } catch {}
      }
    });

    s.on("message:deleted", ({ messageId }) => setMessages((p) => p.filter((m) => m.id !== messageId)));

    s.on("conversation:closed", ({ conversation: conv }) => {
      setActiveChats((p) => p.filter((c) => c.id !== conv.id));
      setSelectedConvId((cur) => { if (cur === conv.id) { setCurrentConv(null); setMessages([]); return null; } return cur; });
      addToast("Conversación cerrada", "info");
    });

    s.on("typing:start", ({ conversationId }) => { if (conversationId === selectedConvIdRef.current) setRemoteTyping(true); });
    s.on("typing:stop", ({ conversationId }) => { if (conversationId === selectedConvIdRef.current) setRemoteTyping(false); });

    s.on("user:disconnected", ({ isAgent: a }) => { if (!a) { setClientOnline(false); addToast("El cliente se ha desconectado", "warn"); } });
    s.on("user:reconnected", ({ isAgent: a }) => { if (!a) { setClientOnline(true); addToast("El cliente se ha reconectado", "success"); } });
    s.on("messages:seen", ({ seenBy }) => { if (seenBy === "CLIENT") setSeen(true); });
    s.on("error", ({ message }) => console.error("Socket error:", message));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, remoteTyping]);

  useEffect(() => {
    if (socket && selectedConvId && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender_type === "CLIENT") socket.emit("messages:seen", { conversationId: selectedConvId });
    }
  }, [messages]);

  const takeConversation = (conv) => { if (!socket) return; socket.emit("conversation:take", { conversationId: conv.id }); socket.emit("conversation:join", { conversationId: conv.id }); setSelectedConvId(conv.id); setClientOnline(true); };
  const selectConversation = (conv) => { if (!socket) return; setSelectedConvId(conv.id); setCurrentConv(conv); setClientOnline(true); socket.emit("conversation:join", { conversationId: conv.id }); };

  const handleTyping = useCallback(() => {
    if (!socket || !selectedConvId) return;
    if (!isTyping) { setIsTyping(true); socket.emit("typing:start", { conversationId: selectedConvId }); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); socket.emit("typing:stop", { conversationId: selectedConvId }); }, 2000);
  }, [socket, selectedConvId, isTyping]);

  const sendMessage = (e) => {
    e?.preventDefault(); if (!inputText.trim() || !socket || !selectedConvId) return;
    socket.emit("message:send", { conversationId: selectedConvId, body: inputText.trim() });
    setInputText(""); setIsTyping(false); setSeen(false);
    socket.emit("typing:stop", { conversationId: selectedConvId }); inputRef.current?.focus();
  };

  const deleteMessage = (msgId) => { if (!socket || !selectedConvId) return; socket.emit("message:delete", { messageId: msgId, conversationId: selectedConvId }); };
  const handleClose = () => { if (!socket || !selectedConvId) return; socket.emit("conversation:close", { conversationId: selectedConvId }); };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${t.type === "warn" ? "bg-amber-500 text-white" : t.type === "success" ? "bg-emerald-500 text-white" : "bg-gray-800 text-white"}`} style={{ animation: "fadeInDown 0.3s ease-out" }}>
            {t.type === "warn" && <AlertCircle size={16} />}{t.type === "success" && <CheckCircle size={16} />}{t.type === "info" && <MessageCircle size={16} />}{t.text}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20"><Headphones size={24} color="white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Soporte</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Atiende chats de clientes en tiempo real</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
          <span className="text-xs text-gray-400">{connected ? "En línea" : "Desconectado"}</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2">
              <Clock size={14} /> En espera
              {waitingQueue.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">{waitingQueue.length}</span>}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
            {waitingQueue.map((conv) => (
              <button key={conv.id} onClick={() => takeConversation(conv)} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{conv.contact_name?.[0] || "?"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{conv.contact_name || `Chat #${conv.id}`}</div>
                    <div className="text-[11px] text-gray-400 truncate">{conv.contact_email || "Sin email"}</div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded-lg">Tomar</span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1 ml-12"><Clock size={10} />{fmtDate(conv.created_at)}</div>
              </button>
            ))}
            {waitingQueue.length === 0 && (
              <div className="px-4 py-6 text-center"><CheckCircle size={24} className="mx-auto text-emerald-400 mb-2" /><p className="text-xs text-gray-400">No hay chats en espera</p></div>
            )}
            {activeChats.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2">
                  <MessageCircle size={14} /> Mis chats activos <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeChats.length}</span>
                </h3>
              </div>
            )}
            {activeChats.map((conv) => (
              <button key={conv.id} onClick={() => selectConversation(conv)} className={`w-full text-left px-4 py-3 transition-colors ${selectedConvId === conv.id ? "bg-blue-50 dark:bg-blue-500/10 border-l-3 border-blue-500" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative">
                    {conv.contact_name?.[0] || "?"}<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-800" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{conv.contact_name || `Chat #${conv.id}`}</div>
                    <div className="text-[11px] text-gray-400 truncate">{conv.subject || "Soporte General"}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="flex-1 flex flex-col bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-md overflow-hidden">
          {!selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4"><Inbox size={36} className="text-gray-300 dark:text-slate-600" /></div>
              <h3 className="text-lg font-bold text-gray-600 dark:text-slate-400 mb-2">Selecciona un chat</h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">Toma un chat de la cola de espera o selecciona uno activo para atender.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center relative">
                    <User size={18} color="white" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-blue-600 ${clientOnline ? "bg-green-400" : "bg-gray-400"}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{currentConv?.contact_name || `Chat #${selectedConvId}`}</h3>
                    <span className="text-blue-200 text-xs flex items-center gap-1">
                      <Mail size={10} />{currentConv?.contact_email || "—"}
                      <span className="mx-1">•</span>
                      <span className={clientOnline ? "text-green-300" : "text-gray-300"}>{clientOnline ? "En línea" : "Desconectado"}</span>
                    </span>
                  </div>
                </div>
                <button onClick={handleClose} className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-3 py-1.5 transition-colors text-xs font-semibold flex items-center gap-1.5" title="Cerrar conversación"><X size={14} />Cerrar chat</button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50/50 to-white dark:from-dark-800 dark:to-dark-800" style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
                {messages.map((msg) => {
                  const isAgent = msg.sender_type === "AGENT";
                  const isSystem = msg.sender_type === "SYSTEM";
                  if (isSystem) return (<div key={msg.id} className="flex justify-center"><div className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400 text-xs px-4 py-1.5 rounded-full">{msg.body}</div></div>);
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"} group`} onMouseEnter={() => setHoveredMsgId(msg.id)} onMouseLeave={() => setHoveredMsgId(null)}>
                      <div className="max-w-[70%]">
                        <div className={`flex items-end gap-2 ${isAgent ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isAgent ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"}`}>
                            {isAgent ? <Headphones size={12} /> : currentConv?.contact_name?.[0] || "C"}
                          </div>
                          <div className="relative">
                            <div className={`px-3.5 py-2.5 rounded-2xl shadow-sm ${isAgent ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md" : "bg-white dark:bg-dark-700 text-gray-800 dark:text-white border border-gray-100 dark:border-white/10 rounded-bl-md"}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                            </div>
                            {isAgent && hoveredMsgId === msg.id && (
                              <button onClick={() => deleteMessage(msg.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" title="Eliminar mensaje">
                                <Trash2 size={12} className="text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className={`text-[10px] text-gray-400 mt-0.5 ${isAgent ? "text-right mr-9" : "ml-9"}`}>{fmtTime(msg.created_at)}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Seen indicator */}
                {seen && messages.length > 0 && messages[messages.length - 1]?.sender_type === "AGENT" && (
                  <div className="flex justify-end pr-9"><span className="text-[10px] text-blue-500 font-medium flex items-center gap-1"><CheckCircle size={10} /> Visto</span></div>
                )}

                {/* Typing */}
                {remoteTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">{currentConv?.contact_name?.[0] || "C"}</div>
                      <div className="bg-white dark:bg-dark-700 border border-gray-100 dark:border-white/10 px-3.5 py-2.5 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="flex gap-1">{[0, 1, 2].map((i) => (<div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="border-t border-gray-100 dark:border-white/10 px-4 py-3 flex items-center gap-2 bg-white dark:bg-dark-800 flex-shrink-0">
                <input ref={inputRef} type="text" value={inputText} onChange={(e) => { setInputText(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Escribe una respuesta..." className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm border border-gray-100 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400" autoFocus />
                <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"><Send size={16} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
