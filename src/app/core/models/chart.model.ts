/**
 * Configuración de gráficos
 */
export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: any;
}

/**
 * Colores predefinidos para gráficos
 */
export const CHART_COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  secondary: '#6B7280',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

export const PRIORITY_COLORS = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#10B981',
};

export const STATUS_COLORS = {
  Open: '#F59E0B',
  Resolved: '#10B981',
  'In Progress': '#3B82F6',
  Pending: '#6B7280',
  Closed: '#8B5CF6',
};
