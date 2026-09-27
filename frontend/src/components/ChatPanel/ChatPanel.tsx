import React, { useState, useRef, useEffect } from 'react';
import { Message, HITLProposal } from '../../types/workbench';
import { MessageBubble } from './MessageBubble';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Lock,
  Radio,
  FileImage,
  FileCode,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
  Cpu,
  Brain,
  ShieldCheck,
  PanelRight,
  Sparkles,
  Layers,
  ChevronDown,
  AlertCircle,
  Square,
  RotateCcw,
  Eraser,
  ArrowDown,
  FileUp,
  LayoutDashboard
} from 'lucide-react';

interface ChatPanelProps {
  channelTitle: string;
  messages: Message[];
  activeModel: string;
  onChangeModel: (model: string) => void;
  availableModels: string[];
  activeAgentMode: string;
  onChangeAgentMode: (mode: string) => void;
  onSendMessage: (content: string, attachments?: any[]) => void;
  onApproveHITL: (proposal: HITLProposal) => void;
  onRejectHITL: (proposal: HITLProposal) => void;
  isSidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  onSelectEvidence: (evidence: any) => void;
  onOpenSecurityModal: () => void;
  onClearChat?: () => void;
  onStopGenerating?: () => void;
  onNavigateToDashboard?: () => void;
  learnedCount: number;
  isGenerating: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  channelTitle,
  messages,
  activeModel,
  onChangeModel,
  availableModels,
  activeAgentMode,
  onChangeAgentMode,
  onSendMessage,
  onApproveHITL,
  onRejectHITL,
  isSidePanelOpen,
  onToggleSidePanel,
  onSelectEvidence,
  onOpenSecurityModal,
  onClearChat,
  onStopGenerating,
  onNavigateToDashboard,
  learnedCount,
  isGenerating
}) => {
  const [inputText, setInputText] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<any[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() && stagedAttachments.length === 0) return;
    onSendMessage(inputText, stagedAttachments);
    setInputText('');
    setStagedAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Universal File Processor for both file picker and drag-and-drop
  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
      const isPdfOrDocx = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx');

      if (isImg) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const base64 = loadEvent.target?.result as string;
          setStagedAttachments(prev => [
            ...prev,
            {
              type: 'image',
              filename: file.name,
              base64,
              preview: `Image: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
              size_kb: Math.max(1, Math.round(file.size / 1024))
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isPdfOrDocx) {
        // PDF & Word files are extracted via backend parser to prevent binary encoding corruption
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api/documents/parse-file', {
          method: 'POST',
          body: formData
        })
          .then(res => {
            if (!res.ok) throw new Error('Document parse failed');
            return res.json();
          })
          .then(data => {
            setStagedAttachments(prev => [
              ...prev,
              {
                type: 'document',
                filename: file.name,
                text_content: data.text_content,
                page_count: data.page_count,
                preview: data.preview || `Document: ${file.name} (${data.page_count} pages)`,
                size_kb: Math.max(1, Math.round(file.size / 1024))
              }
            ]);
          })
          .catch(err => {
            console.warn('PDF endpoint parse error, using base64 fallback:', err);
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              setStagedAttachments(prev => [
                ...prev,
                {
                  type: 'document',
                  filename: file.name,
                  base64: loadEvent.target?.result as string,
                  preview: `Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                  size_kb: Math.max(1, Math.round(file.size / 1024))
                }
              ]);
            };
            reader.readAsDataURL(file);
          });
      } else {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const rawText = (loadEvent.target?.result as string) || '';
          const truncatedText = rawText.length > 30000 ? rawText.slice(0, 30000) + '\n... [truncated]' : rawText;
          const isCsv = file.name.endsWith('.csv');
          const isCad = file.name.endsWith('.dxf');
          const isDoc = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.log');
          setStagedAttachments(prev => [
            ...prev,
            {
              type: isCsv ? 'scada' : isCad ? 'cad' : isDoc ? 'document' : 'code',
              filename: file.name,
              text_content: truncatedText,
              preview: `Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
              size_kb: Math.max(1, Math.round(file.size / 1024))
            }
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const addSimulatedAttachment = (type: 'image' | 'cad' | 'scada') => {
    let newAtt: any = {};
    if (type === 'image') {
      newAtt = {
        type: 'image',
        filename: 'WELD_XR_P104_DISCH_01.png',
        preview: 'Radiographic X-Ray: Specimen Weld W-42 (ISO 5817 Level D)',
        size_kb: 482
      };
    } else if (type === 'cad') {
      newAtt = {
        type: 'cad',
        filename: 'DWG-BFP-104-REV-C.dxf',
        preview: 'CAD Schematic: Bearing Housing & Tolerance k5 fit',
        size_kb: 1240
      };
    } else {
      newAtt = {
        type: 'scada',
        filename: 'scada_samples_p104_vibration.csv',
        preview: 'TimescaleDB Export: 12-point FFT Vibration & Bearing Temp',
        size_kb: 86
      };
    }
    setStagedAttachments(prev => [...prev, newAtt]);
    setShowAttachMenu(false);
  };

  // Real Microphone Voice Dictation
  const handleToggleVoiceRecording = async () => {
    // If already recording, stop it
    if (isRecordingVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingVoice(false);
      setVoiceStatus('🎙️ Voice recorded and added to prompt!');
      setTimeout(() => setVoiceStatus(null), 3000);
      return;
    }

    // Try Web Speech Recognition first (Chrome/Edge/Safari live dictation)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        const initialDraft = inputText ? (inputText.trim() + ' ') : '';

        recognition.onstart = () => {
          setIsRecordingVoice(true);
          setVoiceStatus('🎙️ Listening... Speak into your microphone (Click Mic to stop)');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const spoken = (final + interim).trim();
          setInputText(initialDraft + spoken);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceStatus('⚠️ Microphone permission blocked. Allow mic access in browser.');
          } else if (event.error === 'no-speech') {
            setVoiceStatus('No speech detected. Speak closer to the microphone.');
          } else {
            setVoiceStatus(`Mic: ${event.error}`);
          }
          setIsRecordingVoice(false);
          setTimeout(() => setVoiceStatus(null), 4000);
        };

        recognition.onend = () => {
          setIsRecordingVoice(false);
          setVoiceStatus(null);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed, falling back to MediaRecorder:', err);
      }
    }

    // Fallback: MediaRecorder audio capture with backend Whisper endpoint
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecordingVoice(true);
        setVoiceStatus('🎙️ Recording voice note (Sovereign Whisper)... Speak now');

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          setIsRecordingVoice(false);
          setVoiceStatus('Transcribing audio memo locally...');
          stream.getTracks().forEach(t => t.stop());

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'plant_voice_memo.wav');

          try {
            const res = await fetch('/api/audio/transcribe', {
              method: 'POST',
              body: formData
            });
            if (res.ok) {
              const data = await res.json();
              if (data.transcription) {
                setInputText(prev => prev ? `${prev.trim()} ${data.transcription}` : data.transcription);
                setVoiceStatus('Voice note transcribed!');
              }
            } else {
              setVoiceStatus('Audio transcription error');
            }
          } catch (e) {
            console.error('Audio transcribe error:', e);
            setVoiceStatus('Transcription network error');
          }
          setTimeout(() => setVoiceStatus(null), 3000);
        };

        recorder.start();
      } catch (err) {
        console.error('Mic access error:', err);
        setVoiceStatus('⚠️ Microphone permission denied or device not found.');
        setTimeout(() => setVoiceStatus(null), 4000);
        setIsRecordingVoice(false);
      }
    } else {
      setVoiceStatus('⚠️ Microphone not supported in this browser.');
      setTimeout(() => setVoiceStatus(null), 4000);
    }
  };

  const quickPrompts = [
    {
      title: "Boiler Pump Diagnostic",
      desc: "Check Boiler Feed Pump P-104 vibration limits and ISO 10816-3 trip status.",
      prompt: "What is the critical trip vibration threshold for Boiler Feed Pump BFP-P-104, and what actions are required?"
    },
    {
      title: "LOTO Safety Protocol",
      desc: "Review mandatory 6-step Lockout/Tagout isolation procedure under OSHA 1910.",
      prompt: "Explain the mandatory 6-step Lockout/Tagout (LOTO) procedure before maintenance."
    },
    {
      title: "Teach Continuous Memory",
      desc: "Teach the AI a new company rule, shift supervisor, or equipment setting.",
      prompt: "Please remember that the new supervisor for Shift B is Mr. Rajesh Patel ext 4402."
    },
    {
      title: "Steam Turbine Startup",
      desc: "Inspect ST-01 thermal ramp constraints and barring gear speed.",
      prompt: "What is the cold startup sequence and maximum warming rate for Steam Turbine ST-01?"
    }
  ];

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer?.files) {
          processFiles(e.dataTransfer.files);
        }
      }}
      className="flex-1 flex flex-col h-full bg-[#0b0f17] relative overflow-hidden text-slate-100"
    >
      {/* Full-Window Drag & Drop Blur Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#090d16]/90 backdrop-blur-md border-2 border-dashed border-emerald-400 z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-xl shadow-emerald-950/60 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-base font-bold text-white tracking-wide">Drop Technical Artifact to Ingest</div>
          <div className="text-xs text-slate-300 mt-1 font-mono">PDFs, Word .docx, CAD .dxf, SCADA .csv, images, or logs</div>
        </div>
      )}

      {/* ChatGPT-Style Top Navigation Bar */}
      <div className="h-14 px-4 bg-[#111827]/80 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0 z-10 shadow-sm">
        
        {/* Left: Model Selector & Agent Persona */}
        <div className="flex items-center gap-3">
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ollama Local Online" />
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-200">
                    {m} (Ollama Local)
                  </option>
                ))
              ) : (
                <option value="gemma3:4b" className="bg-slate-900 text-slate-200">
                  gemma3:4b (Ollama Local)
                </option>
              )}
            </select>
          </div>

          {/* Specialist Agent Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={activeAgentMode}
              onChange={(e) => onChangeAgentMode(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="general" className="bg-slate-900">🌐 All-Round Assistant</option>
              <option value="maintenance" className="bg-slate-900">🛠️ Maintenance Specialist</option>
              <option value="safety" className="bg-slate-900">🦺 Safety & LOTO Officer</option>
              <option value="quality" className="bg-slate-900">🔍 Quality & NDT Inspector</option>
              <option value="engineering" className="bg-slate-900">⚙️ Engineering & CAD Specialist</option>
            </select>
          </div>
        </div>

        {/* Right: Air-Gap Badge, Clear Chat & Panel Toggles */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>AIR-GAPPED NODE</span>
          </div>

          {/* Facility Dashboard Button */}
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-medium transition-colors shadow-sm"
              title="Switch to Facility Executive Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Facility Dashboard</span>
            </button>
          )}

          {/* Clear Active Chat Button */}
          {onClearChat && messages.length > 1 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 transition-colors border border-slate-700"
              title="Clear conversation messages"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Security & SIEM Modal Trigger */}
          <button
            onClick={onOpenSecurityModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors border border-slate-700"
            title="Zero-Trust Security & SIEM Attestation"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Evidence / Brain Memory Panel Toggle */}
          <button
            onClick={onToggleSidePanel}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isSidePanelOpen
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Knowledge & Evidence Enclave"
          >
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Brain & Evidence</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              {learnedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-6 space-y-4">
        {messages.length === 0 || (messages.length === 1 && messages[0].role === 'system') ? (
          /* ChatGPT-Style Empty State */
          <div className="max-w-2xl mx-auto my-auto pt-10 pb-6 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-900/30">
              <Brain className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">
              Apex Heavy Dynamics Sovereign AI
            </h1>
            <p className="text-sm text-slate-400 mb-8 max-w-lg mx-auto">
              100% on-premise industrial AI running on local Ollama models. Air-gapped, zero cloud egress. 
              Ask questions or teach new company updates that are permanently remembered.
            </p>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {quickPrompts.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => onSendMessage(card.prompt)}
                  className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
                >
                  <h3 className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                    <span>{card.title}</span>
                    <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Messages List */
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onApproveHITL={onApproveHITL}
              onRejectHITL={onRejectHITL}
              onSelectEvidence={onSelectEvidence}
            />
          ))
        )}

        {/* Animated Thinking Bubble */}
        {isGenerating && (
          <div className="flex w-full my-2.5 px-2 md:px-6 justify-start">
            <div className="flex gap-3 max-w-[92%] md:max-w-[80%] flex-row">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0 pt-0.5">
                <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-[#1e293b] border border-slate-750 rounded-tl-none flex items-center gap-3 shadow-md">
                <span className="text-xs text-slate-300 font-medium">Sovereign Industrial AI is analyzing...</span>
                <span className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden Real File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,.pdf,.txt,.csv,.json,.dxf,.log,.md,.py,.sql,.tsv,.doc,.docx"
        onChange={handleRealFileUpload}
        className="hidden"
      />

      {/* Staged Attachments Strip */}
      {stagedAttachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-2 overflow-x-auto items-center">
          <div className="text-[11px] text-slate-400 font-medium shrink-0 mr-1 flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
            <span>Staged ({stagedAttachments.length}):</span>
          </div>
          {stagedAttachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-lg text-xs shrink-0 shadow-sm">
              {att.base64 ? (
                <img src={att.base64} alt={att.filename} className="w-6 h-6 object-cover rounded border border-slate-700" />
              ) : att.type === 'image' ? (
                <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : att.type === 'scada' ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : att.type === 'cad' ? (
                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="font-mono text-cyan-300 truncate max-w-[130px] font-medium">{att.filename}</span>
                <span className="text-[10px] text-slate-400">{att.size_kb} KB</span>
              </div>
              <button
                onClick={() => setStagedAttachments(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ChatGPT-Style Floating Pill Input Box */}
      <div className="p-3 md:p-5 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17] to-transparent">
        <div className="max-w-3xl mx-auto relative">
          
          {/* Active Voice Dictation Banner */}
          {voiceStatus && (
            <div className="flex items-center justify-between px-3.5 py-2 mb-2 bg-gradient-to-r from-red-950/80 via-slate-900/90 to-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-medium">{voiceStatus}</span>
              </div>
              {isRecordingVoice && (
                <button
                  onClick={handleToggleVoiceRecording}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Dictation</span>
                </button>
              )}
            </div>
          )}

          {/* Attachment Menu Popup */}
          {showAttachMenu && (
            <div className="absolute bottom-16 left-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2.5 z-30 w-72 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                Attach Local Technical Files
              </div>
              
              {/* Real File Upload from Device Button */}
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all hover:scale-[1.01]"
              >
                <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div>Upload from Device (All Files)</div>
                  <div className="text-[10px] text-emerald-400/80 font-normal">Images, PDFs, CSV, Logs, DXF, Code</div>
                </div>
              </button>

              <div className="border-t border-slate-800 my-1 pt-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5">
                  Or Quick Industrial Presets
                </div>
                <button
                  onClick={() => addSimulatedAttachment('image')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Radiographic Weld Film (Preset)</span>
                </button>
                <button
                  onClick={() => addSimulatedAttachment('cad')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>CAD Mechanical Drawing (Preset DXF)</span>
                </button>
                <button
                  onClick={() => addSimulatedAttachment('scada')}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SCADA Sensor Telemetry (Preset CSV)</span>
                </button>
              </div>
            </div>
          )}

          {/* Rounded Input Container */}
          <div className="flex items-end gap-2 bg-[#1e293b] border border-slate-750 focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/40 rounded-2xl p-2.5 shadow-xl transition-all">
            
            {/* Attachment Button */}
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                showAttachMenu ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Attach File from Device (Image, Document, CSV, Log)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Input Button */}
            <button
              onClick={handleToggleVoiceRecording}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                isRecordingVoice
                  ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-900/50 ring-2 ring-red-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isRecordingVoice ? "Stop Voice Recording" : "Voice Dictation / Speech-to-Text"}
            >
              {isRecordingVoice ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isRecordingVoice ? "Listening... Speak into your microphone..." : "Ask any plant query, diagnose equipment, or teach new company knowledge..."}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none py-1.5 px-1 max-h-44 leading-relaxed"
            />

            {/* Send or Stop Generating Button */}
            {isGenerating ? (
              <button
                onClick={onStopGenerating}
                className="p-2 rounded-xl transition-all shrink-0 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950 flex items-center gap-1.5 px-2.5"
                title="Stop AI Generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-semibold hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && stagedAttachments.length === 0}
                className={`p-2 rounded-xl transition-all shrink-0 ${
                  inputText.trim() || stagedAttachments.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send Message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subtext Disclaimer & Shortcuts */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Sovereign AI • Local Ollama ({activeModel}) • 100% Confidential Memory</span>
            <span className="hidden sm:inline font-mono text-[9px] text-slate-400">Shift + Enter for new line • Drag & drop files anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};
