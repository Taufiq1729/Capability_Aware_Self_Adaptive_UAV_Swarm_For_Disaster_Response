import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import {
  BarChart3,
  Play,
  Download,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  BatteryCharging,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export const AnalyticsPage = () => {
  const [config, setConfig] = useState({
    numDrones: 6,
    numVictims: 8,
    faultProbability: 0.35,
    commReliability: 0.90,
    disasterSeverity: 'HIGH',
    simulationDurationSec: 45,
    randomSeed: 42
  });

  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Run initial benchmark on mount if not yet executed
  useEffect(() => {
    runBenchmarkExperiment();
  }, []);

  const runBenchmarkExperiment = async () => {
    try {
      setIsRunningBenchmark(true);
      setErrorMsg(null);
      const res = await api.runBenchmark(config);
      setBenchmarkResults(res.data);
      setIsRunningBenchmark(false);
    } catch (err) {
      setErrorMsg('Failed to run benchmark: ' + err.message);
      setIsRunningBenchmark(false);
    }
  };

  const handleExportCSV = async () => {
    if (!benchmarkResults?.results) return;
    try {
      const res = await api.exportBenchmarkCSV(benchmarkResults.results);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `uav_benchmark_seed_${config.randomSeed}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export error: ' + err.message);
    }
  };

  const results = benchmarkResults?.results;

  // Format chart data
  const accuracyChartData = results
    ? [
        {
          name: 'Precision',
          'A: Fixed Roles': results.A_FIXED_ROLES?.detectionPrecision,
          'B: Anomaly Only': results.B_ANOMALY_ONLY?.detectionPrecision,
          'C: Basic Adapt': results.C_BASIC_ADAPTATION?.detectionPrecision,
          'D: Proposed (Confidence-Aware)': results.D_PROPOSED_CONFIDENCE_AWARE?.detectionPrecision
        },
        {
          name: 'Recall',
          'A: Fixed Roles': results.A_FIXED_ROLES?.detectionRecall,
          'B: Anomaly Only': results.B_ANOMALY_ONLY?.detectionRecall,
          'C: Basic Adapt': results.C_BASIC_ADAPTATION?.detectionRecall,
          'D: Proposed (Confidence-Aware)': results.D_PROPOSED_CONFIDENCE_AWARE?.detectionRecall
        },
        {
          name: 'F1 Score',
          'A: Fixed Roles': results.A_FIXED_ROLES?.f1Score,
          'B: Anomaly Only': results.B_ANOMALY_ONLY?.f1Score,
          'C: Basic Adapt': results.C_BASIC_ADAPTATION?.f1Score,
          'D: Proposed (Confidence-Aware)': results.D_PROPOSED_CONFIDENCE_AWARE?.f1Score
        }
      ]
    : [];

  const missionSuccessData = results
    ? [
        {
          metric: 'Victim Detection %',
          A: results.A_FIXED_ROLES?.victimDetectionRate,
          B: results.B_ANOMALY_ONLY?.victimDetectionRate,
          C: results.C_BASIC_ADAPTATION?.victimDetectionRate,
          D: results.D_PROPOSED_CONFIDENCE_AWARE?.victimDetectionRate
        },
        {
          metric: 'Area Coverage %',
          A: results.A_FIXED_ROLES?.areaCoveragePct,
          B: results.B_ANOMALY_ONLY?.areaCoveragePct,
          C: results.C_BASIC_ADAPTATION?.areaCoveragePct,
          D: results.D_PROPOSED_CONFIDENCE_AWARE?.areaCoveragePct
        },
        {
          metric: 'Task Recovery %',
          A: results.A_FIXED_ROLES?.taskRecoveryRate,
          B: results.B_ANOMALY_ONLY?.taskRecoveryRate,
          C: results.C_BASIC_ADAPTATION?.taskRecoveryRate,
          D: results.D_PROPOSED_CONFIDENCE_AWARE?.taskRecoveryRate
        },
        {
          metric: 'Mission Complete %',
          A: results.A_FIXED_ROLES?.missionCompletionRate,
          B: results.B_ANOMALY_ONLY?.missionCompletionRate,
          C: results.C_BASIC_ADAPTATION?.missionCompletionRate,
          D: results.D_PROPOSED_CONFIDENCE_AWARE?.missionCompletionRate
        }
      ]
    : [];

  const latencyChartData = results
    ? [
        {
          baseline: 'Fixed Roles (A)',
          detectionLatency: results.A_FIXED_ROLES?.detectionLatencyMs ?? 0,
          adaptationTime: results.A_FIXED_ROLES?.roleAdaptationTimeSec ?? 0
        },
        {
          baseline: 'Anomaly Only (B)',
          detectionLatency: results.B_ANOMALY_ONLY?.detectionLatencyMs ?? 0,
          adaptationTime: results.B_ANOMALY_ONLY?.roleAdaptationTimeSec ?? 0
        },
        {
          baseline: 'Basic Adapt (C)',
          detectionLatency: results.C_BASIC_ADAPTATION?.detectionLatencyMs ?? 0,
          adaptationTime: results.C_BASIC_ADAPTATION?.roleAdaptationTimeSec ?? 0
        },
        {
          baseline: 'Proposed D',
          detectionLatency: results.D_PROPOSED_CONFIDENCE_AWARE?.detectionLatencyMs ?? 0,
          adaptationTime: results.D_PROPOSED_CONFIDENCE_AWARE?.roleAdaptationTimeSec ?? 0
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">
            Empirical Research Evaluation & Baseline Benchmarks
          </h2>
          <p className="text-sm text-charcoal-600">
            Rigorous comparison of the proposed confidence-aware decentralized approach against standard swarm baselines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={!results}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cream-200 text-charcoal-800 border border-cream-300 hover:bg-cream-300 disabled:opacity-50 transition shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={runBenchmarkExperiment}
            disabled={isRunningBenchmark}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-50 transition shadow-xs"
          >
            <Play className="w-4 h-4" />
            <span>{isRunningBenchmark ? 'Executing Experiment...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-critical-50 border border-critical-200 text-critical-700 text-xs rounded-xl font-mono">
          {errorMsg}
        </div>
      )}

      {/* Experiment Configuration Tuning Bar */}
      <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
            <Sliders className="w-4 h-4 mr-2 text-terracotta-500" />
            Experiment Parameters & Monte Carlo Seeds
          </span>
          <span className="text-xs font-mono text-charcoal-500">
            Seed: <strong className="text-charcoal-900">{config.randomSeed}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <label className="text-charcoal-500 block text-[10px]">Fleet Size</label>
            <input
              type="number"
              min="2"
              max="12"
              value={config.numDrones}
              onChange={(e) => setConfig({ ...config, numDrones: parseInt(e.target.value) || 6 })}
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>

          <div>
            <label className="text-charcoal-500 block text-[10px]">Trapped Victims</label>
            <input
              type="number"
              min="2"
              max="16"
              value={config.numVictims}
              onChange={(e) => setConfig({ ...config, numVictims: parseInt(e.target.value) || 8 })}
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>

          <div>
            <label className="text-charcoal-500 block text-[10px]">Fault Probability</label>
            <input
              type="number"
              step="0.05"
              min="0.0"
              max="0.8"
              value={config.faultProbability}
              onChange={(e) =>
                setConfig({ ...config, faultProbability: parseFloat(e.target.value) || 0.35 })
              }
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>

          <div>
            <label className="text-charcoal-500 block text-[10px]">Comm Reliability</label>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="1.0"
              value={config.commReliability}
              onChange={(e) =>
                setConfig({ ...config, commReliability: parseFloat(e.target.value) || 0.9 })
              }
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>

          <div>
            <label className="text-charcoal-500 block text-[10px]">Duration (Sec)</label>
            <input
              type="number"
              min="15"
              max="180"
              value={config.simulationDurationSec}
              onChange={(e) =>
                setConfig({ ...config, simulationDurationSec: parseInt(e.target.value) || 45 })
              }
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>

          <div>
            <label className="text-charcoal-500 block text-[10px]">Random Seed</label>
            <input
              type="number"
              value={config.randomSeed}
              onChange={(e) =>
                setConfig({ ...config, randomSeed: parseInt(e.target.value) || 42 })
              }
              className="w-full bg-cream-50 border border-cream-300 rounded-lg p-2 font-mono text-charcoal-900 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Detection Precision, Recall & F1 */}
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider">
              Fault Detection Accuracy (Precision, Recall, F1)
            </h3>
            <span className="text-xs text-charcoal-500 font-mono">Higher is Better</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyChartData}>
                <XAxis dataKey="name" stroke="#78716C" fontSize={11} />
                <YAxis domain={[0, 1.1]} stroke="#78716C" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderColor: '#E8DFD0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="A: Fixed Roles" fill="#A8A29E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="B: Anomaly Only" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="C: Basic Adapt" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="D: Proposed (Confidence-Aware)" fill="#C85A32" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Mission Effectiveness & Recovery */}
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider">
              Disaster Mission Metrics (%)
            </h3>
            <span className="text-xs text-charcoal-500 font-mono">Empirical Output</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missionSuccessData}>
                <XAxis dataKey="metric" stroke="#78716C" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#78716C" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderColor: '#E8DFD0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="A" name="A: Fixed Roles" fill="#A8A29E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="B" name="B: Anomaly Only" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="C" name="C: Basic Adapt" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="D" name="D: Proposed" fill="#3D7A5A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quantitative Baseline Comparison Table */}
      {results && (
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider">
              Quantitative Baseline Performance Matrix
            </h3>
            <span className="text-xs text-charcoal-500 font-mono">
              Measured from Seed {config.randomSeed}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-cream-200 text-charcoal-500">
                  <th className="pb-2 font-semibold">Strategy / Baseline</th>
                  <th className="pb-2 font-semibold">F1 Score</th>
                  <th className="pb-2 font-semibold">False Alarms</th>
                  <th className="pb-2 font-semibold">Latency (ms)</th>
                  <th className="pb-2 font-semibold">Adaptation (s)</th>
                  <th className="pb-2 font-semibold">Victims %</th>
                  <th className="pb-2 font-semibold">Coverage %</th>
                  <th className="pb-2 font-semibold">Task Recovery %</th>
                  <th className="pb-2 font-semibold">Energy (J)</th>
                  <th className="pb-2 font-semibold">Comm Msgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {[
                  { key: 'A_FIXED_ROLES', label: 'A: Fixed Roles' },
                  { key: 'B_ANOMALY_ONLY', label: 'B: Anomaly Only' },
                  { key: 'C_BASIC_ADAPTATION', label: 'C: Basic Adaptation' },
                  { key: 'D_PROPOSED_CONFIDENCE_AWARE', label: 'D: Proposed (Confidence-Aware)' }
                ].map(({ key, label }) => {
                  const m = results[key] || {};
                  const isProposed = key === 'D_PROPOSED_CONFIDENCE_AWARE';

                  return (
                    <tr
                      key={key}
                      className={
                        isProposed
                          ? 'bg-terracotta-50/60 font-semibold text-terracotta-900'
                          : 'text-charcoal-700'
                      }
                    >
                      <td className="py-2.5 font-bold">{label}</td>
                      <td className="py-2.5">{m.f1Score}</td>
                      <td className="py-2.5">{m.falseAlarmRate}</td>
                      <td className="py-2.5">{m.detectionLatencyMs}</td>
                      <td className="py-2.5">{m.roleAdaptationTimeSec}</td>
                      <td className="py-2.5">{m.victimDetectionRate}%</td>
                      <td className="py-2.5">{m.areaCoveragePct}%</td>
                      <td className="py-2.5">{m.taskRecoveryRate}%</td>
                      <td className="py-2.5">{m.energyConsumptionJoules}</td>
                      <td className="py-2.5">{m.commOverheadMsgs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
