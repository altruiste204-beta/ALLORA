import React from 'react';

export interface AlloraAnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  showTagline?: boolean;
  text?: string;
  className?: string;
}

export const AlloraAnimatedLogo: React.FC<AlloraAnimatedLogoProps> = ({
  size = 'lg',
  showText = false,
  showTagline = false,
  text,
  className = '',
}) => {
  const sizeMap = {
    sm: { symbol: 36, font: 'text-sm', tagFont: 'text-[9px]', padding: 'p-2', radius: 'rounded-xl' },
    md: { symbol: 52, font: 'text-lg', tagFont: 'text-[11px]', padding: 'p-2.5', radius: 'rounded-2xl' },
    lg: { symbol: 76, font: 'text-2xl', tagFont: 'text-xs', padding: 'p-3.5', radius: 'rounded-2xl' },
    xl: { symbol: 96, font: 'text-3xl', tagFont: 'text-sm', padding: 'p-4', radius: 'rounded-3xl' },
    hero: { symbol: 120, font: 'text-4xl', tagFont: 'text-base', padding: 'p-5', radius: 'rounded-3xl' },
  };

  const currentSize = sizeMap[size];

  const fontStyle = {
    fontFamily: "'Montserrat', system-ui, sans-serif",
    fontWeight: 800,
    letterSpacing: '0.04em',
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-4 select-none ${className}`}>
      {/* Official ALLORA SVG Logo Icon with Tri-Color Animated Badge */}
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center transition-all duration-300 animate-allora-badge-cycle ${currentSize.radius} ${currentSize.padding}`}
        style={{ width: currentSize.symbol, height: currentSize.symbol }}
        role="status"
        aria-label="Chargement ALLORA"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1095 1095"
          width="100%"
          height="100%"
          className="w-full h-full block animate-allora-symbol-cycle"
          aria-hidden="true"
        >
          <path
            d="M838.73 239.43C850.92 237.86 863.18 238.82 874.87 242.58C895.8 249.31 913.24 263.05 924.41 282.1C948.04 322.39 931.95 376.84 891.61 399.08C882.91 403.88 873.33 407.36 863.46 408.78C850.86 410.61 838.52 409.79 826.3 406.31C815.98 403.39 806.8 398.71 798.09 392.41C788.57 385.53 781.08 376.29 775.41 366.09C752.23 324.43 768 272.55 808.99 249.49C818.18 244.32 828.24 240.78 838.73 239.43ZM843.66 293.35C811.17 298.56 809.41 345.42 840.51 355C845.8 356.63 851.88 356.74 857.29 355.66C884.65 350.2 890.41 313.82 868.34 298.13C861.29 293.12 852.02 292.01 843.66 293.35ZM807.5 711.11C801.86 716.48 797.68 724.17 792.93 730.39C783.61 742.61 773.95 754.71 763.36 765.86C726.18 805.01 682.77 839.1 633.81 862.32C617.98 869.83 601.85 877.02 585.25 882.67C482.05 917.82 357.89 919.97 258.45 872.05C195.72 841.83 144.07 792.31 131.22 721.45C128.68 707.39 128.07 692.76 128.87 678.5C133.34 598.7 180.8 525.43 236.57 471.07C313.39 396.21 416.66 345.58 522.46 328.77C595.6 317.15 671.34 322.2 738.02 356.49C757.68 366.6 775.34 380.07 791.78 394.7C853.26 449.44 877.94 525.95 887.69 605.55C894.15 658.27 894.6 711.41 906.18 763.45C912.92 793.72 924.88 822.58 942.09 848.36C952.67 864.2 968.6 882.02 958.89 902.38C953.17 914.39 940.1 919.51 927.5 919.74C907.63 920.1 887.32 910.93 872.51 898C836.66 866.71 820.28 815.21 814.4 769.31C812.96 758.05 811.31 746.8 810.21 735.5C809.42 727.48 809.51 718.89 807.5 711.11ZM581.75 405.46C470.96 412.79 350.72 469.62 290.63 566.15C259.23 616.59 243.53 677.53 280.99 729.47C287.43 738.4 295.59 746.5 304.15 753.39C341.72 783.64 390.33 795.23 437.47 798.38C523.06 804.09 611.17 774.9 677.57 721.03C708.76 695.73 736.2 664.71 753.89 628.39C763.93 607.77 771.22 586.16 774.76 563.46C777.36 546.76 777.47 529.21 774.91 512.5C773.61 504.02 771.16 495.5 767.86 487.59C738.96 418.32 648.63 401.04 581.75 405.46Z"
            fillRule="evenodd"
            strokeWidth="0.25"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {(showText || text) && (
        <div className="flex flex-col items-center justify-center text-center leading-none">
          {showText && (
            <span
              className={`${currentSize.font} text-[#19344A] dark:text-white tracking-tight font-extrabold`}
              style={fontStyle}
            >
              ALLORA
            </span>
          )}
          {showTagline && (
            <span className={`font-semibold tracking-normal mt-1.5 ${currentSize.tagFont} text-[#67B7E8]`}>
              Connectés pour servir
            </span>
          )}
          {text && (
            <p className="text-xs sm:text-sm font-semibold text-[#6F7B85] dark:text-white/80 mt-2 animate-pulse">
              {text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
