import React, { useState } from 'react';
import { Message, HITLProposal } from '../../types/workbench';
import { HITLCard } from './HITLCard';
import {
  CheckCheck,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  Cpu,
  User
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onApproveHITL: (proposal: HITLProposal) => void;
  onRejectHITL: (proposal: HITLProposal) => void;
  onSelectEvidence?: (evidence: any) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onApproveHITL,
  onRejectHITL,
  onSelectEvidence
}) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isExecutive = message.role === 'executive';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-[#1e293b]/80 border border-slate-700/60 text-slate-400 text-xs px-3.5 py-1.5 rounded-full max-w-lg text-center flex items-center gap-2 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  // Inline formatting helper (handles bold, code chips, citations)
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 font-mono text-cyan-300 text-[12px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Format content: convert markdown code blocks, tables, bold, headers, blockquotes
  const renderFormattedContent = (content: string) => {
    // 1. Separate code blocks from normal text
    const segments: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    const parseTextChunk = (chunk: string, baseKey: string) => {
      const lines = chunk.split('\n');
      const elements: React.ReactNode[] = [];
      let inTable = false;
      let tableRows: string[][] = [];

      const flushTable = (k: number) => {
        if (tableRows.length > 0) {
          const header = tableRows[0];
          const dataRows = tableRows.slice(1).filter(r => !r.every(c => c.match(/^[ -:]+$/)));
          elements.push(
            <div key={`table-${k}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-700 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/90 text-cyan-300 font-semibold border-b border-slate-700">
                    {header.map((col, ci) => (
                      <th key={ci} className="px-3 py-2 border-r border-slate-700/60 last:border-r-0">{col.trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-800/40 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 border-r border-slate-800/60 last:border-r-0 text-slate-200">{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
          inTable = false;
        }
      };

      lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Check if table row
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          inTable = true;
          const cols = trimmed.slice(1, -1).split('|');
          tableRows.push(cols);
          return;
        } else if (inTable) {
          flushTable(idx);
        }

        // Heading 3
        if (line.startsWith('### ')) {
          elements.push(<h3 key={`${baseKey}-${idx}`} className="text-base font-bold text-slate-100 mt-2 mb-1">{line.replace('### ', '')}</h3>);
          return;
        }
        // Heading 2
        if (line.startsWith('## ')) {
          elements.push(<h2 key={`${baseKey}-${idx}`} className="text-lg font-bold text-slate-100 mt-2.5 mb-1.5">{line.replace('## ', '')}</h2>);
          return;
        }
        // Blockquote / Alert
        if (line.startsWith('> [!IMPORTANT]')) {
          elements.push(
            <div key={`${baseKey}-${idx}`} className="my-1.5 px-3 py-1.5 rounded-md bg-amber-950/40 border-l-4 border-amber-500 text-amber-200 text-xs font-medium">
              ⚠️ <strong>IMPORTANT</strong>
            </div>
          );
          return;
        }
        if (line.startsWith('> [!NOTE]')) {
          elements.push(
            <div key={`${baseKey}-${idx}`} className="my-1.5 px-3 py-1.5 rounded-md bg-sky-950/40 border-l-4 border-sky-500 text-sky-200 text-xs">
              ℹ️ <strong>NOTE</strong>
            </div>
          );
          return;
        }
        if (line.startsWith('> 💡')) {
          elements.push(
            <div key={`${baseKey}-${idx}`} className="my-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 shadow-sm">
              <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{renderInline(line.replace('> 💡', '').trim())}</div>
            </div>
          );
          return;
        }
        if (line.startsWith('> ')) {
          elements.push(
            <blockquote key={`${baseKey}-${idx}`} className="border-l-2 border-slate-500 pl-3 my-1 text-slate-300 italic text-xs">
              {renderInline(line.replace('> ', ''))}
            </blockquote>
          );
          return;
        }
        // Bullet items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          elements.push(
            <li key={`${baseKey}-${idx}`} className="ml-4 list-disc text-slate-200 text-sm leading-relaxed my-0.5">
              {renderInline(line.substring(2))}
            </li>
          );
          return;
        }
        // Regular line
        if (trimmed) {
          elements.push(
            <p key={`${baseKey}-${idx}`} className="my-0.5 text-sm leading-relaxed text-slate-200">
              {renderInline(line)}
            </p>
          );
        } else {
          elements.push(<div key={`${baseKey}-${idx}`} className="h-1.5" />);
        }
      });

      if (inTable) {
        flushTable(lines.length);
      }

      return elements;
    };

    let blockIdx = 0;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        segments.push(...parseTextChunk(textBefore, `pre-${blockIdx}`));
      }

      const lang = match[1];
      const code = match[2];
      segments.push(
        <div key={`code-${blockIdx}`} className="my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-[#0a0e17] shadow-lg">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-[11px] font-mono text-slate-300">
            <span className="uppercase tracking-wider font-semibold text-cyan-400">{lang || 'CODE'}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="Copy code"
            >
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </button>
          </div>
          <pre className="p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed select-text">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
      blockIdx++;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      segments.push(...parseTextChunk(remainingText, `post-${blockIdx}`));
    }

    return segments;
  };

  return (
    <div className={`flex w-full my-2.5 px-2 md:px-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[92%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
              <Cpu className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Container */}
        <div
          className={`flex-1 rounded-2xl px-4 py-3 shadow-md border ${
            isUser
              ? 'bg-[#1e293b] border-slate-700/80 text-slate-100 rounded-tr-none'
              : isExecutive
              ? 'bg-[#0f172a] border-amber-500/40 text-slate-100 rounded-tl-none'
              : 'bg-[#1e293b] border-slate-700 text-slate-100 rounded-tl-none'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className={isUser ? 'text-emerald-400' : isExecutive ? 'text-amber-400' : 'text-cyan-400'}>
                {message.sender}
              </span>
              {!isUser && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {isExecutive ? 'DIRECTORATE' : 'OLLAMA'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>{message.timestamp}</span>
              {!isUser && (
                <button
                  onClick={handleCopy}
                  className="p-1 hover:text-slate-200 transition-colors rounded hover:bg-slate-750"
                  title="Copy message"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Multimodal Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2.5 space-y-1.5">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  onClick={() => onSelectEvidence && onSelectEvidence({ ...att, source: 'attachment' })}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-black/40 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors text-xs"
                >
                  {att.base64 ? (
                    <img src={att.base64} alt={att.filename} className="w-8 h-8 rounded object-cover border border-slate-700 shrink-0" />
                  ) : att.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : att.type === 'scada' ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : att.type === 'cad' ? (
                    <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-mono text-cyan-200 font-medium">{att.filename}</span>
                    {att.size_kb && (
                      <span className="text-[10px] text-slate-400">{att.size_kb} KB</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{att.type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Agent Reasoning */}
          {message.reasoning && (
            <div className="mb-2.5">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/90 hover:text-cyan-300 bg-cyan-950/20 px-2.5 py-1 rounded-md border border-cyan-900/40 transition-colors w-full text-left"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="flex-1">Grounded Reasoning & Verification</span>
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showReasoning && (
                <div className="mt-1.5 p-2.5 rounded-lg bg-slate-900/90 border border-cyan-900/40 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {message.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Citations Pill if Available */}
          {message.citations && message.citations.length > 0 && (
            <div className="mb-2.5">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/20 px-2.5 py-1 rounded-md border border-emerald-900/40 transition-colors w-full text-left"
              >
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span className="flex-1">Grounding Sources ({message.citations.length} cited documents/memories)</span>
                {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showCitations && (
                <div className="mt-1.5 p-2 rounded-lg bg-slate-900/90 border border-emerald-900/40 space-y-1.5">
                  {message.citations.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectEvidence && onSelectEvidence(c)}
                      className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-400 font-mono text-[10px]">[{idx + 1}]</span>
                        <span className="text-slate-200 truncate font-medium">{c.title || c.source}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-700/50 uppercase shrink-0">
                        {c.type === 'learned_fact' ? 'Learned' : 'SOP'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Message Body */}
          <div className="select-text space-y-1">
            {renderFormattedContent(message.content)}
          </div>

          {/* Interactive In-Chat HITL Card */}
          {message.hitl_proposal && (
            <div className="mt-3">
              <HITLCard
                proposal={message.hitl_proposal}
                onApprove={onApproveHITL}
                onReject={onRejectHITL}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
