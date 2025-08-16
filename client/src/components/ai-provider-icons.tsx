import React from "react";

interface AIProviderIconProps {
  provider: string;
  className?: string;
  status?: 'connected' | 'setup_required' | 'error';
}

export function AIProviderIcon({ provider, className = "w-10 h-10", status = 'setup_required' }: AIProviderIconProps) {
  const baseClasses = "rounded-full flex items-center justify-center border-2 border-white shadow-lg overflow-hidden relative";
  
  const getProviderConfig = (provider: string) => {
    switch (provider) {
      case 'openai':
        return { favicon: '/favicons/openai.ico', initial: 'O', color: 'bg-black' };
      case 'anthropic':
        return { favicon: '/favicons/anthropic.ico', initial: 'A', color: 'bg-orange-500' };
      case 'google':
        return { favicon: '/favicons/google.ico', initial: 'G', color: 'bg-blue-500' };
      case 'microsoft':
        return { favicon: '/favicons/microsoft.ico', initial: 'M', color: 'bg-blue-600' };
      case 'perplexity':
        return { favicon: '/favicons/perplexity.ico', initial: 'P', color: 'bg-slate-800' };
      case 'deepseek':
        return { favicon: '/favicons/deepseek.ico', initial: 'D', color: 'bg-gray-900' };
      case 'grok':
        return { favicon: '/favicons/grok.ico', initial: 'X', color: 'bg-black' };
      case 'llama':
        return { favicon: '/favicons/llama.ico', initial: 'L', color: 'bg-blue-600' };
      default:
        return { favicon: '', initial: '?', color: 'bg-gray-500' };
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
  
  const config = getProviderConfig(provider);
  const statusColor = getStatusIndicator(status);
  
  return (
    <div className={`${baseClasses} ${className}`}>
      <img 
        src={config.favicon} 
        alt={`${provider} favicon`}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement!;
          parent.innerHTML = `<div class="${config.color} w-full h-full flex items-center justify-center text-white font-bold text-lg">${config.initial}</div><div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${statusColor}"></div>`;
        }}
        onLoad={(e) => {
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement!;
          // Add status indicator after image loads
          const statusDiv = document.createElement('div');
          statusDiv.className = `absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${statusColor}`;
          parent.appendChild(statusDiv);
        }}
      />
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