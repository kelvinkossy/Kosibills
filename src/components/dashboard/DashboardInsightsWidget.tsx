import React, { memo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Lightbulb, BarChart2 } from 'lucide-react';

interface DashboardInsightsWidgetProps {
  aiTip: string;
  topExpenseCategory: string;
  budgetUsedPercent: number;
  budgetLimit: number;
}

const DashboardInsightsWidget = memo(function DashboardInsightsWidget({
  aiTip, topExpenseCategory, budgetUsedPercent, budgetLimit
}: DashboardInsightsWidgetProps) {
  const barColor = budgetUsedPercent >= 90 ? '#ef4444' : budgetUsedPercent >= 70 ? '#f97316' : '#10b981';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="font-black text-slate-800 dark:text-white text-sm">Spending Insights</h2>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3">
        <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Top Expense</p>
          <p className="font-bold text-sm text-slate-800 dark:text-white">{topExpenseCategory || 'No data yet'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Monthly Budget</p>
          <p className="text-[10px] font-black" style={{ color: barColor }}>{budgetUsedPercent}% used</p>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${budgetUsedPercent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ backgroundColor: barColor }} />
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Limit: ₦{(budgetLimit || 50000).toLocaleString()}/month</p>
      </div>

      {aiTip && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-3 flex gap-2">
          <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">{aiTip}</p>
        </div>
      )}
    </div>
  );
});

export default DashboardInsightsWidget;
