import { useStore } from '@/store/useStore';
import { Brain, Clock, TrendingUp, Zap, Shield, Award, BarChart3, GitCommit } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

const MODEL_HISTORY = [
  { version: 'v0.8', auc: 0.942, precision: 0.89, recall: 0.85, f1: 0.87 },
  { version: 'v0.9', auc: 0.961, precision: 0.91, recall: 0.87, f1: 0.89 },
  { version: 'v0.10', auc: 0.972, precision: 0.93, recall: 0.88, f1: 0.905 },
  { version: 'v0.11', auc: 0.978, precision: 0.935, recall: 0.895, f1: 0.915 },
  { version: 'v1.0', auc: 0.987, precision: 0.94, recall: 0.91, f1: 0.925 },
];

export default function Models() {
  const { modelInfo } = useStore();

  if (!modelInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-nexus-secondary">Loading model information...</div>
      </div>
    );
  }

  const fi = modelInfo.feature_importance?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Models</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">Model registry, performance tracking, and deployment management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success">Production</span>
          <span className="badge badge-info">{modelInfo.version}</span>
        </div>
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ModelKpiCard icon={<Brain className="w-5 h-5" />} label="Model Type" value={modelInfo.model_type} sub={`v${modelInfo.version}`} color="blue" />
        <ModelKpiCard icon={<TrendingUp className="w-5 h-5" />} label="AUC-ROC" value={modelInfo.metrics?.auc_roc?.toFixed(3)} sub="Validation set" color="emerald" />
        <ModelKpiCard icon={<Zap className="w-5 h-5" />} label="Avg Latency" value={`${modelInfo.runtime_stats?.avg_latency_ms}ms`} sub={`p99: ${modelInfo.runtime_stats?.p99_latency_ms}ms`} color="purple" />
        <ModelKpiCard icon={<Shield className="w-5 h-5" />} label="F1 Score" value={modelInfo.metrics?.f1_score?.toFixed(3)} sub="Weighted avg" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature Importance */}
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-nexus-primary">Feature Importance</h3>
              <p className="text-xs text-nexus-secondary">Top 10 most impactful features</p>
            </div>
            <BarChart3 className="w-4 h-4 text-nexus-secondary" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fi} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} domain={[0, 'auto']} />
                <YAxis dataKey="feature" type="category" stroke="#374151" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={120} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: any) => [(v * 100).toFixed(1) + '%', 'Importance']}
                />
                <Bar dataKey="importance" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Performance Over Time */}
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-nexus-primary">Performance History</h3>
              <p className="text-xs text-nexus-secondary">Metrics across model versions</p>
            </div>
            <Award className="w-4 h-4 text-nexus-secondary" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MODEL_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="version" stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis domain={[0.8, 1]} stroke="#374151" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
                  formatter={(v: any, n: string) => [Number(v).toFixed(3), n]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="auc" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} name="AUC" />
                <Line type="monotone" dataKey="precision" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, fill: '#F59E0B' }} name="Recall" />
                <Line type="monotone" dataKey="f1" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4, fill: '#8B5CF6' }} name="F1" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Training Parameters & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Training Configuration</h3>
          <p className="text-xs text-nexus-secondary mb-4">Hyperparameters used for model training</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(modelInfo.training_params || {}).map(([key, value]) => (
              <div key={key} className="py-2 px-3 rounded-md bg-white/[0.02]">
                <div className="text-[10px] text-nexus-secondary uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
                <div className="text-sm font-mono text-nexus-primary mt-0.5">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-4">
          <h3 className="text-sm font-medium text-nexus-primary mb-1">Deployment Info</h3>
          <p className="text-xs text-nexus-secondary mb-4">Current deployment status and runtime statistics</p>
          <div className="space-y-3">
            <InfoRow label="Model Name" value={modelInfo.model_name} />
            <InfoRow label="Version" value={modelInfo.version} />
            <InfoRow label="Created" value={new Date(modelInfo.created_at).toLocaleString()} />
            <InfoRow label="Total Predictions" value={modelInfo.runtime_stats?.total_predictions?.toLocaleString()} />
            <InfoRow label="Avg Latency" value={`${modelInfo.runtime_stats?.avg_latency_ms}ms`} />
            <InfoRow label="P99 Latency" value={`${modelInfo.runtime_stats?.p99_latency_ms}ms`} />
            <div className="pt-2 border-t border-nexus">
              <div className="flex items-center gap-2">
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Deployed to production</span>
                <Clock className="w-3 h-3 text-nexus-secondary ml-auto" />
                <span className="text-[10px] text-nexus-secondary">2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelKpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <div className="metric-card">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div className="mt-3">
        <div className="text-lg font-semibold text-nexus-primary">{value}</div>
        <div className="text-xs text-nexus-secondary mt-0.5">{sub}</div>
      </div>
      <div className="text-[10px] text-nexus-secondary mt-2">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-nexus-secondary">{label}</span>
      <span className="text-xs font-mono text-nexus-primary">{value}</span>
    </div>
  );
}
