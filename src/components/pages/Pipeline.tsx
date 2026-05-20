import { useMemo } from 'react';
import ReactFlow, { Background, Controls, type Edge, type Node, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '@/store/useStore';
import { Cpu, Database, Zap, CheckCircle, Brain, HardDrive, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const NODE_ICONS: Record<string, React.ElementType> = {
  'data-source': Database,
  'kafka': Zap,
  'spark': Cpu,
  'feature-store': HardDrive,
  'model': Brain,
  'predictions': CheckCircle,
};

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'data-source': { x: 50, y: 150 },
  'kafka': { x: 280, y: 150 },
  'spark': { x: 510, y: 150 },
  'feature-store': { x: 740, y: 150 },
  'model': { x: 970, y: 150 },
  'predictions': { x: 1200, y: 150 },
};

function PipelineNodeComponent({ data }: { data: any }) {
  const Icon = NODE_ICONS[data.id] || Activity;
  const isActive = data.status === 'active';

  return (
    <div
      className={`min-w-[160px] p-3 rounded-lg border transition-all duration-300 ${
        isActive
          ? 'bg-[#111827] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
          : 'bg-[#111827] border-red-500/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-nexus-primary truncate">{data.name}</div>
        </div>
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-nexus-secondary">Throughput</span>
          <span className="text-[10px] font-mono text-emerald-400">{data.throughput.toLocaleString()}/s</span>
        </div>
        {data.lag !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-nexus-secondary">Lag</span>
            <span className="text-[10px] font-mono text-nexus-secondary">{data.lag} msg</span>
          </div>
        )}
        {data.latency && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-nexus-secondary">Latency</span>
            <span className="text-[10px] font-mono text-nexus-secondary">{data.latency}</span>
          </div>
        )}
        {data.executor && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-nexus-secondary">Executors</span>
            <span className="text-[10px] font-mono text-nexus-secondary">{data.executor}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { pipelineNode: PipelineNodeComponent };

export default function Pipeline() {
  const {
    nodes, edges,
    throughputHistory,
    logs, predictionDistribution,
    currentMetrics
  } = useStore();

  const rfNodes: Node[] = useMemo(() =>
    nodes.map((n) => ({
      id: n.id,
      type: 'pipelineNode',
      position: NODE_POSITIONS[n.id] || { x: 0, y: 0 },
      data: n,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
    })),
    [nodes]
  );

  const rfEdges: Edge[] = useMemo(() =>
    edges.map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 2, opacity: 0.5 },
      label: `${e.rate.toLocaleString()}/s`,
      labelStyle: { fill: '#9CA3AF', fontSize: 10 },
      labelBgStyle: { fill: '#111827', fillOpacity: 0.8 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      type: 'smoothstep',
    })),
    [edges]
  );

  const pieData = [
    { name: 'Safe', value: predictionDistribution.safe?.count || 0, color: '#10B981' },
    { name: 'Fraud', value: predictionDistribution.fraud?.count || 0, color: '#EF4444' },
    { name: 'Review', value: predictionDistribution.review?.count || 0, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Pipeline</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">Real-time data flow and processing topology</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">{currentMetrics.throughput.toLocaleString()} msgs/s</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/5 border border-blue-500/10">
            <span className="text-xs text-blue-400 font-medium">{currentMetrics.latency.toFixed(0)}ms latency</span>
          </div>
        </div>
      </div>

      {/* Pipeline Topology Graph */}
      <div className="card-glass" style={{ height: 380 }}>
        <div className="px-4 py-3 border-b border-nexus flex items-center justify-between">
          <h3 className="text-sm font-medium text-nexus-primary">Pipeline Topology</h3>
          <span className="text-xs text-nexus-secondary">Data Source → Predictions</span>
        </div>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          zoomOnScroll={false}
          zoomOnPinch={true}
          panOnScroll={true}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={20} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Throughput & Latency Chart */}
        <div className="lg:col-span-1 card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Throughput & Latency</h3>
          <p className="text-xs text-nexus-secondary mb-4">Real-time processing metrics</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputHistory.slice(-40)}>
                <defs>
                  <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ltGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} stroke="#374151" />
                <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(v: any, n: string) => [`${Number(v).toFixed(0)} ${n === 'value' ? 'msgs/s' : 'ms'}`, n === 'value' ? 'Throughput' : 'Latency']}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#tpGrad)" name="Throughput" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Processing Logs</h3>
          <p className="text-xs text-nexus-secondary mb-4">Live pipeline activity</p>
          <div className="h-[200px] overflow-y-auto font-mono text-[11px] space-y-1">
            {logs.slice(-20).map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5 hover:bg-white/[0.02] rounded px-1">
                <span className="text-nexus-secondary shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 font-semibold ${
                  log.level === 'WARN' ? 'text-yellow-400' : log.level === 'ERROR' ? 'text-red-400' : 'text-emerald-400'
                }`}>[{log.level}]</span>
                <span className="text-nexus-secondary shrink-0">{log.component}:</span>
                <span className="text-nexus-primary/80 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prediction Distribution */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Prediction Distribution</h3>
          <p className="text-xs text-nexus-secondary mb-4">Model classification output</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
                  formatter={(v: any, n: string) => [v, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-nexus-secondary">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
