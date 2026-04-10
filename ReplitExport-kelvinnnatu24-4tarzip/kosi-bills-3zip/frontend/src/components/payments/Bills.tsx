import { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Wifi, 
  Lightbulb, 
  Tv, 
  GraduationCap, 
  Droplets, 
  Globe, 
  Trash2, 
  Car, 
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import { View } from '../../types';
import { storage } from '../../utils/storage';

interface BillsProps {
  setView: (view: View) => void;
}

export default function Bills({ setView }: BillsProps) {
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => {
    const parsed = storage.getJSON<any[]>('recent_services');
    if (parsed) {
      const restored = parsed.map((s: any) => ({
        ...s,
        icon: getIcon(s.name)
      })).filter((s: any) => s.icon !== null);
      setRecentServices(restored);
    }
  }, []);

  const handleServiceClick = (item: any) => {
    const { icon, ...itemWithoutIcon } = item;
    const updated = [itemWithoutIcon, ...recentServices.filter(s => s.name !== item.name)].slice(0, 4);
    setRecentServices([item, ...recentServices.filter(s => s.name !== item.name)].slice(0, 4));
    storage.setJSON('recent_services', updated);
    setView(item.view);
  };

  const billCategories = [
    {
      title: 'Telecommunications',
      items: [
        { name: 'Airtime', icon: PhoneCall, view: 'airtime' as View, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { name: 'Data Bundle', icon: Wifi, view: 'data' as View, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { name: 'Internet Service', icon: Globe, view: 'internet' as View, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
      ]
    },
    {
      title: 'Utilities',
      items: [
        { name: 'Electricity', icon: Lightbulb, view: 'electricity' as View, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        { name: 'Water Bill', icon: Droplets, view: 'other-utilities' as View, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
        { name: 'Waste Management', icon: Trash2, view: 'other-utilities' as View, color: 'text-stone-500', bg: 'bg-stone-100 dark:bg-stone-900/30' },
      ]
    },
    {
      title: 'Education & Exams',
      items: [
        { name: 'JAMB e-PIN', icon: GraduationCap, view: 'education' as View, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        { name: 'WAEC Result Checker', icon: GraduationCap, view: 'education' as View, color: 'text-fuchsia-500', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
      ]
    },
    {
      title: 'Entertainment & Lifestyle',
      items: [
        { name: 'Cable TV', icon: Tv, view: 'cable' as View, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
        { name: 'Betting & Lottery', icon: Gamepad2, view: 'betting' as View, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
        { name: 'Toll Pass', icon: Car, view: 'other-utilities' as View, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
      ]
    }
  ];

  const getIcon = (name: string) => {
    for (const category of billCategories) {
      const item = category.items.find(i => i.name === name);
      if (item) return item.icon;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-4">
      <div className="premium-card p-6 sm:p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tighter mb-1">All Bills & Services</h2>
          <p className="text-slate-300 font-medium text-sm">Pay all your bills in one place quickly and securely.</p>
        </div>
      </div>

      {recentServices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white px-2">Recently Used</h3>
          <div className="grid grid-cols-4 gap-2">
            {recentServices.map((service, idx) => (
              <button
                key={idx}
                onClick={() => setView(service.view)}
                className="premium-card p-3 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform text-center group"
              >
                <div className={`p-2 rounded-xl ${service.bg} ${service.color} group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{service.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {billCategories.map((category, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white px-2">{category.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {category.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleServiceClick(item)}
                    className="premium-card p-3 flex items-center justify-between hover:scale-[1.02] transition-transform text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</h4>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
