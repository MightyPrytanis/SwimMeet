import React, { useState, useRef, useCallback } from 'react';
import { Zap, MessageSquare, CheckCircle, ArrowRight, Move, Plus } from 'lucide-react';

interface Node {
  id: string;
  type: 'start' | 'ai' | 'decision' | 'end';
  x: number;
  y: number;
  title: string;
  provider?: string;
  config?: any;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  animated: boolean;
}

const SAMPLE_NODES: Node[] = [
  { id: 'start', type: 'start', x: 100, y: 150, title: 'Query Input' },
  { id: 'gpt', type: 'ai', x: 300, y: 100, title: 'ChatGPT-4', provider: 'openai' },
  { id: 'claude', type: 'ai', x: 300, y: 200, title: 'Claude 4', provider: 'anthropic' },
  { id: 'decision', type: 'decision', x: 500, y: 150, title: 'Best Response' },
  { id: 'end', type: 'end', x: 700, y: 150, title: 'Final Answer' }
];

const SAMPLE_CONNECTIONS: Connection[] = [
  { id: 'c1', from: 'start', to: 'gpt', animated: true },
  { id: 'c2', from: 'start', to: 'claude', animated: true },
  { id: 'c3', from: 'gpt', to: 'decision', animated: false },
  { id: 'c4', from: 'claude', to: 'decision', animated: false },
  { id: 'c5', from: 'decision', to: 'end', animated: true }
];

export function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>(SAMPLE_NODES);
  const [connections, setConnections] = useState<Connection[]>(SAMPLE_CONNECTIONS);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [executionStep, setExecutionStep] = useState<number>(-1);

  const handleNodeDrag = useCallback((nodeId: string, newX: number, newY: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x: newX, y: newY } : node
    ));
  }, []);

  const getNodeIcon = (type: string, provider?: string) => {
    switch (type) {
      case 'start': return <Zap className="w-4 h-4" />;
      case 'ai': return <MessageSquare className="w-4 h-4" />;
      case 'decision': return <CheckCircle className="w-4 h-4" />;
      case 'end': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: string, provider?: string) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'ai': 
        switch (provider) {
          case 'openai': return 'bg-blue-500';
          case 'anthropic': return 'bg-orange-500';
          case 'google': return 'bg-red-500';
          default: return 'bg-purple-500';
        }
      case 'decision': return 'bg-yellow-500';
      case 'end': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  const renderConnection = (conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x + 40;
    const y1 = fromNode.y + 20;
    const x2 = toNode.x;
    const y2 = toNode.y + 20;

    // Create curved path for better visual flow
    const midX = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} Q ${midX} ${y1} ${x2} ${y2}`;

    return (
      <g key={conn.id}>
        <path
          d={path}
          stroke="#64748b"
          strokeWidth="2"
          fill="none"
          className={conn.animated ? "animate-pulse" : ""}
          markerEnd="url(#arrowhead)"
        />
        {conn.animated && (
          <circle 
            r="4" 
            fill="#3b82f6"
            className="animate-bounce"
          >
            <animateMotion dur="3s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  const simulateExecution = () => {
    setExecutionStep(0);
    const steps = ['start', 'gpt', 'claude', 'decision', 'end'];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setExecutionStep(index);
        // Animate connections leading to this step
        setConnections(prev => prev.map(conn => ({
          ...conn,
          animated: conn.to === step || (index === steps.length - 1 && conn.from === 'decision')
        })));
      }, index * 1500);
    });

    setTimeout(() => {
      setExecutionStep(-1);
      setConnections(SAMPLE_CONNECTIONS);
    }, steps.length * 1500 + 2000);
  };

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">AI Workflow Builder</h3>
          <p className="text-sm text-slate-600">Drag nodes to rearrange • Click to simulate execution</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={simulateExecution}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            data-testid="button-simulate-workflow"
          >
            <Zap className="w-4 h-4" />
            Simulate
          </button>
          <button
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
            data-testid="button-add-node"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
        </div>
      </div>

      <div className="relative bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-300 min-h-[400px] overflow-hidden">
        {/* SVG for connections */}
        <svg 
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ minHeight: '400px' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
              />
            </marker>
          </defs>
          {connections.map(renderConnection)}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute z-20 cursor-move transition-all duration-200 ${
              executionStep !== -1 ? 
                (nodes.indexOf(node) <= executionStep ? 'scale-110 shadow-lg' : 'opacity-50') : 
                'hover:scale-105'
            }`}
            style={{ 
              left: node.x, 
              top: node.y,
              transform: draggedNode === node.id ? 'scale(1.1)' : 'scale(1)'
            }}
            draggable
            onDragStart={(e) => {
              setDraggedNode(node.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDrag={(e) => {
              if (e.clientX > 0 && e.clientY > 0) {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const newX = e.clientX - rect.left - 40;
                  const newY = e.clientY - rect.top - 20;
                  handleNodeDrag(node.id, Math.max(0, newX), Math.max(0, newY));
                }
              }
            }}
            onDragEnd={() => setDraggedNode(null)}
            data-testid={`node-${node.id}`}
          >
            <div className={`
              w-20 h-10 ${getNodeColor(node.type, node.provider)} 
              rounded-lg flex items-center justify-center text-white shadow-md
              border-2 border-white relative
              ${executionStep !== -1 && nodes.indexOf(node) === executionStep ? 
                'animate-pulse ring-4 ring-blue-300' : ''}
            `}>
              {getNodeIcon(node.type, node.provider)}
              <Move className="absolute -top-2 -right-2 w-3 h-3 opacity-60" />
            </div>
            <div className="text-xs text-center mt-1 font-medium text-slate-700 bg-white/80 rounded px-1">
              {node.title}
            </div>
          </div>
        ))}

        {/* Execution progress indicator */}
        {executionStep !== -1 && (
          <div className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <div className="text-sm font-medium text-slate-700 mb-2">Execution Progress</div>
            <div className="flex gap-1">
              {nodes.map((node, index) => (
                <div
                  key={node.id}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= executionStep ? 'bg-green-500 scale-110' : 
                    index === executionStep + 1 ? 'bg-yellow-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {executionStep < nodes.length ? `Step ${executionStep + 1}: ${nodes[executionStep]?.title}` : 'Complete'}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <strong>Features Demonstrated:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Drag & drop nodes to rearrange workflow</li>
          <li>Animated connectors showing data flow direction</li>
          <li>Real-time execution simulation with progress tracking</li>
          <li>Provider-specific node colors (Blue=OpenAI, Orange=Anthropic)</li>
          <li>Interactive workflow building with visual feedback</li>
        </ul>
      </div>
    </div>
  );
}