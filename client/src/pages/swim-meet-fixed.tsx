import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";
import { StandardFileUpload } from "@/components/StandardFileUpload";
import { CloudStorageSettings } from "@/components/CloudStorageSettings";
import { Download, FileText, Upload, Play, GitBranch, Users, BarChart3, Settings, Menu, X, Activity } from "lucide-react";
import "../styles/modernist.css";
import { PerformanceOverlay } from "../components/PerformanceOverlay";

// Types
interface AIProvider {
  id: string;
  name: string;
  company: string;
  status: 'connected' | 'setup_required' | 'error' | 'disabled';
  requiresApiKey: boolean;
}

interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  responseTime?: number;
  award?: 'gold' | 'silver' | 'bronze' | 'titanic';
  awardSaved?: boolean;
  metadata?: any;
}

interface QueryRequest {
  query: string;
  selectedAIs: string[];
  mode: 'dive' | 'turn' | 'work';
  attachedFiles?: any[];
}

interface WorkflowStep {
  stepNumber: number;
  assignedAI: string;
  objective: string;
  completed: boolean;
  status: 'pending' | 'complete' | 'error';
}

interface WorkflowStatus {
  status: 'no_workflow' | 'active';
  totalSteps: number;
  currentStep: number;
  completedSteps: number;
  steps: WorkflowStep[];
  collaborativeDoc: string;
}

export default function SwimMeetFixed() {
  // ALL STATE HOOKS FIRST - NO CONDITIONAL LOGIC BEFORE HOOKS
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [mode, setMode] = useState<'dive' | 'turn' | 'work'>('dive');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);

  // Authentication check effect
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
    setAuthLoading(false);
  }, []);

  // Helper function for mode icons
  const getModeIcon = () => {
    switch (mode) {
      case 'dive': return <Play size={20} />;
      case 'turn': return <GitBranch size={20} />;
      case 'work': return <Users size={20} />;
      default: return <Play size={20} />;
    }
  };

  // File upload handler
  const handleFilesSelected = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAttachedFiles(prev => [...prev, ...result.files]);
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed');
    }
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // ALL QUERIES AND MUTATIONS BEFORE CONDITIONAL LOGIC
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ['/api/providers'],
    queryFn: () => makeAuthenticatedRequest('/api/providers').then(res => res.json()),
    enabled: !!authToken,
    refetchInterval: 300000,
    staleTime: 240000,
  });

  const { data: providerStats = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/stats'],
    enabled: !!authToken,
    refetchInterval: 30000,
  });

  // WORK mode workflow status query
  const { data: workflowStatus } = useQuery<WorkflowStatus>({
    queryKey: [`/api/conversations/${conversationId}/workflow`],
    queryFn: () => makeAuthenticatedRequest(`/api/conversations/${conversationId}/workflow`).then(res => res.json()),
    enabled: !!authToken && !!conversationId && mode === 'work',
    refetchInterval: 2000, // Poll every 2 seconds for WORK mode
  });

  const queryMutation = useMutation({
    mutationFn: async (queryRequest: QueryRequest) => {
      setIsQuerying(true);
      const response = await makeAuthenticatedRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          ...queryRequest,
          attachedFiles
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponses(data.responses || []);
      setConversationId(data.conversationId);
      setIsQuerying(false);
    },
    onError: () => {
      setIsQuerying(false);
    }
  });

  // Query to fetch updated responses for a conversation
  const { data: conversationResponses } = useQuery<AIResponse[]>({
    queryKey: [`/api/conversations/${conversationId}/responses`],
    queryFn: () => makeAuthenticatedRequest(`/api/conversations/${conversationId}/responses`).then(res => res.json()),
    enabled: !!authToken && !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0, // Always consider stale to fetch fresh data
  });

  // ALL EFFECTS BEFORE CONDITIONAL LOGIC
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAuthToken(token);
          setUser({ id: data.id, username: data.username });
        } else {
          localStorage.removeItem('authToken');
        }
        setAuthLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Update responses when conversation data changes
  useEffect(() => {
    if (conversationResponses) {
      setResponses(conversationResponses);
    }
  }, [conversationResponses]);

  // EVENT HANDLERS
  const handleAuth = (token: string, userData: { id: string; username: string }) => {
    setAuthToken(token);
    setUser(userData);
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    queryClient.clear();
  };

  const toggleAISelection = (aiId: string) => {
    setSelectedAIs(prev => 
      prev.includes(aiId) 
        ? prev.filter(id => id !== aiId)
        : [...prev, aiId]
    );
  };

  const handleSubmitQuery = () => {
    if (!query.trim() || selectedAIs.length === 0) return;
    
    queryMutation.mutate({
      query: query.trim(),
      selectedAIs,
      mode,
      attachedFiles
    });
  };

  const handleFileUpload = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/objects/upload', {
        method: 'POST'
      });
      const { uploadURL } = await response.json();
      return { method: 'PUT' as const, url: uploadURL };
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      throw error;
    }
  };

  const handleFileComplete = async (result: any) => {
    try {
      for (const file of result.successful) {
        const response = await makeAuthenticatedRequest('/api/objects/attach', {
          method: 'PUT',
          body: JSON.stringify({
            fileURL: file.uploadURL,
            fileName: file.name
          })
        });
        const data = await response.json();
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          path: data.objectPath,
          size: file.size
        }]);
      }
    } catch (error) {
      console.error('Error attaching files:', error);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (path: string, filename: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = filename;
    link.click();
  };

  const getModeColor = () => {
    switch (mode) {
      case 'dive': return '#0ea5e9'; // Sky blue
      case 'turn': return '#8b5cf6'; // Purple  
      case 'work': return '#f59e0b'; // Amber
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16a34a';
      case 'setup_required': return '#eab308';
      case 'disabled': return '#6b7280';
      default: return '#dc2626';
    }
  };

  // NOW CONDITIONAL RENDERING IS SAFE
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!authToken || !user) {
    return (
      <div className="swim-grid swim-grid--main" style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="swim-panel swim-panel--elevated" style={{ padding: 'calc(var(--grid-unit) * 4)', maxWidth: '400px', margin: '0 auto' }}>
          <AuthForm onAuth={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="swim-grid swim-grid--main">
      {/* Modernist Header - Glass Panel Design */}
      <header className="swim-panel swim-panel--elevated swim-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--panel-gap)' }}>
            <div style={{
              height: '80px',
              width: '220px',
              background: 'linear-gradient(135deg, #007BFF 0%, #0056D6 50%, #00A3E0 100%)',
              border: '3px solid #C0C0C0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C0C0C0',
              fontWeight: 'bold',
              fontSize: '24px',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(255,255,255,0.9), -1px -1px 3px rgba(0,0,0,0.4)',
              boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                color: '#FFFFFF',
                textStroke: '1px #808080',
                WebkitTextStroke: '1px #808080',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                fontWeight: '800'
              }}>SWIM MEET</div>
              <div style={{
                fontSize: '12px',
                letterSpacing: '3px',
                fontWeight: '700',
                marginTop: '2px',
                color: '#FFFFFF',
                textStroke: '0.5px #808080',
                WebkitTextStroke: '0.5px #808080',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
              }}>P R E M I U M</div>
            </div>
            <div>
              <p className="swim-caption" style={{ margin: '0' }}>
                User: {user?.username}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'calc(var(--grid-unit) / 2)' }}>
            <button
              className="swim-button swim-button--secondary"
              onClick={() => setShowStats(!showStats)}
              data-testid="button-toggle-stats"
              title={showStats ? 'Hide Statistics' : 'Show Statistics'}
              style={{
                padding: 'calc(var(--grid-unit) * 0.75)',
                minWidth: 'auto'
              }}
            >
              <BarChart3 size={20} />
            </button>
            
            <button
              className="swim-button swim-button--secondary"
              onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
              data-testid="button-toggle-performance"
              title={showPerformanceOverlay ? 'Hide Performance Monitor' : 'Show Performance Monitor'}
              style={{
                padding: 'calc(var(--grid-unit) * 0.75)',
                minWidth: 'auto'
              }}
            >
              <Activity size={20} />
            </button>
            
            <button
              className="swim-button swim-button--secondary"
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-toggle-settings"
              title={showSettings ? 'Hide Cloud Storage' : 'Show Cloud Storage'}
              style={{
                padding: 'calc(var(--grid-unit) * 0.75)',
                minWidth: 'auto'
              }}
            >
              <Settings size={20} />
            </button>
            
            <button
              className="swim-button swim-button--ghost"
              onClick={handleLogout}
              data-testid="button-logout"
              title="Logout"
              style={{
                padding: 'calc(var(--grid-unit) * 0.75)',
                minWidth: 'auto',
                color: 'hsl(var(--poolside-red))'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Modernist Statistics Panel */}
      {showStats && (
        <section className="glass-panel-large swim-section">
          <h3 className="panel-heading">AI Provider Statistics</h3>
          <div className="swim-grid swim-grid--three-col">
            {Object.entries(providerStats).map(([providerId, stats]: [string, any]) => (
              <div key={providerId} className="swim-panel" data-testid={`stats-${providerId}`}>
                <div className="swim-provider-name" style={{ marginBottom: 'var(--panel-gap)' }}>
                  {providerId.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--grid-unit) / 2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="swim-caption">Success Rate:</span>
                    <span className={`swim-status ${stats.successRate >= 90 ? 'swim-status--connected' : 'swim-status--setup-required'}`}>
                      {stats.successRate}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="swim-caption">Awards:</span>
                    <div style={{ display: 'flex', gap: 'calc(var(--grid-unit) / 2)' }}>
                      <span className="swim-award swim-award--gold" title="Gold Awards">{stats.awards?.gold || 0}</span>
                      <span className="swim-award swim-award--silver" title="Silver Awards">{stats.awards?.silver || 0}</span>
                      <span className="swim-award swim-award--bronze" title="Bronze Awards">{stats.awards?.bronze || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modernist Cloud Storage Settings Panel */}
      {showSettings && (
        <section className="glass-panel-large swim-section">
          <CloudStorageSettings authToken={authToken} />
        </section>
      )}

      {/* Modernist Mode Selection - Distinctly Styled Panels */}
      <section className="swim-section">
        <h3 className="swim-subtitle">Workflow Mode</h3>
        <div className="swim-mode-selector">
          {[
            { id: 'dive', name: 'DIVE', desc: 'Multiple AIs respond simultaneously', icon: <Play size={20} /> },
            { id: 'turn', name: 'TURN', desc: 'AI fact-checking and critique', icon: <GitBranch size={20} /> },
            { id: 'work', name: 'WORK', desc: 'Multi-step collaborative solving', icon: <Users size={20} /> }
          ].map(m => {
            const isActive = mode === m.id;
            const panelClass = `swim-mode-panel ${m.id}-panel ${isActive ? 'swim-mode-panel--active' : ''}`;
            
            return (
              <div
                key={m.id}
                className={panelClass}
                onClick={() => setMode(m.id as 'dive' | 'turn' | 'work')}
                style={{ cursor: 'pointer' }}
                data-testid={`mode-${m.id}`}
              >
                <div className="swim-mode-title">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--grid-unit) / 2)', marginBottom: 'calc(var(--grid-unit) / 2)' }}>
                    {m.icon}
                    {m.name}
                  </div>
                </div>
                <div className="swim-mode-description">{m.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mode-specific content areas with explanatory text */}
      <div className={`mode-themed-container ${mode}-mode`}>
        
        {/* AI Provider Selection with mode-specific explanation */}
        <section className="swim-section">
          <h3 className="panel-heading">Select AI Providers</h3>
          {mode === 'dive' && (
            <div className="mode-explanation dive-explanation">
              <strong>DIVE Mode:</strong> Choose as many AI competitors as you like. Each AI will respond simultaneously to your query, giving you multiple perspectives at once.
            </div>
          )}
          {mode === 'turn' && (
            <div className="mode-explanation turn-explanation">
              <strong>TURN Mode:</strong> Choose primary AI providers, then select a verifier AI. The verifier will fact-check and critique the primary responses for accuracy.
            </div>
          )}
          {mode === 'work' && (
            <div className="mode-explanation work-explanation">
              <strong>WORK Mode:</strong> Choose AI team members for the project. They will agree on roles for each agent, or you can designate them yourself. Sequential collaboration on complex problems.
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderLeft: '4px solid #007BFF', fontSize: '14px' }}>
                <strong>Role Assignment:</strong> After selecting AIs, you can assign specific roles like "Analyst", "Designer", "Reviewer" by clicking the role button next to each selected AI.
              </div>
            </div>
          )}
          
          <div className="provider-grid">
            {providers.map((provider, index) => {
            const isSelected = selectedAIs.includes(provider.id);
            
            return (
              <div
                key={provider.id}
                className={`consistent-provider-card ${isSelected ? 'provider-selected' : ''}`}
                onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
                style={{
                  cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                  opacity: provider.status === 'error' ? 0.5 : 1,
                  position: 'relative',
                  margin: '8px', // Add margin to prevent overlap
                  padding: '16px',
                  background: isSelected ? 'linear-gradient(135deg, #007BFF15 0%, #0056D615 100%)' : '#f8f9fa',
                  border: isSelected ? '2px solid #007BFF' : '1px solid #e9ecef',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 123, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                }}
                data-testid={`provider-${provider.id}`}
                title={`Click to ${isSelected ? 'deselect' : 'select'} ${provider.name}. Status: ${provider.status.replace('_', ' ')}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    {provider.name}
                    {isSelected && <span style={{ marginLeft: '8px', color: '#007BFF', fontSize: '16px' }}>✓</span>}
                  </div>
                  <div 
                    className={`swim-status swim-status--${provider.status}`}
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {provider.status.replace('_', ' ')}
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Company: {provider.company}
                </div>
                
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Status: {provider.status.replace('_', ' ')}
                </div>
                
                <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                  {mode === 'dive' && 'Simultaneous competition mode'}
                  {mode === 'turn' && 'Sequential verification mode'}
                  {mode === 'work' && 'Collaborative workflow mode'}
                </div>
              </div>
            );
            })}
          </div>

          {/* WORK Mode Role Assignment Section */}
          {mode === 'work' && selectedAIs.length > 0 && (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff8f0', borderRadius: '8px', border: '2px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} />
                Role Assignment
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {selectedAIs.map((aiId, index) => {
                  const provider = providers?.find(p => p.id === aiId);
                  const roleOptions = ['Analyst', 'Designer', 'Reviewer', 'Strategist', 'Technical Lead', 'Auto-assign'];
                  
                  return (
                    <div key={aiId} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <strong>{provider?.name}</strong>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{provider?.company}</div>
                      </div>
                      <select 
                        defaultValue="Auto-assign"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                        data-testid={`role-select-${aiId}`}
                      >
                        {roleOptions.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* File Upload Interface with mode-specific explanation */}
        <section className="swim-section">
          <div className="swim-feature-header">
            <Upload size={20} />
            <h3 className="panel-heading">File Attachments</h3>
          </div>
          
          {mode === 'dive' && (
            <div className="mode-explanation dive-explanation">
              <strong>File Support:</strong> Attach documents, images, or data files. All selected AIs will receive and analyze these files simultaneously.
            </div>
          )}
          {mode === 'turn' && (
            <div className="mode-explanation turn-explanation">
              <strong>File Support:</strong> Attach files for analysis. The verifier AI will also review file-based responses for accuracy and completeness.
            </div>
          )}
          {mode === 'work' && (
            <div className="mode-explanation work-explanation">
              <strong>File Support:</strong> Upload project files, specifications, or reference materials. AI team members will use these throughout the collaborative workflow.
            </div>
          )}
          
        <div style={{ display: 'flex', gap: 'var(--panel-gap)', alignItems: 'center', marginBottom: 'var(--section-gap)' }}>
          <StandardFileUpload
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            maxSizeBytes={50 * 1024 * 1024}
            disabled={isQuerying}
          />
          <span className="swim-caption">Max 5 files, 50MB each</span>
        </div>

          {attachedFiles.length > 0 && (
            <div className="swim-section--compact">
              <div className="swim-caption" style={{ marginBottom: 'calc(var(--grid-unit) / 2)' }}>
                Attached Files ({attachedFiles.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {attachedFiles.map((file, index) => (
                  <div key={index} className="swim-file-card">
                    <div className="swim-file-info">
                      <FileText size={16} style={{ color: 'hsl(var(--chrome-silver))' }} />
                      <span className="swim-caption">{file.name}</span>
                      <span className="swim-caption" style={{ color: 'hsl(var(--chrome-silver))' }}>
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <div className="swim-file-actions">
                      <button
                        onClick={() => downloadFile(file.path, file.name)}
                        className="swim-button swim-button--secondary"
                        style={{
                          padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                          fontSize: '12px',
                          minWidth: 'auto'
                        }}
                        data-testid={`button-download-${index}`}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="swim-button swim-button--ghost"
                        style={{
                          padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                          fontSize: '12px',
                          color: '#dc2626',
                          minWidth: 'auto'
                        }}
                        data-testid={`button-remove-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Query Input Section */}
        <section className="swim-section">
        <h3 className="panel-heading">Query Input</h3>
        <div className="swim-query-container">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query here..."
            data-testid="input-query"
            className="swim-textarea"
          />
          <button
            onClick={handleSubmitQuery}
            disabled={!query.trim() || selectedAIs.length === 0 || isQuerying}
            data-testid="button-submit-query"
            className={`swim-button swim-button--primary swim-button--large ${isQuerying ? 'swim-button--disabled' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--grid-unit) / 2)' }}>
              {getModeIcon()}
              <span>{isQuerying ? 'Processing...' : `Submit to ${selectedAIs.length} AI${selectedAIs.length !== 1 ? 's' : ''}`}</span>
            </div>
          </button>
        </div>
        </section>
      </div>

      <div className="steel-frame-divider"></div>

      <div>
        {/* WORK Mode Progress Monitor */}
        {mode === 'work' && workflowStatus?.status === 'active' && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '3px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, color: '#f59e0b' }}>WORK Mode Progress</h3>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  Progress: {workflowStatus.completedSteps}/{workflowStatus.totalSteps} Steps Complete
                </span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {Math.round((workflowStatus.completedSteps / workflowStatus.totalSteps) * 100)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(workflowStatus.completedSteps / workflowStatus.totalSteps) * 100}%`,
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workflowStatus.steps.map((step: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: step.completed ? '#dcfce7' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#fef3c7' : '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid ' + (step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#e5e7eb')
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#6b7280',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}>
                    {step.completed ? '✓' : step.stepNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                      Step {step.stepNumber}: {step.assignedAI.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {step.objective}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: step.completed ? '#dcfce7' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#fef3c7' : '#f3f4f6',
                    color: step.completed ? '#16a34a' : (step.status === 'pending' && index === workflowStatus.currentStep) ? '#eab308' : '#6b7280',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {step.completed ? 'COMPLETE' : (step.status === 'pending' && index === workflowStatus.currentStep) ? 'IN PROGRESS' : 'WAITING'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>
              {mode === 'work' ? 'Collaborative Results' : 'AI Responses'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {responses.map(response => (
                <div key={response.id} className="glass-panel-large swim-response-card">
                  <div className="swim-response-header">
                    <div className="panel-heading" style={{ margin: 0 }}>
                      {response.aiProvider.toUpperCase()}
                      {mode === 'work' && responses.indexOf(response) >= 0 && (
                        <span className="swim-caption" style={{ 
                          marginLeft: 'calc(var(--grid-unit) / 2)', 
                          color: 'hsl(var(--work-primary))'
                        }}>
                          (Step {responses.indexOf(response) + 1})
                        </span>
                      )}
                    </div>
                    <div className="swim-response-actions">
                      <div className={`swim-status swim-status--${response.status === 'complete' ? 'connected' : 'setup-required'}`}>
                        {response.status.toUpperCase()}
                      </div>
                      {response.status === 'complete' && (
                        <button
                          onClick={() => downloadFile(`data:text/plain;charset=utf-8,${encodeURIComponent(response.content)}`, `${response.aiProvider}-response.txt`)}
                          className="swim-button swim-button--secondary"
                          style={{
                            padding: 'calc(var(--grid-unit) / 2) var(--grid-unit)',
                            fontSize: '12px',
                            minWidth: 'auto'
                          }}
                          data-testid={`button-download-response-${response.id}`}
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="swim-response-content">
                    {response.content}
                  </div>
                  {response.responseTime && (
                    <div className="swim-response-time">
                      Response time: {(response.responseTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        <StandardFileUpload
          isVisible={showSettings}
          onFilesUploaded={handleFilesUploaded}
        />

        {/* Cloud Storage Settings Panel */}
        {showSettings && (
          <CloudStorageSettings 
            isVisible={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Performance Monitoring Overlay */}
        <PerformanceOverlay 
          isVisible={showPerformanceOverlay}
          onClose={() => setShowPerformanceOverlay(false)}
        />
      </div> {/* End of container div */}
    </div>
  );
}