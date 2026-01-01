
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardItem, DataRow, ChartType, AggregationType, ThemeType } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Label, ScatterChart, Scatter, ComposedChart, Legend } from 'recharts';
import { Trash2, GripVertical, Download, Maximize2, Lock, Unlock, Grid3X3, Magnet, LayoutGrid, RotateCcw, LayoutTemplate, Settings2, Check, X, Palette, Calculator, Type as TypeIcon, Square, MoreVertical, Copy, Eye, EyeOff, Activity, AlignLeft, Layers, ArrowUpCircle, ArrowDownCircle, FileJson, Table } from 'lucide-react';
import { CHART_THEMES } from './Visualization';
import { processChartData } from '../utils/chartUtils';

interface DashboardProps {
  data: DataRow[];
  headers: string[];
  isDarkMode: boolean;
  items: DashboardItem[];
  onUpdateItem: (id: string, updates: Partial<DashboardItem>) => void;
  onRemoveItem: (id: string) => void;
  onNavigateToData: () => void;
}

const interpolateColor = (minColor: number[], maxColor: number[], factor: number) => {
    const r = Math.round(minColor[0] + (maxColor[0] - minColor[0]) * factor);
    const g = Math.round(minColor[1] + (maxColor[1] - minColor[1]) * factor);
    const b = Math.round(minColor[2] + (maxColor[2] - minColor[2]) * factor);
    return `rgb(${r},${g},${b})`;
};

const HeatmapRect = (props: any) => {
    const { cx, cy, value, min, max, width = 30, height = 30, type, isDarkMode } = props;
    if (!cx || !cy) return null;
    const range = max - min || 1;
    const factor = (value - min) / range;
    const color = isDarkMode
        ? interpolateColor([186, 230, 253], [30, 64, 175], factor)
        : interpolateColor([219, 234, 254], [30, 58, 138], factor);
    
    if (type === 'contour') {
         return <circle cx={cx} cy={cy} r={(width / 2) * (0.5 + 0.5 * factor)} fill={color} fillOpacity={0.7} />;
    }
    return (
        <rect x={cx - width/2} y={cy - height/2} width={width} height={height} fill={color} rx={3} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} strokeWidth={1} />
    );
};

const MiniBoxShape = (props: any) => {
    const { x, width, payload, fill } = props;
    if (!payload || !props.yAxis) return null;
    const { min, q1, median, q3, max: maxVal } = payload;
    
    const yBottom = props.yAxis.scale(min);
    const yQ1 = props.yAxis.scale(q1);
    const yMedian = props.yAxis.scale(median);
    const yQ3 = props.yAxis.scale(q3);
    const yTop = props.yAxis.scale(maxVal);

    const center = x + width / 2;
    return (
        <g>
            <line x1={center} y1={yTop} x2={center} y2={yQ3} stroke={fill} strokeWidth={1} />
            <line x1={center} y1={yQ1} x2={center} y2={yBottom} stroke={fill} strokeWidth={1} />
            <rect x={x} y={yQ3} width={width} height={Math.max(1, yQ1 - yQ3)} fill={fill} fillOpacity={0.5} stroke={fill} strokeWidth={1} />
            <line x1={x} y1={yMedian} x2={x + width} y2={yMedian} stroke="#fff" strokeWidth={1} />
        </g>
    );
};

const MiniVenn = ({ data, isDarkMode }: { data: any[], isDarkMode: boolean }) => {
    const A = data.find(d => d.name === 'A')?.value || 0;
    const B = data.find(d => d.name === 'B')?.value || 0;
    const Both = data.find(d => d.name === 'Intersection')?.value || 0;
    return (
        <div className="w-full h-full flex items-center justify-center">
             <svg width="80%" height="80%" viewBox="-150 -150 300 300">
                <g className={isDarkMode ? "mix-blend-screen" : "mix-blend-multiply"}>
                    <circle cx={-30} cy={0} r={80} fill="#3b82f6" fillOpacity={0.6} />
                </g>
                <g className={isDarkMode ? "mix-blend-screen" : "mix-blend-multiply"}>
                    <circle cx={30} cy={0} r={80} fill="#ef4444" fillOpacity={0.6} />
                </g>
                <text x={-60} y={0} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="bold">{A}</text>
                <text x={60} y={0} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="bold">{B}</text>
                <text x={0} y={0} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="bold">{Both}</text>
             </svg>
        </div>
    );
}

const DashboardChart = React.memo(({ item, data, isDarkMode }: { item: DashboardItem, data: DataRow[], isDarkMode: boolean }) => {
    const colors = CHART_THEMES[item.theme || 'default'];
    const chartConfigProxy = useMemo(() => ({ ...item }), [item]);
    const chartData = useMemo(() => processChartData(data, chartConfigProxy), [data, chartConfigProxy]);
    
    const hasYAxis = item.yAxisKeys && item.yAxisKeys.length > 0;
    const dataKey = hasYAxis ? item.yAxisKeys[0] : "value";
    const yAxisLabel = hasYAxis ? `${item.yAxisKeys[0]}` : 'Count';

    const axisStroke = isDarkMode ? "#6b7280" : "#94a3b8";
    const axisStyle = { fontSize: 10, fill: axisStroke, fontWeight: 500 };
    const labelStyle = { fill: isDarkMode ? '#4b5563' : '#cbd5e1', fontSize: 10, fontWeight: 500 };
    const gridStroke = isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const margin = { top: 10, right: 10, left: 0, bottom: 40 }; 

    const showX = item.showXAxis ?? true;
    const showY = item.showYAxis ?? true;
    const showG = item.showGrid ?? true;
    const showL = item.showLegend ?? false;
    const showT = item.tooltip?.show ?? true;
    const lineType = item.smoothCurve ?? true ? 'monotone' : 'linear';

    const chartAxes = (
        <>
            {showG && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />}
            <XAxis hide={!showX} dataKey="name" tick={axisStyle} interval="preserveStartEnd" tickLine={false} axisLine={false} height={30}>
                <Label value={item.xAxisKey} position="insideBottom" offset={-5} style={labelStyle} />
            </XAxis>
            <YAxis hide={!showY} tick={axisStyle} tickLine={false} axisLine={false} width={showY ? 45 : 0}>
                <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ ...labelStyle, textAnchor: 'middle' }} />
            </YAxis>
            {showT && <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#1f2937' : '#e2e8f0', fontSize: '10px', borderRadius: '6px', color: isDarkMode ? '#fff' : '#111' }} />}
            {showL && <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />}
        </>
    );

    if (item.type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={margin}>
                    {chartAxes}
                    <Bar dataKey={dataKey} fill={colors[0]} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }
    if (item.type === 'box') {
        return (
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={margin}>
                     {showG && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />}
                     <XAxis hide={!showX} dataKey="name" tick={axisStyle} />
                     <YAxis hide={!showY} tick={axisStyle} width={showY ? 45 : 0} />
                     {showT && <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#111827' : '#fff', fontSize: '10px' }} />}
                     <Bar dataKey="max" fillOpacity={0} />
                     <Bar dataKey="max" shape={<MiniBoxShape />} fill={colors[0]} />
                </ComposedChart>
            </ResponsiveContainer>
        )
    }
    if (item.type === 'pie' || item.type === 'doughnut') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                 <PieChart margin={margin}>
                    <Pie 
                        data={chartData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="80%" 
                        innerRadius={item.type === 'doughnut' ? '55%' : '0%'} 
                        fill="#8884d8" 
                        dataKey={dataKey} 
                        nameKey="name"
                        stroke={isDarkMode ? "none" : "#fff"}
                        strokeWidth={2}
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    {showT && <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#1f2937' : '#e2e8f0', fontSize: '10px', borderRadius: '6px' }} />}
                    {showL && <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />}
                </PieChart>
            </ResponsiveContainer>
        )
    }
    if (item.type === 'area') {
         return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={margin}>
               {chartAxes}
               <Area type={lineType} dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
    if (item.type === 'heatmap' || item.type === 'contour') {
        const values = chartData.map(d => d.value as number);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                     {showG && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />}
                     <XAxis hide={!showX} type="category" dataKey="x" tick={axisStyle} tickLine={false} axisLine={false} height={30}>
                        <Label value={item.xAxisKey} position="insideBottom" offset={-5} style={labelStyle} />
                     </XAxis>
                     <YAxis hide={!showY} type="category" dataKey="y" tick={axisStyle} tickLine={false} axisLine={false} width={showY ? 45 : 0}>
                        <Label value={item.yAxisKeys?.[0] || 'Y'} angle={-90} position="insideLeft" style={{ ...labelStyle, textAnchor: 'middle' }} />
                     </YAxis>
                     {showT && <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#111827' : '#fff', borderColor: gridStroke, fontSize: '10px', borderRadius: '6px' }} />}
                     <Scatter 
                        data={chartData} 
                        shape={(props: any) => <HeatmapRect {...props} isDarkMode={isDarkMode} min={minVal} max={maxVal} width={25} height={25} type={item.type} />}
                     />
                </ScatterChart>
            </ResponsiveContainer>
        );
    }
    if (item.type === 'venn') {
        return <MiniVenn data={chartData} isDarkMode={isDarkMode} />
    }
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={margin}>
                {chartAxes}
                <Line type={lineType} dataKey={dataKey} stroke={colors[0]} dot={false} strokeWidth={3} />
            </LineChart>
        </ResponsiveContainer>
    )
});

export const Dashboard: React.FC<DashboardProps> = ({ data, headers, isDarkMode, items, onUpdateItem, onRemoveItem, onNavigateToData }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialDim, setInitialDim] = useState({ w: 0, h: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});
  
  const [isLocked, setIsLocked] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [enableSnap, setEnableSnap] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
  
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onUpdateItemRef = useRef(onUpdateItem);
  onUpdateItemRef.current = onUpdateItem;
  
  const SNAP_THRESHOLD = 15;
  const GRID_SIZE = 20;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || isLocked) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;

      if (draggingId) {
        const item = itemsRef.current.find(i => i.id === draggingId);
        if (item?.isLocked) return;

        let newX = mouseX - dragOffset.x;
        let newY = mouseY - dragOffset.y;
        if (enableSnap) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }
        let snappedX = newX;
        let snappedY = newY;
        let activeSnapLines: { x?: number, y?: number } = {};
        if (enableSnap) {
            itemsRef.current.forEach(other => {
                if (other.id === draggingId) return;
                if (Math.abs(newX - other.x) < SNAP_THRESHOLD) { snappedX = other.x; activeSnapLines.x = other.x; }
                if (Math.abs(newX - (other.x + other.width)) < SNAP_THRESHOLD) { snappedX = other.x + other.width; activeSnapLines.x = other.x + other.width; }
                if (Math.abs(newY - other.y) < SNAP_THRESHOLD) { snappedY = other.y; activeSnapLines.y = other.y; }
                if (Math.abs(newY - (other.y + other.height)) < SNAP_THRESHOLD) { snappedY = other.y + other.height; activeSnapLines.y = other.y + other.height; }
            });
        }
        setSnapLines(activeSnapLines);
        onUpdateItemRef.current(draggingId, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) });
      } else if (resizingId) {
        const item = itemsRef.current.find(i => i.id === resizingId);
        if (item?.isLocked) return;

        const deltaX = e.clientX - startMouse.x;
        const deltaY = e.clientY - startMouse.y;
        let newW = initialDim.w + deltaX;
        let newH = initialDim.h + deltaY;
        if (enableSnap) {
            newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
            newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;
        }
        onUpdateItemRef.current(resizingId, { width: Math.max(200, newW), height: Math.max(150, newH) });
      }
    };
    const handleMouseUp = () => {
      setDraggingId(null);
      setResizingId(null);
      setSnapLines({});
    };

    const handleClickOutside = () => setContextMenu(null);

    if (draggingId || resizingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [draggingId, resizingId, dragOffset, startMouse, initialDim, isLocked, enableSnap]);

  const startDrag = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    const item = itemsRef.current.find(i => i.id === id);
    if (!canvasRef.current || isLocked || editingId || item?.isLocked) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;
    setDraggingId(id);
    setDragOffset({ x: mouseX - currentX, y: mouseY - currentY });
    e.stopPropagation();
  };

  const startResize = (e: React.MouseEvent, id: string, w: number, h: number) => {
    const item = itemsRef.current.find(i => i.id === id);
    if (isLocked || editingId || item?.isLocked) return;
    setResizingId(id);
    setStartMouse({ x: e.clientX, y: e.clientY });
    setInitialDim({ w, h });
    e.stopPropagation();
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    if (isLocked) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId: id });
  };

  const handleDuplicate = (id: string) => {
      const original = items.find(i => i.id === id);
      if (!original) return;
      const newItem: DashboardItem = {
          ...original,
          id: Date.now().toString(),
          x: original.x + 20,
          y: original.y + 20,
          title: `${original.title} (Copy)`
      };
      // We need a way to add this to the list. For now we assume items are reactive.
      // Since Dashboard is a view component, we use onUpdateItem usually. 
      // But adding a new item requires a specific handler.
      // Assuming parent App.tsx handles dashboardItems state:
      (window as any).dispatchDashboardAction?.({ type: 'ADD', item: newItem });
  };

  const handleLayering = (id: string, action: 'front' | 'back') => {
      const maxZ = Math.max(...items.map(i => i.zIndex || 10), 10);
      const minZ = Math.min(...items.map(i => i.zIndex || 10), 10);
      if (action === 'front') onUpdateItem(id, { zIndex: maxZ + 1 });
      else onUpdateItem(id, { zIndex: Math.max(1, minZ - 1) });
  };

  const handleExportCSV = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const chartData = processChartData(data, item);
    if (chartData.length === 0) return;

    const csvHeaders = Object.keys(chartData[0]).join(',');
    const csvRows = chartData.map(row => Object.values(row).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
    const csvContent = `${csvHeaders}\n${csvRows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${item.title.replace(/\s+/g, '_')}_data.csv`);
    link.click();
  };

  const handleDownloadDashboard = async () => {
      if (!canvasRef.current || !(window as any).html2canvas) return;
      const canvas = await (window as any).html2canvas(canvasRef.current, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', scale: 2 });
      const link = document.createElement('a');
      link.download = 'dashboard-snapshot.png';
      link.href = canvas.toDataURL();
      link.click();
  };

  const handleAutoLayout = useCallback(() => {
    const PADDING = 40;
    const CARD_W = 400;
    const CARD_H = 300;
    const containerWidth = canvasRef.current?.offsetWidth || 1200;
    const cols = Math.floor((containerWidth - PADDING) / (CARD_W + PADDING)) || 1;
    items.forEach((item, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        onUpdateItem(item.id, { x: PADDING + col * (CARD_W + PADDING), y: PADDING + row * (CARD_H + PADDING), width: CARD_W, height: CARD_H });
    });
  }, [items, onUpdateItem]);

  const handleClearAll = () => {
    items.forEach(item => onRemoveItem(item.id));
    setShowClearConfirm(false);
  };

  const toggleProperty = (itemId: string, property: keyof DashboardItem) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
        onUpdateItem(itemId, { [property]: !(item as any)[property] });
    }
  };

  if (data.length === 0) {
      return (
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to InsightFlow</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">To build your dashboard, start by uploading a dataset in the Data Studio.</p>
                <button onClick={onNavigateToData} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-semibold shadow-md">
                    Go to Data Studio
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0 z-20 transition-colors">
             <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">Interactive Board {isLocked && <Lock className="w-3 h-3 text-orange-500" />}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{isLocked ? 'View only mode enabled' : 'Freeform data exploration'}</p>
             </div>
             <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isLocked ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title={isLocked ? "Unlock Board" : "Lock Board"}>
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isLocked ? 'Locked' : 'Lock'}</span>
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-all ${showGrid ? 'bg-blue-500/10 text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} title="Toggle Grid"><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setEnableSnap(!enableSnap)} className={`p-2 rounded-lg transition-all ${enableSnap ? 'bg-blue-500/10 text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} title="Toggle Snapping"><Magnet className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={handleAutoLayout} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition-all flex items-center gap-2" title="Auto Arrange Layout"><LayoutTemplate className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Arrange</span></button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                {showClearConfirm ? (
                    <div className="flex items-center gap-1 animate-fade-in"><button onClick={handleClearAll} className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md hover:bg-red-500">Confirm Clear</button><button onClick={() => setShowClearConfirm(false)} className="px-2 py-1 text-gray-400 text-[10px] font-bold">Cancel</button></div>
                ) : (
                    <button onClick={() => setShowClearConfirm(true)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all" title="Clear Board"><RotateCcw className="w-4 h-4" /></button>
                )}
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={handleDownloadDashboard} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ml-2"><Download className="w-3.5 h-3.5" /> Export Snapshot</button>
             </div>
        </div>

        <div ref={canvasRef} className={`flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-900 ${showGrid ? 'canvas-grid' : ''} transition-all duration-300`} style={{ width: '100%', height: '100%' }}>
            {snapLines.x !== undefined && <div className="absolute top-0 bottom-0 border-l border-blue-500 border-dashed z-50 pointer-events-none" style={{ left: snapLines.x }}></div>}
            {snapLines.y !== undefined && <div className="absolute left-0 right-0 border-t border-blue-500 border-dashed z-50 pointer-events-none" style={{ top: snapLines.y }}></div>}
            
            {items.map(item => (
                <div 
                    key={item.id} 
                    className={`absolute flex flex-col group transition-all duration-200 ${draggingId === item.id ? 'z-[999]' : ''}`}
                    style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.zIndex || 10 }}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                >
                    
                    {/* Floating Header */}
                    <div 
                        onMouseDown={(e) => startDrag(e, item.id, item.x, item.y)} 
                        className={`h-8 flex items-center justify-between px-2 select-none opacity-0 group-hover:opacity-100 transition-opacity ${isLocked || item.isLocked ? 'cursor-default' : 'cursor-move'}`}
                    >
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-lg shadow-lg">
                             {!item.isLocked && !isLocked && <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-600 shrink-0" />}
                             {item.isLocked && <Lock className="w-3 h-3 text-orange-400 shrink-0" />}
                             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleProperty(item.id, 'isLocked'); }}
                                className={`p-1.5 rounded-lg transition-colors bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 shadow-sm ${item.isLocked ? 'text-orange-500' : 'text-gray-400 hover:text-blue-500'}`}
                            >
                                {item.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingId(editingId === item.id ? null : item.id); }}
                                className={`p-1.5 rounded-lg transition-colors bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 shadow-sm ${editingId === item.id ? 'text-blue-600 border-blue-200' : 'text-gray-400 hover:text-blue-500'}`}
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Chart Title Label (Locked/Always visible) */}
                    {(isLocked || item.isLocked) && (
                        <div className="absolute -top-6 left-0 right-0 text-center animate-fade-in">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">{item.title}</span>
                        </div>
                    )}

                    {/* Chart Container - Conditionally Bordered */}
                    <div className={`flex-1 min-h-0 relative pointer-events-none transition-all duration-300 ${item.showBox ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4' : ''}`}>
                        {editingId === item.id ? (
                            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 overflow-y-auto pointer-events-auto animate-fade-in custom-scrollbar">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Chart Settings</h4>
                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1"><TypeIcon className="w-2.5 h-2.5" /> Chart Title</label>
                                        <input type="text" value={item.title} onChange={(e) => onUpdateItem(item.id, { title: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2.5 py-2 text-[11px] outline-none transition-colors focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Type</label>
                                            <select value={item.type} onChange={(e) => onUpdateItem(item.id, { type: e.target.value as ChartType })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-2 text-[11px] outline-none">
                                                <option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="pie">Pie</option><option value="doughnut">Doughnut</option><option value="box">Box Plot</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1"><Calculator className="w-2.5 h-2.5" /> Agg</label>
                                            <select value={item.aggregation || 'sum'} onChange={(e) => onUpdateItem(item.id, { aggregation: e.target.value as AggregationType })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-2 text-[11px] outline-none">
                                                <option value="sum">Sum</option><option value="avg">Avg</option><option value="count">Count</option><option value="min">Min</option><option value="max">Max</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Expanded Display Options */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-x-6 gap-y-2">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Show Box</span>
                                            <input type="checkbox" checked={item.showBox || false} onChange={(e) => onUpdateItem(item.id, { showBox: e.target.checked })} className="sr-only peer" />
                                            <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">X Axis</span>
                                            <input type="checkbox" checked={item.showXAxis ?? true} onChange={(e) => onUpdateItem(item.id, { showXAxis: e.target.checked })} className="sr-only peer" />
                                            <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Y Axis</span>
                                            <input type="checkbox" checked={item.showYAxis ?? true} onChange={(e) => onUpdateItem(item.id, { showYAxis: e.target.checked })} className="sr-only peer" />
                                            <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Grid</span>
                                            <input type="checkbox" checked={item.showGrid ?? true} onChange={(e) => onUpdateItem(item.id, { showGrid: e.target.checked })} className="sr-only peer" />
                                            <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Legend</span>
                                            <input type="checkbox" checked={item.showLegend ?? false} onChange={(e) => onUpdateItem(item.id, { showLegend: e.target.checked })} className="sr-only peer" />
                                            <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                        </label>
                                        {(item.type === 'line' || item.type === 'area') && (
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Smooth</span>
                                                <input type="checkbox" checked={item.smoothCurve ?? true} onChange={(e) => onUpdateItem(item.id, { smoothCurve: e.target.checked })} className="sr-only peer" />
                                                <div className="w-7 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 relative"></div>
                                            </label>
                                        )}
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1"><Palette className="w-2.5 h-2.5" /> Theme</label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {(Object.keys(CHART_THEMES) as ThemeType[]).map(t => (
                                                <button key={t} onClick={() => onUpdateItem(item.id, { theme: t })} className={`px-2 py-1.5 rounded border text-[9px] font-bold uppercase transition-all ${(item.theme || 'default') === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                    {t.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingId(null)} className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Apply Changes</button>
                                </div>
                            </div>
                        ) : null}
                        <DashboardChart item={item} data={data} isDarkMode={isDarkMode} />
                    </div>

                    {!isLocked && !item.isLocked && (
                        <div 
                            onMouseDown={(e) => startResize(e, item.id, item.width, item.height)} 
                            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-300 dark:border-gray-700 rounded-[1px]"></div>
                        </div>
                    )}
                </div>
            ))}
            
            {items.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-30">
                    <LayoutGrid className="w-16 h-16 mb-4" />
                    <p className="text-lg font-bold tracking-tight">Board Workspace</p>
                    <p className="text-sm">Create visualizations and pin them here</p>
                </div>
            )}
        </div>

        {/* Professional Custom Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl py-2 w-64 animate-fade-in backdrop-blur-xl"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                {/* Section: Management */}
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Management</p>
                </div>
                
                <button 
                    onClick={() => { toggleProperty(contextMenu.itemId, 'isLocked'); setContextMenu(null); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {items.find(i => i.id === contextMenu.itemId)?.isLocked ? <Lock className="w-4 h-4 text-orange-500" /> : <Unlock className="w-4 h-4" />}
                        <span>{items.find(i => i.id === contextMenu.itemId)?.isLocked ? 'Unlock Position' : 'Lock Position'}</span>
                    </div>
                </button>

                <button 
                    onClick={() => { handleDuplicate(contextMenu.itemId); setContextMenu(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    Duplicate Chart
                </button>

                {/* Section: Layering */}
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 my-1">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Layering</p>
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                    <button 
                        onClick={() => { handleLayering(contextMenu.itemId, 'front'); setContextMenu(null); }}
                        className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowUpCircle className="w-4 h-4" /> Front
                    </button>
                    <button 
                        onClick={() => { handleLayering(contextMenu.itemId, 'back'); setContextMenu(null); }}
                        className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowDownCircle className="w-4 h-4" /> Back
                    </button>
                </div>

                {/* Section: View Controls */}
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 my-1">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">View Controls</p>
                </div>
                <div className="grid grid-cols-2 px-1">
                    <button 
                        onClick={() => { toggleProperty(contextMenu.itemId, 'showBox'); setContextMenu(null); }}
                        className={`flex items-center gap-2 px-2 py-2 text-xs transition-colors rounded-lg ${items.find(i => i.id === contextMenu.itemId)?.showBox ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <Square className="w-3.5 h-3.5" /> Card Box
                    </button>
                    <button 
                        onClick={() => { toggleProperty(contextMenu.itemId, 'showGrid'); setContextMenu(null); }}
                        className="flex items-center gap-2 px-2 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Grid3X3 className="w-3.5 h-3.5" /> Grid Lines
                    </button>
                </div>

                {/* Section: Data & Export */}
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 my-1">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Data & Export</p>
                </div>
                <button 
                    onClick={() => { handleExportCSV(contextMenu.itemId); setContextMenu(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors"
                >
                    <Table className="w-4 h-4" />
                    Export Data (CSV)
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>

                <button 
                    onClick={() => { setEditingId(contextMenu.itemId); setContextMenu(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors font-semibold"
                >
                    <Settings2 className="w-4 h-4" />
                    Full Settings
                </button>

                <button 
                    onClick={() => { onRemoveItem(contextMenu.itemId); setContextMenu(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove from Board
                </button>
            </div>
        )}
    </div>
  );
};
