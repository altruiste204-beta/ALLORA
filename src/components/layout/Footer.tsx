import React from 'react';
import { AlloraLogo } from '../common/AlloraLogo';
import { i18n } from '../../i18n';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFFFFF] border-t border-[#E8E4D9] mt-12 py-8 pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E8E4D9]/60">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <AlloraLogo size="sm" />
            <p className="text-xs text-[#19344A]/70 mt-1 font-medium">
              {i18n.brand.tagline}
            </p>
          </div>

          <div className="flex flex-col text-center sm:text-right max-w-sm">
            <p className="text-[11px] text-[#19344A]/60 italic">
              « {i18n.brand.corePhilosophy1} »
            </p>
            <p className="text-[11px] text-[#19344A]/60 italic mt-0.5">
              « {i18n.brand.corePhilosophy2} »
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-[#19344A]/60 font-medium">
          <div>
            <span>©ALLORA • All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#19344A]/80">{i18n.phases.phase1Badge}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
