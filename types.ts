
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface ColumnMeta {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  uniqueCount: number;
  missingCount: number;
}

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'area' | 'heatmap' | 'doughnut' | 'bubble' | 'box' | 'venn' | 'contour';
export type ThemeType = 'default' | 'neon' | 'pastel' | 'dark' | 'professional';
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface TooltipConfig {
  show: boolean;
  backgroundColor: string;
  textColor: string;
  borderRadius?: number;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xAxisKey: string;
  yAxisKeys: string[]; 
  zAxisKey?: string; 
  aggregation?: AggregationType;
  color?: string;
  theme?: ThemeType;
  tooltip?: TooltipConfig;
  showBox?: boolean;
  // Essential Display Options
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  smoothCurve?: boolean;
  showLabels?: boolean;
}

export interface DashboardItem extends ChartConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked?: boolean;
  zIndex?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  isToolOutput?: boolean;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  DATA = 'data',
  VISUALIZE = 'visualize',
  INSIGHTS = 'insights',
}
