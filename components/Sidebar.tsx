
import React, { useState } from 'react';
import { LayoutDashboard, Database, BarChart2, BrainCircuit, Settings, Sparkles, ChevronLeft, ChevronRight, Moon, Sun, LogOut } from 'lucide-react';
import { AppView, User } from '../types';

interface SidebarProps {
  currentView: AppView;
  user: User;
  isOpen: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggle: () => void;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  user,
  isOpen, 
  isDarkMode, 
  onToggleTheme, 
  onToggle, 
  onNavigate, 
  onOpenSettings,
  onLogout
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.DATA, label: 'Data Studio', icon: Database },
    { id: AppView.VISUALIZE, label: 'Visualization', icon: BarChart2 },
    { id: AppView.INSIGHTS, label: 'AI Insights', icon: BrainCircuit },
  ];

  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-30 transition-all duration-300 ease-in-out relative shadow-sm`}
    >
      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full p-1 shadow-lg z-40 transition-transform active:scale-90"
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      <div className={`p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 ${!isOpen && 'justify-center px-2'}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Sparkles className="text-white w-4 h-4" />
        </div>
        <h1 className={`font-bold text-lg tracking-tight text-gray-900 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          InsightFlow
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative ${
              currentView === item.id
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
            } ${!isOpen && 'justify-center px-0'}`}
            title={!isOpen ? item.label : ''}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full"></div>
            )}
            <item.icon className={`w-5 h-5 shrink-0 ${currentView === item.id ? 'text-blue-500' : ''}`} />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              {item.label}
            </span>
          </button>
        ))}
        
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
             {isOpen && (
                <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-2 animate-fade-in">System</p>
             )}
             
             <button 
              onClick={onToggleTheme}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${!isOpen && 'justify-center px-0'}`}
              title={!isOpen ? (isDarkMode ? "Light Mode" : "Dark Mode") : ""}
             >
                {isDarkMode ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
            </button>

             <button 
              onClick={onOpenSettings}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${!isOpen && 'justify-center px-0'}`}
              title={!isOpen ? "Settings" : ""}
             >
                <Settings className="w-5 h-5 shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  Settings
                </span>
            </button>

            <button 
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500/70 hover:bg-red-500/5 hover:text-red-500 transition-all ${!isOpen && 'justify-center px-0'}`}
              title={!isOpen ? "Logout" : ""}
             >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {showLogoutConfirm ? 'Confirm Logout?' : 'Logout'}
                </span>
                {showLogoutConfirm && isOpen && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onLogout(); }}
                    className="ml-auto text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
                  >
                    Yes
                  </button>
                )}
            </button>
        </div>
      </nav>

      <div className={`p-4 border-t border-gray-100 dark:border-gray-800 transition-colors ${!isOpen && 'flex justify-center'}`}>
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                {user.name.charAt(0).toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${!isOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">Professional Plan</p>
            </div>
        </div>
      </div>
    </aside>
  );
};
