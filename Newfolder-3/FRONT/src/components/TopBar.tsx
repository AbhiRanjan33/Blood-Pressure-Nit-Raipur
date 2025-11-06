import { useMemo } from 'react';

interface TopBarProps {
  brand?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export default function TopBar({ brand = 'CHAT A.I+', tabs = [{ id: 'chat', label: 'Chat' }, { id: 'docs', label: 'Docs' }], activeTab = 'chat', onTabChange }: TopBarProps) {
  const items = useMemo(() => tabs, [tabs]);
  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
      <div className="text-[13px] tracking-[0.15em] text-gray-900 font-medium">{brand}</div>
      <div className="flex gap-2">
        {items.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange?.(t.id)}
            className={`h-8 px-3 rounded-full text-[12px] transition-all border ${activeTab === t.id ? 'text-white bg-[#6366f1] border-[#6366f1]' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}


