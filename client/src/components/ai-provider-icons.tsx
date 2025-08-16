import React from "react";

interface AIProviderIconProps {
  provider: string;
  className?: string;
}

export function AIProviderIcon({ provider, className = "w-10 h-10" }: AIProviderIconProps) {
  const baseClasses = "rounded-lg flex items-center justify-center";
  
  switch (provider) {
    case 'openai':
      // ChatGPT favicon - green circle with white sparkle/star
      return (
        <div className={`${baseClasses} ${className} bg-green-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      );
      
    case 'anthropic':
      // Claude favicon - orange "A" symbol
      return (
        <div className={`${baseClasses} ${className} bg-orange-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2L8 22h2.5l1-4h5l1 4H20L16 2h-4zm-1 6l1.5 6h-3L10.5 8z"/>
          </svg>
        </div>
      );
      
    case 'google':
      // Google Gemini favicon - blue diamond/gem shape
      return (
        <div className={`${baseClasses} ${className} bg-blue-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2l6 6-6 6-6-6 6-6zm0 4L8 10l4 4 4-4-4-4z"/>
            <path d="M12 10l6 6-6 6-6-6 6-6z" opacity="0.7"/>
          </svg>
        </div>
      );
      
    case 'microsoft':
      // Microsoft Copilot favicon - blue with white Microsoft squares
      return (
        <div className={`${baseClasses} ${className} bg-blue-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M11.4 11.4H2V2h9.4v9.4zM22 11.4h-9.4V2H22v9.4zM11.4 22H2v-9.4h9.4V22zM22 22h-9.4v-9.4H22V22z"/>
          </svg>
        </div>
      );
      
    case 'perplexity':
      // Perplexity favicon - dark circle with stylized design
      return (
        <div className={`${baseClasses} ${className} bg-slate-700 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 10h8M8 14h8" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </div>
      );
      
    case 'deepseek':
      // DeepSeek favicon - simple geometric design
      return (
        <div className={`${baseClasses} ${className} bg-black text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
      
    case 'grok':
      // Grok/X favicon - black with white X (correct design)
      return (
        <div className={`${baseClasses} ${className} bg-black text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      );
      
    case 'llama':
      // Meta/Llama favicon - blue with simplified Meta symbol
      return (
        <div className={`${baseClasses} ${className} bg-blue-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16z"/>
          </svg>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClasses} ${className} bg-gray-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" fill="none"/>
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