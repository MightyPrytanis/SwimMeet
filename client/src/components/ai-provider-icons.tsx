import React from "react";

interface AIProviderIconProps {
  provider: string;
  className?: string;
}

export function AIProviderIcon({ provider, className = "w-10 h-10" }: AIProviderIconProps) {
  const baseClasses = "rounded-lg flex items-center justify-center";
  
  switch (provider) {
    case 'openai':
      return (
        <div className={`${baseClasses} ${className} bg-emerald-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
          </svg>
        </div>
      );
      
    case 'anthropic':
      return (
        <div className={`${baseClasses} ${className} bg-orange-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2L14.09 8.26L20 6L18.74 12L24 12L18.74 12L20 18L14.09 15.74L12 22L9.91 15.74L4 18L5.26 12L0 12L5.26 12L4 6L9.91 8.26L12 2Z"/>
          </svg>
        </div>
      );
      
    case 'google':
      return (
        <div className={`${baseClasses} ${className} bg-blue-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12.017 2.016c5.517 0 9.997 4.48 9.997 9.998s-4.48 9.998-9.997 9.998S2.02 17.532 2.02 12.014 6.5 2.016 12.017 2.016zm0 1.5c-4.69 0-8.497 3.807-8.497 8.498s3.807 8.498 8.497 8.498 8.497-3.807 8.497-8.498-3.807-8.498-8.497-8.498zm2.25 5.25h-4.5v1.5h2.734c-.234 1.266-1.266 2.25-2.734 2.25-1.518 0-2.75-1.232-2.75-2.75s1.232-2.75 2.75-2.75c.703 0 1.359.281 1.828.75l1.078-1.078C11.859 5.672 10.984 5.25 10.017 5.25c-2.344 0-4.25 1.906-4.25 4.25s1.906 4.25 4.25 4.25c2.344 0 4.25-1.906 4.25-4.25 0-.281-.031-.562-.094-.828h-2.156v-1.406z"/>
          </svg>
        </div>
      );
      
    case 'microsoft':
      return (
        <div className={`${baseClasses} ${className} bg-blue-700 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
        </div>
      );
      
    case 'perplexity':
      return (
        <div className={`${baseClasses} ${className} bg-purple-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2L4 7.5L12 13L20 7.5L12 2ZM4 16.5L12 22L20 16.5L16 14L12 16.5L8 14L4 16.5ZM4 10.5L8 13L12 10.5L16 13L20 10.5V7.5L12 13L4 7.5V10.5Z"/>
          </svg>
        </div>
      );
      
    case 'deepseek':
      return (
        <div className={`${baseClasses} ${className} bg-gray-800 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16zm7-4L13 14.5 13 9.5 15.5 12zm-7 0L6.5 12 9 9.5 9 14.5 6.5 12z"/>
          </svg>
        </div>
      );
      
    case 'grok':
      return (
        <div className={`${baseClasses} ${className} bg-black text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      );
      
    case 'llama':
      return (
        <div className={`${baseClasses} ${className} bg-blue-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M23.5 6.5C23.5 3.74 21.26 1.5 18.5 1.5S13.5 3.74 13.5 6.5v11c0 2.76 2.24 5 5 5s5-2.24 5-5v-11zM.5 6.5C.5 3.74 2.74 1.5 5.5 1.5S10.5 3.74 10.5 6.5v11c0 2.76-2.24 5-5 5s-5-2.24-5-5v-11z"/>
          </svg>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClasses} ${className} bg-gray-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
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