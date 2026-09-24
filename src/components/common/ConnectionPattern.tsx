import React from 'react';

interface ConnectionPatternProps {
  className?: string;
  opacity?: number;
}

export const ConnectionPattern: React.FC<ConnectionPatternProps> = ({
  className = '',
  opacity = 0.35,
}) => {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      width="100%"
      height="100%"
      viewBox="0 0 600 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="allora-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#19344A" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#67B7E8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#19344A" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Connection Links */}
      <line x1="80" y1="60" x2="220" y2="40" stroke="url(#allora-line-grad)" strokeWidth="1.2" strokeDasharray="3 3" />
      <line x1="220" y1="40" x2="360" y2="100" stroke="url(#allora-line-grad)" strokeWidth="1.2" />
      <line x1="360" y1="100" x2="480" y2="60" stroke="url(#allora-line-grad)" strokeWidth="1.2" strokeDasharray="4 4" />
      <line x1="220" y1="40" x2="280" y2="170" stroke="url(#allora-line-grad)" strokeWidth="1" />
      <line x1="280" y1="170" x2="420" y2="190" stroke="url(#allora-line-grad)" strokeWidth="1.2" strokeDasharray="2 3" />
      <line x1="420" y1="190" x2="520" y2="140" stroke="url(#allora-line-grad)" strokeWidth="1" />
      <line x1="120" y1="160" x2="280" y2="170" stroke="url(#allora-line-grad)" strokeWidth="1.2" />

      {/* Nodes - Cold palette: deep blue, light blue, soft aged ivory */}
      <circle cx="80" cy="60" r="4.5" fill="#19344A" />
      <circle cx="220" cy="40" r="6" fill="#67B7E8" />
      <circle cx="220" cy="40" r="10" stroke="#67B7E8" strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="360" cy="100" r="5" fill="#19344A" />
      <circle cx="480" cy="60" r="4" fill="#67B7E8" />
      <circle cx="280" cy="170" r="5.5" fill="#67B7E8" />
      <circle cx="280" cy="170" r="9" stroke="#19344A" strokeWidth="1" strokeOpacity="0.25" />
      <circle cx="420" cy="190" r="4.5" fill="#19344A" />
      <circle cx="520" cy="140" r="5" fill="#67B7E8" />
      <circle cx="120" cy="160" r="3.5" fill="#19344A" />
    </svg>
  );
};
