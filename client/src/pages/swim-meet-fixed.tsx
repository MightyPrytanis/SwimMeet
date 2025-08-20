import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthForm } from "@/components/AuthForm";

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
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");

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

  const queryMutation = useMutation({
    mutationFn: async (queryRequest: QueryRequest) => {
      const response = await makeAuthenticatedRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify(queryRequest)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponses(data.responses || []);
      setConversationId(data.conversationId);
    }
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
      mode
    });
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
            disabled={!query.trim() || selectedAIs.length === 0 || queryMutation.isPending}
            style={{
              padding: '12px 24px',
              backgroundColor: queryMutation.isPending ? '#6b7280' : '#0c4a6e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: queryMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {queryMutation.isPending ? 'Submitting...' : `Submit to ${selectedAIs.length} AI${selectedAIs.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Responses */}
        {responses.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Responses</h3>
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
                    </div>
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