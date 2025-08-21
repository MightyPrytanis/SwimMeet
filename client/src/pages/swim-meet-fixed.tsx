import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";
import { StandardFileUpload } from "@/components/StandardFileUpload";
import { CloudStorageSettings } from "@/components/CloudStorageSettings";
import { Download, FileText, Upload, Play, GitBranch, Users, BarChart3, Settings, Menu, X } from "lucide-react";
import "../styles/modernist.css";

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

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-testid="button-hamburger-menu"]') && 
            !target.closest('[data-menu-dropdown]')) {
          setShowMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
          <div>
            <h1 className="swim-brand swim-title" style={{ margin: '0', fontSize: '2rem' }}>
              SWIM MEET
            </h1>
            <p className="swim-caption" style={{ margin: '0' }}>
              User: {user?.username}
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className="swim-button swim-button--secondary"
              onClick={() => setShowMenu(!showMenu)}
              data-testid="button-hamburger-menu"
              style={{
                padding: 'calc(var(--grid-unit) * 0.75)',
                minWidth: 'auto'
              }}
            >
              {showMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Hamburger Menu Dropdown */}
            {showMenu && (
              <div 
                data-menu-dropdown
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: 'calc(var(--grid-unit) / 2)',
                  backgroundColor: 'white',
                  border: '1px solid hsl(var(--steel-gunmetal) / 0.2)',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '200px',
                  overflow: 'hidden'
                }}>
                <div style={{ padding: 'calc(var(--grid-unit) / 2)' }}>
                  <button
                    className="swim-button swim-button--ghost"
                    onClick={() => {
                      setShowStats(!showStats);
                      setShowMenu(false);
                    }}
                    data-testid="button-toggle-stats"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      marginBottom: 'calc(var(--grid-unit) / 4)'
                    }}
                  >
                    <BarChart3 size={16} style={{ marginRight: 'calc(var(--grid-unit) / 2)' }} />
                    {showStats ? 'Hide Statistics' : 'Show Statistics'}
                  </button>
                  
                  <button
                    className="swim-button swim-button--ghost"
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowMenu(false);
                    }}
                    data-testid="button-toggle-settings"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      marginBottom: 'calc(var(--grid-unit) / 4)'
                    }}
                  >
                    <Settings size={16} style={{ marginRight: 'calc(var(--grid-unit) / 2)' }} />
                    {showSettings ? 'Hide Cloud Storage' : 'Cloud Storage'}
                  </button>
                  
                  <hr style={{
                    border: 'none',
                    borderTop: '1px solid hsl(var(--steel-gunmetal) / 0.1)',
                    margin: 'calc(var(--grid-unit) / 2) 0'
                  }} />
                  
                  <button
                    className="swim-button swim-button--ghost"
                    onClick={() => {
                      handleLogout();
                      setShowMenu(false);
                    }}
                    data-testid="button-logout"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      color: 'hsl(var(--poolside-red))'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modernist Statistics Panel */}
      {showStats && (
        <section className="swim-panel swim-section">
          <h3 className="swim-subtitle">AI Provider Statistics</h3>
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
        <section className="swim-panel swim-section">
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
            
            // Get mode-specific styling
            let modeColor, modeGradient, modeBorder;
            if (m.id === 'dive') {
              modeColor = 'hsl(var(--dive-primary))';
              modeGradient = isActive 
                ? 'linear-gradient(135deg, hsl(var(--dive-primary)) 0%, hsl(var(--dive-secondary)) 100%)' 
                : 'linear-gradient(135deg, hsl(var(--dive-primary) / 0.15) 0%, hsl(var(--dive-secondary) / 0.1) 100%)';
              modeBorder = isActive ? 'hsl(var(--dive-primary))' : 'hsl(var(--dive-primary) / 0.4)';
            } else if (m.id === 'turn') {
              modeColor = 'hsl(var(--turn-primary))';
              modeGradient = isActive 
                ? 'linear-gradient(135deg, hsl(var(--turn-primary)) 0%, hsl(var(--turn-secondary)) 100%)' 
                : 'linear-gradient(135deg, hsl(var(--turn-primary) / 0.15) 0%, hsl(var(--turn-secondary) / 0.1) 100%)';
              modeBorder = isActive ? 'hsl(var(--turn-primary))' : 'hsl(var(--turn-primary) / 0.4)';
            } else {
              modeColor = 'hsl(var(--work-primary))';
              modeGradient = isActive 
                ? 'linear-gradient(135deg, hsl(var(--work-primary)) 0%, hsl(var(--work-secondary)) 100%)' 
                : 'linear-gradient(135deg, hsl(var(--work-primary) / 0.15) 0%, hsl(var(--work-secondary) / 0.1) 100%)';
              modeBorder = isActive ? 'hsl(var(--work-primary))' : 'hsl(var(--work-primary) / 0.4)';
            }
            
            return (
              <div
                key={m.id}
                className={`swim-mode-panel ${isActive ? 'swim-mode-panel--active' : ''}`}
                onClick={() => setMode(m.id as any)}
                data-testid={`mode-${m.id}`}
                style={{
                  background: modeGradient,
                  border: `2px solid ${modeBorder}`,
                  transform: isActive ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 'calc(var(--grid-unit) / 2)',
                  color: isActive ? 'white' : modeColor
                }}>
                  {m.icon}
                </div>
                <div className="swim-mode-title" style={{ 
                  color: isActive ? 'white' : modeColor,
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                }}>
                  {m.name}
                </div>
                <div className="swim-mode-description" style={{ 
                  color: isActive ? 'rgba(255,255,255,0.9)' : `${modeColor}aa`,
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {m.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modernist AI Provider Selection */}
      <section className="swim-section">
        <h3 className="swim-subtitle">Select AI Providers</h3>
        <div className="swim-providers">
          {providers.map(provider => (
            <div
              key={provider.id}
              className={`swim-panel swim-provider ${selectedAIs.includes(provider.id) ? 'swim-provider--selected' : ''}`}
              onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
              style={{
                cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                opacity: provider.status === 'error' ? 0.5 : 1
              }}
              data-testid={`provider-${provider.id}`}
            >
              <div className="swim-provider-header">
                <div>
                  <div className="swim-provider-name">{provider.name}</div>
                  <div className="swim-provider-company">{provider.company}</div>
                </div>
                <div className={`swim-status swim-status--${provider.status}`}>
                  {provider.status.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modernist File Upload Interface */}
      <section className="swim-panel swim-section">
        <div className="swim-feature-header">
          <Upload size={20} />
          <h3 className="swim-subtitle">File Attachments</h3>
        </div>
          
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
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Attached Files ({attachedFiles.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachedFiles.map((file, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span style={{ fontSize: '14px' }}>{file.name}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => downloadFile(file.path, file.name)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        data-testid={`button-download-${index}`}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
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

      {/* Modernist Query Input - Primary Action Panel */}
      <section className="swim-panel swim-panel--primary swim-section">
        <h3 className="swim-subtitle">Query Input</h3>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {responses.map(response => (
                <div key={response.id} style={{
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#374151' }}>
                      {response.aiProvider.toUpperCase()}
                      {mode === 'work' && responses.indexOf(response) >= 0 && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px', 
                          color: '#f59e0b',
                          fontWeight: 'normal'
                        }}>
                          (Step {responses.indexOf(response) + 1})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: response.status === 'complete' ? '#dcfce7' : '#fef3c7',
                        color: response.status === 'complete' ? '#16a34a' : '#eab308',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {response.status.toUpperCase()}
                      </div>
                      {response.status === 'complete' && (
                        <button
                          onClick={() => downloadFile(`data:text/plain;charset=utf-8,${encodeURIComponent(response.content)}`, `${response.aiProvider}-response.txt`)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          data-testid={`button-download-response-${response.id}`}
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{
                    color: '#374151',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {response.content}
                  </div>
                  {response.responseTime && (
                    <div style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Response time: {(response.responseTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div> {/* End of container div */}
    </div>
  );
}