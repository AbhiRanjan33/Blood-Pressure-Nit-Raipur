import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { FeedbackButton } from './components/FeedbackButton';
import { createSession, fetchLatestPatientName, loadSessions, saveSessions, type Session } from './api';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id ?? '');
  const [patientName, setPatientName] = useState<string>('Patient');

  useEffect(() => { saveSessions(sessions); }, [sessions]);
  useEffect(() => { (async () => {
    const n = await fetchLatestPatientName();
    if (n) setPatientName(n.charAt(0).toUpperCase() + n.slice(1));
  })(); }, []);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeId) ?? null, [sessions, activeId]);

  function handleNewChat() {
    const s = createSession();
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
  }

  function handleSelectChat(id: string) {
    setActiveId(id);
  }

  function handleUpdateSession(updated: Session) {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  return (
    <div className="flex h-screen bg-[#e8f0e0]">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        patientName={patientName}
      />
      <ChatArea session={activeSession} onUpdateSession={handleUpdateSession} />
      <FeedbackButton />
    </div>
  );
}
