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

  // Fetch available AI providers
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ['/api/providers'],
    refetchInterval: 5000, // Refresh status every 5 seconds
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
    
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, award: award as any } : r)
    );
    
    awardMutation.mutate({ responseId, award });
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
      </div>

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
              onClick={() => toggleAISelection(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `2px solid ${selectedAIs.includes(provider.id) ? '#0c4a6e' : '#e5e7eb'}`,
                backgroundColor: selectedAIs.includes(provider.id) ? '#eff6ff' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
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

                {/* Award Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}