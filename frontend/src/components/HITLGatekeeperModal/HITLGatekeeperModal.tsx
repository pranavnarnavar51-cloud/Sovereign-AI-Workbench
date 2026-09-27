import React, { useState } from 'react';
import { HITLProposal } from '../../types/workbench';
import { ShieldAlert, CheckCircle2, Lock, X, Key, AlertTriangle } from 'lucide-react';

interface HITLModalProps {
  proposal: HITLProposal;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'APPROVE' | 'REJECT', signedBy: string, clearanceCode: string, comments: string) => void;
}

export const HITLGatekeeperModal: React.FC<HITLModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [signedBy, setSignedBy] = useState('Director M. Sharma');
  const [clearanceCode, setClearanceCode] = useState('SIG-SOV-LEVEL5-9941');
  const [comments, setComments] = useState('Approved after reviewing TimescaleDB FFT harmonics and ISO 10816 Zone D breach.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (action: 'APPROVE' | 'REJECT') => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm(action, signedBy, clearanceCode, comments);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#182229] border border-amber-500/50 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Modal Header */}
        <div className="bg-[#202c33] px-5 py-4 border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide">Executive HITL Gatekeeper Authorization</h3>
              <p className="text-[11px] font-mono text-[#8696a0]">Sovereign Air-Gap Cryptographic Signoff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8696a0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs font-mono">
          <div className="bg-[#111b21] p-3 rounded-lg border border-amber-500/30 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#8696a0]">WORK ORDER ID:</span>
              <span className="text-amber-400 font-bold">{proposal.work_order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8696a0]">EQUIPMENT TAG:</span>
              <span className="text-white font-bold">{proposal.equipment_tag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8696a0]">PRIORITY:</span>
              <span className="text-red-400 font-bold">{proposal.priority}</span>
            </div>
            <p className="text-[#cfd9df] pt-2 border-t border-neutral-800 leading-relaxed font-sans text-xs">
              {proposal.description}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[#8696a0] mb-1">Authorizing Executive Identity:</label>
              <input
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className="w-full bg-[#111b21] border border-[#2a3942] rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[#8696a0] mb-1">Clearance Key / Digital Seal:</label>
              <div className="flex items-center gap-2 bg-[#111b21] border border-[#2a3942] rounded px-3 py-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={clearanceCode}
                  onChange={(e) => setClearanceCode(e.target.value)}
                  className="w-full bg-transparent text-amber-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#8696a0] mb-1">Executive Justification / Directives:</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                className="w-full bg-[#111b21] border border-[#2a3942] rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-[#202c33] px-5 py-3.5 border-t border-[#2a3942] flex items-center justify-end gap-3">
          <button
            onClick={() => handleSubmit('REJECT')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-[#111b21] hover:bg-red-950/60 text-red-300 border border-red-500/30 text-xs font-medium transition-colors"
          >
            Reject & Abort
          </button>
          <button
            onClick={() => handleSubmit('APPROVE')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cryptographically Authorize & Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
