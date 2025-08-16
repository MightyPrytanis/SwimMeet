import React from "react";

interface AIProviderIconProps {
  provider: string;
  className?: string;
  status?: 'connected' | 'setup_required' | 'error';
}

export function AIProviderIcon({ provider, className = "w-10 h-10", status = 'setup_required' }: AIProviderIconProps) {
  const baseClasses = "rounded-full flex items-center justify-center border-2 border-white shadow-lg font-bold text-lg relative";
  
  // Use first initials for all providers
  const getInitialAndColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return { initial: 'C', color: 'bg-black' };
      case 'anthropic':
        return { initial: 'C', color: 'bg-orange-500' };
      case 'google':
        return { initial: 'G', color: 'bg-blue-500' };
      case 'microsoft':
        return { initial: 'C', color: 'bg-blue-600' };
      case 'perplexity':
        return { initial: 'P', color: 'bg-slate-800' };
      case 'deepseek':
        return { initial: 'D', color: 'bg-gray-900' };
      case 'grok':
        return { initial: 'G', color: 'bg-black' };
      case 'llama':
        return { initial: 'L', color: 'bg-blue-600' };
      default:
        return { initial: '?', color: 'bg-gray-500' };
    }
  };
  
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'setup_required':
      default:
        return 'bg-yellow-500';
    }
  };
  
  const { initial, color } = getInitialAndColor(provider);
  const statusColor = getStatusIndicator(status);
  
  return (
    <div className={`${baseClasses} ${className} ${color} text-white`}>
      {initial}
      {/* Status indicator light */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${statusColor}`}></div>
    </div>
  );
}

export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'ChatGPT™',
    anthropic: 'Claude™', 
    google: 'Gemini™',
    microsoft: 'Copilot™',
    perplexity: 'Perplexity™',
    deepseek: 'DeepSeek™',
    grok: 'Grok™',
    llama: 'Llama™'
  };
  return names[provider] || provider;
}