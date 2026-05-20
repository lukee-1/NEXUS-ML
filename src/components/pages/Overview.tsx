import { useStore } from '@/store/useStore';
import {
  ArrowUpRight, ArrowDownRight, Brain, Clock, Database, Eye, FileCheck, Gauge, GitBranch, Layers, Shield, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const { currentMetrics, throughputHistory, predictionDistribution, nodes, logs, alerts, dags } = useStore();

  const safePct = predictionDistribution.safe?.percentage || 0;
  const fraudPct = predictionDistribution.fraud?.percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Dashboard Overview</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">Real-time system health and pipeline metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Throughput"
          value={`${currentMetrics.throughput.toLocaleString()}`}
          unit="msgs/s"
          icon={<Zap className="w-5 h-5" />}
          trend={+2.4}
          color="emerald"
        />
        <KpiCard
          title="Avg Latency"
          value={`${currentMetrics.latency.toFixed(0)}`}
          unit="ms"
          icon={<Clock className="w-5 h-5" />}
          trend={-5.1}
          color="blue"
        />
        <KpiCard
          title="Predictions"
          value={`${currentMetrics.total_transactions.toLocaleString()}`}
          unit="total"
          icon={<Brain className="w-5 h-5" />}
          trend={+12.8}
          color="purple"
        />
        <KpiCard
          title="Error Rate"
          value={`${currentMetrics.error_rate.toFixed(2)}`}
          unit="%"
          icon={<Shield className="w-5 h-5" />}
          trend={-0.3}
          color={currentMetrics.error_rate > 2 ? 'red' : 'emerald'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Throughput Chart */}
        <div className="lg:col-span-2 card-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-nexus-primary">Pipeline Throughput</h3>
              <p className="text-xs text-nexus-secondary">Messages processed per second</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-xs text-nexus-secondary">Throughput</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-xs text-nexus-secondary">Latency</span>
              </div>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputHistory.slice(-60)}>
                <defs>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  stroke="#374151"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                />
                <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: any, name: string) => [
                    name === 'value' ? `${Number(value).toFixed(0)} msgs/s` : `${Number(value).toFixed(0)} ms`,
                    name === 'value' ? 'Throughput' : 'Latency'
                  ]}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#tGrad)" name="Throughput" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Distribution */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Prediction Distribution</h3>
          <p className="text-xs text-nexus-secondary mb-4">Model output classification</p>

          <div className="space-y-4">
            <DistributionBar label="Safe" count={predictionDistribution.safe?.count || 0} percentage={safePct} color="emerald" />
            <DistributionBar label="Fraud" count={predictionDistribution.fraud?.count || 0} percentage={fraudPct} color="red" />
            <DistributionBar label="Review" count={predictionDistribution.review?.count || 0} percentage={predictionDistribution.review?.percentage || 0} color="yellow" />
          </div>

          <div className="mt-6 pt-4 border-t border-nexus">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-emerald-400">{(predictionDistribution.safe?.percentage || 0).toFixed(1)}%</div>
                <div className="text-[10px] text-nexus-secondary">Safe</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-400">{(predictionDistribution.fraud?.percentage || 0).toFixed(1)}%</div>
                <div className="text-[10px] text-nexus-secondary">Fraud</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-400">{(predictionDistribution.review?.percentage || 0).toFixed(1)}%</div>
                <div className="text-[10px] text-nexus-secondary">Review</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Status */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Pipeline Status</h3>
          <p className="text-xs text-nexus-secondary mb-4">Active processing nodes</p>
          <div className="space-y-2">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : node.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-nexus-primary">{node.name}</span>
                </div>
                <span className="text-xs font-mono text-nexus-secondary">{node.throughput.toLocaleString()}/s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Recent Logs</h3>
          <p className="text-xs text-nexus-secondary mb-4">Latest pipeline activity</p>
          <div className="space-y-1 max-h-[220px] overflow-y-auto font-mono text-[11px]">
            {logs.slice(-8).map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="text-nexus-secondary shrink-0">[{log.timestamp}]</span>
                <span className={log.level === 'WARN' ? 'text-yellow-400' : log.level === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}>{log.level}</span>
                <span className="text-nexus-secondary truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Quick Stats</h3>
          <p className="text-xs text-nexus-secondary mb-4">System summary</p>
          <div className="space-y-3">
            <StatRow icon={<Database className="w-4 h-4" />} label="Active DAGs" value={dags.filter(d => d.status === 'running').length.toString()} suffix={`/ ${dags.length}`} />
            <StatRow icon={<GitBranch className="w-4 h-4" />} label="DAG Runs (24h)" value={dags.reduce((a, d) => a + d.run_count, 0).toLocaleString()} />
            <StatRow icon={<Layers className="w-4 h-4" />} label="Pipeline Nodes" value={nodes.length.toString()} />
            <StatRow icon={<Gauge className="w-4 h-4" />} label="Uptime" value={formatUptime(currentMetrics.uptime_seconds)} />
            <StatRow icon={<FileCheck className="w-4 h-4" />} label="Model AUC" value="0.987" />
            <StatRow icon={<Eye className="w-4 h-4" />} label="Active Alerts" value={alerts.filter(a => !a.resolved).length.toString()} color={alerts.filter(a => !a.resolved).length > 0 ? 'text-yellow-400' : 'text-emerald-400'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, unit, icon, trend, color }: {
  title: string; value: string; unit: string; icon: React.ReactNode; trend: number; color: string;
}) {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = color === 'red'
    ? (isPositive ? 'text-red-400' : 'text-emerald-400')
    : (isPositive ? 'text-emerald-400' : 'text-red-400');

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : color === 'blue' ? 'bg-blue-500/10 text-blue-400' : color === 'purple' ? 'bg-purple-500/10 text-purple-400' : color === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold text-nexus-primary">{value}</div>
        <div className="text-xs text-nexus-secondary mt-0.5">{unit}</div>
      </div>
      <div className="text-[10px] text-nexus-secondary mt-2">{title}</div>
    </div>
  );
}

function DistributionBar({ label, count, percentage, color }: { label: string; count: number; percentage: number; color: string }) {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-nexus-primary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-nexus-secondary">{count.toLocaleString()}</span>
          <span className="text-xs font-medium text-nexus-primary">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${bgColors[color]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, suffix, color }: { icon: React.ReactNode; label: string; value: string; suffix?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="text-nexus-secondary">{icon}</div>
      <div className="flex-1 text-xs text-nexus-secondary">{label}</div>
      <div className={`text-xs font-semibold font-mono ${color || 'text-nexus-primary'}`}>
        {value}{suffix ? <span className="text-nexus-secondary font-normal"> {suffix}</span> : null}
      </div>
    </div>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m`;
}
