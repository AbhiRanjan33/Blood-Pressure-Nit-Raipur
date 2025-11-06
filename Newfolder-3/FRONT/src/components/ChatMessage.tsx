import { ThumbsUp, ThumbsDown, Copy, RotateCw } from 'lucide-react';

interface ChatMessageProps {
  type: 'user' | 'assistant';
  text: string;
  title?: string;
  avatar?: boolean;
  isPartial?: boolean;
  onCopy?: (text: string) => void;
  onFeedback?: (value: 'up' | 'down') => void;
  feedback?: 'up' | 'down';
}

export function ChatMessage({ type, text, title, avatar, isPartial, onCopy, onFeedback, feedback }: ChatMessageProps) {
  if (type === 'user') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl shadow-sm">
          <p className="text-[13px] text-gray-800">{text}</p>
        </div>
        {avatar && (
          <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
      <div className="flex-1">
        {title && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-gray-900">{title}</span>
            <button className="p-1 hover:bg-white/50 rounded" onClick={() => onCopy?.(text)}>
              <Copy className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        )}
        <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
            {text}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button className={`p-1.5 hover:bg-white rounded-lg transition-colors ${feedback==='up' ? 'bg-gray-50' : ''}`} onClick={() => onFeedback?.('up')}>
            <ThumbsUp className={`w-3.5 h-3.5 ${feedback==='up' ? 'text-[#6366f1]' : 'text-gray-400'}`} />
          </button>
          <button className={`p-1.5 hover:bg-white rounded-lg transition-colors ${feedback==='down' ? 'bg-gray-50' : ''}`} onClick={() => onFeedback?.('down')}>
            <ThumbsDown className={`w-3.5 h-3.5 ${feedback==='down' ? 'text-[#6366f1]' : 'text-gray-400'}`} />
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors" onClick={() => onCopy?.(text)}>
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {isPartial && (
            <button className="ml-auto flex items-center gap-2 px-3 py-1 bg-white hover:bg-gray-50 rounded-lg text-[11px] text-gray-700 transition-colors">
              <RotateCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
