/**
 * Client-side Pipeline Simulator
 * Generates realistic streaming data, metrics, logs, and system states
 * for the dashboard when running without the backend.
 */

import { useStore } from '@/store/useStore';

let intervalId: ReturnType<typeof setInterval> | null = null;
let tick = 0;

const LOG_TEMPLATES = [
  { level: 'INFO', component: 'spark-worker-1', message: 'Processed batch #{{batch}} ({{records}} records, {{ms}}ms)' },
  { level: 'INFO', component: 'feature-store', message: 'Extracted {{features}} features for user_id: {{user}}' },
  { level: 'INFO', component: 'model-svc', message: 'Inference batch completed: {{txs}} txs in {{ms}}ms' },
  { level: 'INFO', component: 'kafka-consumer', message: 'Committed offsets for partition {{part}}-{{offset}}' },
  { level: 'INFO', component: 'predictions', message: 'Flagged transaction TX-{{tx}} as {{result}} (score: {{score}})' },
  { level: 'WARN', component: 'kafka-consumer', message: 'Consumer lag increasing: {{lag}} messages behind' },
  { level: 'WARN', component: 'spark-executor-2', message: 'GC pause {{pause}}ms (heap: {{heap}}MB)' },
  { level: 'ERROR', component: 'spark-executor-1', message: 'Task {{task}} failed - Connection timeout to feature-store' },
  { level: 'INFO', component: 'data-source', message: "Ingested {{count}} transactions from stream '{{stream}}'" },
  { level: 'INFO', component: 'model-svc', message: 'Model v1.0.0 served prediction #{{predCount}}' },
];

const WEIGHTS = [0.18, 0.14, 0.14, 0.1, 0.1, 0.08, 0.08, 0.04, 0.1, 0.04];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randn(mean: number, std: number) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + std * z;
}

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 8);
}

function generateLog(predCount: number) {
  const tpl = LOG_TEMPLATES[weightedRandom(WEIGHTS)];
  let msg = tpl.message
    .replace('{{batch}}', String(rand(40000, 60000)))
    .replace('{{records}}', String(rand(800, 1500)))
    .replace('{{ms}}', String(rand(100, 600)))
    .replace('{{features}}', String(rand(35, 55)))
    .replace('{{user}}', String(rand(1000, 9999)))
    .replace('{{txs}}', String(rand(50, 200)))
    .replace('{{part}}', String(rand(0, 5)))
    .replace('{{offset}}', String(rand(100000, 999999)))
    .replace('{{tx}}', String(rand(1000, 9999)))
    .replace('{{result}}', Math.random() < 0.5 ? 'fraud' : 'review')
    .replace('{{score}}', (rand(65, 98) / 100).toFixed(2))
    .replace('{{lag}}', String(rand(50, 300)))
    .replace('{{pause}}', String(rand(200, 800)))
    .replace('{{heap}}', String(rand(2048, 4096)))
    .replace('{{task}}', String(rand(1, 100)))
    .replace('{{count}}', String(rand(500, 2000)))
    .replace('{{stream}}', ['user-events', 'card-tx', 'merchant-settlements'][rand(0, 2)])
    .replace('{{predCount}}', String(predCount));

  return {
    timestamp: formatTime(new Date()),
    level: tpl.level,
    component: tpl.component,
    message: msg,
  };
}

function weightedRandom(weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function maybeGenerateAlert(alerts: any[]) {
  if (Math.random() < 0.15) {
    const types = [
      { severity: 'warning', component: 'kafka', message: `Consumer lag exceeds threshold (${rand(100, 500)} messages)` },
      { severity: 'critical', component: 'spark', message: `Executor ${rand(1, 3)} out of memory` },
      { severity: 'warning', component: 'model', message: `Inference latency p99 > ${rand(100, 300)}ms` },
      { severity: 'info', component: 'pipeline', message: 'Daily feature backfill completed successfully' },
      { severity: 'warning', component: 'feature-store', message: `Feature drift detected in '${['amount_log', 'tx_velocity', 'merchant_risk_score'][rand(0, 2)]}'` },
      { severity: 'critical', component: 'api', message: 'API error rate > 5% for 2 minutes' },
    ];
    const t = types[rand(0, types.length - 1)];
    alerts.unshift({
      id: `ALT-${String(rand(100, 999)).padStart(3, '0')}`,
      ...t,
      timestamp: new Date().toISOString(),
      resolved: false,
    });
    if (alerts.length > 100) alerts.pop();
  }
}

export function startSimulation() {
  if (intervalId) return;

  const startTime = Date.now();

  // Seed initial data
  seedInitialData();

  intervalId = setInterval(() => {
    const s = useStore.getState();
    if (!s.isStreamActive) return;

    tick++;

    // Generate metrics
    const ts = new Date().toISOString();
    const baseThroughput = 1200 + 50 * Math.sin(tick / 60);
    const throughput = Math.max(200, baseThroughput + randn(0, 100));
    let latency = 45 + randn(0, 8);
    if (throughput > 1400) latency += 15;
    const errorRate = Math.max(0, randn(0.5, 0.2) + (Math.random() < 0.02 ? rand(2, 5) : 0));

    // Update metric histories
    const th = [...s.throughputHistory, { timestamp: ts, value: Math.round(throughput * 10) / 10 }].slice(-300);
    const lh = [...s.latencyHistory, { timestamp: ts, value: Math.round(latency * 10) / 10 }].slice(-300);
    const eh = [...s.errorRateHistory, { timestamp: ts, value: Math.round(errorRate * 100) / 100 }].slice(-300);

    s.setThroughputHistory(th);
    s.setLatencyHistory(lh);
    s.setErrorRateHistory(eh);

    // Update current metrics
    const totalTx = s.currentMetrics.total_transactions + Math.floor(throughput / 60);
    s.setCurrentMetrics({
      throughput: Math.round(throughput * 10) / 10,
      latency: Math.round(latency * 10) / 10,
      error_rate: Math.round(errorRate * 100) / 100,
      total_transactions: totalTx,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });

    // Generate log
    s.addLog(generateLog(totalTx));

    // Update prediction counts
    const outcomes = ['safe', 'safe', 'safe', 'safe', 'safe', 'safe', 'safe', 'fraud', 'fraud', 'review'];
    const outcome = outcomes[rand(0, outcomes.length - 1)];
    const dist = { ...s.predictionDistribution };
    dist[outcome as keyof typeof dist] = {
      count: (dist[outcome as keyof typeof dist]?.count || 0) + 1,
      percentage: 0,
    };
    const totalPred = dist.fraud.count + dist.safe.count + dist.review.count;
    dist.fraud.percentage = Math.round((dist.fraud.count / totalPred) * 1000) / 10;
    dist.safe.percentage = Math.round((dist.safe.count / totalPred) * 1000) / 10;
    dist.review.percentage = Math.round((dist.review.count / totalPred) * 1000) / 10;
    s.setPredictionDistribution(dist);

    // Maybe generate alert
    const currentAlerts = [...s.alerts];
    maybeGenerateAlert(currentAlerts);
    s.setAlerts(currentAlerts);
    s.setUnreadAlerts(currentAlerts.filter((a: any) => !a.resolved).length);

    // Update nodes
    const nodes = s.nodes.map((n: any) => {
      if (n.id === 'data-source') return { ...n, throughput: Math.max(200, Math.floor(throughput)) };
      if (n.id === 'kafka') return { ...n, throughput: Math.max(190, Math.floor(throughput * 0.998)), lag: Math.max(0, Math.floor((n.lag || 50) + randn(0, 10))) };
      if (n.id === 'spark') return { ...n, throughput: Math.max(180, Math.floor(throughput * 0.94)), executor: `${rand(2, 3)}/3` };
      if (n.id === 'feature-store') return { ...n, throughput: Math.max(180, Math.floor(throughput * 0.94)), latency: `${rand(8, 20)}ms` };
      if (n.id === 'model') return { ...n, throughput: Math.max(180, Math.floor(throughput * 0.94)), latency: `${rand(25, 70)}ms` };
      if (n.id === 'predictions') return { ...n, throughput: Math.max(180, Math.floor(throughput * 0.94)) };
      return n;
    });
    s.setNodes(nodes);

    // Update CPU/Memory metrics
    const cpuEntry = {
      timestamp: ts,
      'api-server': Math.round(randn(45, 10) * 10) / 10,
      'kafka-broker': Math.round(randn(35, 8) * 10) / 10,
      'spark-worker': Math.round(randn(60, 15) * 10) / 10,
      'model-svc': Math.round(randn(25, 5) * 10) / 10,
    };
    s.setCpuMetrics([...s.cpuMetrics, cpuEntry].slice(-60));

    const memEntry = {
      timestamp: ts,
      'api-server': Math.round(randn(60, 5) * 10) / 10,
      'kafka-broker': Math.round(randn(70, 8) * 10) / 10,
      'spark-worker': Math.round(randn(80, 10) * 10) / 10,
      'model-svc': Math.round(randn(40, 5) * 10) / 10,
    };
    s.setMemoryMetrics([...s.memoryMetrics, memEntry].slice(-60));

    // Update DAG states periodically
    if (tick % 10 === 0) {
      const dags = s.dags.map((dag: any) => {
        const taskStates = { ...dag.task_states };
        Object.keys(taskStates).forEach((taskId) => {
          const ts2 = taskStates[taskId];
          if (ts2.status === 'queued' && Math.random() < 0.3) {
            taskStates[taskId] = { ...ts2, status: 'running', start_time: new Date().toISOString() };
          } else if (ts2.status === 'running') {
            if (Math.random() < 0.4) {
              taskStates[taskId] = { ...ts2, status: 'success', duration: `${rand(10, 300)}s` };
            } else if (Math.random() < 0.05) {
              taskStates[taskId] = { ...ts2, status: 'failed', duration: `${rand(5, 60)}s`, retry_count: ts2.retry_count + 1 };
            }
          } else if (ts2.status === 'failed' && ts2.retry_count < 3 && Math.random() < 0.3) {
            taskStates[taskId] = { ...ts2, status: 'running' };
          }
        });
        return { ...dag, task_states: taskStates };
      });
      s.setDags(dags);
    }
  }, 1000);
}

export function stopSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function seedInitialData() {
  const s = useStore.getState();
  const now = new Date();

  // Seed throughput/latency/error history
  const th: any[] = [];
  const lh: any[] = [];
  const eh: any[] = [];
  for (let i = 0; i < 120; i++) {
    const ts = new Date(now.getTime() - (120 - i) * 1000).toISOString();
    th.push({ timestamp: ts, value: Math.round(randn(1200, 150) * 10) / 10 });
    lh.push({ timestamp: ts, value: Math.round(randn(45, 12) * 10) / 10 });
    eh.push({ timestamp: ts, value: Math.round(randn(0.5, 0.3) * 100) / 100 });
  }
  s.setThroughputHistory(th);
  s.setLatencyHistory(lh);
  s.setErrorRateHistory(eh);

  // Seed logs
  const logs: any[] = [];
  for (let i = 0; i < 30; i++) {
    logs.push(generateLog(i * 1000));
  }
  s.setLogs(logs);

  // Seed nodes
  s.setNodes([
    { id: 'data-source', name: 'Data Source', type: 'source', status: 'active', throughput: 1250, icon: 'database' },
    { id: 'kafka', name: 'Kafka Cluster', type: 'queue', status: 'active', throughput: 1248, lag: 45, icon: 'zap' },
    { id: 'spark', name: 'Spark Streaming', type: 'processor', status: 'active', throughput: 1180, executor: '3/3', icon: 'cpu' },
    { id: 'feature-store', name: 'Feature Store', type: 'storage', status: 'active', throughput: 1180, latency: '12ms', icon: 'hard-drive' },
    { id: 'model', name: 'ML Model', type: 'inference', status: 'active', throughput: 1180, latency: '45ms', icon: 'brain' },
    { id: 'predictions', name: 'Predictions', type: 'sink', status: 'active', throughput: 1180, icon: 'check-circle' },
  ]);

  s.setEdges([
    { source: 'data-source', target: 'kafka', label: 'raw-events', rate: 1250 },
    { source: 'kafka', target: 'spark', label: 'consumer-group', rate: 1248 },
    { source: 'spark', target: 'feature-store', label: 'features', rate: 1180 },
    { source: 'feature-store', target: 'model', label: 'feature-vector', rate: 1180 },
    { source: 'model', target: 'predictions', label: 'scores', rate: 1180 },
  ]);

  // Seed alerts
  s.setAlerts([
    { id: 'ALT-001', severity: 'warning', component: 'kafka', message: 'Consumer lag exceeds threshold (150 messages)', timestamp: new Date(now.getTime() - 7200000).toISOString(), resolved: false },
    { id: 'ALT-002', severity: 'critical', component: 'spark', message: 'Executor memory usage > 90%', timestamp: new Date(now.getTime() - 3600000).toISOString(), resolved: true },
    { id: 'ALT-003', severity: 'info', component: 'model', message: 'Model drift detected - AUC dropped by 0.03', timestamp: new Date(now.getTime() - 1800000).toISOString(), resolved: false },
    { id: 'ALT-004', severity: 'warning', component: 'feature-store', message: 'Feature freshness delay: 45 minutes', timestamp: new Date(now.getTime() - 900000).toISOString(), resolved: false },
    { id: 'ALT-005', severity: 'critical', component: 'api', message: 'API latency p99 > 500ms for 5 minutes', timestamp: new Date(now.getTime() - 300000).toISOString(), resolved: false },
  ]);
  s.setUnreadAlerts(4);

  // Seed prediction distribution
  s.setPredictionDistribution({
    fraud: { count: rand(40, 60), percentage: 5.2 },
    safe: { count: rand(800, 950), percentage: 88.5 },
    review: { count: rand(30, 60), percentage: 6.3 },
  });

  s.setCurrentMetrics({
    throughput: 1248,
    latency: 45,
    error_rate: 0.5,
    total_transactions: 15420,
    uptime_seconds: 3600,
  });

  // Seed DAGs
  s.setDags([
    {
      id: 'daily_feature_backfill',
      name: 'Daily Feature Backfill',
      schedule: '0 2 * * *',
      owner: 'ml-team',
      status: 'idle',
      last_run: new Date(now.getTime() - 3600000).toISOString(),
      next_run: new Date(now.getTime() + 7200000).toISOString(),
      run_count: 342,
      tasks: [
        { id: 'extract_raw', name: 'Extract Raw Data', dependencies: [] },
        { id: 'validate_schema', name: 'Validate Schema', dependencies: ['extract_raw'] },
        { id: 'clean_missing', name: 'Clean Missing Values', dependencies: ['validate_schema'] },
        { id: 'engineer_features', name: 'Engineer Features', dependencies: ['clean_missing'] },
        { id: 'store_features', name: 'Store Features', dependencies: ['engineer_features'] },
        { id: 'validate_features', name: 'Validate Features', dependencies: ['store_features'] },
      ],
      task_states: {
        extract_raw: { status: 'success', start_time: new Date(now.getTime() - 4000000).toISOString(), duration: '120s', retry_count: 0, logs: [] },
        validate_schema: { status: 'success', start_time: new Date(now.getTime() - 3800000).toISOString(), duration: '45s', retry_count: 0, logs: [] },
        clean_missing: { status: 'success', start_time: new Date(now.getTime() - 3700000).toISOString(), duration: '180s', retry_count: 0, logs: [] },
        engineer_features: { status: 'success', start_time: new Date(now.getTime() - 3400000).toISOString(), duration: '300s', retry_count: 0, logs: [] },
        store_features: { status: 'success', start_time: new Date(now.getTime() - 3000000).toISOString(), duration: '90s', retry_count: 0, logs: [] },
        validate_features: { status: 'running', start_time: new Date(now.getTime() - 600000).toISOString(), duration: null, retry_count: 0, logs: [] },
      },
    },
    {
      id: 'model_retraining',
      name: 'Model Retraining Pipeline',
      schedule: '0 3 * * 0',
      owner: 'ml-team',
      status: 'idle',
      last_run: new Date(now.getTime() - 86400000).toISOString(),
      next_run: new Date(now.getTime() + 172800000).toISOString(),
      run_count: 52,
      tasks: [
        { id: 'fetch_training_data', name: 'Fetch Training Data', dependencies: [] },
        { id: 'split_data', name: 'Train/Test Split', dependencies: ['fetch_training_data'] },
        { id: 'train_model', name: 'Train XGBoost Model', dependencies: ['split_data'] },
        { id: 'evaluate_model', name: 'Evaluate Performance', dependencies: ['train_model'] },
        { id: 'model_validation', name: 'Model Validation', dependencies: ['evaluate_model'] },
        { id: 'deploy_model', name: 'Deploy to Production', dependencies: ['model_validation'] },
      ],
      task_states: {
        fetch_training_data: { status: 'success', start_time: null, duration: '300s', retry_count: 0, logs: [] },
        split_data: { status: 'success', start_time: null, duration: '60s', retry_count: 0, logs: [] },
        train_model: { status: 'success', start_time: null, duration: '1800s', retry_count: 0, logs: [] },
        evaluate_model: { status: 'success', start_time: null, duration: '120s', retry_count: 0, logs: [] },
        model_validation: { status: 'success', start_time: null, duration: '90s', retry_count: 0, logs: [] },
        deploy_model: { status: 'success', start_time: null, duration: '30s', retry_count: 0, logs: [] },
      },
    },
    {
      id: 'data_quality_check',
      name: 'Data Quality Check',
      schedule: '0 */4 * * *',
      owner: 'data-team',
      status: 'running',
      last_run: new Date(now.getTime() - 14400000).toISOString(),
      next_run: new Date(now.getTime() + 3600000).toISOString(),
      run_count: 210,
      tasks: [
        { id: 'check_completeness', name: 'Check Completeness', dependencies: [] },
        { id: 'check_freshness', name: 'Check Freshness', dependencies: [] },
        { id: 'check_distribution', name: 'Check Distribution', dependencies: ['check_completeness', 'check_freshness'] },
        { id: 'generate_report', name: 'Generate Report', dependencies: ['check_distribution'] },
      ],
      task_states: {
        check_completeness: { status: 'success', start_time: new Date(now.getTime() - 300000).toISOString(), duration: '45s', retry_count: 0, logs: [] },
        check_freshness: { status: 'success', start_time: new Date(now.getTime() - 250000).toISOString(), duration: '30s', retry_count: 0, logs: [] },
        check_distribution: { status: 'running', start_time: new Date(now.getTime() - 200000).toISOString(), duration: null, retry_count: 0, logs: [] },
        generate_report: { status: 'queued', start_time: null, duration: null, retry_count: 0, logs: [] },
      },
    },
  ]);

  // Seed CPU/Memory
  const cpuData: any[] = [];
  const memData: any[] = [];
  for (let i = 0; i < 60; i++) {
    const ts = new Date(now.getTime() - (60 - i) * 1000).toISOString();
    cpuData.push({
      timestamp: ts,
      'api-server': Math.round(randn(45, 10) * 10) / 10,
      'kafka-broker': Math.round(randn(35, 8) * 10) / 10,
      'spark-worker': Math.round(randn(60, 15) * 10) / 10,
      'model-svc': Math.round(randn(25, 5) * 10) / 10,
    });
    memData.push({
      timestamp: ts,
      'api-server': Math.round(randn(60, 5) * 10) / 10,
      'kafka-broker': Math.round(randn(70, 8) * 10) / 10,
      'spark-worker': Math.round(randn(80, 10) * 10) / 10,
      'model-svc': Math.round(randn(40, 5) * 10) / 10,
    });
  }
  s.setCpuMetrics(cpuData);
  s.setMemoryMetrics(memData);

  // Model info
  s.setModelInfo({
    model_name: 'fraud_detection_v1',
    model_type: 'GradientBoostingClassifier',
    version: '1.0.0',
    created_at: '2026-05-20T10:00:00Z',
    metrics: { auc_roc: 0.987, precision: 0.94, recall: 0.91, f1_score: 0.925 },
    training_params: { n_estimators: 200, max_depth: 5, learning_rate: 0.1, subsample: 0.8 },
    runtime_stats: { total_predictions: 15420, avg_latency_ms: 12.4, p99_latency_ms: 45.2 },
    feature_importance: [
      { feature: 'transaction_count_24h', importance: 0.35 },
      { feature: 'amount_to_avg_ratio', importance: 0.18 },
      { feature: 'risk_composite', importance: 0.12 },
      { feature: 'distance_from_home', importance: 0.10 },
      { feature: 'tx_velocity', importance: 0.08 },
      { feature: 'merchant_risk_score', importance: 0.06 },
      { feature: 'time_since_last_tx', importance: 0.04 },
      { feature: 'amount_log', importance: 0.03 },
      { feature: 'unique_merchants_7d', importance: 0.02 },
      { feature: 'transaction_count_1h', importance: 0.02 },
    ],
  });
}
