import React from "react";

interface EventIconProps {
  event: string;
  className?: string;
}

export function EventIcon({ event, className = "w-8 h-8" }: EventIconProps) {
  switch (event) {
    case 'freestyle':
      // Olympic freestyle swimming - side view swimmer with freestyle stroke
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Swimmer body in freestyle position */}
            <path d="M3 12c0-1 1-2 2-2h2c1 0 2 1 2 2v1c0 1-1 2-2 2H5c-1 0-2-1-2-2v-1z"/>
            {/* Extended arm reaching forward */}
            <path d="M9 11h6c1 0 2 0 2 1s-1 1-2 1H9c0-1 0-2 0-2z"/>
            {/* Head position */}
            <circle cx="6" cy="9" r="1.5"/>
            {/* Water lines indicating movement */}
            <path d="M2 16h20M1 18h18M3 14h16" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          </g>
        </svg>
      );

    case 'backstroke':
      // Olympic backstroke - swimmer on back with arched position
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Swimmer on back with arched body */}
            <path d="M5 8c2-1 4-1 6 0s4 1 6 0c1 0 2 1 2 2s-1 2-2 2c-2 1-4 1-6 0s-4-1-6 0c-1 0-2-1-2-2s1-2 2-2z"/>
            {/* Head tilted back */}
            <circle cx="6" cy="6" r="1.5"/>
            {/* Arm extending backwards over head */}
            <path d="M8 4c2-1 4-2 6-1s3 3 2 4-3 0-4-1-3-1-4-2z"/>
            {/* Water surface lines */}
            <path d="M2 16h20M1 18h18M3 14h16" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          </g>
        </svg>
      );

    case 'relay':
      // Olympic relay - multiple swimmers or starting block with handoff
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Starting block/platform */}
            <rect x="2" y="14" width="20" height="2" rx="1"/>
            {/* Swimmer diving off */}
            <path d="M6 8c1-2 3-3 5-2s3 3 2 5-3 2-4 1-3-2-3-4z"/>
            {/* Second swimmer ready position */}
            <path d="M14 10c0-1 1-2 2-2s2 1 2 2v2c0 1-1 2-2 2s-2-1-2-2v-2z"/>
            {/* Team connection/baton handoff visual */}
            <path d="M10 12h4" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
            {/* Water splash effects */}
            <circle cx="8" cy="16" r="1" opacity="0.3"/>
            <circle cx="10" cy="17" r="0.5" opacity="0.3"/>
          </g>
        </svg>
      );

    default:
      // Default swimming icon
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16z"/>
        </svg>
      );
  }
}