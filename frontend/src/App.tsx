import React, { useState, useEffect } from 'react';
import { ChatSession, Message, HealthStatus, HITLProposal, LearnedFact, UserProfile } from './types/workbench';
import {
  fetchHealth,
  fetchSessions,
  createSession,
  deleteSession,
  updateSessionTitle,
  clearSessionMessages,
  fetchSessionMessages,
  sendChatMessage,
  submitHITLDecision,
  fetchLearnedFacts
} from './api/litellm_client';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EvidencePanel } from './components/EvidencePanel/EvidencePanel';
import { LoginPage } from './components/LoginPage/LoginPage';
import { HITLGatekeeperModal } from './components/HITLGatekeeperModal/HITLGatekeeperModal';
import { SecurityCenterModal } from './components/SecurityCenterModal/SecurityCenterModal';
import { ExecutiveDashboard } from './components/Dashboard/ExecutiveDashboard';
import {
  Plus,
  MessageSquare,
  Trash2,
  Brain,
  BookOpen,
  ShieldCheck,
  Lock,
  Search,
  Radio,
  Menu,
  ChevronLeft,
  ChevronRight,
  Cpu,
  LogOut,
  Pencil,
  Check,
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  LayoutDashboard
} from 'lucide-react';

export const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sovereign_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [learnedCount, setLearnedCount] = useState<number>(0);

  // Model & Agent Mode selections (Default to gemma3:4b)
  const [activeModel, setActiveModel] = useState<string>('gemma3:4b');
  const [availableModels, setAvailableModels] = useState<string[]>(['gemma3:4b', 'llava:latest', 'llama3.2:latest']);
  const [activeAgentMode, setActiveAgentMode] = useState<string>('general');

  // Sidebar & Panel state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState<any>(null);
  const [searchSessionQuery, setSearchSessionQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat'>('dashboard');

  // Modals state
  const [activeHITLProposal, setActiveHITLProposal] = useState<HITLProposal | null>(null);
  const [isHITLModalOpen, setIsHITLModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Load health & installed models
  const loadHealthAndMemory = () => {
    fetchHealth().then(h => {
      setHealth(h);
      if (h.ollama?.installed_models && h.ollama.installed_models.length > 0) {
        setAvailableModels(h.ollama.installed_models);
        if (h.ollama.active_text_model) {
          setActiveModel(h.ollama.active_text_model);
        }
      }
      if (h.memory?.learned_facts_count !== undefined) {
        setLearnedCount(h.memory.learned_facts_count);
      }
    }).catch(console.error);

    fetchLearnedFacts().then(facts => {
      setLearnedCount(facts.length);
    }).catch(console.error);
  };

  // Initial load
  useEffect(() => {
    loadHealthAndMemory();
    fetchSessions().then(sessList => {
      setSessions(sessList);
      if (sessList.length > 0) {
        setActiveSessionId(sessList[0].id);
      } else {
        handleNewChat();
      }
    }).catch(console.error);
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    fetchSessionMessages(activeSessionId).then(msgs => {
      setMessages(msgs);
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].evidence) {
          setActiveEvidence(msgs[i].evidence);
          break;
        }
      }
    }).catch(console.error);
  }, [activeSessionId]);

  const handleNewChat = async () => {
    try {
      const newSess = await createSession(
        `Industrial Chat #${sessions.length + 1}`,
        activeModel,
        activeAgentMode
      );
      setSessions(prev => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setMessages([
        {
          id: `msg-init-${newSess.id}`,
          sender: 'system',
          role: 'system',
          content: '🔒 Sovereign Air-Gapped Session Active • Local Ollama LLM • Zero External Telemetry Enforced',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // Toast Notification System
  interface ToastItem {
    id: string;
    title: string;
    desc?: string;
    type: 'success' | 'info' | 'warning';
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (title: string, desc?: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev.slice(-3), { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Inline Session Title Renaming
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  const handleStartRename = (e: React.MouseEvent, sess: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(sess.id);
    setEditingSessionTitle(sess.title);
  };

  const handleSaveRename = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingSessionId || !editingSessionTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    const newTitle = editingSessionTitle.trim();
    const idToUpdate = editingSessionId;
    setEditingSessionId(null);
    try {
      await updateSessionTitle(idToUpdate, newTitle);
      setSessions(prev => prev.map(s => s.id === idToUpdate ? { ...s, title: newTitle } : s));
      addToast('Conversation Renamed', newTitle, 'success');
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    try {
      await deleteSession(sessId);
      const remaining = sessions.filter(s => s.id !== sessId);
      setSessions(remaining);
      addToast('Conversation Deleted', undefined, 'info');
      if (activeSessionId === sessId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearChat = async () => {
    if (!activeSessionId) return;
    if (!window.confirm('Clear all messages in this conversation?')) return;
    try {
      await clearSessionMessages(activeSessionId);
      setMessages([
        {
          id: `msg-init-${activeSessionId}`,
          sender: 'system',
          role: 'system',
          content: '🔒 Sovereign Air-Gapped Session Active • Local Ollama LLM • Zero External Telemetry Enforced',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      addToast('Chat History Cleared', undefined, 'info');
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  };

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleStopGenerating = () => {
    setIsGenerating(false);
    addToast('Generation Stopped', undefined, 'warning');
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    const targetSessionId = activeSessionId || (sessions.length > 0 ? sessions[0].id : 'session-default-01');
    if (!activeSessionId) {
      setActiveSessionId(targetSessionId);
    }

    // 1. Optimistic User Message (Immediately appears on screen)
    const tempId = `usr-${Date.now()}`;
    const userName = currentUser?.name || 'Lead Reliability Engineer';
    const optimisticUserMsg: Message = {
      id: tempId,
      session_id: targetSessionId,
      sender: userName,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments
    };

    setMessages(prev => [...prev, optimisticUserMsg]);
    setIsGenerating(true);

    try {
      const resp = await sendChatMessage(
        targetSessionId,
        content,
        userName,
        activeModel,
        activeAgentMode,
        attachments
      );

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        const next = [...filtered, resp.user_message];
        if (resp.agent_response) {
          next.push(resp.agent_response);
          if (resp.agent_response.evidence) {
            setActiveEvidence(resp.agent_response.evidence);
          }
          if (resp.agent_response.hitl_proposal) {
            setActiveHITLProposal(resp.agent_response.hitl_proposal);
          }
        }
        return next;
      });

      // If a new fact was learned, refresh count and trigger toast
      if (resp.learned_info) {
        loadHealthAndMemory();
        addToast('💡 Continuous Knowledge Learned', resp.learned_info.fact, 'success');
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      addToast('Dispatch Error', err.message || 'Server timeout', 'warning');
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'System Alert',
          role: 'system',
          content: `⚠️ Failed to dispatch message to local AI engine: ${err.message || 'Server timeout'}. Please verify connection to port 8000.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveHITL = (proposal: HITLProposal) => {
    setActiveHITLProposal(proposal);
    setIsHITLModalOpen(true);
  };

  const handleRejectHITL = async (proposal: HITLProposal) => {
    try {
      await submitHITLDecision(
        proposal.work_order_id,
        'REJECT',
        'Director M. Sharma',
        'SIG-REJECT',
        'Action aborted by authority.'
      );
      setMessages(prev => prev.map(m => {
        if (m.hitl_proposal?.work_order_id === proposal.work_order_id) {
          return {
            ...m,
            hitl_proposal: { ...m.hitl_proposal, status: 'ABORTED_BY_DIRECTOR' }
          };
        }
        return m;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmHITLModal = async (
    action: 'APPROVE' | 'REJECT',
    signedBy: string,
    clearanceCode: string,
    comments: string
  ) => {
    if (!activeHITLProposal) return;
    try {
      await submitHITLDecision(
        activeHITLProposal.work_order_id,
        action,
        signedBy,
        clearanceCode,
        comments
      );
      setMessages(prev => prev.map(m => {
        if (m.hitl_proposal?.work_order_id === activeHITLProposal.work_order_id) {
          return {
            ...m,
            hitl_proposal: {
              ...m.hitl_proposal,
              status: action === 'APPROVE' ? 'AUTHORIZED_AND_EXECUTING' : 'ABORTED_BY_DIRECTOR'
            }
          };
        }
        return m;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // If user is not authenticated, render Enterprise LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('sovereign_user', JSON.stringify(user));
        }}
      />
    );
  }

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchSessionQuery.toLowerCase())
  );

  const currentSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen w-screen bg-[#0b0f17] overflow-hidden select-none font-sans text-slate-100">
      
      {/* ChatGPT Left Collapsible Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64 md:w-72' : 'w-0'
        } h-full bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-30`}
      >
        {/* Brand & Airgap Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide text-slate-100">Apex Sovereign AI</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% AIR-GAPPED</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher: Facility Dashboard vs AI Chat Studio */}
        <div className="p-3 pb-2 space-y-1">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Facility Dashboard</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'chat'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className={`w-4 h-4 ${currentView === 'chat' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>AI Chat Studio</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              OLLAMA
            </span>
          </button>
        </div>

        <div className="mx-3 border-t border-slate-800/80" />

        {/* "+ New Chat" Button */}
        <div className="p-3 pt-2">
          <button
            onClick={() => {
              handleNewChat();
              setCurrentView('chat');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 hover:border-slate-600 transition-all text-xs font-medium shadow-sm group"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>New Industrial Chat</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-750 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchSessionQuery}
              onChange={(e) => setSearchSessionQuery(e.target.value)}
              className="bg-transparent w-full text-xs text-slate-200 focus:outline-none placeholder-slate-500"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 pt-2 pb-1">
            Recent Operations
          </div>
          {filteredSessions.map(sess => {
            const isActive = sess.id === activeSessionId && currentView === 'chat';
            const isEditing = sess.id === editingSessionId;

            if (isEditing) {
              return (
                <div
                  key={sess.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-800 border border-emerald-500/50 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingSessionTitle}
                    onChange={(e) => setEditingSessionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                    autoFocus
                    className="bg-transparent text-xs text-slate-100 flex-1 focus:outline-none px-1"
                  />
                  <button
                    onClick={handleSaveRename}
                    className="p-1 text-emerald-400 hover:text-emerald-300 rounded"
                    title="Save title"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingSessionId(null)}
                    className="p-1 text-slate-400 hover:text-slate-200 rounded"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sess.id}
                onClick={() => {
                  setActiveSessionId(sess.id);
                  setCurrentView('chat');
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sess.title}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => handleStartRename(e, sess)}
                    className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Rename chat"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Memory & SOP Quick Access Buttons */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Learned Brain Memory</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/60 font-mono text-[10px]">
              {learnedCount}
            </span>
          </button>

          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Company SOP Corpus</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 font-mono text-[10px]">
              6
            </span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3 border-t border-slate-800 bg-[#0d1424]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                {currentUser.initials || 'EM'}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs text-slate-200 truncate">{currentUser.name}</span>
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                </div>
                <span className="text-[10px] text-emerald-400 font-mono block truncate">
                  {currentUser.clearance.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                title="Zero-Trust Security Center"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('sovereign_user');
                  setCurrentUser(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Log Out of Sovereign Enclave"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button when collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-3 left-3 z-40 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shadow-lg"
          title="Open Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Main Enclave Workspace: Facility Dashboard or AI Chat Studio */}
      {currentView === 'dashboard' ? (
        <ExecutiveDashboard
          currentUser={currentUser}
          health={health}
          learnedCount={learnedCount}
          activeModel={activeModel}
          onChangeModel={setActiveModel}
          availableModels={availableModels}
          onNavigateToChat={(prompt) => {
            setCurrentView('chat');
            if (prompt) {
              handleSendMessage(prompt);
            }
          }}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenMemoryPanel={() => setIsSidePanelOpen(true)}
          onAddToast={addToast}
          onRefreshMemoryCount={loadHealthAndMemory}
        />
      ) : (
        <ChatPanel
          channelTitle={currentSession?.title || 'Industrial Chat'}
          messages={messages}
          activeModel={activeModel}
          onChangeModel={setActiveModel}
          availableModels={availableModels}
          activeAgentMode={activeAgentMode}
          onChangeAgentMode={setActiveAgentMode}
          onSendMessage={handleSendMessage}
          onApproveHITL={handleApproveHITL}
          onRejectHITL={handleRejectHITL}
          isSidePanelOpen={isSidePanelOpen}
          onToggleSidePanel={() => setIsSidePanelOpen(!isSidePanelOpen)}
          onSelectEvidence={(ev) => {
            setActiveEvidence(ev);
            setIsSidePanelOpen(true);
          }}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onClearChat={handleClearChat}
          onStopGenerating={handleStopGenerating}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
          learnedCount={learnedCount}
          isGenerating={isGenerating}
        />
      )}

      {/* Right Sliding Evidence & Brain Memory Panel */}
      {isSidePanelOpen && (
        <EvidencePanel
          evidence={activeEvidence}
          onClose={() => setIsSidePanelOpen(false)}
        />
      )}

      {/* HITL Gatekeeper Modal */}
      {isHITLModalOpen && activeHITLProposal && (
        <HITLGatekeeperModal
          isOpen={isHITLModalOpen}
          proposal={activeHITLProposal}
          onClose={() => setIsHITLModalOpen(false)}
          onConfirm={handleConfirmHITLModal}
        />
      )}

      {/* Security & SIEM Modal */}
      {isSecurityModalOpen && (
        <SecurityCenterModal
          isOpen={isSecurityModalOpen}
          health={health}
          onClose={() => setIsSecurityModalOpen(false)}
        />
      )}

      {/* Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/50'
                  : 'bg-slate-900/90 border-slate-700/60 text-slate-100 shadow-slate-950/50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-100">{toast.title}</div>
                {toast.desc && <div className="text-[11px] text-slate-300 mt-0.5 truncate">{toast.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
