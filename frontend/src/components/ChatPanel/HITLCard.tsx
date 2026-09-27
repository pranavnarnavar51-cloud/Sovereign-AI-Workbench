import React, { useState } from 'react';
import { HITLProposal } from '../../types/workbench';
import { ShieldAlert, CheckCircle2, XCircle, FileSignature, Clock, Wrench, AlertTriangle } from 'lucide-react';

interface HITLCardProps {
  proposal: HITLProposal;
  onApprove: (proposal: HITLProposal) => void;
  onReject: (proposal: HITLProposal) => void;
}

export const HITLCard: React.FC<HITLCardProps> = ({ proposal, onApprove, onReject }) => {
  const isPending = proposal.status === 'PENDING_HITL_APPROVAL';
  const isApproved = proposal.status === 'AUTHORIZED_AND_EXECUTING';
  const isRejected = proposal.status === 'ABORTED_BY_DIRECTOR';

  return (
    <div className="mt-3 p-3.5 rounded-lg border border-amber-500/40 bg-[#182229]/90 backdrop-blur-sm text-sm shadow-lg">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-300 text-xs tracking-wider uppercase">
            Human-in-the-Loop (HITL) Gatekeeper Action Required
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {proposal.work_order_id}
        </span>
      </div>

      <div className="space-y-2 mb-3 text-xs text-[#cfd9df]">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="font-medium text-white">{proposal.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-[#8696a0]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Est. Downtime: <strong className="text-white">{proposal.estimated_downtime_hours} hrs</strong></span>
          </div>
          <div className="flex items-center gap-1 text-[#8696a0]">
            <Wrench className="w-3 h-3 text-emerald-400" />
            <span>Required: <strong className="text-white">{proposal.required_craft}</strong></span>
          </div>
        </div>

        {proposal.spare_parts_allocated && proposal.spare_parts_allocated.length > 0 && (
          <div className="bg-[#111b21] p-2 rounded border border-neutral-800 text-[11px]">
            <span className="text-[#8696a0] block mb-1">Allocated Critical Spares (SAP PM):</span>
            <ul className="list-disc list-inside text-emerald-300/90 font-mono space-y-0.5">
              {proposal.spare_parts_allocated.map((p, idx) => (
                <li key={idx}>{p.part_no}: {p.description} (Qty: {p.quantity})</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onApprove(proposal)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow"
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Sign & Authorize Transfer</span>
          </button>
          <button
            onClick={() => onReject(proposal)}
            className="flex items-center justify-center gap-1 py-1.5 px-3 rounded bg-[#2a3942] hover:bg-red-900/60 text-red-300 font-medium text-xs transition-colors border border-red-500/30"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>
      ) : isApproved ? (
        <div className="flex items-center gap-2 py-1 px-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-mono">Authorized & Sealed by Plant Director (Order Dispatched)</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 px-2.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="font-mono">Rejected by Executive Authority (Holding Current State)</span>
        </div>
      )}
    </div>
  );
};
