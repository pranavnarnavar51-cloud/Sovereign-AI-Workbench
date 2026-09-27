import React from 'react';
import { GitCommit, ShieldCheck, CheckCircle2, AlertTriangle, ArrowDown, Cpu, Wrench, Layers } from 'lucide-react';

interface TraceVisualizerProps {
  trace?: Array<{ step: string; [key: string]: any }>;
  onClose: () => void;
}

export const TraceVisualizer: React.FC<TraceVisualizerProps> = ({ trace, onClose }) => {
  const defaultTrace = [
    {
      step: 'SECURITY_GATEWAY_INTERCEPTION',
      status: 'PASS',
      detail: 'OWASP LLM01 Prompt Injection checked (Score: 0.05). PII Scrubber scrubbed 0 secrets.'
    },
    {
      step: 'OPERATIONS_PLANNER_DISPATCH',
      status: 'SUCCESS',
      detail: 'Intent classified as Rotating Machinery Vibration Anomaly. Assigned to [maintenance_agent].'
    },
    {
      step: 'MCP_TOOL_EXECUTION: sql_telemetry_runner',
      status: 'SUCCESS',
      detail: 'Queried TimescaleDB for BFP-P-104. 12 data points retrieved. Zone D trip threshold confirmed.'
    },
    {
      step: 'MCP_TOOL_EXECUTION: anomaly_detection_invoke',
      status: 'SUCCESS',
      detail: 'Z-Score anomaly detected on VIB-P104-DE-RMS at 8.6 mm/s (> 2.5 sigma).'
    },
    {
      step: 'VERIFICATION_ENGINE_GROUNDING',
      status: 'VERIFIED',
      detail: 'Factuality score: 98.5%. Cross-referenced ISO 10816-3 limits. Zero hallucinations detected.'
    },
    {
      step: 'HITL_GATEKEEPER_INTERCEPT',
      status: 'ACTIVE_GATE',
      detail: 'Critical plant operation detected. Executive signoff required before equipment throttling.'
    }
  ];

  const activeTrace = trace && trace.length > 0 ? trace : defaultTrace;

  return (
    <div className="w-96 lg:w-[420px] h-full bg-[#111b21] border-l border-[#2a3942] flex flex-col shrink-0 z-10 text-[#e9edef]">
      {/* Header */}
      <div className="h-16 px-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm tracking-wide">LangGraph Agent Execution Trace</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#8696a0] hover:text-white text-xs px-2 py-1 rounded hover:bg-[#111b21]"
        >
          Close
        </button>
      </div>

      {/* Trace Timeline Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between p-2.5 rounded bg-[#182229] border border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-[#8696a0]">EXECUTION RUNTIME:</span>
          </div>
          <span className="text-cyan-300 font-bold">Local Ollama Enclave</span>
        </div>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a3942]">
          {activeTrace.map((t, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#202c33] border-2 border-cyan-400 ring-2 ring-[#111b21] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>

              {/* Step Card */}
              <div className="bg-[#182229] p-3 rounded-lg border border-[#2a3942] shadow-sm hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-cyan-300 text-[11px]">
                    {t.step || `STEP_${idx + 1}`}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111b21] text-emerald-400 border border-emerald-500/30">
                    {t.status || 'OK'}
                  </span>
                </div>
                <p className="text-[#8696a0] text-[11px] leading-relaxed">
                  {t.detail || JSON.stringify(t)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
