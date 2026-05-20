import { create } from 'zustand';

interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
}

interface Alert {
  id: string;
  severity: string;
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface MetricPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

interface PipelineNode {
  id: string;
  name: string;
  type: string;
  status: string;
  throughput: number;
  icon: string;
  lag?: number;
  latency?: string;
  executor?: string;
}

interface DagTask {
  id: string;
  name: string;
  dependencies: string[];
}

interface DagState {
  id: string;
  name: string;
  schedule: string;
  owner: string;
  status: string;
  last_run: string | null;
  next_run: string;
  run_count: number;
  task_states: Record<string, {
    status: string;
    start_time: string | null;
    duration: string | null;
    retry_count: number;
    logs: string[];
  }>;
  tasks: DagTask[];
}

interface StoreState {
  activeTab: string;
  setActiveTab: (tab: string) => void;

  isStreamActive: boolean;
  setStreamActive: (active: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Pipeline data
  nodes: PipelineNode[];
  setNodes: (nodes: PipelineNode[]) => void;
  edges: any[];
  setEdges: (edges: any[]) => void;

  // Metrics
  throughputHistory: MetricPoint[];
  setThroughputHistory: (data: MetricPoint[]) => void;
  latencyHistory: MetricPoint[];
  setLatencyHistory: (data: MetricPoint[]) => void;
  errorRateHistory: MetricPoint[];
  setErrorRateHistory: (data: MetricPoint[]) => void;

  // Logs
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  addLog: (log: LogEntry) => void;

  // Alerts
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  unreadAlerts: number;
  setUnreadAlerts: (count: number) => void;

  // Predictions
  predictionDistribution: { fraud: any; safe: any; review: any };
  setPredictionDistribution: (dist: any) => void;

  // Current metrics
  currentMetrics: {
    throughput: number;
    latency: number;
    error_rate: number;
    total_transactions: number;
    uptime_seconds: number;
  };
  setCurrentMetrics: (metrics: any) => void;

  // DAGs
  dags: DagState[];
  setDags: (dags: DagState[]) => void;

  // System metrics
  cpuMetrics: any[];
  setCpuMetrics: (data: any[]) => void;
  memoryMetrics: any[];
  setMemoryMetrics: (data: any[]) => void;

  // Model info
  modelInfo: any;
  setModelInfo: (info: any) => void;

  // Active DAG detail
  activeDagId: string | null;
  setActiveDagId: (id: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  activeTab: 'pipeline',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isStreamActive: true,
  setStreamActive: (active) => set({ isStreamActive: active }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  nodes: [],
  setNodes: (nodes) => set({ nodes }),
  edges: [],
  setEdges: (edges) => set({ edges }),

  throughputHistory: [],
  setThroughputHistory: (data) => set({ throughputHistory: data }),
  latencyHistory: [],
  setLatencyHistory: (data) => set({ latencyHistory: data }),
  errorRateHistory: [],
  setErrorRateHistory: (data) => set({ errorRateHistory: data }),

  logs: [],
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({
    logs: [...state.logs.slice(-499), log]
  })),

  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  unreadAlerts: 0,
  setUnreadAlerts: (count) => set({ unreadAlerts: count }),

  predictionDistribution: { fraud: { count: 0, percentage: 0 }, safe: { count: 0, percentage: 0 }, review: { count: 0, percentage: 0 } },
  setPredictionDistribution: (dist) => set({ predictionDistribution: dist }),

  currentMetrics: {
    throughput: 0,
    latency: 0,
    error_rate: 0,
    total_transactions: 0,
    uptime_seconds: 0,
  },
  setCurrentMetrics: (metrics) => set({ currentMetrics: metrics }),

  dags: [],
  setDags: (dags) => set({ dags }),

  cpuMetrics: [],
  setCpuMetrics: (data) => set({ cpuMetrics: data }),
  memoryMetrics: [],
  setMemoryMetrics: (data) => set({ memoryMetrics: data }),

  modelInfo: null,
  setModelInfo: (info) => set({ modelInfo: info }),

  activeDagId: null,
  setActiveDagId: (id) => set({ activeDagId: id }),
}));
