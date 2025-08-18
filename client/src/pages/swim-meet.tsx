import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface AIProvider {
  id: string;
  name: string;
  company: string;
  requiresApiKey: boolean;
  status: 'connected' | 'setup_required' | 'error';
}

interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
  award?: 'gold' | 'silver' | 'bronze' | 'finished' | 'quit' | 'titanic';
}

interface QueryRequest {
  query: string;
  selectedAIs: string[];
  mode: 'dive' | 'turn' | 'work';
}

export default function SwimMeet() {
  const [query, setQuery] = useState("");
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [mode, setMode] = useState<'dive' | 'turn' | 'work'>('dive');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [verifyingStates, setVerifyingStates] = useState<Record<string, boolean>>({});
  const [selectedVerifier, setSelectedVerifier] = useState<string>("anthropic");

  // Fetch available AI providers - MINIMAL API CALLS
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ['/api/providers'],
    refetchInterval: 300000, // Refresh status every 5 minutes to minimize API costs
    staleTime: 240000, // Cache for 4 minutes
  });

  // Poll for response updates when we have an active conversation - MINIMAL COST
  const { data: updatedResponses } = useQuery<AIResponse[]>({
    queryKey: ['/api/conversations', conversationId, 'responses'],
    enabled: !!conversationId && responses.some(r => r.status === 'pending'),
    refetchInterval: 5000, // Poll every 5 seconds, only when responses are pending
  });

  // Update responses when polling returns new data
  useEffect(() => {
    if (updatedResponses) {
      setResponses(updatedResponses);
    }
  }, [updatedResponses]);

  // Fetch AI provider statistics
  const { data: providerStats = {} } = useQuery<Record<string, any>>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh stats every 30 seconds
  });

  // Multi-AI query mutation
  const queryMutation = useMutation({
    mutationFn: async (queryRequest: QueryRequest) => {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryRequest)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponses(data.responses || []);
      setConversationId(data.conversationId);
    }
  });

  // Award response mutation
  const awardMutation = useMutation({
    mutationFn: async ({ responseId, award }: { responseId: string, award: string }) => {
      const response = await fetch(`/api/responses/${responseId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ award })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/responses'] });
    }
  });

  const handleSubmitQuery = () => {
    if (!query.trim() || selectedAIs.length === 0) return;
    
    console.log(`Submitting ${mode.toUpperCase()} query to ${selectedAIs.length} AIs at ${new Date().toLocaleTimeString()}`);
    
    queryMutation.mutate({
      query: query.trim(),
      selectedAIs,
      mode
    });
  };

  const handleAwardResponse = (responseId: string, award: string) => {
    console.log(`Awarding ${award} to response ${responseId} at ${new Date().toLocaleTimeString()}`);
    
    // Optimistically update UI
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, award: award as any, awardSaved: false } : r)
    );
    
    // Save to backend
    awardMutation.mutate({ responseId, award }, {
      onSuccess: () => {
        setResponses(prev => 
          prev.map(r => r.id === responseId ? { ...r, awardSaved: true } : r)
        );
      }
    });
  };

  // TURN verification mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ responseId, verifierAI }: { responseId: string, verifierAI: string }) => {
      const response = await fetch(`/api/responses/${responseId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierAI })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/responses`] });
      }
    }
  });

  // Share critique mutation  
  const shareCritiqueMutation = useMutation({
    mutationFn: async ({ responseId }: { responseId: string }) => {
      const response = await fetch(`/api/responses/${responseId}/share-critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      return response.json();
    },
    onSuccess: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/responses`] });
      }
    }
  });

  const handleTurnVerification = async (response: AIResponse) => {
    if (verifyingStates[response.id] || response.metadata?.verificationStatus === 'pending') return;
    
    setVerifyingStates(prev => ({
      ...prev,
      [response.id]: true
    }));

    try {
      await verifyMutation.mutateAsync({ responseId: response.id, verifierAI: selectedVerifier });
    } catch (error) {
      console.error('Failed to verify response:', error);
    } finally {
      setVerifyingStates(prev => {
        const newState = { ...prev };
        delete newState[response.id];
        return newState;
      });
    }
  };

  const handleShareCritique = async (response: AIResponse) => {
    try {
      await shareCritiqueMutation.mutateAsync({ responseId: response.id });
    } catch (error) {
      console.error('Failed to share critique:', error);
    }
  };

  const toggleAISelection = (aiId: string) => {
    setSelectedAIs(prev => 
      prev.includes(aiId) 
        ? prev.filter(id => id !== aiId)
        : [...prev, aiId]
    );
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16a34a'; // Green
      case 'setup_required': return '#eab308'; // Yellow
      case 'error': return '#dc2626'; // Red
      case 'disabled': return '#9ca3af'; // Light gray for disabled
      default: return '#6b7280'; // Gray
    }
  };

  const getAwardColor = (award?: string) => {
    switch (award) {
      case 'gold': return '#fbbf24';
      case 'silver': return '#e5e7eb';
      case 'bronze': return '#d97706';
      case 'finished': return '#16a34a';
      case 'quit': return '#6b7280';
      case 'titanic': return '#dc2626';
      default: return 'transparent';
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#0c4a6e',
        color: 'white',
        borderRadius: '12px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
          SWIM MEET
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          AI Orchestration Platform • Multi-Agent Problem Solving
        </p>
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: showStats ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showStats ? 'Hide Stats Dashboard' : 'Show Stats Dashboard'}
        </button>
      </div>

      {/* Comprehensive Stats Dashboard */}
      {showStats && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          border: '2px solid #0ea5e9'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#0c4a6e', textAlign: 'center' }}>
            📊 COMPREHENSIVE AI PROVIDER STATISTICS
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(providerStats).map(([providerId, stats]) => {
              const provider = providers.find(p => p.id === providerId);
              if (!provider) return null;
              
              return (
                <div key={providerId} style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#374151', textAlign: 'center' }}>
                    {provider.name}
                  </h3>
                  
                  {/* Award Counts */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>AWARDS</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 6px', backgroundColor: '#fbbf24', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        🥇 {stats.awards.gold}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#e5e7eb', color: 'black', borderRadius: '4px', fontSize: '11px' }}>
                        🥈 {stats.awards.silver}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#d97706', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        🥉 {stats.awards.bronze}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#16a34a', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        ✅ {stats.awards.finished}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        ❌ {stats.awards.quit}
                      </span>
                      <span style={{ padding: '2px 6px', backgroundColor: '#dc2626', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        💥 {stats.awards.titanic}
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Stats */}
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Total Responses:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>{stats.totalResponses}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Success Rate:</span>
                      <span style={{ fontWeight: 'bold', color: stats.successRate >= 90 ? '#16a34a' : stats.successRate >= 70 ? '#eab308' : '#dc2626' }}>
                        {stats.successRate}%
                      </span>
                    </div>
                    {stats.avgResponseTimeMs && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Avg Response Time:</span>
                        <span style={{ fontWeight: 'bold', color: '#374151' }}>
                          {(stats.avgResponseTimeMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                    {stats.avgAccuracyScore && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Avg Accuracy:</span>
                        <span style={{ fontWeight: 'bold', color: stats.avgAccuracyScore >= 8 ? '#16a34a' : stats.avgAccuracyScore >= 6 ? '#eab308' : '#dc2626' }}>
                          {stats.avgAccuracyScore}/10
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Verified:</span>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>
                        {stats.verificationRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(providerStats).length === 0 && (
            <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
              No statistics available yet. Submit some queries to generate data!
            </div>
          )}
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
              onClick={() => provider.status !== 'disabled' && toggleAISelection(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `2px solid ${selectedAIs.includes(provider.id) ? '#0c4a6e' : '#e5e7eb'}`,
                backgroundColor: selectedAIs.includes(provider.id) ? '#eff6ff' : 'white',
                borderRadius: '6px',
                cursor: provider.status === 'disabled' ? 'not-allowed' : 'pointer',
                opacity: provider.status === 'disabled' ? 0.5 : 1,
                transition: 'all 0.2s'
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
                {providerStats[provider.id] && (
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    🏆 {providerStats[provider.id].awards.gold}G {providerStats[provider.id].awards.silver}S {providerStats[provider.id].awards.bronze}B
                    {providerStats[provider.id].avgResponseTimeMs && ` • ⏱️ ${(providerStats[provider.id].avgResponseTimeMs / 1000).toFixed(1)}s`}
                    {providerStats[provider.id].avgAccuracyScore && ` • 🎯 ${providerStats[provider.id].avgAccuracyScore}/10`}
                  </div>
                )}
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
          placeholder="Enter your query for the AI agents..."
          style={{
            width: '100%',
            height: '100px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <button
          onClick={handleSubmitQuery}
          disabled={!query.trim() || selectedAIs.length === 0 || queryMutation.isPending}
          style={{
            marginTop: '10px',
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
          {queryMutation.isPending ? 'Processing...' : `Submit to ${selectedAIs.length} AIs`}
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
          <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>AI Responses</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {responses.map(response => (
              <div
                key={response.id}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#374151' }}>
                    {response.aiProvider}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {response.timestamp}
                  </div>
                </div>
                
                <div style={{
                  color: '#374151',
                  lineHeight: '1.5',
                  marginBottom: '15px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {response.content}
                </div>

                {/* Award and Analysis Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                  {['gold', 'silver', 'bronze', 'finished', 'quit', 'titanic'].map(award => (
                    <button
                      key={award}
                      onClick={() => handleAwardResponse(response.id, award)}
                      style={{
                        padding: '6px 12px',
                        border: `2px solid ${response.award === award ? getAwardColor(award) : '#e5e7eb'}`,
                        backgroundColor: response.award === award ? getAwardColor(award) : 'white',
                        color: response.award === award && ['gold', 'bronze', 'titanic'].includes(award) ? 'white' : '#374151',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {award}
                    </button>
                  ))}
                  {response.award && (
                    <div style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      color: response.awardSaved ? '#16a34a' : '#eab308',
                      fontWeight: 'bold'
                    }}>
                      {response.awardSaved ? '✓ Saved' : '⏳ Saving...'}
                    </div>
                  )}
                </div>

                {/* DIVE-TURN Bridge: TURN Analysis Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTurnVerification(response)}
                    disabled={verifyingStates[response.id]}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: response.metadata?.verificationStatus === 'complete' ? '#16a34a' : 
                                     verifyingStates[response.id] ? '#fbbf24' : '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: verifyingStates[response.id] ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {verifyingStates[response.id] ? '⏳ Analyzing...' : 
                     response.metadata?.verificationStatus === 'complete' ? '✓ TURN Verified' : '🔍 TURN Analysis'}
                  </button>

                  {response.metadata?.verificationStatus === 'complete' && (
                    <button
                      onClick={() => handleShareCritique(response)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: response.metadata?.critiqueResponse ? '#16a34a' : '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {response.metadata?.critiqueResponse ? '✓ Shared with AI' : '📤 Share Critique'}
                    </button>
                  )}

                  {/* Verifier AI Selector */}
                  <select
                    value={selectedVerifier}
                    onChange={(e) => setSelectedVerifier(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="anthropic">Claude Verifier</option>
                    <option value="openai">GPT Verifier</option>
                    <option value="google">Gemini Verifier</option>
                    <option value="perplexity">Perplexity Verifier</option>
                  </select>
                </div>

                {/* Display Verification Results */}
                {response.metadata?.verificationResults && response.metadata.verificationResults.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0c4a6e', marginBottom: '5px' }}>
                      TURN Analysis by {response.metadata.verificationResults[0].verifiedBy}
                    </div>
                    <div style={{ fontSize: '11px', color: '#374151' }}>
                      <div>🎯 Accuracy: {response.metadata.verificationResults[0].accuracyScore}/10</div>
                      {response.metadata.verificationResults[0].factualErrors && response.metadata.verificationResults[0].factualErrors.length > 0 && (
                        <div style={{ color: '#dc2626' }}>❌ Errors: {response.metadata.verificationResults[0].factualErrors.join(', ')}</div>
                      )}
                      <div>✅ Strengths: {response.metadata.verificationResults[0].strengths.join(', ')}</div>
                      {response.metadata.verificationResults[0].weaknesses && response.metadata.verificationResults[0].weaknesses.length > 0 && (
                        <div>⚠️ Areas to improve: {response.metadata.verificationResults[0].weaknesses.join(', ')}</div>
                      )}
                      <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                        📋 Assessment: {response.metadata.verificationResults[0].overallAssessment}
                      </div>
                    </div>
                  </div>
                )}

                {/* Display AI's Response to Critique */}
                {response.metadata?.critiqueResponse && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f3e8ff',
                    borderRadius: '6px',
                    border: '1px solid #7c3aed'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#7c3aed', marginBottom: '5px' }}>
                      {response.aiProvider}'s Response to Critique:
                    </div>
                    <div style={{ fontSize: '11px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {response.metadata.critiqueResponse.aiResponse}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Award Summary */}
          {responses.some(r => r.award) && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0c4a6e' }}>Award Summary</h4>
              {responses.filter(r => r.award).map(response => (
                <div key={response.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px 0'
                }}>
                  <span style={{ fontWeight: 'bold' }}>{response.aiProvider}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: getAwardColor(response.award),
                      color: ['gold', 'bronze', 'titanic'].includes(response.award!) ? 'white' : 'black',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {response.award}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: response.awardSaved ? '#16a34a' : '#eab308'
                    }}>
                      {response.awardSaved ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}