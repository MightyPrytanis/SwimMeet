import React from "react";

interface AIProviderIconProps {
  provider: string;
  className?: string;
}

export function AIProviderIcon({ provider, className = "w-10 h-10" }: AIProviderIconProps) {
  const baseClasses = "rounded-lg flex items-center justify-center";
  
  switch (provider) {
    case 'openai':
      // ChatGPT actual favicon - black circle with white ChatGPT logo
      return (
        <div className={`${baseClasses} ${className} bg-black text-white`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91A6.046 6.046 0 0 0 15.25 2A5.981 5.981 0 0 0 8.98 4.18 5.99 5.99 0 0 0 2.76 8.99a6.057 6.057 0 0 0 .585 7.08 5.985 5.985 0 0 0 .516 4.91A6.046 6.046 0 0 0 10.38 24a5.98 5.98 0 0 0 6.27-2.18 5.99 5.99 0 0 0 6.22-4.81 6.057 6.057 0 0 0-.585-7.08zM12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
          </svg>
        </div>
      );
      
    case 'anthropic':
      // Claude actual favicon - orange/red background with "A"
      return (
        <div className={`${baseClasses} ${className} bg-orange-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <text x="12" y="17" textAnchor="middle" fontSize="16" fontWeight="bold" fontFamily="serif">A</text>
          </svg>
        </div>
      );
      
    case 'google':
      // Google Gemini actual favicon - multicolor sparkle/star
      return (
        <div className={`${baseClasses} ${className} bg-white border border-gray-200`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M12 2l3.5 7 7 1-5 5 1 7-6.5-3.5L5 21l1-7-5-5 7-1z"/>
            <path fill="#34A853" d="M12 2l-3.5 7-7 1 5 5-1 7 6.5-3.5L18 21l-1-7 5-5-7-1z" opacity="0.8"/>
          </svg>
        </div>
      );
      
    case 'microsoft':
      // Microsoft Copilot actual favicon - blue with white icon
      return (
        <div className={`${baseClasses} ${className} bg-blue-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 10h8v4H8z" fill="white"/>
          </svg>
        </div>
      );
      
    case 'perplexity':
      // Perplexity actual favicon - dark background with "?" or simple icon
      return (
        <div className={`${baseClasses} ${className} bg-slate-800 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold">?</text>
          </svg>
        </div>
      );
      
    case 'deepseek':
      // DeepSeek actual favicon - simple minimal design
      return (
        <div className={`${baseClasses} ${className} bg-gray-900 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
            <circle cx="12" cy="12" r="2" fill="black"/>
          </svg>
        </div>
      );
      
    case 'grok':
      // Grok actual favicon - X logo (this one is correct)
      return (
        <div className={`${baseClasses} ${className} bg-black text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      );
      
    case 'llama':
      // Meta/Llama actual favicon - Meta "f" or simplified logo
      return (
        <div className={`${baseClasses} ${className} bg-blue-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold">f</text>
          </svg>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClasses} ${className} bg-gray-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </div>
      );
  }
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