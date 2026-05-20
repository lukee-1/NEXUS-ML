import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, Brain, ChevronLeft, ChevronRight, GitBranch, Home, LayoutDashboard, Menu, Play, Bell, Settings, ShieldAlert, Zap
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { startSimulation } from '@/lib/simulator';

const NAV_TABS = [
  { id: 'overview', label: 'Overview', icon: Home, path: '/' },
  { id: 'pipeline', label: 'Pipeline', icon: Zap, path: '/pipeline' },
  { id: 'orchestration', label: 'Orchestration', icon: GitBranch, path: '/orchestration' },
  { id: 'models', label: 'Models', icon: Brain, path: '/models' },
  { id: 'monitoring', label: 'Monitoring', icon: BarChart3, path: '/monitoring' },
  { id: 'alerts', label: 'Alerts', icon: ShieldAlert, path: '/alerts' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeTab, setActiveTab,
    sidebarCollapsed, toggleSidebar,
    isStreamActive, setStreamActive,
    unreadAlerts,
    currentMetrics,
  } = useStore();

  useEffect(() => {
    const tab = NAV_TABS.find(t => t.path === location.pathname);
    if (tab) setActiveTab(tab.id);
  }, [location.pathname, setActiveTab]);

  useEffect(() => {
    startSimulation();
    return () => {
      // cleanup handled by simulator module
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-nexus overflow-hidden">
      {/* Top Navbar */}
      <nav className="h-[60px] bg-nexus-card border-b border-nexus flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              <span className="text-emerald-400">Nexus</span>
              <span className="text-white">ML</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
                {tab.id === 'alerts' && unreadAlerts > 0 && (
                  <span className="ml-1.5 badge badge-error">{unreadAlerts}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stream Toggle */}
          <button
            onClick={() => setStreamActive(!isStreamActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isStreamActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            }`}
          >
            {isStreamActive ? <Activity className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isStreamActive ? 'LIVE' : 'PAUSED'}
          </button>

          {/* Alert Bell */}
          <button className="relative p-2 rounded-md hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4 text-nexus-secondary" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Settings */}
          <button className="p-2 rounded-md hover:bg-white/5 transition-colors">
            <Settings className="w-4 h-4 text-nexus-secondary" />
          </button>

          {/* System Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
            <span className="status-dot status-active" />
            <span className="text-xs text-emerald-400 font-medium">Healthy</span>
            <span className="text-xs text-nexus-secondary">{currentMetrics.latency.toFixed(0)}ms</span>
          </div>

          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-md hover:bg-white/5">
            <Menu className="w-5 h-5 text-nexus-secondary" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`shrink-0 bg-nexus-card border-r border-nexus transition-all duration-300 ${
            sidebarCollapsed ? 'w-[60px]' : 'w-[200px]'
          } hidden md:flex flex-col`}
        >
          <div className="p-3">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center py-2 rounded-md hover:bg-white/5 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-nexus-secondary" /> : <ChevronLeft className="w-4 h-4 text-nexus-secondary" />}
            </button>
          </div>

          <div className="flex-1 px-2 space-y-1 overflow-y-auto">
            <SidebarContent collapsed={sidebarCollapsed} />
          </div>

          <div className="p-3 border-t border-nexus">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs font-semibold text-white">
                ML
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-nexus-primary truncate">ML Engineer</div>
                  <div className="text-[10px] text-nexus-secondary truncate">admin@nexusml.io</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { activeTab, nodes, dags, activeDagId, setActiveDagId } = useStore();

  if (activeTab === 'pipeline') {
    return (
      <>
        <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {collapsed ? 'SRC' : 'Data Sources'}
        </div>
        {['User Transactions', 'Card Events', 'Merchant Settlements'].map((src) => (
          <div key={src} className={`sidebar-item ${collapsed ? 'justify-center px-1' : ''}`}>
            <Zap className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate text-xs">{src}</span>}
          </div>
        ))}
        <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mt-4 mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {collapsed ? 'NODES' : 'Pipeline Nodes'}
        </div>
        {nodes.map((node) => (
          <div key={node.id} className={`sidebar-item ${collapsed ? 'justify-center px-1' : ''}`}>
            <StatusDot status={node.status} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs">{node.name}</div>
                <div className="text-[10px] text-nexus-secondary">{node.throughput.toLocaleString()} msg/s</div>
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  if (activeTab === 'orchestration') {
    return (
      <>
        <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {collapsed ? 'DAGS' : 'Workflows'}
        </div>
        {dags.map((dag) => (
          <div
            key={dag.id}
            onClick={() => setActiveDagId(dag.id)}
            className={`sidebar-item ${activeDagId === dag.id ? 'active' : ''} ${collapsed ? 'justify-center px-1' : ''}`}
          >
            <GitBranch className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs">{dag.name}</div>
                <div className="text-[10px] text-nexus-secondary">{dag.schedule}</div>
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  if (activeTab === 'monitoring') {
    return (
      <>
        <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {collapsed ? 'SYS' : 'Components'}
        </div>
        {['API Servers', 'Kafka Cluster', 'Spark Cluster', 'ML Service', 'Feature Store', 'PostgreSQL', 'Redis'].map((comp) => (
          <div key={comp} className={`sidebar-item ${collapsed ? 'justify-center px-1' : ''}`}>
            <Activity className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate text-xs">{comp}</span>}
          </div>
        ))}
      </>
    );
  }

  if (activeTab === 'alerts') {
    return (
      <>
        <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {collapsed ? 'FILT' : 'Filters'}
        </div>
        {['All Alerts', 'Critical', 'Warning', 'Info', 'Resolved'].map((f) => (
          <div key={f} className={`sidebar-item ${collapsed ? 'justify-center px-1' : ''}`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate text-xs">{f}</span>}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <div className={`text-[10px] font-semibold text-nexus-secondary uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
        {collapsed ? 'NAV' : 'Navigation'}
      </div>
      {NAV_TABS.map((tab) => (
        <div key={tab.id} className={`sidebar-item ${activeTab === tab.id ? 'active' : ''} ${collapsed ? 'justify-center px-1' : ''}`}>
          <tab.icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate text-xs">{tab.label}</span>}
        </div>
      ))}
    </>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls = status === 'active' ? 'status-active' : status === 'warning' ? 'status-warning' : 'status-error';
  return <span className={`status-dot ${cls} shrink-0`} />;
}
