import { apiFetch } from '../../utils/api';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Filter,
  Clock,
  Loader2,
  X,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Transaction, Receipt as ReceiptType, View } from '../../types';
import Receipt from '../common/Receipt';

interface HistoryProps {
  user: User;
  initialTransactionId?: string;
  onTransactionViewed?: () => void;
  onRetry?: (view: View, data: any) => void;
}

export default function History({ user, initialTransactionId, onTransactionViewed, onRetry }: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiFetch(`/api/transactions/${user.id}`);
        const data = await response.json();
        if (data.success) {
          setTransactions(data.transactions || []);
          if (initialTransactionId) {
            const tx = (data.transactions || []).find((t: Transaction) => t.id.toString() === initialTransactionId);
            if (tx) setSelectedTx(tx);
            if (onTransactionViewed) onTransactionViewed();
          }
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id, initialTransactionId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || 
                            (filter === 'credit' && tx.amount > 0) || 
                            (filter === 'debit' && tx.amount < 0);
      const matchesCategory = categoryFilter === 'all' || tx.type.toLowerCase() === categoryFilter.toLowerCase();
      
      const txDate = new Date(tx.date);
      const matchesDate = (!dateRange.start || txDate >= new Date(dateRange.start)) &&
                         (!dateRange.end || txDate <= new Date(dateRange.end + 'T23:59:59'));
      
      return matchesSearch && matchesFilter && matchesCategory && matchesDate;
    });
  }, [transactions, searchTerm, filter, categoryFilter, dateRange]);

  const stats = useMemo(() => {
    const income = transactions.filter(tx => tx.amount > 0 && tx.status === 'success').reduce((acc, tx) => acc + tx.amount, 0);
    const expenses = transactions.filter(tx => tx.amount < 0 && tx.status === 'success').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return { income, expenses };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="premium-card overflow-hidden p-6 space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div>
                <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800/50 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference ID', 'Balance After'];
    const csvData = filteredTransactions.map(tx => [
      new Date(tx.date).toLocaleString(),
      tx.type,
      `"${tx.description}"`,
      tx.amount,
      tx.status,
      tx.tx_ref || `TXN-${String(tx.id).padStart(8, '0')}`,
      tx.balance_after || ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">Total Inflow</p>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">₦{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Total Outflow</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">₦{stats.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Activity History</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Track all your utility payments and wallet funding</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs appearance-none font-bold text-slate-700 dark:text-slate-300 transition-all"
            >
              <option value="all">All Types</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs appearance-none font-bold text-slate-700 dark:text-slate-300 transition-all"
            >
              <option value="all">Categories</option>
              <option value="funding">Funding</option>
              <option value="airtime">Airtime</option>
              <option value="data">Data</option>
              <option value="electricity">Electricity</option>
              <option value="cable">Cable TV</option>
              <option value="education">Education</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <button 
            onClick={downloadCSV}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title="Download CSV Statement"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="premium-card overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const Icon = tx.amount > 0 ? ArrowDownLeft : ArrowUpRight;
              return (
                <button 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          tx.status === 'success' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20' : 
                          tx.status === 'pending' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/20' :
                          'text-red-600 bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-tighter">{tx.type}</div>
                    {tx.status === 'failed' && onRetry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const viewMap: Record<string, View> = {
                            'Airtime': 'airtime',
                            'Data': 'data',
                            'Electricity': 'electricity',
                            'Cable TV': 'cable',
                            'Betting': 'betting',
                            'Internet': 'internet',
                            'Education': 'education',
                            'Other Utilities': 'other-utilities'
                          };
                          const view = viewMap[tx.type];
                          if (view) {
                            try {
                              const data = tx.metadata ? JSON.parse(tx.metadata) : {};
                              onRetry(view, data);
                            } catch (e) {
                              console.error("Failed to parse metadata", e);
                              onRetry(view, {});
                            }
                          }
                        }}
                        className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30 ml-auto"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Retry
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No activity found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Your transaction history will appear here once you start using Kosi Bills.</p>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (
          <Receipt 
            receipt={{
              transactionId: selectedTx.id.toString(),
              date: new Date(selectedTx.date).toLocaleString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
              }),
              amount: Math.abs(selectedTx.amount),
              type: selectedTx.type,
              recipient: selectedTx.description,
              status: selectedTx.status,
              reference: selectedTx.tx_ref || `TXN-${String(selectedTx.id).padStart(8, '0')}`,
              fee: 0,
              total: Math.abs(selectedTx.amount)
            }}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
