import React, { memo } from 'react';
import { motion } from 'motion/react';
import { View } from '../../types';
import { Smartphone, Wifi, Lightbulb, Tv, Send, Globe, Gamepad2, GraduationCap, MoreHorizontal, Zap } from 'lucide-react';

interface QuickActionsProps {
  setView: (view: View) => void;
  userPhone: string;
}

const SERVICES = [
  { name: 'Airtime',     icon: Smartphone,   view: 'airtime'         as View, color: 'from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/30' },
  { name: 'Data',        icon: Wifi,          view: 'data'            as View, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
  { name: 'Electricity', icon: Lightbulb,     view: 'electricity'     as View, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
  { name: 'Cable TV',    icon: Tv,            view: 'cable'           as View, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/30' },
  { name: 'Transfer',    icon: Send,          view: 'transfer'        as View, color: 'from-sky-500 to-cyan-600',     shadow: 'shadow-sky-500/30' },
  { name: 'Internet',    icon: Globe,         view: 'internet'        as View, color: 'from-indigo-500 to-blue-600',  shadow: 'shadow-indigo-500/30' },
  { name: 'Betting',     icon: Gamepad2,      view: 'betting'         as View, color: 'from-pink-500 to-rose-600',    shadow: 'shadow-pink-500/30' },
  { name: 'Education',   icon: GraduationCap, view: 'education'       as View, color: 'from-green-500 to-emerald-600',shadow: 'shadow-green-500/30' },
  { name: 'More',        icon: MoreHorizontal,view: 'other-utilities' as View, color: 'from-slate-500 to-slate-600',  shadow: 'shadow-slate-500/30' },
];

const QuickActions = memo(function QuickActions({ setView }: QuickActionsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-slate-800 dark:text-white text-base">Services</h2>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3 fill-current" /> Instant
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4">
        {SERVICES.map((service, i) => {
          const Icon = service.icon;
          return (
            <motion.button
              key={service.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => setView(service.view)}
              className="flex flex-col items-center gap-2 group touch-manipulation"
            >
              <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${service.color} shadow-lg ${service.shadow} flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-transform duration-200`}>
                <Icon className="w-7 h-7 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight">{service.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default QuickActions;
