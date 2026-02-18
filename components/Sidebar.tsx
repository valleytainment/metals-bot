
import React from 'react';
import { LayoutDashboard, History, BookOpen, Settings, BarChart3 } from 'lucide-react';

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
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-black tracking-tighter text-blue-500 flex items-center gap-2">
          METALS<span className="text-slate-100">SIGNAL</span>
        </h1>
        <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">Bot Engine v1.0.4</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        Personal Use Only
      </div>
    </div>
  );
};

export default Sidebar;
