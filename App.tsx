
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataStudio } from './views/DataStudio';
import { Visualization } from './views/Visualization';
import { AiInsights } from './views/AiInsights';
import { Dashboard } from './views/Dashboard';
import { AuthView } from './components/AuthView';
import { SettingsModal } from './components/SettingsModal';
import { AppView, DataRow, ChartConfig, ChatMessage, DashboardItem, User } from './types';
import { CheckCircle2, Info } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('insightflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  // Global Event Listener for View actions (like duplication)
  useEffect(() => {
    const handleAction = (e: any) => {
        if (e.type === 'ADD') {
            setDashboardItems(prev => [...prev, e.item]);
            setNotification({ message: 'Chart Duplicated', type: 'success' });
        }
    };
    (window as any).dispatchDashboardAction = handleAction;
    return () => delete (window as any).dispatchDashboardAction;
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Notification Auto-hide
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', content: "Hello! Upload a dataset, and I can help you visualize and analyze it." }
  ]);

  // Current Visualization Config
  const [vizConfig, setVizConfig] = useState<ChartConfig>({
    id: 'default',
    title: 'New Analysis',
    type: 'bar',
    xAxisKey: '',
    yAxisKeys: [],
    theme: 'default',
    aggregation: 'sum',
    tooltip: {
        show: true,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        textColor: isDarkMode ? '#f3f4f6' : '#111827',
        borderRadius: 8
    }
  });

  // Sync vizConfig colors when theme changes
  useEffect(() => {
    setVizConfig(prev => ({
      ...prev,
      tooltip: {
        ...prev.tooltip!,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        textColor: isDarkMode ? '#f3f4f6' : '#111827',
      }
    }));
  }, [isDarkMode]);

  // --- Auth Handlers ---
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('insightflow_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('insightflow_user');
    setCurrentView(AppView.DASHBOARD);
  };

  // --- Handlers ---

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let curVal = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = "";
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const headers = parseCSVLine(lines[0]);
      
      const parsedData = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row: DataRow = {};
        headers.forEach((h, i) => {
            const val = values[i];
            if (val === undefined) {
              row[h] = null;
              return;
            }
            const num = parseFloat(val);
            row[h] = (isNaN(num) || val.trim() === '' || isNaN(Number(val))) ? val : num;
        });
        return row;
      });
      
      setHeaders(headers);
      setData(parsedData);
      setCurrentView(AppView.DATA);
      setNotification({ message: `Successfully loaded ${parsedData.length} records.`, type: 'success' });
    }
  };

  const handleAddToDashboard = useCallback((config: ChartConfig) => {
    setDashboardItems(prev => {
        const count = prev.length;
        const newItem: DashboardItem = {
            ...config,
            id: Date.now().toString(),
            x: 20 + (count % 5) * 40,
            y: 20 + (count % 5) * 40,
            width: 400,
            height: 300,
            zIndex: 10
        };
        return [...prev, newItem];
    });
    setNotification({ message: 'Added to Dashboard', type: 'success' });
  }, []);

  const handleRemoveFromDashboard = useCallback((id: string) => {
    setDashboardItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateDashboardItem = useCallback((id: string, updates: Partial<DashboardItem>) => {
    setDashboardItems(prev => {
      const index = prev.findIndex(i => i.id === id);
      if (index === -1) return prev;
      
      const currentItem = prev[index];
      const hasChanges = Object.keys(updates).some(
        key => (updates as any)[key] !== (currentItem as any)[key]
      );
      
      if (!hasChanges) return prev;
      
      const next = [...prev];
      next[index] = { ...currentItem, ...updates };
      return next;
    });
  }, []);

  const handleAiUpdateViz = useCallback((config: ChartConfig) => {
    setVizConfig({
        ...config,
        theme: config.theme || 'default',
        aggregation: config.aggregation || 'sum',
        tooltip: config.tooltip || { 
          show: true, 
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
          textColor: isDarkMode ? '#f3f4f6' : '#111827', 
          borderRadius: 8 
        }
    });
    setCurrentView(AppView.VISUALIZE);
  }, [isDarkMode]);

  const handleAiCleanData = useCallback((column: string, operation: string) => {
      setData(prevData => {
          let newData = [...prevData];
          const beforeCount = newData.length;

          if (operation === 'remove_outliers') {
              const values = newData.map(r => Number(r[column])).filter(v => !isNaN(v)).sort((a, b) => a - b);
              if (values.length > 4) {
                  const q1 = values[Math.floor(values.length * 0.25)];
                  const q3 = values[Math.floor(values.length * 0.75)];
                  const iqr = q3 - q1;
                  const min = q1 - 1.5 * iqr;
                  const max = q3 + 1.5 * iqr;
                  newData = newData.filter(r => {
                      const v = Number(r[column]);
                      return isNaN(v) || (v >= min && v <= max);
                  });
              }
              setNotification({ message: `Outliers removed. Dropped ${beforeCount - newData.length} rows.`, type: 'info' });
          } else if (operation === 'impute_mean') {
              let sum = 0;
              let count = 0;
              prevData.forEach(r => {
                  const val = Number(r[column]);
                  if (!isNaN(val)) {
                      sum += val;
                      count++;
                  }
              });
              const mean = count > 0 ? Number((sum / count).toFixed(2)) : 0;
              let imputedCount = 0;
              newData = newData.map(r => {
                  const val = r[column];
                  if (val === null || val === '' || val === undefined || isNaN(Number(val))) {
                      imputedCount++;
                      return { ...r, [column]: mean };
                  }
                  return r;
              });
              setNotification({ message: `Imputed mean (${mean}) for ${imputedCount} missing values in ${column}.`, type: 'success' });
          } else if (operation === 'drop_missing') {
              newData = newData.filter(r => r[column] !== null && r[column] !== '' && r[column] !== undefined && !isNaN(Number(r[column])));
              setNotification({ message: `Dropped ${beforeCount - newData.length} rows with missing values in ${column}.`, type: 'info' });
          }
          return newData;
      });
  }, []);

  if (!user) {
    return <AuthView onLogin={handleLogin} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        user={user}
        isOpen={isSidebarOpen}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={setCurrentView} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 transition-all relative">
        {notification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in pointer-events-none">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${
              notification.type === 'success' 
              ? 'bg-green-50/90 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
              : 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <span className="text-sm font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            data={data} 
            isDarkMode={isDarkMode}
            headers={headers}
            items={dashboardItems} 
            onUpdateItem={handleUpdateDashboardItem}
            onRemoveItem={handleRemoveFromDashboard}
            onNavigateToData={() => setCurrentView(AppView.DATA)}
          />
        )}
        
        {currentView === AppView.DATA && (
          <DataStudio 
            data={data} 
            headers={headers} 
            onFileUpload={handleFileUpload} 
          />
        )}
        
        {currentView === AppView.VISUALIZE && (
          <Visualization 
            data={data} 
            isDarkMode={isDarkMode}
            headers={headers} 
            config={vizConfig} 
            setConfig={setVizConfig} 
            onAddToDashboard={handleAddToDashboard} 
          />
        )}
        
        {currentView === AppView.INSIGHTS && (
          <AiInsights 
            data={data} 
            headers={headers}
            messages={chatMessages}
            setMessages={setChatMessages}
            onUpdateVisualization={handleAiUpdateViz}
            onCleanData={handleAiCleanData}
            onAddToDashboard={handleAddToDashboard}
          />
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;
