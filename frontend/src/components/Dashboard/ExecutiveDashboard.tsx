import React, { useState, useEffect } from 'react';
import { HealthStatus, UserProfile, LearnedFact, CompanyDocument } from '../../types/workbench';
import {
  fetchLearnedFacts,
  addLearnedFact,
  fetchCompanyDocuments,
  fetchLiveTelemetry,
  fetchSIEMLogs
} from '../../api/litellm_client';
import {
  Brain,
  Cpu,
  ShieldCheck,
  BookOpen,
  Radio,
  Sparkles,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Layers,
  ChevronRight,
  Database,
  Lock,
  PlusCircle,
  FileText,
  UserCheck,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface ExecutiveDashboardProps {
  currentUser: UserProfile;
  health: HealthStatus | null;
  learnedCount: number;
  activeModel: string;
  onChangeModel: (model: string) => void;
  availableModels: string[];
  onNavigateToChat: (prompt?: string) => void;
  onOpenSecurityModal: () => void;
  onOpenMemoryPanel: () => void;
  onAddToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning') => void;
  onRefreshMemoryCount: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  currentUser,
  health,
  learnedCount,
  activeModel,
  onChangeModel,
  availableModels,
  onNavigateToChat,
  onOpenSecurityModal,
  onOpenMemoryPanel,
  onAddToast,
  onRefreshMemoryCount
}) => {
  const [learnedFacts, setLearnedFacts] = useState<LearnedFact[]>([]);
  const [companyDocs, setCompanyDocs] = useState<CompanyDocument[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [siemLogs, setSiemLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Teach AI input state
  const [newFactText, setNewFactText] = useState('');
  const [isTeaching, setIsTeaching] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [facts, docs, telem, siem] = await Promise.all([
        fetchLearnedFacts().catch(() => []),
        fetchCompanyDocuments().catch(() => []),
        fetchLiveTelemetry().catch(() => null),
        fetchSIEMLogs().catch(() => ({ logs: [] }))
      ]);
      setLearnedFacts(facts);
      setCompanyDocs(docs);
      setTelemetry(telem);
      if (siem && siem.logs) setSiemLogs(siem.logs);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTeachAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    setIsTeaching(true);
    try {
      const saved = await addLearnedFact(
        newFactText.trim(),
        'operational_rule',
        currentUser.name || 'Plant Engineer'
      );
      setLearnedFacts(prev => [saved, ...prev]);
      setNewFactText('');
      onRefreshMemoryCount();
      onAddToast(
        '🧠 AI Learned New Knowledge',
        saved.fact,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      onAddToast('Failed to save memory', err.message, 'warning');
    } finally {
      setIsTeaching(false);
    }
  };

  const teachPreset = (text: string) => {
    setNewFactText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f17] text-slate-100 overflow-y-auto">
      
      {/* Top Enclave Bar */}
      <div className="p-4 md:px-8 border-b border-slate-800 bg-[#0d1424]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SOVEREIGN ENCLAVE OPERATIONAL
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">• Facility Node 07 Mumbai</span>
            {activeModel && (
              <span className="text-xs text-cyan-400 font-mono hidden sm:inline">• Model: {activeModel}</span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            Apex Heavy Dynamics AI Command Center
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToChat()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Chat Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* Row 2: Live SCADA Telemetry & Interactive "Teach AI" Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Interactive "Teach the AI" Console (7 cols) */}
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Teach the AI New Company Knowledge</h2>
                    <p className="text-xs text-slate-400">
                      Employees teach facts, shifts, or equipment settings. The local agent persists it and uses it in future answers.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 hidden sm:inline">
                  Auto-Vectorized
                </span>
              </div>

              {/* Form Input */}
              <form onSubmit={handleTeachAI} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={newFactText}
                    onChange={(e) => setNewFactText(e.target.value)}
                    placeholder="E.g. Mr. Rajesh Patel is the new Shift B supervisor (ext 4402). Or: Feedwater valve FW-12 limit is 85%."
                    className="w-full bg-slate-900/90 border border-slate-750 focus:border-emerald-500 focus:outline-none rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 resize-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isTeaching || !newFactText.trim()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isTeaching ? 'Teaching...' : 'Teach AI'}</span>
                  </button>
                </div>
              </form>

              {/* Preset Quick-Teach Suggestions */}
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1-Click Example Facts to Teach:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => teachPreset('The new supervisor for Shift B is Mr. Rajesh Patel ext 4402.')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors text-left"
                  >
                    + Shift B Supervisor: Rajesh Patel
                  </button>
                  <button
                    onClick={() => teachPreset('Turbine ST-01 lube oil brand is Shell Turbo T 46 (ISO VG 46).')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors text-left"
                  >
                    + ST-01 Oil: Shell Turbo T 46
                  </button>
                  <button
                    onClick={() => teachPreset('Boiler Feed Pump P-104 mechanical seal flush plan changed to API Plan 53A.')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors text-left"
                  >
                    + P-104 Seal Flush: API Plan 53A
                  </button>
                </div>
              </div>
            </div>

            {/* Teaching Stats Footnote */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Knowledge Base: <strong>{learnedCount} learned memories</strong></span>
              </span>
              <button
                onClick={onOpenMemoryPanel}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>View Full Knowledge Bank</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Live SCADA Telemetry & Anomaly Radar (5 cols) */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Live Plant Telemetry</h2>
                    <p className="text-xs text-slate-400">Critical SCADA node: Boiler Feed Pump P-104</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-semibold">
                  ADVISORY NOTICE
                </span>
              </div>

              {/* Gauges Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Vibration (Overall)</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    6.8 mm/s
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Trip limit: 7.1 mm/s (ISO 10816-3)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Bearing DE Temp</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                    72.4 °C
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Max allowable: 75.0 °C
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Feedwater Flow</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    142.8 m³/h
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Setpoint: 145.0 m³/h
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Motor Current</div>
                  <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">
                    185 A
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Nominal rating: 180 A
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger AI Diagnosis Button */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => onNavigateToChat("What is the critical trip vibration threshold for Boiler Feed Pump BFP-P-104, and what corrective actions are required according to our SOPs?")}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Launch AI Diagnostic on Pump P-104</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Row 3: Pre-seeded Company Knowledge Base Directory */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-base font-bold text-white">Company Standard Operating Procedures (SOPs)</h2>
                <p className="text-xs text-slate-400">
                  Apex Heavy Dynamics technical corpus pre-loaded for air-gapped RAG query & verification.
                </p>
              </div>
            </div>
            <span className="text-xs text-purple-300 font-mono bg-purple-950/60 border border-purple-800/50 px-2.5 py-1 rounded-lg">
              6 Technical Manuals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-purple-400 mb-1.5">
                    <span>{doc.id}</span>
                    <span className="text-slate-500 capitalize">{doc.doc_type || 'standard'}</span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-100 group-hover:text-purple-300 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {doc.content.slice(0, 160) + '...'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {doc.equipment_tag || doc.tags || 'TECHNICAL_SPEC'}
                  </span>
                  <button
                    onClick={() => onNavigateToChat(`According to ${doc.id} (${doc.title}), what are the key compliance rules and procedures?`)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Query Document</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Recent Learned Knowledge Stream */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Live Continuous Learned Knowledge Stream</h2>
                <p className="text-xs text-slate-400">Facts dynamically learned from employee pair-programming & chat interactions</p>
              </div>
            </div>
            <button
              onClick={onOpenMemoryPanel}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>Manage Memory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {learnedFacts.slice(0, 5).map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-slate-200 font-medium">{f.fact}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                      <span>Taught by: <strong className="text-slate-300">{f.taught_by}</strong></span>
                      <span>•</span>
                      <span>Category: <strong className="text-cyan-400">{f.category}</strong></span>
                      <span>•</span>
                      <span>{f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToChat(`What do you remember about: "${f.fact}"?`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-mono shrink-0 transition-colors"
                >
                  Verify
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
