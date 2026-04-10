import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, MessageCircle, User as UserIcon, Loader2 } from 'lucide-react';
import { User, SupportMessage } from '../../types';

interface SupportChatProps {
  user: User;
}

export default function SupportChat({ user }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        ticketId: 'temp',
        senderId: 'support',
        senderType: 'agent',
        message: `Hello ${user.name}! Welcome to Kosi Bills Support. How can we help you today? Type your message and we'll get back to you as soon as possible, or you can request a live agent.`,
        createdAt: new Date().toISOString()
      }
    ]);
  }, [user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([
        {
          id: '1',
          ticketId: 'temp',
          senderId: 'support',
          senderType: 'agent',
          message: `Hello ${user.name}! Welcome to Kosi Bills Support. How can we help you today?`,
          createdAt: new Date().toISOString()
        }
      ]);
      setTicketId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: SupportMessage = {
      id: Date.now().toString(),
      ticketId: ticketId || 'temp',
      senderId: user.id.toString(),
      senderType: 'user',
      message: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const wantsHuman = input.toLowerCase().includes('human') ||
                         input.toLowerCase().includes('agent') ||
                         input.toLowerCase().includes('customer care') ||
                         input.toLowerCase().includes('real person');

      if (wantsHuman) {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, subject: 'User requested human agent', initialMessage: input })
        });
        const data = await res.json();

        if (data.success) {
          setTicketId(data.ticketId);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            ticketId: data.ticketId,
            senderId: 'support',
            senderType: 'agent',
            message: `We've created a support ticket for you (Ticket #${data.ticketId}). A customer care agent will review your request and get back to you shortly. Thank you for your patience.`,
            createdAt: new Date().toISOString()
          }]);
        }
      } else {
        const res = await fetch('/api/support/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input })
        });
        const data = await res.json();

        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            ticketId: ticketId || 'temp',
            senderId: 'support',
            senderType: 'agent',
            message: data.text || "Sorry, we couldn't process that right now. Would you like to speak to a live agent?",
            createdAt: new Date().toISOString()
          }]);
        } else {
          throw new Error(data.error || 'Failed to respond');
        }
      }
    } catch (error) {
      console.error('Support error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        ticketId: ticketId || 'temp',
        senderId: 'support',
        senderType: 'agent',
        message: "Sorry, we're having trouble connecting right now. Please try again later or contact us directly.",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kosi Support</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">We typically reply within minutes</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Clear chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.senderType === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.senderType === 'user'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {msg.senderType === 'user' ? <UserIcon className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.senderType === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-none'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.message}</p>
              <span className={`text-xs mt-2 block ${msg.senderType === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="text-slate-500">Support is responding...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
