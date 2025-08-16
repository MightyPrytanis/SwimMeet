import React from "react";

interface EventIconProps {
  event: string;
  className?: string;
}

export function EventIcon({ event, className = "w-8 h-8" }: EventIconProps) {
  switch (event) {
    case 'freestyle':
      // Freestyle swimmer - human figure in horizontal swimming position
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Swimmer head */}
            <circle cx="4" cy="10" r="2"/>
            {/* Body in streamlined position */}
            <ellipse cx="9" cy="11" rx="4" ry="1.5"/>
            {/* Extended arm reaching forward */}
            <ellipse cx="16" cy="9" rx="3" ry="0.8" transform="rotate(15 16 9)"/>
            {/* Legs kicking */}
            <ellipse cx="14" cy="13" rx="2" ry="0.6" transform="rotate(-10 14 13)"/>
            <ellipse cx="15" cy="14.5" rx="2" ry="0.6" transform="rotate(10 15 14.5)"/>
            {/* Water ripples */}
            <path d="M2 18c4-1 8-1 12 0s8 1 8 0" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          </g>
        </svg>
      );

    case 'backstroke':
      // Backstroke swimmer - human figure on back with arched position
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Swimmer head tilted back */}
            <circle cx="6" cy="8" r="2"/>
            {/* Arched body on back */}
            <path d="M8 9c3-2 6-1 8 1" stroke="currentColor" strokeWidth="3" fill="none"/>
            {/* Arm extending over head */}
            <ellipse cx="12" cy="5" rx="3" ry="0.8" transform="rotate(-30 12 5)"/>
            {/* Other arm by side */}
            <ellipse cx="18" cy="12" rx="2.5" ry="0.7" transform="rotate(45 18 12)"/>
            {/* Legs */}
            <ellipse cx="16" cy="14" rx="2" ry="0.6"/>
            {/* Water surface */}
            <path d="M2 18c4-1 8-1 12 0s8 1 8 0" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          </g>
        </svg>
      );

    case 'relay':
      // Based on the attached relay icon - starting block with swimmers
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <g>
            {/* Starting block platform */}
            <rect x="2" y="14" width="8" height="4" rx="1"/>
            {/* Swimmer on starting block - ready position */}
            <circle cx="6" cy="11" r="1.5"/>
            <rect x="5" y="12" width="2" height="2" rx="0.5"/>
            {/* Arms in ready position */}
            <ellipse cx="4" cy="13" rx="1" ry="0.4" transform="rotate(-45 4 13)"/>
            <ellipse cx="8" cy="13" rx="1" ry="0.4" transform="rotate(45 8 13)"/>
            
            {/* Second swimmer in water */}
            <circle cx="16" cy="16" r="1.5"/>
            <ellipse cx="18" cy="17" rx="2" ry="0.8" transform="rotate(15 18 17)"/>
            <ellipse cx="14" cy="18" rx="1.5" ry="0.6" transform="rotate(-20 14 18)"/>
            
            {/* Water waves */}
            <path d="M12 20c2-0.5 4-0.5 6 0s4 0.5 6 0" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M12 22c2-0.5 4-0.5 6 0s4 0.5 6 0" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          </g>
        </svg>
      );

    default:
      // Default swimming icon
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      );
  }
}