import React from 'react';

export interface AlloraLogoProps {
  variant?: 'primary' | 'monochrome' | 'white' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  withContainer?: boolean;
  animated?: boolean;
}

export const AlloraLogo: React.FC<AlloraLogoProps> = ({
  variant = 'primary',
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
  withContainer = true,
  animated = false,
}) => {
  const sizeMap = {
    sm: { symbol: 28, font: 'text-sm', tagFont: 'text-[9px]' },
    md: { symbol: 36, font: 'text-lg', tagFont: 'text-[11px]' },
    lg: { symbol: 52, font: 'text-2xl', tagFont: 'text-xs' },
    xl: { symbol: 72, font: 'text-3xl', tagFont: 'text-sm' },
    '2xl': { symbol: 96, font: 'text-4xl', tagFont: 'text-base' },
    hero: { symbol: 120, font: 'text-5xl', tagFont: 'text-lg' },
  };

  const currentSize = sizeMap[size];

  const textColor = variant === 'white' ? 'text-white' : 'text-[#19344A] dark:text-white';
  const tagColor = variant === 'white' ? 'text-white/80' : 'text-[#19344A]/70 dark:text-white/70';

  const fontStyle = {
    fontFamily: "'Montserrat', system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: '0.04em',
  };

  const taglineStyle = {
    fontFamily: "'Montserrat', system-ui, sans-serif",
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official ALLORA SVG Logo Icon with App Badge Styling */}
      <div 
        className={`relative shrink-0 rounded-2xl overflow-hidden transition-all duration-300 ${
          withContainer 
            ? variant === 'white'
              ? 'shadow-xs border border-white/20 bg-white/10 backdrop-blur-xs'
              : 'shadow-xs border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 bg-[#fefefe]' 
            : ''
        } ${animated ? 'hover:scale-105 active:scale-95' : ''}`}
        style={{ width: currentSize.symbol, height: currentSize.symbol }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1095 1095"
          width="100%"
          height="100%"
          className="w-full h-full block no-unify"
          aria-label="Logo ALLORA"
        >
          <path
            d="M838.73 239.43C850.92 237.86 863.18 238.82 874.87 242.58C895.8 249.31 913.24 263.05 924.41 282.1C948.04 322.39 931.95 376.84 891.61 399.08C882.91 403.88 873.33 407.36 863.46 408.78C850.86 410.61 838.52 409.79 826.3 406.31C815.98 403.39 806.8 398.71 798.09 392.41C788.57 385.53 781.08 376.29 775.41 366.09C752.23 324.43 768 272.55 808.99 249.49C818.18 244.32 828.24 240.78 838.73 239.43ZM843.66 293.35C811.17 298.56 809.41 345.42 840.51 355C845.8 356.63 851.88 356.74 857.29 355.66C884.65 350.2 890.41 313.82 868.34 298.13C861.29 293.12 852.02 292.01 843.66 293.35ZM807.5 711.11C801.86 716.48 797.68 724.17 792.93 730.39C783.61 742.61 773.95 754.71 763.36 765.86C726.18 805.01 682.77 839.1 633.81 862.32C617.98 869.83 601.85 877.02 585.25 882.67C482.05 917.82 357.89 919.97 258.45 872.05C195.72 841.83 144.07 792.31 131.22 721.45C128.68 707.39 128.07 692.76 128.87 678.5C133.34 598.7 180.8 525.43 236.57 471.07C313.39 396.21 416.66 345.58 522.46 328.77C595.6 317.15 671.34 322.2 738.02 356.49C757.68 366.6 775.34 380.07 791.78 394.7C853.26 449.44 877.94 525.95 887.69 605.55C894.15 658.27 894.6 711.41 906.18 763.45C912.92 793.72 924.88 822.58 942.09 848.36C952.67 864.2 968.6 882.02 958.89 902.38C953.17 914.39 940.1 919.51 927.5 919.74C907.63 920.1 887.32 910.93 872.51 898C836.66 866.71 820.28 815.21 814.4 769.31C812.96 758.05 811.31 746.8 810.21 735.5C809.42 727.48 809.51 718.89 807.5 711.11ZM581.75 405.46C470.96 412.79 350.72 469.62 290.63 566.15C259.23 616.59 243.53 677.53 280.99 729.47C287.43 738.4 295.59 746.5 304.15 753.39C341.72 783.64 390.33 795.23 437.47 798.38C523.06 804.09 611.17 774.9 677.57 721.03C708.76 695.73 736.2 664.71 753.89 628.39C763.93 607.77 771.22 586.16 774.76 563.46C777.36 546.76 777.47 529.21 774.91 512.5C773.61 504.02 771.16 495.5 767.86 487.59C738.96 418.32 648.63 401.04 581.75 405.46Z"
            fill={
              variant === 'white' 
                ? '#FFFFFF' 
                : variant === 'monochrome' 
                ? 'currentColor' 
                : '#3e9ee0'
            }
            fillRule="evenodd"
            stroke={
              variant === 'white' 
                ? '#FFFFFF' 
                : variant === 'monochrome' 
                ? 'currentColor' 
                : '#3e9ee0'
            }
            strokeWidth="0.25"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`${currentSize.font} ${textColor} tracking-tight font-bold`}
            style={fontStyle}
          >
            ALLORA
          </span>
          {showTagline && (
            <span 
              className={`font-medium tracking-normal mt-1 ${currentSize.tagFont} ${tagColor}`}
              style={taglineStyle}
            >
              Ensemble pour aller plus loin
            </span>
          )}
        </div>
      )}
    </div>
  );
};
