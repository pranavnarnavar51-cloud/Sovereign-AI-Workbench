import React, { useState, useEffect } from 'react';
import {
  Activity,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Database,
  BookOpen,
  Brain,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { LearnedFact, CompanyDocument } from '../../types/workbench';
import { fetchLearnedFacts, addLearnedFact, deleteLearnedFact, fetchCompanyDocuments } from '../../api/litellm_client';

interface EvidencePanelProps {
  evidence: any;
  onClose: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, onClose }) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'docs' | 'scada' | 'attachment'>('memory');
  const [learnedFacts, setLearnedFacts] = useState<LearnedFact[]>([]);
  const [companyDocs, setCompanyDocs] = useState<CompanyDocument[]>([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New Fact Form
  const [newFactText, setNewFactText] = useState('');
  const [newFactCategory, setNewFactCategory] = useState('procedure');
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const loadMemoriesAndDocs = () => {
    fetchLearnedFacts().then(setLearnedFacts).catch(console.error);
    fetchCompanyDocuments().then(setCompanyDocs).catch(console.error);
  };

  useEffect(() => {
    loadMemoriesAndDocs();
  }, []);

  useEffect(() => {
    if (evidence?.source === 'attachment' || evidence?.filename || evidence?.base64 || evidence?.text_content) {
      setActiveTab('attachment');
    }
  }, [evidence]);

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    try {
      await addLearnedFact(newFactText.trim(), newFactCategory, 'Lead Reliability Engineer');
      setNewFactText('');
      setIsAddingFact(false);
      loadMemoriesAndDocs();
      setSaveNotification('Fact learned and committed to persistent SQLite store!');
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleDeleteFact = async (factId: string) => {
    try {
      await deleteLearnedFact(factId);
      setLearnedFacts(prev => prev.filter(f => f.id !== factId));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  // Telemetry points
  const points = evidence?.telemetry_points || [
    { timestamp: '06:00', vibration_rms_de: 3.1, bearing_temp_c: 62.0 },
    { timestamp: '06:10', vibration_rms_de: 3.4, bearing_temp_c: 65.0 },
    { timestamp: '06:20', vibration_rms_de: 4.5, bearing_temp_c: 71.0 },
    { timestamp: '06:30', vibration_rms_de: 5.9, bearing_temp_c: 78.0 },
    { timestamp: '06:40', vibration_rms_de: 7.3, bearing_temp_c: 84.5 },
    { timestamp: '06:45', vibration_rms_de: 8.6, bearing_temp_c: 91.2 }
  ];

  const filteredFacts = learnedFacts.filter(f => {
    const matchesQuery = f.fact.toLowerCase().includes(memorySearch.toLowerCase()) ||
                         f.taught_by.toLowerCase().includes(memorySearch.toLowerCase()) ||
                         f.key.toLowerCase().includes(memorySearch.toLowerCase());
    if (!matchesQuery) return false;
    if (selectedCategory === 'all') return true;
    return f.category === selectedCategory;
  });

  return (
    <div className="w-96 lg:w-[450px] h-full bg-[#0f172a] border-l border-slate-800 flex flex-col shrink-0 z-20 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="h-16 px-4 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-sm tracking-wide text-slate-100">Knowledge & Memory Enclave</h3>
            <span className="text-[10px] text-emerald-400 font-mono">100% AIR-GAP PERSISTENCE</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0f172a] px-2 pt-2 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'memory'
              ? 'bg-[#1e293b] text-emerald-400 border-t-2 border-emerald-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Learned Memory ({learnedFacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'docs'
              ? 'bg-[#1e293b] text-cyan-400 border-t-2 border-cyan-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Company SOPs ({companyDocs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('scada')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'scada'
              ? 'bg-[#1e293b] text-amber-400 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>SCADA Live</span>
        </button>
        {(evidence?.filename || evidence?.source === 'attachment') && (
          <button
            onClick={() => setActiveTab('attachment')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'attachment'
                ? 'bg-[#1e293b] text-purple-400 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[100px]">Artifact</span>
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {saveNotification && (
        <div className="mx-3 mt-2 p-2 rounded-md bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Tab 1: Continuous Learned Memory Store */}
        {activeTab === 'memory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Learned from Employee Interactions:</span>
              <button
                onClick={() => setIsAddingFact(!isAddingFact)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Teach AI Fact</span>
              </button>
            </div>

            {/* Inline Add Fact Form */}
            {isAddingFact && (
              <form onSubmit={handleAddFact} className="p-3 rounded-lg bg-slate-800/90 border border-emerald-500/40 space-y-2">
                <div className="font-semibold text-emerald-300 text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teach AI New Operational Knowledge</span>
                </div>
                <textarea
                  value={newFactText}
                  onChange={(e) => setNewFactText(e.target.value)}
                  placeholder="e.g., Turbine 4 pressure threshold is now 320 PSI instead of 300."
                  className="w-full h-20 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newFactCategory}
                    onChange={(e) => setNewFactCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="procedure">Procedure / SOP</option>
                    <option value="equipment">Equipment Spec</option>
                    <option value="personnel">Personnel / Directory</option>
                    <option value="safety">Safety / Hazard</option>
                    <option value="policy">Policy / Roster</option>
                    <option value="general">General Rule</option>
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingFact(false)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
                    >
                      Commit to Memory
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Search and Category Filter */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-md border border-slate-700/60">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search learned facts..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="bg-transparent w-full text-xs text-slate-200 focus:outline-none placeholder-slate-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="personnel">Personnel</option>
                <option value="equipment">Equipment</option>
                <option value="procedure">Procedure</option>
                <option value="safety">Safety</option>
              </select>
            </div>

            {/* List of Facts */}
            {filteredFacts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No learned memories matching query. Teach the AI using chat or click "Teach AI Fact".
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFacts.map((fact) => (
                  <div key={fact.id} className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 uppercase font-mono">
                          {fact.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {fact.taught_by}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteFact(fact.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete learned memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed font-sans select-text">
                      {fact.fact}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Key: {fact.key}</span>
                      <span>{fact.created_at ? fact.created_at.slice(0, 16).replace('T', ' ') : 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Seeded Company SOPs */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-xs">
              Pre-seeded Company Documentation (Apex Heavy Dynamics):
            </div>
            <div className="space-y-2">
              {companyDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-cyan-300 text-xs">{doc.id}</span>
                    <span className="text-[10px] uppercase font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                      {doc.doc_type}
                    </span>
                  </div>
                  <h4 className="text-slate-200 font-medium text-xs mb-1.5">{doc.title}</h4>
                  <div className="p-2 rounded bg-slate-900/80 text-[11px] font-mono text-slate-400 line-clamp-4 select-text">
                    {doc.content}
                  </div>
                  {doc.equipment_tag && (
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      Asset Tag: <span className="text-emerald-400">{doc.equipment_tag}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: SCADA Telemetry & Anomaly Analysis */}
        {activeTab === 'scada' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs">TARGET INDUSTRIAL ASSET:</span>
                <span className="text-emerald-400 font-bold">BFP-P-104 (Boiler Feed Pump)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900 p-2 rounded border border-red-500/30">
                  <span className="text-slate-400 text-[10px] block">Vibration DE</span>
                  <span className="text-red-400 text-lg font-bold">8.6 mm/s</span>
                  <span className="text-[10px] text-red-300 block">ISO Zone D (Trip)</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-amber-500/30">
                  <span className="text-slate-400 text-[10px] block">Bearing Temp</span>
                  <span className="text-amber-400 text-lg font-bold">91.2 °C</span>
                  <span className="text-[10px] text-amber-300 block">Alarm &gt; 85°C</span>
                </div>
              </div>
            </div>

            {/* Visualizer */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-[10px] block mb-2 font-mono">VIBRATION VELOCITY SPECTRUM (1-HOUR TREND):</span>
              <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-1 px-1 bg-slate-900 rounded border border-slate-800 relative">
                <div className="absolute top-8 left-0 right-0 border-t border-dashed border-red-500/80 flex items-center justify-end pr-1">
                  <span className="text-[9px] text-red-400 bg-slate-900 px-1 font-mono">Trip Limit 7.1 mm/s</span>
                </div>

                {points.map((pt: any, idx: number) => {
                  const heightPercent = Math.min(100, (pt.vibration_rms_de / 10.0) * 100);
                  const isTrip = pt.vibration_rms_de > 7.1;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-300 ${
                          isTrip ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[9px] text-slate-500 mt-1 font-mono">{pt.timestamp}</span>
                      <div className="absolute -top-7 hidden group-hover:block bg-black/90 text-white text-[10px] px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap z-20">
                        {pt.vibration_rms_de} mm/s
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <strong className="text-white block mb-1">Standard Reference: ISO 10816-3</strong>
              Evaluated for Group 1 industrial pumps on rigid foundation. Vibration has entered Zone D (Critical Trip threshold exceeded).
            </div>
          </div>
        )}

        {/* Tab 4: Attachment / Artifact Viewer */}
        {activeTab === 'attachment' && evidence && (
          <div className="space-y-3">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-cyan-300 text-xs font-mono truncate max-w-[240px]">
                  {evidence.filename || 'Uploaded Technical Artifact'}
                </span>
                {evidence.size_kb && (
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                    {evidence.size_kb} KB
                  </span>
                )}
              </div>

              {evidence.preview && (
                <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                  {evidence.preview}
                </div>
              )}

              {/* Render Image Preview if base64 or type image */}
              {evidence.base64 ? (
                <div className="mt-3 rounded-lg overflow-hidden border border-slate-700 bg-black/60 p-2 flex flex-col items-center">
                  <img
                    src={evidence.base64}
                    alt={evidence.filename}
                    className="max-h-72 w-full object-contain rounded"
                  />
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    Multimodal Vision Context (Processed by local LLaVA / Gemma)
                  </div>
                </div>
              ) : evidence.text_content ? (
                <div className="mt-3">
                  <div className="text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-wider">
                    Extracted Document Content ({evidence.text_content.length} chars):
                  </div>
                  <pre className="p-2.5 rounded bg-slate-900 border border-slate-750 font-mono text-[11px] text-slate-300 max-h-80 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
                    {evidence.text_content}
                  </pre>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded text-slate-400 text-xs text-center">
                  Artifact ingested and indexed in sovereign local session context.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
