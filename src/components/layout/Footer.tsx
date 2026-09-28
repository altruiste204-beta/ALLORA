import React from 'react';
import { AlloraLogo } from '../common/AlloraLogo';
import { useLanguage } from '../../context/LanguageContext';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'light' }) => {
  const { t } = useLanguage();
  const isDark = variant === 'dark';

  return (
    <footer
      className={`w-full relative z-10 transition-colors ${
        isDark
          ? 'bg-[#111315] border-t border-[#67B7E8]/10 text-white/80 py-8 pb-10'
          : 'bg-white dark:bg-[#111315] border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 mt-12 py-8 pb-24 md:pb-10 text-[#19344A] dark:text-[#FAF9F6]/70'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b ${
            isDark ? 'border-white/10' : 'border-[#E8E4D9] dark:border-[#67B7E8]/10'
          }`}
        >
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <AlloraLogo 
              size="sm" 
              variant={isDark ? 'white' : 'primary'} 
              withContainer={false} 
            />
            <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-[#6F7B85]'}`}>
              {t.brand.tagline}
            </p>
          </div>

          <div className="flex flex-col text-center sm:text-right max-w-sm">
            <p className={`text-[10px] font-bold ${isDark ? 'text-white/60' : 'text-[#19344A] dark:text-[#FAF9F6]/70'}`}>
              « {t.brand.corePhilosophy1} »
            </p>
            <p className={`text-[10px] font-bold mt-1 ${isDark ? 'text-white/60' : 'text-[#19344A] dark:text-[#FAF9F6]/70'}`}>
              « {t.brand.corePhilosophy2} »
            </p>
          </div>
        </div>

        <div
          className={`pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[10px] font-black uppercase tracking-widest ${
            isDark ? 'text-white/30' : 'text-[#6F7B85]'
          }`}
        >
          <div>
            <span>{t.brand.footer}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
