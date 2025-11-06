import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Plus, Calendar, Pill, Search, Clock, AlertCircle, FileText, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  avatar?: string;
};

type ConversationItem = {
  id: string;
  title: string;
  description: string;
  active?: boolean;
};

export default function ChatbotUI() {
  // Start with no messages; conversation begins empty
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionIdRef = useRef<string>("");
  useEffect(() => {
    const key = "chat_session_id";
    let s = localStorage.getItem(key);
    if (!s) { s = crypto.randomUUID(); localStorage.setItem(key, s); }
    sessionIdRef.current = s;
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, showTyping]);

  // Prefer explicit env var, then window override, else same-origin
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || (window as any).__API_BASE__ || "";

  // Patient info (for left-bottom display)
  const [patientName, setPatientName] = useState<string | null>(null);
  const [patientEmail, setPatientEmail] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchPatient() {
      try {
        // Fetch patient name
        const nameRes = await fetch(`${API_BASE}/api/profile/name`);
        if (nameRes.ok) {
          const nameData = await nameRes.json();
          const profileName: string | undefined = nameData?.name;
          if (!cancelled && profileName) setPatientName(profileName);
        }
        
        // Fetch patient email
        const emailRes = await fetch(`${API_BASE}/api/profile/email`);
        if (emailRes.ok) {
          const emailData = await emailRes.json();
          const profileEmail: string | undefined = emailData?.email;
          if (!cancelled && profileEmail) setPatientEmail(profileEmail);
        }
      } catch {
        // ignore
      }
    }
    fetchPatient();
    return () => { cancelled = true; };
  }, [API_BASE]);

  async function handleSendMessage() {
    const text = inputValue.trim();
    if (!text) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      avatar: "JD",
    };

    setMessages(prev => [...prev, newMessage]);
    // Ensure a conversation exists for the first message
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newId = crypto.randomUUID();
      const newConv: ConversationItem = {
        id: newId,
        title: "New Chat",
        description: "",
        active: true,
      };
      setConversations(prev => [
        ...prev.map(c => ({ ...c, active: false })),
        newConv,
      ]);
      setActiveConversationId(newId);
      setMessagesByConversation(prev => ({ ...prev, [newId]: [] }));
      localStorage.setItem(`chat_session_id_${newId}`, sessionIdRef.current);
      currentConversationId = newId;
    }
    if (currentConversationId) {
      setMessagesByConversation(prev => ({
        ...prev,
        [currentConversationId]: [...(prev[currentConversationId] || []), newMessage],
      }));
      setConversations(prev => prev.map(c => {
        if (c.id !== currentConversationId) return c;
        const snippet = text.length > 80 ? `${text.slice(0, 77)}...` : text;
        return {
          ...c,
          title: c.title === "New Chat" ? (text.split(" ").slice(0, 5).join(" ") || c.title) : c.title,
          description: c.description || snippet,
        };
      }));
    }
    setInputValue("");
    setShowTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: newMessage.content, 
          session_id: sessionIdRef.current,
          email: patientEmail || undefined  // Include patient email if available
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { response: string; session_id: string };

      if (data.session_id && data.session_id !== sessionIdRef.current) {
        sessionIdRef.current = data.session_id;
        localStorage.setItem("chat_session_id", data.session_id);
        const convForSession = currentConversationId || activeConversationId;
        if (convForSession) localStorage.setItem(`chat_session_id_${convForSession}`, data.session_id);
      }

      const assistant: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      };
      setMessages(prev => [...prev, assistant]);
      const convForAssistant = currentConversationId || activeConversationId;
      if (convForAssistant) {
        setMessagesByConversation(prev => ({
          ...prev,
          [convForAssistant]: [...(prev[convForAssistant] || []), assistant],
        }));
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: "assistant",
        content: "Sorry—there was a problem contacting the server.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      }]);
    } finally {
      setShowTyping(false);
    }
  }

  // Conversation history state; empty initially
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  function createNewConversation() {
    const newId = crypto.randomUUID();
    const newConv: ConversationItem = {
      id: newId,
      title: "New Chat",
      description: "",
      active: true,
    };
    setConversations(prev => [
      // deactivate previous items
      ...prev.map(c => ({ ...c, active: false })),
      newConv,
    ]);
    setActiveConversationId(newId);
    // Clear current chat messages
    setMessages([]);
    setMessagesByConversation(prev => ({ ...prev, [newId]: [] }));
    // Reset session id for backend
    const key = "chat_session_id";
    const newSession = crypto.randomUUID();
    localStorage.setItem(key, newSession);
    sessionIdRef.current = newSession;
    localStorage.setItem(`chat_session_id_${newId}`, newSession);
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title?.toLowerCase().includes(q)) ||
      (c.description?.toLowerCase().includes(q))
    );
  });

  function selectConversation(id: string) {
    setConversations(prev => prev.map(c => ({ ...c, active: c.id === id })));
    setActiveConversationId(id);
    const msgs = messagesByConversation[id] || [];
    setMessages(msgs);
    const stored = localStorage.getItem(`chat_session_id_${id}`);
    if (stored) sessionIdRef.current = stored;
  }

  const quickActions = [
    { id: "1", icon: Calendar, label: "Book Appointment" },
    { id: "2", icon: Pill, label: "Refill Prescription" },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:w-72 border-r border-gray-200 bg-white flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="font-semibold text-gray-900">Health Assistant</span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 border-gray-300 rounded-lg text-sm"
            />
          </div>

          <Button onClick={createNewConversation} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Quick Actions</p>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button key={action.id} className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                  <IconComponent className="w-4 h-4 text-gray-600" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

          {/* Conversation History (from state, initially empty) */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <p className="text-xs font-semibold text-gray-600 mb-3 px-2 uppercase tracking-wide">Conversation History</p>
          <div className="space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${conv.active ? "bg-indigo-50 border-l-2 border-indigo-600" : "hover:bg-gray-50"}`}
              >
                <p className={`text-sm font-medium ${conv.active ? "text-indigo-700" : "text-gray-900"}`}>{conv.title}</p>
                <p className="text-xs text-gray-600 line-clamp-1">{conv.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar footer: patient avatar + name */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gray-100 text-black font-semibold border border-gray-300">
                {patientName ? (patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PT') : 'PT'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{patientName || ""}</p>
              <p className="text-xs text-gray-500 truncate">Signed in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Chat Window */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Conversation with Health Assistant</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gray-100 text-black font-semibold border border-gray-300">JD</AvatarFallback>
          </Avatar>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} gap-3`}>
              {message.type === "assistant" && (
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-black font-semibold text-xs border border-gray-300">AI</AvatarFallback>
                  </Avatar>
                </div>
              )}

              <div className={`max-w-sm sm:max-w-md md:max-w-lg ${message.type === "user" ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3" : "bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none px-4 py-3"}`}>
                <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${message.type === "user" ? "text-indigo-100" : "text-gray-600"}`}>{message.timestamp}</p>
              </div>

              {message.type === "user" && (
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-black font-semibold text-xs border border-gray-300">{message.avatar ?? "U"}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))}

          {showTyping && (
            <div className="flex justify-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                  <MessageSquare className="w-4 h-4 text-black" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="flex gap-3 items-center">
            <Input
              type="text"
              placeholder="Type your question here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 border-gray-300 rounded-lg"
            />
            <Button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-3">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Disclaimer: This is not a replacement for professional medical advice. If you are in an emergency, please call 911.
          </p>
        </div>
      </div>

      {/* Right Sidebar - Hidden on mobile */}
      <div className="hidden lg:block w-80 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Upcoming Appointment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Health Hub</h3>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">Upcoming Appointment</p>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-indigo-600 rounded-lg flex flex-col items-center justify-center text-white">
                    <p className="text-xs font-semibold">JUL</p>
                    <p className="text-xl font-bold">28</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Annual Check-up</p>
                  <p className="text-xs text-gray-600">Dr. Emily Carter</p>
                  <p className="text-xs text-gray-600">10:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medication Reminders */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Medication Reminders</p>
            <div className="space-y-2">
              <div className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <Pill className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Lisinopril (10mg)</p>
                  <p className="text-xs text-gray-600">Next dose: 8:00 PM today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Articles */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Recommended Articles</p>
            <div className="space-y-3">
              {[
                "Understanding Seasonal Allergies",
                "5 Tips for a Healthier Diet",
                "The Importance of Regular Exercise",
              ].map((article, idx) => (
                <a key={idx} href="#" className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium block">
                  {article}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}