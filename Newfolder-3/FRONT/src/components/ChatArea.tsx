import { Edit2, Send } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { sendChat, type Session } from '../api';

interface ChatAreaProps {
  session: Session | null;
  onUpdateSession: (session: Session) => void;
}

const messages = [
  {
    type: 'user' as const,
    text: 'Create a chatbot gpt using python language what will be step for that',
    avatar: true,
  },
  {
    type: 'assistant' as const,
    title: 'CHAT A.I+',
    text: `Sure, I can help you get started with creating a chatbot using GPT in Python. Here are the basic steps you'll need to follow:

1. Install the required libraries: You'll need to install the transformers library from Hugging Face to use GPT. You can install it using pip.

2. Load the pre-trained model: GPT comes in several sizes and versions, so you'll need to choose the one that fits your needs. You can load a pre-trained model like the 1.3B parameter version of GPT-Neo, which is a powerful and relatively recent model.

3. Create a chatbot loop: You'll need to create a loop that takes user input, generates a response using the GPT model, and outputs it to the user. Here's a simple example that uses the input() function to get user input and the gpt() function to generate a response. This loop will keep running until the user exits the program or the loop is interrupted.

4. Add some personality to the chatbot: While GPT can generate text, it doesn't have any inherent personality or style. You can make your chatbot more interesting by adding custom prompts or responses that reflect your desired personality. You can then modify the chatbot to use these prompts and responses when appropriate. This will make the chatbot seem more human-like and engaging.

These are just the basic steps to get started with a GPT chatbot in Python. Depending on your requirements, you may need to add more features or complexity to the chatbot. Good luck!`,
  },
  {
    type: 'user' as const,
    text: 'What is use of that chatbot ?',
    avatar: true,
  },
  {
    type: 'assistant' as const,
    title: 'CHAT A.I+',
    text: `Chatbots can be used for a wide range of purposes, including:

Customer service: chatbots can handle frequently asked questions, provide basic support and help customers`,
    isPartial: true,
  },
];

export function ChatArea({ session, onUpdateSession }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [session?.messages.length]);

  async function handleSend() {
    if (!session || !input.trim()) return;
    const userMsg = { role: 'user' as const, content: input.trim(), timestamp: Date.now() };
    const updated = { ...session, messages: [...session.messages, userMsg], updatedAt: Date.now(), title: session.title === 'New chat' && input ? input.slice(0, 30) + (input.length > 30 ? '…' : '') : session.title };
    onUpdateSession(updated);
    setInput('');

    try {
      const res = await sendChat(userMsg.content, session.id);
      const botMsg = { role: 'assistant' as const, content: res.response, timestamp: Date.now() };
      onUpdateSession({ ...updated, messages: [...updated.messages, botMsg], updatedAt: Date.now() });
    } catch (e) {
      const botMsg = { role: 'assistant' as const, content: 'Error contacting server. Please try again.', timestamp: Date.now() };
      onUpdateSession({ ...updated, messages: [...updated.messages, botMsg], updatedAt: Date.now() });
    }
  }

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <div className="text-[12px] text-gray-800 tracking-wider">Chat</div>
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {session?.messages.map((m, i) => (
            <ChatMessage key={i} type={m.role as any} text={m.content} avatar={m.role==='user'} title={m.role==='assistant' ? 'CHAT A.I+' : undefined} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center px-4 py-2">
            <input
              type="text"
              placeholder="What is in your mind?..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-gray-600 placeholder:text-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <button onClick={handleSend} className="w-8 h-8 bg-[#6366f1] hover:bg-[#5558e3] rounded-full flex items-center justify-center ml-2">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
