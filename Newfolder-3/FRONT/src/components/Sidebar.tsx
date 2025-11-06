import { Plus, Search, MessageCircle, Settings } from 'lucide-react';
import { Button } from './ui/button';
import type { Session } from '../api';
import { useMemo, useState } from 'react';

interface SidebarProps {
  sessions: Session[];
  activeId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  patientName: string;
}

function withinLast7Days(ts: number) {
  const seven = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - ts <= seven;
}

export function Sidebar({ sessions, activeId, onNewChat, onSelectChat, patientName }: SidebarProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const last7All = sessions.filter(s => withinLast7Days(s.updatedAt));
  const othersAll = sessions.filter(s => !withinLast7Days(s.updatedAt));
  const last7 = useMemo(() => query ? last7All.filter(s => (s.title||'').toLowerCase().includes(query.toLowerCase())) : last7All, [last7All, query]);
  const others = useMemo(() => query ? othersAll.filter(s => (s.title||'').toLowerCase().includes(query.toLowerCase())) : othersAll, [othersAll, query]);
  return (
    <div className="w-[190px] bg-white rounded-tr-2xl rounded-br-2xl shadow-sm flex flex-col h-full p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[15px] tracking-wide mb-4">CHAT A.I+</h1>
        
        {/* New Chat Button */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-[#6366f1] hover:bg-[#5558e3] text-white rounded-full h-9 text-[13px]"
            onClick={onNewChat}
          >
            <Plus className="w-4 h-4 mr-1" />
            New chat
          </Button>
          <button className="w-9 h-9 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0" onClick={() => setSearchOpen(s => !s)}>
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>
        {searchOpen && (
          <input
            className="mt-3 w-full h-8 rounded-full border border-gray-200 px-3 text-[12px] outline-none"
            placeholder="Search conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-gray-500">Your conversations</span>
          <button className="text-[11px] text-[#6366f1] hover:underline" onClick={() => {
            localStorage.removeItem('chat_sessions');
            window.location.reload();
          }}>
            Clear All
          </button>
        </div>

        <div className="space-y-1 mb-6">
          {last7.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectChat(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] flex items-center gap-2 transition-colors ${
                activeId === s.id
                  ? 'bg-[#f3f0ff] text-[#6366f1]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{s.title || 'New chat'}</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] text-gray-400 mb-2 px-3">Last 7 Days</div>
        <div className="space-y-1">
          {others.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectChat(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] flex items-center gap-2 transition-colors ${
                activeId === s.id
                  ? 'bg-[#f3f0ff] text-[#6366f1]'
                  : 'text-gray-300 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{s.title || 'Chat'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <button className="w-full text-left px-3 py-2.5 rounded-lg text-[12px] flex items-center gap-2 text-gray-700 hover:bg-gray-50">
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
          <span className="text-[12px] text-gray-700">{patientName}</span>
        </div>
      </div>
    </div>
  );
}
