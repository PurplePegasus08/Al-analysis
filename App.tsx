
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataStudio } from './views/DataStudio';
import { Visualization } from './views/Visualization';
import { AiInsights } from './views/AiInsights';
import { Dashboard } from './views/Dashboard';
import { AuthView } from './components/AuthView';
import { SettingsModal } from './components/SettingsModal';
import { AppView, DataRow, ChartConfig, ChatMessage, DashboardItem, User } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('insightflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
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

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(','); 
        const row: DataRow = {};
        headers.forEach((h, i) => {
            const val = values[i]?.trim().replace(/^"|"$/g, '');
            const num = parseFloat(val);
            row[h] = isNaN(num) ? val : num;
        });
        return row;
      });
      setHeaders(headers);
      setData(parsedData);
      setCurrentView(AppView.DATA);
      setChatMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'system', 
          content: `System: User uploaded ${file.name} with ${parsedData.length} rows.` 
      }]);
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
            height: 300
        };
        return [...prev, newItem];
    });
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

  // AI Tool Handlers
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
          if (operation === 'remove_outliers') {
              newData = [...newData].sort((a, b) => (Number(a[column]) || 0) - (Number(b[column]) || 0));
              const lowerBound = Math.floor(newData.length * 0.05);
              const upperBound = Math.floor(newData.length * 0.95);
              newData = newData.slice(lowerBound, upperBound);
          } else if (operation === 'impute_mean') {
              let sum = 0;
              let count = 0;
              prevData.forEach(r => {
                  if (typeof r[column] === 'number') {
                      sum += r[column] as number;
                      count++;
                  }
              });
              const mean = count > 0 ? sum / count : 0;
              newData = newData.map(r => ({
                  ...r,
                  [column]: (r[column] === null || r[column] === '' || isNaN(Number(r[column]))) ? mean : r[column]
              }));
          } else if (operation === 'drop_missing') {
              newData = newData.filter(r => r[column] !== null && r[column] !== '' && r[column] !== undefined);
          }
          return newData;
      });
  }, []);

  // Root authentication check
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
      
      <main className="flex-1 flex flex-col min-w-0 transition-all">
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            data={data} 
            isDarkMode={isDarkMode}
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
