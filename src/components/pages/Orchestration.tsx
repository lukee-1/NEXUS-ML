import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { GitBranch, Play, Clock, Calendar, CheckCircle, XCircle, Loader2, AlertTriangle, User, RotateCcw } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; className: string; label: string }> = {
  success: { icon: CheckCircle, className: 'dag-node-success', label: 'Success' },
  running: { icon: Loader2, className: 'dag-node-running', label: 'Running' },
  failed: { icon: XCircle, className: 'dag-node-failed', label: 'Failed' },
  queued: { icon: Clock, className: 'dag-node-queued', label: 'Queued' },
};

const DAG_LAYOUTS: Record<string, { positions: Record<string, { x: number; y: number }>; edges: string[][] }> = {
  daily_feature_backfill: {
    positions: {
      extract_raw: { x: 100, y: 40 },
      validate_schema: { x: 100, y: 130 },
      clean_missing: { x: 100, y: 220 },
      engineer_features: { x: 100, y: 310 },
      store_features: { x: 100, y: 400 },
      validate_features: { x: 100, y: 490 },
    },
    edges: [
      ['extract_raw', 'validate_schema'],
      ['validate_schema', 'clean_missing'],
      ['clean_missing', 'engineer_features'],
      ['engineer_features', 'store_features'],
      ['store_features', 'validate_features'],
    ],
  },
  model_retraining: {
    positions: {
      fetch_training_data: { x: 50, y: 40 },
      split_data: { x: 50, y: 130 },
      train_model: { x: 50, y: 220 },
      evaluate_model: { x: 50, y: 310 },
      model_validation: { x: 50, y: 400 },
      deploy_model: { x: 50, y: 490 },
    },
    edges: [
      ['fetch_training_data', 'split_data'],
      ['split_data', 'train_model'],
      ['train_model', 'evaluate_model'],
      ['evaluate_model', 'model_validation'],
      ['model_validation', 'deploy_model'],
    ],
  },
  data_quality_check: {
    positions: {
      check_completeness: { x: 30, y: 40 },
      check_freshness: { x: 230, y: 40 },
      check_distribution: { x: 130, y: 160 },
      generate_report: { x: 130, y: 280 },
    },
    edges: [
      ['check_completeness', 'check_distribution'],
      ['check_freshness', 'check_distribution'],
      ['check_distribution', 'generate_report'],
    ],
  },
};

export default function Orchestration() {
  const { dags, activeDagId, setActiveDagId } = useStore();

  useEffect(() => {
    if (dags.length > 0 && !activeDagId) {
      setActiveDagId(dags[0].id);
    }
  }, [dags, activeDagId, setActiveDagId]);

  const activeDag = dags.find((d) => d.id === activeDagId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-nexus-primary">Orchestration</h1>
          <p className="text-sm text-nexus-secondary mt-0.5">Workflow scheduling and pipeline DAG management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium">
          <Play className="w-4 h-4" />
          Trigger DAG
        </button>
      </div>

      {/* DAG List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dags.map((dag) => (
          <div
            key={dag.id}
            onClick={() => setActiveDagId(dag.id)}
            className={`card-glass p-4 cursor-pointer transition-all ${activeDagId === dag.id ? 'border-emerald-500/30' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <StatusBadge status={dag.status} />
            </div>
            <h3 className="text-sm font-medium text-nexus-primary mb-1">{dag.name}</h3>
            <div className="flex items-center gap-3 text-[10px] text-nexus-secondary mt-2">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dag.schedule}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {dag.owner}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-nexus">
              <span className="text-[10px] text-nexus-secondary">{dag.run_count.toLocaleString()} runs</span>
              <span className="text-[10px] text-nexus-secondary">{dag.tasks.length} tasks</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active DAG Detail */}
      {activeDag && (
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-medium text-nexus-primary">{activeDag.name}</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-nexus-secondary flex items-center gap-1"><Calendar className="w-3 h-3" /> {activeDag.schedule}</span>
                <span className="text-xs text-nexus-secondary flex items-center gap-1"><User className="w-3 h-3" /> {activeDag.owner}</span>
                {activeDag.last_run && (
                  <span className="text-xs text-nexus-secondary flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Last run: {new Date(activeDag.last_run).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-xs">
                <Play className="w-3 h-3" /> Run Now
              </button>
            </div>
          </div>

          {/* DAG Visualization */}
          <div className="relative" style={{ height: activeDagId === 'data_quality_check' ? 340 : 560 }}>
            <DagVisualizer dag={activeDag} dagId={activeDagId || ''} />
          </div>

          {/* Task Details Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-nexus-primary mb-3">Task Instances</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-nexus">
                    <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Task</th>
                    <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Start Time</th>
                    <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Duration</th>
                    <th className="text-left py-2 px-3 text-nexus-secondary font-medium">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDag.tasks.map((task) => {
                    const state = activeDag.task_states[task.id];
                    const statusCfg = STATUS_CONFIG[state?.status] || STATUS_CONFIG.queued;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={task.id} className="border-b border-nexus/50 hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-nexus-primary">{task.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${statusCfg.className}`}>
                            <StatusIcon className={`w-3 h-3 ${state?.status === 'running' ? 'animate-spin' : ''}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-nexus-secondary font-mono">
                          {state?.start_time ? new Date(state.start_time).toLocaleTimeString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-nexus-secondary font-mono">{state?.duration || '-'}</td>
                        <td className="py-2.5 px-3">
                          {state?.retry_count ? (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <AlertTriangle className="w-3 h-3" />
                              {state.retry_count}
                            </span>
                          ) : (
                            <span className="text-nexus-secondary">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DagVisualizer({ dag, dagId }: { dag: any; dagId: string }) {
  const layout = DAG_LAYOUTS[dagId];
  if (!layout) return null;

  const { positions, edges } = layout;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 560" className="overflow-visible">
      <defs>
        <marker id="arrow-success" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#10B981" opacity="0.6" />
        </marker>
        <marker id="arrow-running" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#3B82F6" opacity="0.8" />
        </marker>
        <marker id="arrow-failed" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#EF4444" opacity="0.6" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(([from, to]) => {
        const fromPos = positions[from];
        const toPos = positions[to];
        if (!fromPos || !toPos) return null;

        const fromState = dag.task_states[from];
        const markerId = fromState?.status === 'running' ? 'arrow-running' : fromState?.status === 'failed' ? 'arrow-failed' : 'arrow-success';
        const strokeColor = fromState?.status === 'running' ? '#3B82F6' : fromState?.status === 'failed' ? '#EF4444' : '#10B981';

        return (
          <line
            key={`${from}-${to}`}
            x1={fromPos.x + 60}
            y1={fromPos.y + 30}
            x2={toPos.x + 60}
            y2={toPos.y}
            stroke={strokeColor}
            strokeWidth={1.5}
            opacity={0.5}
            markerEnd={`url(#${markerId})`}
            strokeDasharray={fromState?.status === 'queued' ? '4 4' : 'none'}
          />
        );
      })}

      {/* Nodes */}
      {dag.tasks.map((task: any) => {
        const pos = positions[task.id];
        if (!pos) return null;
        const state = dag.task_states[task.id];
        const cfg = STATUS_CONFIG[state?.status] || STATUS_CONFIG.queued;
        const StatusIcon = cfg.icon;

        return (
          <g key={task.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <rect
              width={dagId === 'data_quality_check' ? 100 : 120}
              height={50}
              rx={6}
              fill="#111827"
              stroke={state?.status === 'running' ? '#3B82F6' : state?.status === 'failed' ? '#EF4444' : state?.status === 'success' ? '#10B981' : '#374151'}
              strokeWidth={1.5}
              className={state?.status === 'running' ? 'animate-pulse' : ''}
            />
            <foreignObject x={6} y={6} width={dagId === 'data_quality_check' ? 88 : 108} height={38}>
              <div className={`flex items-center gap-1.5 text-[10px] font-medium ${cfg.className.split(' ')[0]}`}>
                <StatusIcon className={`w-3 h-3 ${state?.status === 'running' ? 'animate-spin' : ''}`} />
                <span className="truncate text-nexus-primary">{task.name}</span>
              </div>
              {state?.duration && (
                <div className="text-[9px] text-nexus-secondary font-mono mt-0.5">{state.duration}</div>
              )}
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    idle: 'badge-neutral',
    running: 'badge-info',
    success: 'badge-success',
    failed: 'badge-error',
  };
  return <span className={`badge ${classes[status] || 'badge-neutral'}`}>{status}</span>;
}
