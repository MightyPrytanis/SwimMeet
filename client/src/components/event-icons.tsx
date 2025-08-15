import React from "react";

interface EventIconProps {
  event: string;
  className?: string;
}

export function EventIcon({ event, className = "w-8 h-8" }: EventIconProps) {
  const baseClasses = "rounded-lg flex items-center justify-center";
  
  switch (event) {
    case 'freestyle':
      return (
        <div className={`${baseClasses} ${className} bg-blue-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
          </svg>
        </div>
      );
      
    case 'backstroke':
      return (
        <div className={`${baseClasses} ${className} bg-emerald-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2C17.52 2 22 6.48 22 12S17.52 22 12 22S2 17.52 2 12S6.48 2 12 2ZM12 4C7.59 4 4 7.59 4 12S7.59 20 12 20S20 16.41 20 12S16.41 4 12 4ZM12 6L16 10H13V18H11V10H8L12 6Z"/>
          </svg>
        </div>
      );
      
    case 'relay':
      return (
        <div className={`${baseClasses} ${className} bg-purple-600 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM12 4C16.41 4 20 7.59 20 12S16.41 20 12 20S4 16.41 4 12S7.59 4 12 4ZM8 8V16L16 12L8 8Z"/>
          </svg>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClasses} ${className} bg-gray-500 text-white`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM12 4C16.41 4 20 7.59 20 12S16.41 20 12 20S4 16.41 4 12S7.59 4 12 4ZM11 7V13H13V7H11ZM11 15V17H13V15H11Z"/>
          </svg>
        </div>
      );
  }
}