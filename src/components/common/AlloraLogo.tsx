import React from 'react';

interface AlloraLogoProps {
  variant?: 'primary' | 'monochrome' | 'white' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AlloraLogo: React.FC<AlloraLogoProps> = ({
  variant = 'primary',
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { symbol: 24, font: 'text-base', dot: 3 },
    md: { symbol: 32, font: 'text-xl', dot: 4 },
    lg: { symbol: 42, font: 'text-2xl', dot: 5 },
    xl: { symbol: 56, font: 'text-3xl', dot: 6 },
  };

  const currentSize = sizeMap[size];

  // Color mappings conforming strictly to ALLORA guidelines
  const curveColor1 =
    variant === 'primary'
      ? '#19344A' // Deep Blue
      : variant === 'white'
      ? '#FFFFFF'
      : '#111315'; // Soft Black

  const curveColor2 =
    variant === 'primary'
      ? '#67B7E8' // Light Blue
      : variant === 'white'
      ? '#FAF9F6' // Off-white
      : '#19344A';

  const dotColor =
    variant === 'primary'
      ? '#67B7E8' // Light Blue
      : variant === 'white'
      ? '#FFFFFF'
      : '#19344A';

  const textColor =
    variant === 'white' ? 'text-[#FFFFFF]' : 'text-[#19344A]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Abstract A symbol with two connected curves and meeting dot */}
      <svg
        width={currentSize.symbol}
        height={currentSize.symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
        aria-label="Logo ALLORA"
      >
        {/* Left primary ascending curve */}
        <path
          d="M 22 84 C 24 55 42 22 66 18 C 74 16 80 20 80 28 C 80 40 68 56 46 64 C 36 68 28 76 22 84 Z"
          fill={curveColor1}
        />
        {/* Right supportive connecting bridge curve forming the A crossway */}
        <path
          d="M 38 60 C 48 54 66 50 78 58 C 84 62 84 72 78 78 C 70 86 52 82 42 74 Z"
          fill={curveColor2}
          opacity={variant === 'primary' ? '0.95' : '1'}
        />
        {/* The Connection Dot: representing encounter, unity, and need-response convergence */}
        <circle cx="50" cy="38" r="8" fill={dotColor} />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-tight ${currentSize.font} ${textColor}`}
            style={{ fontFamily: "'Hero New', 'Montserrat', sans-serif", letterSpacing: '-0.03em' }}
          >
            ALLORA
          </span>
        </div>
      )}
    </div>
  );
};
