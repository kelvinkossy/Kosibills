import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../../types';
import { ArrowDownLeft, ArrowUpRight, Smartphone, Wifi, Lightbulb, Tv, Globe, Gamepad2, GraduationCap, CreditCard, RefreshCw, ChevronRight, Clock } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  setView: (view: any) => void;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Airtime:          { icon: Smartphone,    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  Data:             { icon: Wifi,           color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Electricity:      { icon: Lightbulb,     color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'Cable TV':       { icon: Tv,            color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  Internet:         { icon: Globe,          color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  Betting:          { icon: Gamepad2,       color: 'text-pink-600 dark:text-pink-400',    bg: 'bg-pink-100 dark:bg-pink-900/30' },
  Education:        { icon: GraduationCap, color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-100 dark:bg-green-900/30' },
  Funding:          { icon: ArrowDownLeft, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Transfer:         { icon: ArrowUpRight,  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  Withdrawal:       { icon: CreditCard,    color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-100 dark:bg-red-900/30' },
  Commission:       { icon: RefreshCw,     color: 'text-teal-600 dark:text-teal-400',    bg: 'bg-teal-100 dark:bg-teal-900/30' },
  'Other Utilities':{ icon: CreditCard,   color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

const SkeletonRow = () => (
  <div className="flex items-center justify-between p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
      </div>
    </div>
    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
  </div>
);

const RecentTransactions = memo(function RecentTransactions({ transactions, isLoading, setView }: RecentTransactionsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-white text-base">Recent Activity</h2>
        <button onClick={() => setView('history')}
          className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        {isLoading ? (
          <>
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </>
        ) : transactions.length > 0 ? (
          transactions.slice(0, 5).map((tx, i) => {
            const meta = TYPE_META[tx.type] || TYPE_META['Other Utilities'];
            const Icon = meta.icon;
            const isCredit = tx.amount > 0;
            return (
              <motion.div key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[180px]">{tx.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'success' ? 'bg-emerald-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{tx.status}</p>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(tx.date)}
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`font-black text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {isCredit ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </motion.div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">No transactions yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Your activity will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default RecentTransactions;
