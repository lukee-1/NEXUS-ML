import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  ShieldAlert, CheckCircle, AlertTriangle, Info, XCircle, Filter, Clock, Server, Search, CheckCheck
} from 'lucide-react';

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; badge: string; color: string }> = {
  critical: { icon: XCircle, badge: 'badge-error', color: 'text-red-400' },
  warning: { icon: AlertTriangle, badge: 'badge-warning', color: 'text-yellow-400' },
  info: { icon: Info, badge: 'badge-info', color: 'text-blue-400' },
};

const COMPONENT_ICONS: Record<string, React.ElementType> = {
  kafka: Server,
  spark: Server,
  model: Server,
  api: Server,
  'feature-store': Server,
  pipeline: Server,
};

export default function Alerts() {
  const { alerts, setAlerts, setUnreadAlerts } = useStore();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (statusFilter === 'resolved' && !alert.resolved) return false;
    if (statusFilter === 'open' && alert.resolved) return false;
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase()) && !alert.component.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const resolveAlert = (alertId: string) => {
    const updated = alerts.map((a) => a.id === alertId ? { ...a, resolved: true } : a);
    setAlerts(updated);
    setUnreadAlerts(updated.filter((a) => !a.resolved).length);
  };

  const resolveAll = () => {
    const updated = alerts.map((a) => ({ ...a, resolved: true }));
    setAlerts(updated);
    setUnreadAlerts(0);
  };

  const stats = {
    total: alerts.length,
    open: alerts.filter((a) => !a.resolved).length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
    warning: alerts.filter((a) => a.severity === 'warning' && !a.resolved).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Alerts</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">System alerts and notifications</p>
        </div>
        <button
          onClick={resolveAll}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
        >
          <CheckCheck className="w-4 h-4" />
          Resolve All
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AlertStatCard icon={<ShieldAlert className="w-5 h-5" />} label="Total Alerts" value={stats.total} color="blue" />
        <AlertStatCard icon={<AlertTriangle className="w-5 h-5" />} label="Open" value={stats.open} color="yellow" />
        <AlertStatCard icon={<XCircle className="w-5 h-5" />} label="Critical" value={stats.critical} color="red" />
        <AlertStatCard icon={<AlertTriangle className="w-5 h-5" />} label="Warning" value={stats.warning} color="orange" />
      </div>

      {/* Filters */}
      <div className="card-glass p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-nexus-secondary" />
            <span className="text-xs text-nexus-secondary">Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'critical', 'warning', 'info'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  severityFilter === s
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/5 text-nexus-secondary border border-transparent hover:bg-white/[0.08]'
                }`}
              >
                {s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            {['all', 'open', 'resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-white/5 text-nexus-secondary border border-transparent hover:bg-white/[0.08]'
                }`}
              >
                {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-secondary" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md bg-white/5 border border-nexus text-xs text-nexus-primary placeholder:text-nexus-secondary focus:outline-none focus:border-emerald-500/30 w-48"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {filteredAlerts.length === 0 && (
          <div className="card-glass p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-nexus-secondary">No alerts match your filters</p>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
          const SeverityIcon = cfg.icon;
          const CompIcon = COMPONENT_ICONS[alert.component] || Server;

          return (
            <div
              key={alert.id}
              className={`card-glass p-4 transition-all ${alert.resolved ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${cfg.badge.replace('badge-', 'bg-')}-500/10`}>
                  <SeverityIcon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${cfg.badge} text-[10px]`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-nexus-secondary flex items-center gap-1">
                      <CompIcon className="w-3 h-3" />
                      {alert.component}
                    </span>
                    <span className="text-[10px] text-nexus-secondary flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${alert.resolved ? 'text-nexus-secondary line-through' : 'text-nexus-primary'}`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-nexus-secondary">{alert.id}</span>
                    {alert.resolved && (
                      <span className="badge badge-success text-[10px]">Resolved</span>
                    )}
                  </div>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="shrink-0 p-2 rounded-md hover:bg-emerald-500/10 text-nexus-secondary hover:text-emerald-400 transition-colors"
                    title="Resolve alert"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };
  return (
    <div className="metric-card">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="mt-3">
        <div className="text-2xl font-semibold text-nexus-primary">{value}</div>
      </div>
      <div className="text-[10px] text-nexus-secondary mt-2">{label}</div>
    </div>
  );
}
