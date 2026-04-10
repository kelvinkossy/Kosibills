import { CheckCircle2, ChevronRight, Zap, Shield, Star, Gift } from 'lucide-react';
import { User } from '../../types';

interface RecommendedProps {
  user: User;
}

export default function Recommended({ user }: RecommendedProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      <div className="premium-card p-8 sm:p-10 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl">
            <Star className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1">Personalized For You</h2>
            <p className="text-3xl font-black tracking-tighter">Recommended Bills</p>
          </div>
          <p className="text-emerald-100 text-sm font-medium">Based on your recent transactions</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white px-2">Suggested Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Water Bill', desc: 'Pay your monthly water bill', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { title: 'Internet Service', desc: 'Renew your broadband', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
            { title: 'Waste Management', desc: 'LAWMA & others', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
            { title: 'Toll Pass', desc: 'LCC & e-Tag top-up', icon: Star, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          ].map((service, i) => (
            <button key={i} className="premium-card p-5 flex items-center justify-between hover:scale-[1.02] transition-transform text-left">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${service.bg} ${service.color}`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{service.title}</h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{service.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white px-2">Special Offers</h3>
        <div className="premium-card overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { desc: '10% Cashback on Electricity', date: 'Valid till Mar 31' },
              { desc: 'Free Transfers this Weekend', date: 'Sat & Sun only' },
            ].map((item, i) => (
              <div key={i} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{item.desc}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                  </div>
                </div>
                <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Claim</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
