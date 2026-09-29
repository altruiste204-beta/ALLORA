import React from 'react';
import { Opportunity } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Church, Tag, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isOwner?: boolean;
  onClick: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isOwner,
  onClick,
}) => {
  const { t } = useLanguage();

  const isOffer = opportunity.type === 'service' || opportunity.type === 'volunteer';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#67B7E8] rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[#67B7E8]/10 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOffer
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-[#67B7E8]/15 text-[#19344A] dark:text-[#67B7E8] border border-[#67B7E8]/30'
              }`}
            >
              {isOffer ? t.opportunities.tabPropose : t.opportunities.tabSearch}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#6F7B85] dark:text-[#FAF9F6]/70 text-[10px] font-bold border border-[#E8E4D9] dark:border-transparent">
              {opportunity.category}
            </span>
          </div>

          {isOwner && (
            <span className="px-2 py-0.5 rounded-md bg-[#19344A] text-white text-[9px] font-bold">
              Mon annonce
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-black text-[#19344A] dark:text-white group-hover:text-[#67B7E8] transition-colors line-clamp-2 mb-2">
          {opportunity.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 line-clamp-3 leading-relaxed mb-4">
          {opportunity.description}
        </p>

        {/* Skills Tags */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opportunity.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#111315]/40 text-[#19344A] dark:text-[#FAF9F6] text-[10px] font-semibold border border-[#E8E4D9]/60 dark:border-white/5"
              >
                <Tag className="w-2.5 h-2.5 text-[#67B7E8]" />
                <span>{skill}</span>
              </span>
            ))}
            {opportunity.skills.length > 3 && (
              <span className="px-1.5 py-1 text-[10px] font-bold text-[#6F7B85]">
                +{opportunity.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            {opportunity.authorPhotoUrl ? (
              <img
                src={opportunity.authorPhotoUrl}
                alt={opportunity.authorName || 'Auteur'}
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#67B7E8]/30"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#67B7E8] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {opportunity.authorName ? opportunity.authorName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <span className="truncate text-xs font-bold text-[#19344A] dark:text-white">
              {opportunity.authorName || 'Membre ALLORA'}
            </span>
          </div>

          {/* Location */}
          {opportunity.location && (
            <div className="flex items-center gap-1 text-[11px] truncate shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#67B7E8]" />
              <span className="truncate max-w-[100px]">{opportunity.location}</span>
            </div>
          )}
        </div>

        {/* Church or action prompt */}
        <div className="flex items-center justify-between text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/50">
          {opportunity.churchName ? (
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <Church className="w-3 h-3 text-[#67B7E8]" />
              <span className="truncate">{opportunity.churchName}</span>
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1 font-bold text-[#67B7E8] group-hover:translate-x-1 transition-transform">
            <span>Détails</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
