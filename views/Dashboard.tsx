import React, { useRef, useState, useEffect, useMemo } from 'react';
import { DashboardItem, DataRow } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Label, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { Trash2, GripVertical, Download, Maximize2 } from 'lucide-react';
import { CHART_THEMES } from './Visualization';
import { processChartData } from '../utils/chartUtils';

interface DashboardProps {
  data: DataRow[];
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
    
    // Stringify array dependency for stable memoization
    const yKeysStr = JSON.stringify(item.yAxisKeys);

    const chartConfigProxy = useMemo(() => ({
      id: item.id,
      title: item.title,
      type: item.type,
      xAxisKey: item.xAxisKey,
      yAxisKeys: item.yAxisKeys,
      zAxisKey: item.zAxisKey,
      theme: item.theme,
      aggregation: item.aggregation
    }), [item.id, item.title, item.type, item.xAxisKey, yKeysStr, item.zAxisKey, item.theme, item.aggregation]);

    const chartData = useMemo(() => {
        return processChartData(data, chartConfigProxy);
    }, [data, chartConfigProxy]);
    
    const hasYAxis = item.yAxisKeys && item.yAxisKeys.length > 0;
    const dataKey = hasYAxis ? item.yAxisKeys[0] : "value";
    const yAxisLabel = hasYAxis ? `${item.yAxisKeys[0]}` : 'Count';

    const axisStroke = isDarkMode ? "#9ca3af" : "#64748b";
    const axisStyle = { fontSize: 10, fill: axisStroke, fontWeight: 500 };
    const labelStyle = { fill: isDarkMode ? '#6b7280' : '#475569', fontSize: 10, fontWeight: 500 };
    const gridStroke = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
    const margin = { top: 10, right: 10, left: 0, bottom: 40 }; 

    // Define axes as JSX variable to avoid definition inside render loop
    const chartAxes = (
        <>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="name" tick={axisStyle} interval="preserveStartEnd" tickLine={false} axisLine={false} height={30}>
                <Label value={item.xAxisKey} position="insideBottom" offset={-5} style={labelStyle} />
            </XAxis>
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={45}>
                <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ ...labelStyle, textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e2e8f0', fontSize: '10px', borderRadius: '6px', color: isDarkMode ? '#fff' : '#111' }} />
        </>
    );

    if (item.type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={margin}>
                    {chartAxes}
                    <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }
    if (item.type === 'box') {
        return (
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={margin}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                     <XAxis dataKey="name" tick={axisStyle} />
                     <YAxis tick={axisStyle} />
                     <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', fontSize: '10px' }} />
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
                        innerRadius={item.type === 'doughnut' ? '50%' : '0%'} 
                        fill="#8884d8" 
                        dataKey={dataKey} 
                        nameKey="name"
                        stroke={isDarkMode ? "none" : "#fff"}
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e2e8f0', fontSize: '10px', borderRadius: '6px' }} />
                </PieChart>
            </ResponsiveContainer>
        )
    }
    if (item.type === 'area') {
         return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={margin}>
               {chartAxes}
               <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
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
                     <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                     <XAxis type="category" dataKey="x" tick={axisStyle} tickLine={false} axisLine={false} height={30}>
                        <Label value={item.xAxisKey} position="insideBottom" offset={-5} style={labelStyle} />
                     </XAxis>
                     <YAxis type="category" dataKey="y" tick={axisStyle} tickLine={false} axisLine={false} width={45}>
                        <Label value={item.yAxisKeys?.[0] || 'Y'} angle={-90} position="insideLeft" style={{ ...labelStyle, textAnchor: 'middle' }} />
                     </YAxis>
                     <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: gridStroke, fontSize: '10px', borderRadius: '6px' }} />
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
                <Line type="monotone" dataKey={dataKey} stroke={colors[0]} dot={false} strokeWidth={3} />
            </LineChart>
        </ResponsiveContainer>
    )
});

export const Dashboard: React.FC<DashboardProps> = ({ data, isDarkMode, items, onUpdateItem, onRemoveItem, onNavigateToData }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialDim, setInitialDim] = useState({ w: 0, h: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});
  
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onUpdateItemRef = useRef(onUpdateItem);
  onUpdateItemRef.current = onUpdateItem;
  
  const SNAP_THRESHOLD = 10;
  const GRID_SIZE = 20;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;

      if (draggingId) {
        let newX = mouseX - dragOffset.x;
        let newY = mouseY - dragOffset.y;
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        let snappedX = newX;
        let snappedY = newY;
        let activeSnapLines: { x?: number, y?: number } = {};
        const currentItems = itemsRef.current;
        
        currentItems.forEach(other => {
            if (other.id === draggingId) return;
            if (Math.abs(newX - other.x) < SNAP_THRESHOLD) { snappedX = other.x; activeSnapLines.x = other.x; }
            if (Math.abs(newX - (other.x + other.width)) < SNAP_THRESHOLD) { snappedX = other.x + other.width; activeSnapLines.x = other.x + other.width; }
            if (Math.abs(newY - other.y) < SNAP_THRESHOLD) { snappedY = other.y; activeSnapLines.y = other.y; }
            if (Math.abs(newY - (other.y + other.height)) < SNAP_THRESHOLD) { snappedY = other.y + other.height; activeSnapLines.y = other.y + other.height; }
        });
        
        setSnapLines(activeSnapLines);
        onUpdateItemRef.current(draggingId, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) });
      } else if (resizingId) {
        const deltaX = e.clientX - startMouse.x;
        const deltaY = e.clientY - startMouse.y;
        const newW = Math.max(200, Math.round((initialDim.w + deltaX) / GRID_SIZE) * GRID_SIZE);
        const newH = Math.max(150, Math.round((initialDim.h + deltaY) / GRID_SIZE) * GRID_SIZE);
        onUpdateItemRef.current(resizingId, { width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setResizingId(null);
      setSnapLines({});
    };

    if (draggingId || resizingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, resizingId, dragOffset, startMouse, initialDim]);


  const startDrag = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;
    setDraggingId(id);
    setDragOffset({ x: mouseX - currentX, y: mouseY - currentY });
    e.stopPropagation();
  };

  const startResize = (e: React.MouseEvent, id: string, w: number, h: number) => {
    setResizingId(id);
    setStartMouse({ x: e.clientX, y: e.clientY });
    setInitialDim({ w, h });
    e.stopPropagation();
  };

  const handleDownloadDashboard = async () => {
      if (!canvasRef.current || !(window as any).html2canvas) return;
      const canvas = await (window as any).html2canvas(canvasRef.current, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', scale: 2 });
      const link = document.createElement('a');
      link.download = 'dashboard-snapshot.png';
      link.href = canvas.toDataURL();
      link.click();
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
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0 z-10 transition-colors">
             <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interactive Board</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Drag to move • Corner to resize</p>
             </div>
             <button onClick={handleDownloadDashboard} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Export Board
             </button>
        </div>
        <div ref={canvasRef} className="flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-900 canvas-grid" style={{ width: '100%', height: '100%' }}>
            {snapLines.x !== undefined && <div className="absolute top-0 bottom-0 border-l border-blue-500 border-dashed z-50 pointer-events-none" style={{ left: snapLines.x }}></div>}
            {snapLines.y !== undefined && <div className="absolute left-0 right-0 border-t border-blue-500 border-dashed z-50 pointer-events-none" style={{ top: snapLines.y }}></div>}
            {items.map(item => (
                <div key={item.id} className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex flex-col group overflow-hidden transition-colors"
                    style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: draggingId === item.id ? 100 : 1 }}>
                    <div onMouseDown={(e) => startDrag(e, item.id, item.x, item.y)} className="h-8 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 cursor-move flex items-center justify-between px-3 select-none active:bg-gray-100 dark:active:bg-gray-700/80">
                        <div className="flex items-center gap-2">
                             <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                             <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 truncate tracking-tight">{item.title}</span>
                        </div>
                        <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1 p-2 min-h-0 pointer-events-none relative"><DashboardChart item={item} data={data} isDarkMode={isDarkMode} /></div>
                    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900/50 text-[10px] text-gray-400 dark:text-gray-500 flex justify-between items-center select-none font-medium border-t border-gray-100 dark:border-transparent">
                        <span>{item.type.toUpperCase()} • {item.aggregation?.toUpperCase() || 'SUM'}</span>
                    </div>
                    <div onMouseDown={(e) => startResize(e, item.id, item.width, item.height)} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-tl transition-colors"><Maximize2 className="w-2 h-2 text-gray-400 dark:text-gray-500 rotate-90" /></div>
                </div>
            ))}
        </div>
    </div>
  );
};