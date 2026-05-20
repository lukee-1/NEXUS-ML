import { useStore } from '@/store/useStore';
import {
  Cpu, HardDriveIcon, MemoryStick, Network, Server, Zap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';

const KAFKA_TOPIC_DATA = [
  { name: 'raw-transactions', partitions: 6, replication: 3, rate: 1248 },
  { name: 'processed-features', partitions: 4, replication: 3, rate: 1173 },
  { name: 'prediction-scores', partitions: 3, replication: 3, rate: 374 },
  { name: 'alerts', partitions: 2, replication: 3, rate: 12 },
];

const CONSUMER_GROUPS = [
  { group: 'spark-streaming', topic: 'raw-transactions', lag: 67, members: 3 },
  { group: 'feature-consumer', topic: 'processed-features', lag: 23, members: 2 },
  { group: 'prediction-consumer', topic: 'prediction-scores', lag: 8, members: 2 },
];

const SPARK_APPS = [
  { id: 'app-001', name: 'FraudDetectionStream', status: 'running', duration: '2d 4h', executors: 3, tasks: 24 },
  { id: 'app-002', name: 'FeatureEngineering', status: 'running', duration: '5d 12h', executors: 2, tasks: 12 },
  { id: 'app-003', name: 'DailyBatchETL', status: 'completed', duration: '45m', executors: 0, tasks: 0 },
];

const SPARK_EXECUTORS = [
  { id: 'exec-1', host: 'worker-1', tasks: 8, memory_used: 6.2, memory_total: 8, cpu: 65 },
  { id: 'exec-2', host: 'worker-2', tasks: 11, memory_used: 7.1, memory_total: 8, cpu: 78 },
  { id: 'exec-3', host: 'worker-3', tasks: 5, memory_used: 5.5, memory_total: 8, cpu: 52 },
];

export default function Monitoring() {
  const { cpuMetrics, memoryMetrics, throughputHistory, latencyHistory } = useStore();

  const latestCpu = cpuMetrics.length > 0 ? cpuMetrics[cpuMetrics.length - 1] : {};
  const latestMem = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1] : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Monitoring</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">System health, resource utilization, and infrastructure metrics</p>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MonitorCard icon={<Cpu className="w-5 h-5" />} label="CPU Usage" value={`${(Object.values(latestCpu).filter(v => typeof v === 'number').reduce((a: number, b) => a + (b as number), 0) / Math.max(Object.values(latestCpu).filter(v => typeof v === 'number').length, 1)).toFixed(1)}%`} sub="Avg across nodes" color="blue" />
        <MonitorCard icon={<MemoryStick className="w-5 h-5" />} label="Memory" value={`${(Object.values(latestMem).filter(v => typeof v === 'number').reduce((a: number, b) => a + (b as number), 0) / Math.max(Object.values(latestMem).filter(v => typeof v === 'number').length, 1)).toFixed(1)}%`} sub="Avg utilization" color="purple" />
        <MonitorCard icon={<HardDriveIcon className="w-5 h-5" />} label="Disk" value="64.2%" sub="320GB / 500GB" color="emerald" />
        <MonitorCard icon={<Network className="w-5 h-5" />} label="Network" value="45.2 Mbps" sub="In: 45 / Out: 30" color="yellow" />
      </div>

      {/* CPU & Memory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-nexus-primary">CPU Usage by Component</h3>
              <p className="text-xs text-nexus-secondary">Percentage utilization over time</p>
            </div>
            <Cpu className="w-4 h-4 text-nexus-secondary" />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} stroke="#374151" />
                <YAxis domain={[0, 100]} stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
                  formatter={(v: any, n: string) => [`${v}%`, n.replace('-', ' ')]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="api-server" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="API Server" />
                <Line type="monotone" dataKey="kafka-broker" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Kafka Broker" />
                <Line type="monotone" dataKey="spark-worker" stroke="#10B981" strokeWidth={1.5} dot={false} name="Spark Worker" />
                <Line type="monotone" dataKey="model-svc" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="ML Service" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-nexus-primary">Memory Usage by Component</h3>
              <p className="text-xs text-nexus-secondary">Percentage utilization over time</p>
            </div>
            <MemoryStick className="w-4 h-4 text-nexus-secondary" />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} stroke="#374151" />
                <YAxis domain={[0, 100]} stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
                  formatter={(v: any, n: string) => [`${v}%`, n.replace('-', ' ')]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="api-server" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="API Server" />
                <Line type="monotone" dataKey="kafka-broker" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Kafka Broker" />
                <Line type="monotone" dataKey="spark-worker" stroke="#10B981" strokeWidth={1.5} dot={false} name="Spark Worker" />
                <Line type="monotone" dataKey="model-svc" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="ML Service" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Throughput & Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Pipeline Throughput</h3>
          <p className="text-xs text-nexus-secondary mb-4">Messages per second</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputHistory.slice(-60)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} stroke="#374151" />
                <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Processing Latency</h3>
          <p className="text-xs text-nexus-secondary mb-4">Average milliseconds per batch</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyHistory.slice(-60)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} stroke="#374151" />
                <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} unit="ms" />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }} />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kafka Metrics */}
      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-nexus-primary">Kafka Topics</h3>
            <p className="text-xs text-nexus-secondary">Topic throughput and configuration</p>
          </div>
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-nexus">
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Topic</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Partitions</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Replication</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Msg/s</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {KAFKA_TOPIC_DATA.map((topic) => (
                <tr key={topic.name} className="border-b border-nexus/50 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-mono text-nexus-primary">{topic.name}</td>
                  <td className="py-2.5 px-3 text-nexus-secondary">{topic.partitions}</td>
                  <td className="py-2.5 px-3 text-nexus-secondary">{topic.replication}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-mono">{topic.rate.toLocaleString()}</td>
                  <td className="py-2.5 px-3"><span className="badge badge-success">Healthy</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-medium text-nexus-primary mt-6 mb-3">Consumer Groups</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CONSUMER_GROUPS.map((cg) => (
            <div key={cg.group} className="p-3 rounded-md bg-white/[0.02] border border-nexus">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-nexus-primary">{cg.group}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${cg.lag > 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  Lag: {cg.lag}
                </span>
              </div>
              <div className="text-[10px] text-nexus-secondary">Topic: {cg.topic}</div>
              <div className="text-[10px] text-nexus-secondary">Members: {cg.members}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Spark Cluster */}
      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-nexus-primary">Spark Cluster</h3>
            <p className="text-xs text-nexus-secondary">Applications and executor status</p>
          </div>
          <Server className="w-4 h-4 text-orange-400" />
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-nexus">
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">App ID</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Name</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Status</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Duration</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Executors</th>
                <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {SPARK_APPS.map((app) => (
                <tr key={app.id} className="border-b border-nexus/50 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-mono text-nexus-secondary">{app.id}</td>
                  <td className="py-2.5 px-3 text-nexus-primary">{app.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${app.status === 'running' ? 'badge-info' : 'badge-success'}`}>{app.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-nexus-secondary">{app.duration}</td>
                  <td className="py-2.5 px-3 text-nexus-secondary">{app.executors}</td>
                  <td className="py-2.5 px-3 text-nexus-secondary">{app.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-medium text-nexus-primary mb-3">Executors</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SPARK_EXECUTORS.map((exec) => (
            <div key={exec.id} className="p-3 rounded-md bg-white/[0.02] border border-nexus">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium font-mono text-nexus-primary">{exec.id}</span>
                <span className="text-[10px] text-nexus-secondary">{exec.host}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-nexus-secondary">Tasks: {exec.tasks}</span>
                  <span className="text-nexus-secondary">CPU: {exec.cpu}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${exec.cpu}%` }} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-nexus-secondary">Memory</span>
                  <span className="text-nexus-secondary">{exec.memory_used}/{exec.memory_total} GB</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(exec.memory_used / exec.memory_total) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonitorCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  };
  return (
    <div className="metric-card">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="mt-3">
        <div className="text-lg font-semibold text-nexus-primary">{value}</div>
        <div className="text-xs text-nexus-secondary mt-0.5">{sub}</div>
      </div>
      <div className="text-[10px] text-nexus-secondary mt-2">{label}</div>
    </div>
  );
}
