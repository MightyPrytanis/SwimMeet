import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";
import { StandardFileUpload } from "@/components/StandardFileUpload";
import { CloudStorageSettings } from "@/components/CloudStorageSettings";
import { Download, FileText, Upload, Play, GitBranch, Users, BarChart3, Settings } from "lucide-react";
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
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

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
      {/* Precision Steel Header Framework */}
      <header className="steel-frame swim-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="swim-brand swim-title" style={{ 
              margin: '0', 
              fontSize: '2rem',
              color: 'hsl(var(--chrome-silver))',
              fontWeight: 'var(--font-weight-bold)'
            }}>
              SWIM MEET
            </h1>
            <p className="swim-caption" style={{ 
              margin: '0',
              color: 'hsl(var(--chrome-silver))',
              opacity: 0.8
            }}>
              User: {user?.username}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--panel-gap)', alignItems: 'center' }}>
            <button
              className={`swim-button ${showStats ? 'swim-button--primary' : 'swim-button--secondary'}`}
              onClick={() => setShowStats(!showStats)}
              data-testid="button-toggle-stats"
            >
              <BarChart3 size={16} style={{ marginRight: 'calc(var(--grid-unit) / 2)' }} />
              {showStats ? 'Hide Stats' : 'Stats'}
            </button>
            <button
              className={`swim-button ${showSettings ? 'swim-button--primary' : 'swim-button--secondary'}`}
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-toggle-settings"
            >
              <Settings size={16} style={{ marginRight: 'calc(var(--grid-unit) / 2)' }} />
              {showSettings ? 'Hide Cloud' : 'Cloud'}
            </button>
            <button
              className="swim-button swim-button--ghost"
              onClick={handleLogout}
              data-testid="button-logout"
              style={{ color: 'hsl(var(--poolside-red))' }}
            >
              Logout
            </button>
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

      {/* Precision Tetris Mode Selection Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '1px', // Minimal gap for precision fitting
        marginBottom: 'var(--section-gap)',
        height: '200px' // Fixed height for precision layout
      }}>
        {/* DIVE - Large Primary Panel */}
        <div
          className={`glass-panel-large ${mode === 'dive' ? 'active' : ''}`}
          onClick={() => setMode('dive')}
          data-testid="button-mode-dive"
          style={{
            gridArea: '1 / 1 / 3 / 2', // Spans both rows, first column
            padding: 'var(--panel-gap)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: mode === 'dive' 
              ? `linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(135, 206, 235, 0.1) 100%)`
              : 'var(--glass-large-bg)',
            border: mode === 'dive' 
              ? `2px solid hsl(var(--surface-blue))`
              : `1px solid hsl(var(--steel-primary))`
          }}
        >
          <Play size={32} style={{ 
            marginBottom: '12px',
            color: mode === 'dive' ? 'hsl(var(--surface-blue))' : 'hsl(var(--chrome-silver))'
          }} />
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-bold)',
            color: mode === 'dive' ? 'hsl(var(--surface-blue))' : 'hsl(var(--chrome-silver))'
          }}>
            DIVE
          </h4>
          <p style={{ 
            margin: '0', 
            fontSize: '0.9rem',
            color: mode === 'dive' ? 'hsl(var(--underwater-teal))' : 'hsl(var(--chrome-silver))',
            opacity: 0.8
          }}>
            Multiple AIs respond simultaneously
          </p>
        </div>

        {/* TURN - Steel Frame Panel */}
        <div
          className={`steel-frame ${mode === 'turn' ? 'active' : ''}`}
          onClick={() => setMode('turn')}
          data-testid="button-mode-turn"
          style={{
            gridArea: '1 / 2 / 2 / 3', // First row, second column
            padding: 'var(--panel-gap)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: mode === 'turn' 
              ? `hsl(var(--steel-secondary))`
              : `hsl(var(--steel-primary))`,
            border: mode === 'turn' 
              ? `2px solid hsl(var(--underwater-teal))`
              : 'none'
          }}
        >
          <GitBranch size={24} style={{ 
            marginBottom: '8px',
            color: 'hsl(var(--chrome-silver))'
          }} />
          <h4 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '1.1rem',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--chrome-silver))'
          }}>
            TURN
          </h4>
          <p style={{ 
            margin: '0', 
            fontSize: '0.8rem',
            color: 'hsl(var(--chrome-silver))',
            opacity: 0.8
          }}>
            AI fact-checking
          </p>
        </div>

        {/* WORK - Medium Glass Panel */}
        <div
          className={`glass-panel-medium ${mode === 'work' ? 'active' : ''}`}
          onClick={() => setMode('work')}
          data-testid="button-mode-work"
          style={{
            gridArea: '1 / 3 / 3 / 4', // Spans both rows, third column
            padding: 'var(--panel-gap)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: mode === 'work' 
              ? `rgba(184, 134, 11, 0.1)`
              : 'var(--glass-medium-bg)',
            border: mode === 'work' 
              ? `2px solid hsl(var(--work-primary))`
              : `1px solid hsl(var(--steel-secondary))`
          }}
        >
          <Users size={28} style={{ 
            marginBottom: '10px',
            color: mode === 'work' ? 'hsl(var(--work-primary))' : 'hsl(var(--chrome-silver))'
          }} />
          <h4 style={{ 
            margin: '0 0 6px 0', 
            fontSize: '1.3rem',
            fontWeight: 'var(--font-weight-bold)',
            color: mode === 'work' ? 'hsl(var(--work-primary))' : 'hsl(var(--chrome-silver))'
          }}>
            WORK
          </h4>
          <p style={{ 
            margin: '0', 
            fontSize: '0.85rem',
            color: mode === 'work' ? 'hsl(var(--work-primary))' : 'hsl(var(--chrome-silver))',
            opacity: 0.8
          }}>
            Multi-step collaborative solving
          </p>
        </div>

        {/* Stats Panel - Small Steel Support */}
        <div
          className="steel-support"
          style={{
            gridArea: '2 / 2 / 3 / 3', // Second row, second column
            padding: 'calc(var(--panel-gap) / 2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <BarChart3 size={20} style={{ 
            marginBottom: '4px',
            color: 'hsl(var(--chrome-silver))'
          }} />
          <p style={{ 
            margin: '0', 
            fontSize: '0.7rem',
            color: 'hsl(var(--chrome-silver))',
            opacity: 0.7
          }}>
            Stats
          </p>
        </div>
      </section>

      {/* Precision AI Provider Grid */}
      <section className="swim-section">
        <h3 className="swim-subtitle" style={{ 
          marginBottom: 'var(--panel-gap)',
          color: 'hsl(var(--chrome-silver))',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Select AI Providers
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '1px', // Minimal gap for precision fitting
          marginBottom: 'var(--section-gap)',
          height: '160px'
        }}>
          {providers.map((provider, index) => (
            <div
              key={provider.id}
              className={`glass-panel-medium ${selectedAIs.includes(provider.id) ? 'active' : ''}`}
              onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
              data-testid={`provider-${provider.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'calc(var(--panel-gap) * 0.75)',
                cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                opacity: provider.status === 'error' ? 0.5 : 1,
                background: selectedAIs.includes(provider.id) 
                  ? 'linear-gradient(135deg, rgba(135, 206, 235, 0.1) 0%, rgba(74, 139, 139, 0.08) 100%)'
                  : 'var(--glass-medium-bg)',
                border: selectedAIs.includes(provider.id) 
                  ? `2px solid hsl(var(--surface-blue))` 
                  : `1px solid hsl(var(--steel-secondary))`,
                position: 'relative',
                textAlign: 'center'
              }}
            >
              {/* Status Indicator - Steel Badge */}
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: provider.status === 'connected' 
                  ? '#16a34a' : provider.status === 'setup_required' 
                  ? '#eab308' : '#dc2626'
              }}></div>
              
              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '0.9rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: selectedAIs.includes(provider.id) 
                  ? 'hsl(var(--surface-blue))' 
                  : 'hsl(var(--chrome-silver))'
              }}>
                {provider.name}
              </h4>
              <p style={{ 
                margin: '0 0 4px 0', 
                fontSize: '0.7rem',
                color: 'hsl(var(--chrome-silver))',
                opacity: 0.7
              }}>
                {provider.company}
              </p>
              <div style={{
                fontSize: '0.6rem',
                color: provider.status === 'connected' 
                  ? '#16a34a' : provider.status === 'setup_required' 
                  ? '#eab308' : '#dc2626',
                fontWeight: 'var(--font-weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {provider.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Glass Panel File Upload Interface */}
      <section className="glass-panel-large swim-section">
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

      {/* Precision Glass Query Interface */}
      <section className="glass-panel-large swim-section">
        <h3 className="swim-subtitle" style={{
          marginBottom: 'var(--panel-gap)',
          color: 'hsl(var(--chrome-silver))',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Query Input
        </h3>
        <div className="swim-query-container">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query here..."
            data-testid="input-query"
            className="swim-textarea"
            style={{
              background: 'var(--glass-medium-bg)',
              border: `1px solid hsl(var(--steel-secondary))`,
              borderRadius: '0', // Sharp glass edges
              color: 'hsl(var(--chrome-silver))',
              fontFamily: 'var(--font-primary)',
              fontSize: '1rem',
              padding: 'var(--panel-gap)',
              minHeight: '120px',
              width: '100%',
              marginBottom: 'var(--panel-gap)',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleSubmitQuery}
            disabled={!query.trim() || selectedAIs.length === 0 || isQuerying}
            data-testid="button-submit-query"
            className="steel-frame"
            style={{
              width: '100%',
              padding: 'var(--panel-gap)',
              fontSize: '1.1rem',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: (!query.trim() || selectedAIs.length === 0 || isQuerying) ? 'not-allowed' : 'pointer',
              opacity: (!query.trim() || selectedAIs.length === 0 || isQuerying) ? 0.6 : 1,
              color: 'hsl(var(--chrome-silver))',
              border: `2px solid hsl(var(--steel-secondary))`,
              transition: 'all var(--duration-fast) var(--easing-standard)'
            }}
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