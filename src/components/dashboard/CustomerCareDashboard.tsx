import { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, MessageSquare, CheckCircle2, Clock, AlertCircle,
  Send, X, RefreshCw, ChevronRight, Eye, Lock, Unlock,
  Phone, Mail, Calendar, Shield, TrendingUp, Inbox,
  ArrowLeft, UserCheck, Filter, MoreVertical, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerCareDashboardProps {
  user: User;
}

type Tab = 'overview' | 'tickets' | 'users';

export default function CustomerCareDashboard({ user }: CustomerCareDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, users: 0, frozen: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        fetch('/api/admin/users?limit=200', { headers: { 'x-cc-id': user.id }, credentials: 'include' }),
        fetch('/api/support/tickets', { headers: { 'x-cc-id': user.id }, credentials: 'include' })
      ]);
      const [uData, tData] = await Promise.all([uRes.json(), tRes.json()]);
      if (uData.success) setUsers(uData.users || []);
      if (tData.success) {
        setTickets(tData.tickets || []);
        const ts = tData.tickets || [];
        setStats({
          total: ts.length,
          open: ts.filter((t: any) => t.status === 'open').length,
          closed: ts.filter((t: any) => t.status === 'closed').length,
          users: uData.users?.length || 0,
          frozen: uData.users?.filter((u: any) => u.accountStatus === 'frozen').length || 0
        });
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        headers: { 'x-cc-id': user.id }, credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch { toast.error('Failed to load messages'); }
  };

  useEffect(() => { fetchAll(); }, [user.id]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      const interval = setInterval(() => fetchMessages(selectedTicket.id), 8000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cc-id': user.id },
        body: JSON.stringify({ senderId: user.id, message: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchMessages(selectedTicket.id);
        toast.success('Reply sent');
      }
    } catch { toast.error('Failed to send reply'); }
    finally { setIsSending(false); }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-cc-id': user.id },
        body: JSON.stringify({ status: selectedTicket.status === 'open' ? 'closed' : 'open' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket ${selectedTicket.status === 'open' ? 'closed' : 'reopened'}`);
        const updated = { ...selectedTicket, status: selectedTicket.status === 'open' ? 'closed' : 'open' };
        setSelectedTicket(updated);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setStats(prev => ({
          ...prev,
          open: selectedTicket.status === 'open' ? prev.open - 1 : prev.open + 1,
          closed: selectedTicket.status === 'open' ? prev.closed + 1 : prev.closed - 1
        }));
      }
    } catch { toast.error('Failed to update ticket'); }
    finally { setIsUpdatingStatus(false); }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Reset password for ${userName}?`)) return;
    try {
      const res = await fetch(`/api/customer-care/users/${userId}/reset-password`, {
        method: 'POST', headers: { 'x-cc-id': user.id }, credentials: 'include'
      });
      const data = await res.json();
      if (data.success) toast.success(data.message);
      else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed to reset password'); }
  };

  const handleFreezeUser = async (userId: string, currentStatus: string, userName: string) => {
    const action = currentStatus === 'frozen' ? 'unfreeze' : 'freeze';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userName}'s account?`)) return;
    try {
      const res = await fetch(`/api/customer-care/users/${userId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cc-id': user.id },
        body: JSON.stringify({ freeze: currentStatus !== 'frozen' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Account ${action}d`);
        fetchAll();
        if (selectedUser?.id === userId) {
          setSelectedUser((prev: any) => ({ ...prev, accountStatus: currentStatus === 'frozen' ? 'active' : 'frozen' }));
        }
      } else toast.error(data.error || 'Failed');
    } catch { toast.error(`Failed to ${action} account`); }
  };

  const filteredTickets = tickets.filter(t => {
    const matchFilter = ticketFilter === 'all' || t.status === ticketFilter;
    const matchSearch = !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userId?.toString().includes(searchQuery);
    return matchFilter && matchSearch;
  });

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare, count: stats.open },
    { id: 'users', label: 'Users', icon: Users, count: stats.users },
  ];

  const metricCards = [
    { label: 'Total Tickets', value: stats.total, icon: Inbox, color: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Open Tickets', value: stats.open, icon: Clock, color: 'amber', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Resolved', value: stats.closed, icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    { label: 'Frozen Accounts', value: stats.frozen, icon: Shield, color: 'red', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
    {
      label: 'Resolution Rate',
      value: stats.total > 0 ? `${Math.round((stats.closed / stats.total) * 100)}%` : '0%',
      icon: TrendingUp, color: 'green', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Customer Care
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user.name.split(' ')[0]}</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedTicket(null); setSelectedUser(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {metricCards.map((card, i) => (
                  <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className={`w-10 h-10 ${card.bg} ${card.text} rounded-xl flex items-center justify-center mb-3`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Tickets */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Open Tickets</h3>
                  <button onClick={() => setActiveTab('tickets')} className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.filter(t => t.status === 'open').slice(0, 5).map(ticket => (
                    <div key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedTicket(ticket); setActiveTab('tickets'); }}>
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">User #{String(ticket.userId).slice(0,8)} · {new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Open</span>
                    </div>
                  ))}
                  {tickets.filter(t => t.status === 'open').length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="font-medium">All caught up!</p>
                      <p className="text-sm">No open tickets</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Signups</h3>
                  <button onClick={() => setActiveTab('users')} className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(u => (
                    <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedUser(u); setActiveTab('users'); }}>
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.accountStatus === 'frozen'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>{u.accountStatus || 'active'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {selectedTicket ? (
                /* Ticket Thread View */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                  {/* Thread Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{selectedTicket.subject}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ticket #{String(selectedTicket.id).slice(0,8)} · User #{String(selectedTicket.userId).slice(0,8)}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseTicket}
                      disabled={isUpdatingStatus}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                        selectedTicket.status === 'open'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                      }`}
                    >
                      {selectedTicket.status === 'open' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                      {selectedTicket.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-400 py-12">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p>No messages yet</p>
                      </div>
                    ) : messages.map((msg) => {
                      const isAgent = msg.senderType === 'agent' || msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            isAgent
                              ? 'bg-emerald-600 text-white rounded-br-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${isAgent ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                {isAgent ? 'Support Agent' : msg.senderType === 'ai' ? 'Kosi AI' : 'User'}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isAgent ? 'text-emerald-200' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Box */}
                  {selectedTicket.status === 'open' ? (
                    <form onSubmit={handleReply} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isSending || !replyText.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all"
                      >
                        {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-400">
                      This ticket is closed · <button onClick={handleCloseTicket} className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Reopen to reply</button>
                    </div>
                  )}
                </div>
              ) : (
                /* Ticket List */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search tickets..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(['all', 'open', 'closed'] as const).map(f => (
                        <button key={f} onClick={() => setTicketFilter(f)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                            ticketFilter === f
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTickets.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Inbox className="w-10 h-10 mx-auto mb-3" />
                        <p className="font-medium">No tickets found</p>
                      </div>
                    ) : filteredTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTicket(ticket)}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          ticket.status === 'open'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {ticket.status === 'open' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{ticket.subject}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <Hash className="w-3 h-3" />{String(ticket.id).slice(0,8)}
                            <span>·</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          ticket.status === 'open'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>{ticket.status}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {selectedUser ? (
                /* User Detail View */
                <div className="space-y-4">
                  <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Users
                  </button>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {selectedUser.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">ID: {selectedUser.id}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            selectedUser.accountStatus === 'frozen'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>{selectedUser.accountStatus || 'active'}</span>
                          {selectedUser.isAgent && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Agent</span>}
                          {selectedUser.isAdmin && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Admin</span>}
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{selectedUser.tier || 'Basic'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Joined</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <UserCheck className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">KYC Level</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.kycLevel || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-6">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Wallet Balance</p>
                      <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">₦{(selectedUser.balance || 0).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleFreezeUser(selectedUser.id, selectedUser.accountStatus, selectedUser.name)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm ${
                          selectedUser.accountStatus === 'frozen'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {selectedUser.accountStatus === 'frozen' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {selectedUser.accountStatus === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(selectedUser.id, selectedUser.name)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 transition-all text-sm"
                      >
                        <Shield className="w-4 h-4" />
                        Reset Password
                      </button>
                    </div>
                  </div>

                  {/* Related Tickets */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-slate-900 dark:text-white">Support Tickets</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tickets.filter(t => String(t.userId) === String(selectedUser.id)).length === 0 ? (
                        <p className="p-6 text-center text-slate-400 text-sm">No tickets from this user</p>
                      ) : tickets.filter(t => String(t.userId) === String(selectedUser.id)).map(t => (
                        <div key={t.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedTicket(t)}>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>{t.status}</span>
                          <p className="flex-1 text-sm text-slate-900 dark:text-white">{t.subject}</p>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* User List */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email or phone..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <p className="p-12 text-center text-slate-400">No users found</p>
                    ) : filteredUsers.map(u => (
                      <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUser(u)}>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{u.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email} · {u.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.accountStatus === 'frozen'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>{u.accountStatus || 'active'}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
