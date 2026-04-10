import { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { motion } from 'motion/react';
import { Users, User as UserIcon, Shield, ShieldCheck, UserPlus, CheckCircle2, X, Search, UserCheck, Wallet, MoreVertical, BarChart3, TrendingUp, PieChart, ChevronLeft, ChevronRight, Filter, AlertCircle, Download, Megaphone, Settings, Plus, Trash2, BellRing, MessageCircle, Send, Loader2, Bot, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  user: User;
  onBack?: () => void;
}

export default function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', isAgent: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'agents' | 'customer_care' | 'transactions' | 'tickets' | 'logs' | 'broadcast' | 'email' | 'settings' | 'ai'>('overview');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([{ role: 'ai', text: `Hello ${user.name}! I'm Kosi, the Kosi Bills AI assistant. I have full knowledge of the platform — users, transactions, settings, features, and more. How can I help you today?` }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [emailData, setEmailData] = useState({ targetEmail: '', subject: '', message: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [stats, setStats] = useState<any>(null);

  // Broadcast State
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', target: 'all' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isGeneratingVapid, setIsGeneratingVapid] = useState(false);
  const [generatedVapidKeys, setGeneratedVapidKeys] = useState<{publicKey: string, privateKey: string} | null>(null);

  // Settings State
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({
    transfer_fee: '10',
    min_withdrawal: '1000',
    maintenance_mode: 'false'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '' });
  const [showAddSetting, setShowAddSetting] = useState(false);

  // Fund Modal State
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundData, setFundData] = useState({ userId: '', userName: '', amount: '', type: 'credit', description: '' });

  // Live Activity Feed
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [liveActivityLoading, setLiveActivityLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [visibleColumns, setVisibleColumns] = useState({
    contact: true,
    balance: true,
    status: true,
    joined: true,
  });

  // Pagination state
  const [userPage, setUserPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [totalPages, setTotalPages] = useState({ users: 1, transactions: 1 });
  const [totalRecords, setTotalRecords] = useState({ users: 0, transactions: 0 });
  const PAGE_SIZE = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (['overview', 'customers', 'agents', 'customer_care'].includes(activeTab)) {
      csvContent += "ID,Name,Email,Phone,Balance,Tier,Status,Role\n";
      users.forEach(u => {
        const role = u.isAdmin ? 'Admin' : u.isCustomerCare ? 'Customer Care' : u.isAgent ? 'Agent' : 'Customer';
        csvContent += `${u.id},"${u.name}","${u.email}","${u.phone}",${u.balance},${u.tier},${u.accountStatus},${role}\n`;
      });
    } else if (activeTab === 'transactions') {
      csvContent += "ID,User,Type,Amount,Status,Date\n";
      transactions.forEach(t => {
        csvContent += `${t.id},"${t.userName}",${t.type},${t.amount},${t.status},"${t.date}"\n`;
      });
    } else {
      toast.error('Export not supported for this tab');
      return;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kosi_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export downloaded');
  };

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleAuthError = (error: any) => {
    if (error instanceof Error && error.message === 'Unauthorized') {
      toast.error('Session expired. Please log in again.');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings && Object.keys(data.settings).length > 0) {
          setSystemSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
      handleAuthError(error);
    }
  };

  const fetchUsers = async (page = 1, search = '', sort = sortBy, order = sortOrder) => {
    try {
      let role = 'all';
      if (activeTab === 'customers') role = 'customers';
      if (activeTab === 'agents') role = 'agents';
      if (activeTab === 'customer_care') role = 'customer_care';

      const res = await fetch(`/api/admin/users?page=${page}&limit=${PAGE_SIZE}&search=${search}&role=${role}&sortBy=${sort}&sortOrder=${order}`, {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(prev => ({ ...prev, users: data.pagination.totalPages }));
        setTotalRecords(prev => ({ ...prev, users: data.pagination.total }));
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Failed to fetch users', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1, search = '', status = 'all', type = 'all', sort = sortBy, order = sortOrder) => {
    try {
      const res = await fetch(`/api/admin/transactions?page=${page}&limit=${PAGE_SIZE}&search=${search}&status=${status}&type=${type}&sortBy=${sort}&sortOrder=${order}`, {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch transactions');
      }
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setTotalPages(prev => ({ ...prev, transactions: data.pagination.totalPages }));
        setTotalRecords(prev => ({ ...prev, transactions: data.pagination.total }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      handleAuthError(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets', {
        headers: { 'x-cc-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch tickets');
      }
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      handleAuthError(error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch logs');
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
      handleAuthError(error);
    }
  };

  const fetchTicketMessages = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        headers: { 'x-cc-id': user.id },
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      if (data.success) {
        setTicketMessages(data.messages);
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
      handleAuthError(error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cc-id': user.id
        },
        body: JSON.stringify({
          senderId: user.id,
          message: replyMessage
        })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        throw new Error('Failed to send reply');
      }
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        fetchTicketMessages(selectedTicket.id);
        toast.success('Reply sent');
      }
    } catch (error) {
      toast.error('Failed to send reply');
      handleAuthError(error);
    } finally {
      setIsReplying(false);
    }
  };

  const fetchLiveActivity = async () => {
    setLiveActivityLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?page=1&limit=8&search=&status=all&type=all&sortBy=id&sortOrder=DESC`, {
        headers: { 'x-admin-id': user.id },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLiveActivity(data.transactions || []);
          setLastRefreshed(new Date());
        }
      }
    } catch {
    } finally {
      setLiveActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTickets();
    fetchSettings();
    fetchLiveActivity();
    const interval = setInterval(fetchLiveActivity, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions(txPage, debouncedSearch, txStatusFilter, txTypeFilter, sortBy, sortOrder);
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else if (['overview', 'customers', 'agents', 'customer_care'].includes(activeTab)) {
      fetchUsers(userPage, debouncedSearch, sortBy, sortOrder);
    }
  }, [activeTab, userPage, txPage, debouncedSearch, txStatusFilter, txTypeFilter, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setUserPage(1);
    setTxPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <Filter className="w-3 h-3 opacity-20" />;
    return sortOrder === 'ASC' ? <ChevronRight className="w-3 h-3 rotate-[-90deg]" /> : <ChevronRight className="w-3 h-3 rotate-[90deg]" />;
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'frozen'}`);
        fetchUsers(userPage, searchQuery);
        fetchLogs();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User role updated to ${role}`);
        fetchUsers(userPage, searchQuery);
        fetchLogs();
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const toggleCustomerCareStatus = async (userId: string, currentStatus: boolean) => {
    updateUserRole(userId, currentStatus ? 'customer' : 'customer_care');
  };

  const toggleAgentStatus = async (userId: string, currentStatus: boolean) => {
    updateUserRole(userId, currentStatus ? 'customer' : 'agent');
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    // Prevent self-demotion
    if (userId === user.id) {
      toast.error("You cannot demote yourself");
      return;
    }
    updateUserRole(userId, currentStatus ? 'customer' : 'admin');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User added successfully');
        setShowAddModal(false);
        setNewUser({ name: '', email: '', phone: '', password: '', isAgent: false });
        fetchUsers(userPage, searchQuery);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to add user');
      }
    } catch (error) {
      toast.error('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${fundData.userId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({
          amount: parseFloat(fundData.amount),
          type: fundData.type,
          description: fundData.description
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowFundModal(false);
        setFundData({ userId: '', userName: '', amount: '', type: 'credit', description: '' });
        fetchUsers(userPage, debouncedSearch);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to fund user');
      }
    } catch (error) {
      toast.error('Failed to process funding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify(broadcastData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBroadcastData({ title: '', message: '', target: 'all' });
      } else {
        toast.error(data.error || 'Failed to send broadcast');
      }
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify({ settings: systemSettings })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': user.id
        },
        body: JSON.stringify(emailData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email sent successfully');
        setEmailData({ targetEmail: '', subject: '', message: '' });
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'DELETE',
        headers: {
          'x-admin-id': user.id
        }
      });
      const data = await res.json();
      if (data.success) {
        const newSettings = { ...systemSettings };
        delete newSettings[key];
        setSystemSettings(newSettings);
        toast.success('Setting deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete setting');
      }
    } catch (error) {
      toast.error('Failed to delete setting');
    }
  };

  const totalBalance = stats?.totalSystemBalance || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            Kosi Bills Admin
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your platform, customers, and agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm hover:shadow-md">
              <Filter className="w-5 h-5" />
              Columns
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 z-10 hidden group-hover:block">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={value} 
                    onChange={() => setVisibleColumns(prev => ({ ...prev, [key as keyof typeof prev]: !prev[key as keyof typeof prev] }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="capitalize text-slate-700 dark:text-slate-200">{key}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalUsers?.toLocaleString() || 0}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Volume</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₦{stats?.totalVolume?.toLocaleString() || 0}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Balance</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">₦{totalBalance.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Tickets</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.activeTickets || 0}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Transaction Volume (14 Days)
              </h3>
            </div>
            <div className="h-64 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(val: any) => [`₦${val.toLocaleString()}`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Volume by Category
              </h3>
            </div>
            <div className="h-64 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats.volumeByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="volume"
                    nameKey="category"
                  >
                    {stats.volumeByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(val: any) => [`₦${val.toLocaleString()}`, 'Volume']}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stats.volumeByCategory.map((entry: any, index: number) => (
                <div key={entry.category} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{entry.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Activity Feed - Overview tab only */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Live Activity Feed</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={fetchLiveActivity} disabled={liveActivityLoading}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${liveActivityLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {liveActivityLoading && liveActivity.length === 0 ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  </div>
                  <div className="h-3.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              ))
            ) : liveActivity.length > 0 ? (
              liveActivity.map((tx: any, i: number) => {
                const isCredit = tx.amount > 0;
                const isFlagged = Math.abs(tx.amount) >= 50000;
                return (
                  <motion.div key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isFlagged ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-black ${
                      isFlagged ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    }`}>
                      {isFlagged ? '⚠' : tx.type?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{tx.userName || 'User'}</p>
                        {isFlagged && <span className="text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full shrink-0">Large</span>}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{tx.description || tx.type} · {tx.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {isCredit ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Controls Row */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'agents', label: 'Agents', icon: UserCheck },
              { id: 'customer_care', label: 'Support', icon: Shield },
              { id: 'transactions', label: 'Transactions', icon: Wallet },
              { id: 'tickets', label: 'Tickets', icon: AlertCircle },
              { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
              { id: 'email', label: 'Email', icon: BellRing },
              { id: 'logs', label: 'Logs', icon: MoreVertical },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'ai', label: 'AI Assistant', icon: Bot },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setUserPage(1);
                  setTxPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Export */}
          {activeTab !== 'broadcast' && activeTab !== 'settings' && activeTab !== 'ai' && (
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
              {activeTab === 'transactions' && (
                <>
                  <select
                    value={txStatusFilter}
                    onChange={(e) => {
                      setTxStatusFilter(e.target.value);
                      setTxPage(1);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <select
                    value={txTypeFilter}
                    onChange={(e) => {
                      setTxTypeFilter(e.target.value);
                      setTxPage(1);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="airtime">Airtime</option>
                    <option value="data">Data</option>
                    <option value="transfer">Transfer</option>
                    <option value="deposit">Deposit</option>
                    <option value="manual_funding">Manual</option>
                  </select>
                </>
              )}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setUserPage(1);
                    setTxPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
              {['overview', 'customers', 'agents', 'customer_care', 'transactions'].includes(activeTab) && (
                <button
                  onClick={handleExportCSV}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Export to CSV"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'broadcast' ? (
          <div className="p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Send Broadcast Message</h2>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Audience</label>
                <select
                  value={broadcastData.target}
                  onChange={(e) => setBroadcastData({...broadcastData, target: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Users</option>
                  <option value="customers">Customers Only</option>
                  <option value="agents">Agents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message Title</label>
                <input
                  type="text"
                  required
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. System Maintenance Notice"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isBroadcasting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Megaphone className="w-5 h-5" />
                    Send Broadcast
                  </>
                )}
              </button>
            </form>
          </div>
        ) : activeTab === 'email' ? (
          <div className="p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Send Direct Email</h2>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={emailData.targetEmail}
                  onChange={(e) => setEmailData({...emailData, targetEmail: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Account Verification Update"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSendingEmail ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <BellRing className="w-5 h-5" />
                    Send Email
                  </>
                )}
              </button>
            </form>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">System Settings</h2>
              <button
                onClick={() => setShowAddSetting(!showAddSetting)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            {showAddSetting && (
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add New Setting</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Key (e.g. referral_bonus)</label>
                    <input
                      type="text"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="setting_key"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Value</label>
                    <input
                      type="text"
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                      placeholder="Value"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSetting(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newSetting.key || !newSetting.value) return toast.error('Key and value are required');
                      setSystemSettings({ ...systemSettings, [newSetting.key]: newSetting.value });
                      setNewSetting({ key: '', value: '' });
                      setShowAddSetting(false);
                      toast.success('Setting added to list. Click "Save Settings" to persist.');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Add to List
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {Object.entries(systemSettings).map(([key, value]) => (
                <div key={key} className="group relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSetting(key)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete setting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {key === 'maintenance_mode' ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        id="maintenance_mode"
                        checked={value === 'true'}
                        onChange={(e) => setSystemSettings({...systemSettings, maintenance_mode: e.target.checked ? 'true' : 'false'})}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                      />
                      <label htmlFor="maintenance_mode" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Enable Maintenance Mode
                      </label>
                    </div>
                  ) : (
                    <input
                      type={typeof value === 'number' || !isNaN(Number(value)) ? 'number' : 'text'}
                      required
                      value={value}
                      onChange={(e) => setSystemSettings({...systemSettings, [key]: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              ))}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isSavingSettings ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      Save All Settings
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                VAPID Key Generator
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Use this tool to generate keys for Web Push Notifications. Add these to your environment variables in the Settings menu.
              </p>
              
              <button
                onClick={async () => {
                  if (isGeneratingVapid) return;
                  setIsGeneratingVapid(true);
                  setGeneratedVapidKeys(null);
                  try {
                    const res = await fetch('/api/admin/generate-vapid', {
                      headers: { 'x-admin-id': user.id },
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (data.success) {
                      setGeneratedVapidKeys({
                        publicKey: data.publicKey,
                        privateKey: data.privateKey
                      });
                      toast.success('Keys generated! Copy them below.');
                    } else {
                      toast.error(data.error || 'Failed to generate keys');
                    }
                  } catch (error) {
                    toast.error('Failed to generate keys');
                  } finally {
                    setIsGeneratingVapid(false);
                  }
                }}
                disabled={isGeneratingVapid}
                className="px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center gap-2 mb-6"
              >
                {isGeneratingVapid ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isGeneratingVapid ? 'Generating...' : 'Generate New VAPID Keys'}
              </button>

              {generatedVapidKeys && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Public Key (VAPID_PUBLIC_KEY & VITE_VAPID_PUBLIC_KEY)</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={generatedVapidKeys.publicKey}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono break-all"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedVapidKeys.publicKey);
                          toast.success('Public key copied!');
                        }}
                        className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Private Key (VAPID_PRIVATE_KEY)</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        type="password"
                        value={generatedVapidKeys.privateKey}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedVapidKeys.privateKey);
                          toast.success('Private key copied!');
                        }}
                        className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Copy these now. They are not stored on the server and will disappear if you refresh the page.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        ) : activeTab === 'ai' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col" style={{ height: '520px' }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Kosi AI Assistant</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Admin context · Full platform knowledge</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!aiInput.trim() || aiLoading) return;
                  const userMsg = aiInput.trim();
                  setAiInput('');
                  setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
                  setAiLoading(true);
                  try {
                    const res = await fetch('/api/support/ai-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: userMsg, context: 'admin' }),
                      credentials: 'include'
                    });
                    const data = await res.json();
                    setAiMessages(prev => [...prev, { role: 'ai', text: data.text || "Sorry, I couldn't process that. Please try again." }]);
                  } catch {
                    setAiMessages(prev => [...prev, { role: 'ai', text: "Connection error. Please try again." }]);
                  } finally {
                    setAiLoading(false);
                  }
                }} className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    placeholder="Ask about users, transactions, platform settings..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                {activeTab === 'transactions' ? (
                  <>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('userName')}>
                      <div className="flex items-center gap-1">User <SortIcon field="userName" /></div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1">Type <SortIcon field="type" /></div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('amount')}>
                      <div className="flex items-center gap-1">Amount <SortIcon field="amount" /></div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                    </th>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                    </th>
                  </>
                ) : activeTab === 'tickets' ? (
                  <>
                    <th className="p-4 font-bold">Subject</th>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Created At</th>
                  </>
                ) : activeTab === 'logs' ? (
                  <>
                    <th className="p-4 font-bold">Admin</th>
                    <th className="p-4 font-bold">Action</th>
                    <th className="p-4 font-bold">Details</th>
                    <th className="p-4 font-bold">Date</th>
                  </>
                ) : activeTab === 'overview' ? (
                  <>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">User <SortIcon field="name" /></div>
                    </th>
                    <th className={`p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${visibleColumns.contact ? 'hidden sm:table-cell' : 'hidden'}`} onClick={() => handleSort('email')}>
                      <div className="flex items-center gap-1">Contact <SortIcon field="email" /></div>
                    </th>
                    <th className={`p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${visibleColumns.balance ? 'hidden md:table-cell' : 'hidden'}`} onClick={() => handleSort('balance')}>
                      <div className="flex items-center gap-1">Balance <SortIcon field="balance" /></div>
                    </th>
                    <th className={`p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${visibleColumns.status ? 'hidden xl:table-cell' : 'hidden'}`} onClick={() => handleSort('accountStatus')}>
                      <div className="flex items-center gap-1">Status <SortIcon field="accountStatus" /></div>
                    </th>
                    <th className={`p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${visibleColumns.joined ? 'hidden lg:table-cell' : 'hidden'}`} onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1">Joined <SortIcon field="createdAt" /></div>
                    </th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">User <SortIcon field="name" /></div>
                    </th>
                    <th className="p-4 font-bold hidden sm:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('email')}>
                      <div className="flex items-center gap-1">Contact <SortIcon field="email" /></div>
                    </th>
                    <th className="p-4 font-bold hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('balance')}>
                      <div className="flex items-center gap-1">Balance <SortIcon field="balance" /></div>
                    </th>
                    <th className="p-4 font-bold hidden xl:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('accountStatus')}>
                      <div className="flex items-center gap-1">Status <SortIcon field="accountStatus" /></div>
                    </th>
                    <th className="p-4 font-bold hidden lg:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1">Joined <SortIcon field="createdAt" /></div>
                    </th>
                    <th className="p-4 font-bold hidden lg:table-cell">Role</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeTab === 'transactions' ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{tx.userName}</div>
                      <div className="text-xs text-slate-500">{tx.userEmail}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{tx.type}</td>
                    <td className={`p-4 font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₦{Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : activeTab === 'tickets' ? (
                tickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      fetchTicketMessages(ticket.id);
                    }}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{ticket.subject}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>{ticket.userName}</div>
                      <div className="text-xs opacity-60">{ticket.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(ticket.created_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : activeTab === 'logs' ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{log.admin_name}</div>
                      <div className="text-xs text-slate-500">ID: {log.admin_id}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{log.details}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            {u.name}
                            {u.accountStatus === 'frozen' && (
                              <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Frozen</span>
                            )}
                          </div>
                          {u.isAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full mt-0.5 inline-block font-bold uppercase tracking-wider">Admin</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 ${visibleColumns.contact ? 'hidden sm:table-cell' : 'hidden'}`}>
                      <div className="text-sm text-slate-800 dark:text-slate-200">{u.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.phone || 'No phone'}</div>
                    </td>
                    <td className={`p-4 font-mono font-medium text-slate-800 dark:text-slate-200 ${visibleColumns.balance ? 'hidden md:table-cell' : 'hidden'}`}>
                      ₦{u.balance?.toLocaleString() || 0}
                    </td>
                    <td className={`p-4 ${visibleColumns.status ? 'hidden xl:table-cell' : 'hidden'}`}>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.accountStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className={`p-4 text-xs text-slate-500 ${visibleColumns.joined ? 'hidden lg:table-cell' : 'hidden'}`}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {activeTab !== 'overview' && (
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {u.isAgent && <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Agent</span>}
                          {u.isCustomerCare && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Support</span>}
                          {!u.isAgent && !u.isCustomerCare && !u.isAdmin && <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Customer</span>}
                        </div>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="View Details"
                        >
                          <UserIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setEmailData({ ...emailData, targetEmail: u.email });
                            setActiveTab('email');
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Send Direct Email"
                        >
                          <BellRing className="w-5 h-5" />
                        </button>
                        {!u.isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setFundData({ ...fundData, userId: u.id, userName: u.name });
                                setShowFundModal(true);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              title="Fund User Wallet"
                            >
                              <Wallet className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u.id, u.accountStatus || 'active')}
                              className={`p-2 rounded-lg transition-colors ${u.accountStatus === 'frozen' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                              title={u.accountStatus === 'frozen' ? "Activate User" : "Freeze User"}
                            >
                              <AlertCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleAgentStatus(u.id, !!u.isAgent)}
                              className={`p-2 rounded-lg transition-colors ${u.isAgent ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                              title={u.isAgent ? "Revoke Agent" : "Make Agent"}
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleCustomerCareStatus(u.id, !!u.isCustomerCare)}
                              className={`p-2 rounded-lg transition-colors ${u.isCustomerCare ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                              title={u.isCustomerCare ? "Revoke Support Role" : "Make Support Agent"}
                            >
                              <Shield className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleAdminStatus(u.id, !!u.isAdmin)}
                              className={`p-2 rounded-lg transition-colors ${u.isAdmin ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                              title={u.isAdmin ? "Revoke Admin" : "Make Admin"}
                            >
                              <ShieldCheck className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {((activeTab === 'transactions' && transactions.length === 0) || (activeTab !== 'transactions' && activeTab !== 'tickets' && users.length === 0)) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <Search className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination Footer */}
        {activeTab !== 'tickets' && activeTab !== 'overview' && activeTab !== 'logs' && activeTab !== 'broadcast' && activeTab !== 'settings' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Page {activeTab === 'transactions' ? txPage : userPage} of {activeTab === 'transactions' ? totalPages.transactions : totalPages.users}
              <span className="ml-2 text-xs opacity-70">
                (Total: {activeTab === 'transactions' ? totalRecords.transactions.toLocaleString() : totalRecords.users.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={(activeTab === 'transactions' ? txPage : userPage) === 1}
                onClick={() => activeTab === 'transactions' ? setTxPage(p => p - 1) : setUserPage(p => p - 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={(activeTab === 'transactions' ? txPage : userPage) === (activeTab === 'transactions' ? totalPages.transactions : totalPages.users)}
                onClick={() => activeTab === 'transactions' ? setTxPage(p => p + 1) : setUserPage(p => p + 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-500" />
                User Details
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email Address</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone Number</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Joined Date</p>
                      <p className="font-medium text-slate-800 dark:text-white">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Account Status</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Current Balance</p>
                      <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">₦{selectedUser.balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Role</p>
                      <div className="flex gap-2 mt-1">
                        {selectedUser.isAdmin && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Admin</span>}
                        {selectedUser.isCustomerCare && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Support</span>}
                        {selectedUser.isAgent && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Agent</span>}
                        {!selectedUser.isAdmin && !selectedUser.isCustomerCare && !selectedUser.isAgent && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-bold">Customer</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Account Tier & KYC</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.tier} (Level {selectedUser.kycLevel})</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-bold uppercase ${selectedUser.accountStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedUser.accountStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Limits & Security */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Limits & Security</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Daily Transfer Limit</p>
                      <p className="font-medium text-slate-800 dark:text-white">₦{(selectedUser.dailyTransferLimit || 50000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Daily Withdrawal Limit</p>
                      <p className="font-medium text-slate-800 dark:text-white">₦{(selectedUser.dailyWithdrawalLimit || 50000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">BVN</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.bvn || 'Not Provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">2FA Enabled</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.twoFactorEnabled ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Activity</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Total Referred</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.totalReferred || 0} users</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Referral Code</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.referralCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Last Login</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEmailData({ ...emailData, targetEmail: selectedUser.email });
                  setActiveTab('email');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <BellRing className="w-4 h-4" /> Email User
              </button>
              <button
                onClick={() => {
                  setFundData({ ...fundData, userId: selectedUser.id, userName: selectedUser.name });
                  setShowFundModal(true);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Fund Wallet
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newUser.phone}
                  onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                <input
                  type="checkbox"
                  id="isAgent"
                  checked={newUser.isAgent}
                  onChange={e => setNewUser({...newUser, isAgent: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                />
                <label htmlFor="isAgent" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Register as Agent
                </label>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-500">From: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {ticketMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender_type === 'user' 
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700' 
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${msg.sender_type === 'user' ? 'text-slate-500' : 'text-emerald-100'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleReply} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isReplying || !replyMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl transition-colors text-sm"
                >
                  {isReplying ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Fund User Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Fund Wallet: {fundData.userName}</h3>
              <button onClick={() => setShowFundModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFundUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Action Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="fundType" 
                      value="credit" 
                      checked={fundData.type === 'credit'}
                      onChange={() => setFundData({...fundData, type: 'credit'})}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Credit (Add Funds)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="fundType" 
                      value="debit" 
                      checked={fundData.type === 'debit'}
                      onChange={() => setFundData({...fundData, type: 'debit'})}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Debit (Remove Funds)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={fundData.amount}
                  onChange={e => setFundData({...fundData, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description / Reason</label>
                <input
                  type="text"
                  required
                  value={fundData.description}
                  onChange={e => setFundData({...fundData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="e.g. Refund for failed transaction"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm ${
                    fundData.type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      {fundData.type === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
