import { MessageSquare, Star } from 'lucide-react';

export function FeedbackButton() {
  return (
    <button className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#6366f1] hover:bg-[#5558e3] text-white px-3 py-8 rounded-l-xl shadow-lg transition-colors flex flex-col items-center gap-2 group">
      <Star className="w-4 h-4" />
      <div className="writing-mode-vertical text-[11px] tracking-wider rotate-180">
        Feedback
      </div>
    </button>
  );
}
