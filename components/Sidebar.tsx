
import React from 'react';
import { LayoutDashboard, History, BookOpen, Settings, BarChart3, Fingerprint } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const items = [
    { id: 'dashboard', label: 'Signals', icon: LayoutDashboard },
    { id: 'backtest', label: 'Backtest', icon: BarChart3 },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-72 bg-[#0a0f1d] border-r border-slate-800/60 flex flex-col relative z-20">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Fingerprint className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">
              METALS<span className="text-blue-500">BOT</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest font-black">PRO TERMINAL</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1'
                : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-10">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
            Authorized for <br/> <span className="text-blue-500">Personal Use Only</span>
          </p>
          <div className="mt-3 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
