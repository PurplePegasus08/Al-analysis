import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter, PieChart, Pie, Cell, AreaChart, Area, Label, ZAxis, ComposedChart
} from 'recharts';
import { Download, Plus, BarChart2, Palette, MessageSquare, Calculator, PanelLeftClose, PanelLeftOpen, Check } from 'lucide-react';
import { ChartConfig, DataRow, ThemeType, AggregationType } from '../types';
import { processChartData } from '../utils/chartUtils';

interface VisualizationProps {
  data: DataRow[];
  headers: string[];
  config: ChartConfig;
  isDarkMode: boolean;
  setConfig: (config: ChartConfig) => void;
  onAddToDashboard: (config: ChartConfig) => void;
}

export const CHART_THEMES: Record<ThemeType, string[]> = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  neon: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'],
  pastel: ['#a78bfa', '#fbcfe8', '#a5f3fc', '#c7d2fe', '#fde68a'],
  dark: ['#4c1d95', '#1e3a8a', '#065f46', '#92400e', '#831843'],
  professional: ['#94a3b8', '#475569', '#cbd5e1', '#64748b', '#e2e8f0']
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const interpolateColor = (minColor: number[], maxColor: number[], factor: number) => {
    const r = Math.round(minColor[0] + (maxColor[0] - minColor[0]) * factor);
    const g = Math.round(minColor[1] + (maxColor[1] - minColor[1]) * factor);
    const b = Math.round(minColor[2] + (maxColor[2] - minColor[2]) * factor);
    return `rgb(${r},${g},${b})`;
};

const HeatmapRect = (props: any) => {
    const { cx, cy, value, min, max, width = 40, height = 40, type, isDarkMode } = props;
    if (!cx || !cy) return null;
    
    const range = max - min || 1;
    const factor = (value - min) / range;
    const color = isDarkMode 
      ? interpolateColor([186, 230, 253], [30, 64, 175], factor)
      : interpolateColor([219, 234, 254], [30, 58, 138], factor);
    
    if (type === 'contour') {
        return (
            <circle cx={cx} cy={cy} r={(width / 2) * (0.5 + 0.5 * factor)} fill={color} fillOpacity={0.7} stroke="none" />
        );
    }

    return (
        <rect x={cx - width/2} y={cy - height/2} width={width} height={height} fill={color} rx={4} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} strokeWidth={1} />
    );
};

const BoxShape = (props: any) => {
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
            <line x1={center} y1={yTop} x2={center} y2={yQ3} stroke={fill} strokeWidth={2} />
            <line x1={center} y1={yQ1} x2={center} y2={yBottom} stroke={fill} strokeWidth={2} />
            <line x1={center - width/4} y1={yTop} x2={center + width/4} y2={yTop} stroke={fill} strokeWidth={2} />
            <line x1={center - width/4} y1={yBottom} x2={center + width/4} y2={yBottom} stroke={fill} strokeWidth={2} />
            <rect x={x} y={yQ3} width={width} height={Math.max(2, yQ1 - yQ3)} fill={fill} fillOpacity={0.4} stroke={fill} strokeWidth={2} />
            <line x1={x} y1={yMedian} x2={x + width} y2={yMedian} stroke="#fff" strokeWidth={2} />
        </g>
    );
};

const VennDiagram = ({ data, isDarkMode }: { data: any[], isDarkMode: boolean }) => {
    const A = data.find(d => d.name === 'A')?.value || 0;
    const B = data.find(d => d.name === 'B')?.value || 0;
    const Both = data.find(d => d.name === 'Intersection')?.value || 0;
    const LabelA = data.find(d => d.name === 'A')?.label || 'Set A';
    const LabelB = data.find(d => d.name === 'B')?.label || 'Set B';

    const total = A + B + Both;
    const scale = total > 0 ? 150 / Math.sqrt(total) : 1; 

    const rA = Math.sqrt(A + Both) * scale + 20;
    const rB = Math.sqrt(B + Both) * scale + 20;
    const distance = (rA + rB) - (Math.sqrt(Both) * scale * 1.5); 

    const textColor = isDarkMode ? "#fff" : "#111827";

    return (
        <div className="w-full h-full flex items-center justify-center relative">
             <svg width="100%" height="100%" viewBox="-150 -150 300 300">
                <g className={isDarkMode ? "mix-blend-screen" : "mix-blend-multiply"}>
                    <circle cx={-distance/2} cy={0} r={rA} fill="#3b82f6" fillOpacity={0.6} />
                    <text x={-distance/2} y={-rA - 10} textAnchor="middle" fill={textColor} fontSize="12">{LabelA}</text>
                    <text x={-distance/2 - 10} y={10} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{A}</text>
                </g>
                <g className={isDarkMode ? "mix-blend-screen" : "mix-blend-multiply"}>
                    <circle cx={distance/2} cy={0} r={rB} fill="#ef4444" fillOpacity={0.6} />
                    <text x={distance/2} y={-rB - 10} textAnchor="middle" fill={textColor} fontSize="12">{LabelB}</text>
                    <text x={distance/2 + 10} y={10} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{B}</text>
                </g>
                <text x={0} y={0} textAnchor="middle" fill={isDarkMode ? "#fff" : "#374151"} fontSize="14" fontWeight="bold">{Both}</text>
                <text x={0} y={20} textAnchor="middle" fill={isDarkMode ? "#fff" : "#374151"} fontSize="10" opacity={0.8}>Intersection</text>
             </svg>
        </div>
    );
}

export const Visualization: React.FC<VisualizationProps> = ({ data, headers, config, isDarkMode, setConfig, onAddToDashboard }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [addStatus, setAddStatus] = useState<'idle' | 'success'>('idle');
  
  const themeColors = CHART_THEMES[config.theme || 'default'];
  const tooltipConfig = useMemo(() => config.tooltip || { 
    show: true, 
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
    textColor: isDarkMode ? '#f3f4f6' : '#111827', 
    borderRadius: 8 
  }, [config.tooltip, isDarkMode]);

  const chartData = useMemo(() => {
    return processChartData(data, config);
  }, [data, config]);

  const updateTooltipConfig = (updates: Partial<typeof tooltipConfig>) => {
    setConfig({
      ...config,
      tooltip: { ...tooltipConfig, ...updates }
    });
  };

  const handleAddToBoard = () => {
    onAddToDashboard(config);
    setAddStatus('success');
    setTimeout(() => setAddStatus('idle'), 2000);
  };

  const renderChart = () => {
    if (chartData.length === 0) return <div className="text-gray-400 dark:text-gray-500">No data available for current configuration</div>;

    const hasYAxis = config.yAxisKeys && config.yAxisKeys.length > 0;
    const xAxisLabel = config.xAxisKey;
    const yAxisLabel = hasYAxis 
        ? `${config.yAxisKeys[0]} (${config.aggregation || 'sum'})`
        : 'Count';

    const axisStroke = isDarkMode ? "#9ca3af" : "#4b5563";
    const labelFill = isDarkMode ? "#6b7280" : "#374151";
    const gridStroke = isDarkMode ? "#374151" : "#e2e8f0";

    const tooltipStyle = {
        backgroundColor: tooltipConfig.backgroundColor,
        borderColor: isDarkMode ? '#374151' : '#e2e8f0', 
        color: tooltipConfig.textColor,
        borderRadius: `${tooltipConfig.borderRadius}px`,
        border: '1px solid rgba(128,128,128,0.1)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '8px 12px',
    };

    // Shared UI components for all chart types
    const chartAxes = (
      <>
         <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.5} />
         <XAxis 
            dataKey="name" 
            stroke={axisStroke} 
            tick={{fill: axisStroke, fontSize: 11}}
            tickLine={false}
            height={50}
            minTickGap={30}
         >
             <Label value={xAxisLabel} position="insideBottom" offset={-5} fill={labelFill} fontSize={12} />
         </XAxis>
         <YAxis 
            stroke={axisStroke} 
            tick={{fill: axisStroke, fontSize: 11}} 
            tickFormatter={formatNumber}
            tickLine={false}
            width={60}
         >
             <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill={labelFill} fontSize={12} />
         </YAxis>
         {tooltipConfig.show && (
            <Tooltip 
                contentStyle={tooltipStyle}
                itemStyle={{color: tooltipConfig.textColor, fontSize: '12px'}}
                cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', radius: 4}}
            />
         )}
         <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
      </>
    );

    const activeDotStyle = { r: 6, strokeWidth: 0, fill: isDarkMode ? '#fff' : '#000', opacity: 1 };

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {chartAxes}
              {hasYAxis ? (
                  config.yAxisKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} fill={themeColors[i % themeColors.length]} radius={[4, 4, 0, 0]} maxBarSize={80} />
                  ))
              ) : (
                  <Bar dataKey="value" name="Count" fill={themeColors[0]} radius={[4, 4, 0, 0]} maxBarSize={80} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'box':
         return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.5} />
                     <XAxis dataKey="name" stroke={axisStroke} tick={{fill: axisStroke, fontSize: 11}} />
                     <YAxis stroke={axisStroke} tick={{fill: axisStroke, fontSize: 11}} />
                     <Tooltip contentStyle={tooltipStyle} />
                     <Bar dataKey="max" fillOpacity={0} legendType="none" /> 
                     <Bar dataKey="max" shape={<BoxShape />} fill={themeColors[0]} name="Distribution" />
                </ComposedChart>
            </ResponsiveContainer>
         );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {chartAxes}
               {hasYAxis ? (
                config.yAxisKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={themeColors[i % themeColors.length]} strokeWidth={3} dot={false} activeDot={activeDotStyle} />
                ))
               ) : (
                   <Line type="monotone" dataKey="value" name="Count" stroke={themeColors[0]} strokeWidth={3} dot={false} activeDot={activeDotStyle} />
               )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
         return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {chartAxes}
               {hasYAxis ? (
                config.yAxisKeys.map((key, i) => (
                    <Area key={key} type="monotone" dataKey={key} stroke={themeColors[i % themeColors.length]} fill={themeColors[i % themeColors.length]} fillOpacity={0.3} strokeWidth={2} activeDot={activeDotStyle} />
                ))
               ) : (
                   <Area type="monotone" dataKey="value" name="Count" stroke={themeColors[0]} fill={themeColors[0]} fillOpacity={0.3} strokeWidth={2} activeDot={activeDotStyle} />
               )}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
      case 'bubble':
        return (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                 <XAxis type="number" dataKey="x" name={config.xAxisKey} stroke={axisStroke} tick={{fontSize: 11}}>
                    <Label value={config.xAxisKey} position="insideBottom" offset={-5} fill={labelFill} fontSize={12} />
                 </XAxis>
                 <YAxis type="number" dataKey="y" name={config.yAxisKeys?.[0] || 'Y'} stroke={axisStroke} tick={{fontSize: 11}}>
                    <Label value={config.yAxisKeys?.[0] || 'Y'} angle={-90} position="insideLeft" fill={labelFill} fontSize={12} />
                 </YAxis>
                 {config.type === 'bubble' && (
                     <ZAxis type="number" dataKey="z" range={[50, 600]} name={config.zAxisKey || 'Size'} />
                 )}
                 {tooltipConfig.show && (
                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: axisStroke }} contentStyle={tooltipStyle} itemStyle={{color: tooltipConfig.textColor}} />
                 )}
                 <Scatter name="Data" data={chartData} fill={themeColors[0]} />
              </ScatterChart>
            </ResponsiveContainer>
        );
      case 'heatmap':
      case 'contour':
        const values = chartData.map(d => d.value as number);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                     <XAxis type="category" dataKey="x" name={config.xAxisKey} stroke={axisStroke} tick={{fontSize: 11}} interval={0}>
                        <Label value={config.xAxisKey} position="insideBottom" offset={-5} fill={labelFill} fontSize={12} />
                     </XAxis>
                     <YAxis type="category" dataKey="y" name={config.yAxisKeys?.[0] || 'Y'} stroke={axisStroke} tick={{fontSize: 11}} interval={0} width={60}>
                        <Label value={config.yAxisKeys?.[0] || 'Y'} angle={-90} position="insideLeft" fill={labelFill} fontSize={12} />
                     </YAxis>
                     <Tooltip cursor={{ strokeDasharray: '3 3', stroke: axisStroke }} contentStyle={tooltipStyle} itemStyle={{color: tooltipConfig.textColor}} formatter={(value: any) => [`${value}`, 'Count']} />
                     <Scatter data={chartData} shape={(props: any) => <HeatmapRect {...props} isDarkMode={isDarkMode} min={minVal} max={maxVal} type={config.type} />} />
                </ScatterChart>
            </ResponsiveContainer>
        );
      case 'pie':
      case 'doughnut':
        const innerRadius = config.type === 'doughnut' ? 80 : 0;
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        innerRadius={innerRadius}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey={hasYAxis ? config.yAxisKeys[0] : "value"}
                        nameKey="name"
                        stroke={isDarkMode ? "none" : "#fff"}
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} />
                        ))}
                    </Pie>
                    {tooltipConfig.show && (
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{color: tooltipConfig.textColor}} />
                    )}
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
            </ResponsiveContainer>
        );
      case 'venn':
          return <VennDiagram data={chartData} isDarkMode={isDarkMode} />
      default:
        return <div className="text-gray-500">Unsupported chart type</div>;
    }
  };

  const isHeatmapType = config.type === 'heatmap' || config.type === 'contour';
  const isVenn = config.type === 'venn';

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-6 bg-gray-50 dark:bg-gray-900 overflow-hidden relative transition-colors duration-300">
      
      <button 
        onClick={() => setIsConfigOpen(!isConfigOpen)}
        className="absolute top-6 left-6 z-20 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        title={isConfigOpen ? "Hide Settings" : "Show Settings"}
      >
          {isConfigOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
      </button>

      <div 
        className={`${isConfigOpen ? 'w-full md:w-72 opacity-100' : 'w-0 opacity-0 p-0 overflow-hidden'} flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar transition-all duration-300 ease-in-out`}
      >
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 pt-12 rounded-xl backdrop-blur-sm shadow-sm transition-colors">
          <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Configuration</h3>
          
          <div className="space-y-4">
             <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Chart Type</label>
                <select 
                    value={config.type} 
                    onChange={(e) => setConfig({...config, type: e.target.value as any})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="bubble">Bubble Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                    <option value="heatmap">Heatmap</option>
                    <option value="contour">Contour Plot</option>
                    <option value="box">Box Plot</option>
                    <option value="venn">Venn Diagram</option>
                </select>
             </div>

             <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    {isVenn ? 'Set A Column' : 'X Axis / Category'}
                </label>
                <select 
                    value={config.xAxisKey} 
                    onChange={(e) => setConfig({...config, xAxisKey: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                    <option value="">Select Column</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
             </div>

             <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    {isHeatmapType ? 'Y Axis / Category 2' : isVenn ? 'Set B Column' : 'Y Axis / Value'}
                </label>
                <select 
                    value={config.yAxisKeys?.[0] || ''} 
                    onChange={(e) => setConfig({...config, yAxisKeys: e.target.value ? [e.target.value] : []})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                    <option value="">{isHeatmapType ? 'Select Column' : 'Count / None'}</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
             </div>

             {config.type === 'bubble' && (
                 <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Z Axis / Size</label>
                    <select 
                        value={config.zAxisKey || ''} 
                        onChange={(e) => setConfig({...config, zAxisKey: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    >
                        <option value="">Select Column</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                 </div>
             )}

             {!isHeatmapType && !isVenn && config.type !== 'box' && config.yAxisKeys && config.yAxisKeys.length > 0 && config.type !== 'scatter' && config.type !== 'bubble' && (
                 <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Aggregation</label>
                    <div className="flex items-center gap-2">
                         <Calculator className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                        <select 
                            value={config.aggregation || 'sum'} 
                            onChange={(e) => setConfig({...config, aggregation: e.target.value as AggregationType})}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        >
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="min">Min</option>
                            <option value="max">Max</option>
                            <option value="count">Count</option>
                        </select>
                    </div>
                 </div>
             )}
             
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Chart Title</label>
                <input 
                    type="text" 
                    value={config.title} 
                    onChange={(e) => setConfig({...config, title: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl backdrop-blur-sm shadow-sm transition-colors">
             <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Theme Options</h3>
             </div>
             <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CHART_THEMES) as ThemeType[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setConfig({ ...config, theme: t })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            (config.theme || 'default') === t 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20' 
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
             </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl backdrop-blur-sm shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">Tooltip</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={tooltipConfig.show}
                        onChange={(e) => updateTooltipConfig({ show: e.target.checked })}
                        className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            
            {tooltipConfig.show && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Background</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-1">
                            <input 
                                type="color" 
                                value={tooltipConfig.backgroundColor}
                                onChange={(e) => updateTooltipConfig({ backgroundColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">{tooltipConfig.backgroundColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Text Color</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-1">
                             <input 
                                type="color" 
                                value={tooltipConfig.textColor}
                                onChange={(e) => updateTooltipConfig({ textColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">{tooltipConfig.textColor}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className={`flex-1 bg-white/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative flex flex-col transition-all duration-300 ${!isConfigOpen ? 'ml-0' : ''}`}>
        <div className="flex justify-between items-center mb-6 pl-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{config.title || "Untitled Chart"}</h2>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Download className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex-1 min-h-0 relative">
            {config.xAxisKey ? renderChart() : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Select an X-Axis to generate visualization</p>
                </div>
            )}
            
            {config.xAxisKey && (
                <button 
                    onClick={handleAddToBoard}
                    className={`absolute bottom-0 right-0 px-4 py-2 rounded-lg text-sm font-semibold shadow-xl flex items-center gap-2 transition-all duration-300 ${
                        addStatus === 'success' 
                        ? 'bg-green-600 text-white scale-105' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95'
                    }`}
                >
                    {addStatus === 'success' ? (
                        <>
                           <Check className="w-4 h-4" /> Added to Board
                        </>
                    ) : (
                        <>
                           <Plus className="w-4 h-4" /> Add to Board
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};