
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { DataRow, ChatMessage, ChartConfig } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface AiInsightsProps {
  data: DataRow[];
  headers: string[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onUpdateVisualization: (config: ChartConfig) => void;
  onCleanData: (column: string, operation: string) => void;
  onAddToDashboard: (config: ChartConfig) => void;
}

export const AiInsights: React.FC<AiInsightsProps> = ({ 
    data, headers, messages, setMessages, onUpdateVisualization, onCleanData, onAddToDashboard 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const dataSummary = data.length > 0 
            ? `Dataset has ${data.length} rows. Columns: ${headers.join(', ')}. Sample Row: ${JSON.stringify(data[0])}`
            : "No data uploaded yet.";
        
        const historyForApi = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        historyForApi.push({ role: 'user', parts: [{ text: input }]});

        const response = await getGeminiResponse(historyForApi, dataSummary);
        const content = response.text;
        const toolCalls = response.functionCalls;

        if (content) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content }]);
        }

        if (toolCalls && toolCalls.length > 0) {
             for (const call of toolCalls) {
                 const args = call.args as any;
                 
                 if (call.name === 'generateVisualization') {
                     const config: ChartConfig = {
                         id: Date.now().toString(),
                         title: args.title,
                         type: args.type,
                         xAxisKey: args.xAxisKey,
                         yAxisKeys: args.yAxisKey ? [args.yAxisKey] : [],
                     };
                     onUpdateVisualization(config);
                     setMessages(prev => [...prev, { 
                         id: Date.now().toString(), 
                         role: 'model', 
                         content: `Generated a ${args.type} chart for ${args.xAxisKey}.`,
                         isToolOutput: true
                    }]);
                 } else if (call.name === 'cleanData') {
                     onCleanData(args.column, args.operation);
                     setMessages(prev => [...prev, { 
                        id: Date.now().toString(), 
                        role: 'model', 
                        content: `Executed ${args.operation} on column ${args.column}.`,
                        isToolOutput: true
                   }]);
                 } else if (call.name === 'addToDashboard') {
                     setMessages(prev => [...prev, { 
                        id: Date.now().toString(), 
                        role: 'model', 
                        content: `Added the current chart to dashboard.`,
                        isToolOutput: true
                   }]);
                 }
             }
        }

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 opacity-50">
                <Sparkles className="w-12 h-12 mb-4" />
                <p className="font-medium">Ask InsightFlow to analyze your data...</p>
            </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-gray-500 dark:text-gray-300" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            
            <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : msg.isToolOutput 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-tl-none font-mono text-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                     <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
             </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-2xl flex items-center gap-2 shadow-xl shadow-black/5 transition-colors">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI to visualize or clean your data..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-medium">InsightFlow Agent can make mistakes. Always review generated visualizations.</p>
      </div>
    </div>
  );
};