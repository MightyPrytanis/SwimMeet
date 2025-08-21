import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";
import { StandardFileUpload } from "@/components/StandardFileUpload";
import { CloudStorageSettings } from "@/components/CloudStorageSettings";
import { Download, FileText, Upload, Play, GitBranch, Users } from "lucide-react";

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

  const getModeIcon = () => {
    switch (mode) {
      case 'dive': return <Play className="w-5 h-5" />;
      case 'turn': return <GitBranch className="w-5 h-5" />;
      case 'work': return <Users className="w-5 h-5" />;
    }
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
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0c4a6e',
            margin: 0
          }}>
            SWIM MEET
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#374151' }}>Welcome, {user.username}</span>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '8px 16px',
                backgroundColor: showStats ? '#0c4a6e' : 'white',
                color: showStats ? 'white' : '#0c4a6e',
                border: '2px solid #0c4a6e',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 16px',
                backgroundColor: showSettings ? '#0c4a6e' : 'white',
                color: showSettings ? 'white' : '#0c4a6e',
                border: '2px solid #0c4a6e',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showSettings ? 'Hide Settings' : 'Cloud Settings'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>AI Provider Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {Object.entries(providerStats).map(([providerId, stats]: [string, any]) => (
                <div key={providerId} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
                    {providerId.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Success Rate:</span>
                      <span style={{ fontWeight: 'bold', color: stats.successRate >= 90 ? '#16a34a' : '#eab308' }}>
                        {stats.successRate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Awards:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>
                        🏆 {stats.awards?.gold || 0}G {stats.awards?.silver || 0}S {stats.awards?.bronze || 0}B
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cloud Storage Settings Panel */}
        {showSettings && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <CloudStorageSettings authToken={authToken} />
          </div>
        )}

        {/* Mode Selection */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Workflow Mode</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'dive', name: 'DIVE (Competition)', desc: 'Multiple AIs respond simultaneously' },
              { id: 'turn', name: 'TURN (Verification)', desc: 'AI fact-checking and critique' },
              { id: 'work', name: 'WORK (Collaboration)', desc: 'Multi-step collaborative solving' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${mode === m.id ? '#0c4a6e' : '#e5e7eb'}`,
                  backgroundColor: mode === m.id ? '#0c4a6e' : 'white',
                  color: mode === m.id ? 'white' : '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: '1',
                  minWidth: '200px'
                }}
              >
                <div>{m.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider Selection */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Select AI Providers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {providers.map(provider => (
              <div
                key={provider.id}
                onClick={() => provider.status !== 'error' && toggleAISelection(provider.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: `2px solid ${selectedAIs.includes(provider.id) ? '#0c4a6e' : '#e5e7eb'}`,
                  backgroundColor: selectedAIs.includes(provider.id) ? '#eff6ff' : 'white',
                  borderRadius: '6px',
                  cursor: provider.status === 'error' ? 'not-allowed' : 'pointer',
                  opacity: provider.status === 'error' ? 0.5 : 1
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getProviderStatusColor(provider.status),
                    marginRight: '10px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#374151' }}>{provider.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{provider.company}</div>
                </div>
                {selectedAIs.includes(provider.id) && (
                  <div style={{ color: '#0c4a6e', fontWeight: 'bold' }}>✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Interface */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <Upload className="w-5 h-5" />
            <h3 style={{ margin: 0, color: '#374151' }}>File Attachments</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <StandardFileUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxSizeBytes={50 * 1024 * 1024}
              disabled={isQuerying}
            />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Max 5 files, 50MB each
            </span>
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
        </div>

        {/* Query Input */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Query</h3>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query here..."
            data-testid="input-query"
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '15px'
            }}
          />
          <button
            onClick={handleSubmitQuery}
            disabled={!query.trim() || selectedAIs.length === 0 || isQuerying}
            data-testid="button-submit-query"
            style={{
              padding: '12px 24px',
              backgroundColor: isQuerying ? '#6b7280' : '#0c4a6e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isQuerying ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isQuerying ? 'Processing...' : `Submit to ${selectedAIs.length} AI${selectedAIs.length !== 1 ? 's' : ''}`}
          </button>
        </div>

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
      </div>
    </div>
  );
}