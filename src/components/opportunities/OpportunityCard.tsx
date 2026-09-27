import React from 'react';
import { Opportunity, OpportunityType } from '../../types';
import { Briefcase, HeartHandshake, UserCheck, Search, MapPin, Calendar, Building2, User, ChevronRight, Tag } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
  isOwner?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onClick,
  isOwner = false
}) => {
  const getTypeBadge = (type: OpportunityType) => {
    switch (type) {
      case 'service':
        return {
          label: 'Service proposé',
          bg: 'bg-[#67B7E8]/10 text-[#67B7E8] border-[#67B7E8]/20',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-[#67B7E8]" />
        };
      case 'job':
        return {
          label: 'Emploi / Mission',
          bg: 'bg-[#19344A]/10 text-[#19344A] dark:text-white border-[#19344A]/20 dark:border-white/20',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1 text-[#19344A] dark:text-white" />
        };
      case 'volunteer':
        return {
          label: 'Bénévolat',
          bg: 'bg-[#67B7E8]/10 text-[#67B7E8] border-[#67B7E8]/20',
          icon: <HeartHandshake className="w-3.5 h-3.5 mr-1 text-[#67B7E8]" />
        };
      case 'skill_request':
        return {
          label: 'Recherche de compétence',
          bg: 'bg-[#FAF9F6] text-[#19344A] dark:text-white border-[#E8E4D9] dark:border-white/10',
          icon: <Search className="w-3.5 h-3.5 mr-1 text-[#67B7E8]" />
        };
      default:
        return {
          label: 'Opportunité',
          bg: 'bg-[#FAF9F6] text-[#111315] dark:text-white border-[#E8E4D9] dark:border-white/10',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1 text-[#6F7B85]" />
        };
    }
  };

  const getStatusBadge = (status: Opportunity['status']) => {
    switch (status) {
      case 'open':
        return { 
          label: 'Ouverte', 
          bg: 'bg-[#EAF6FD] text-[#67B7E8] border-[#67B7E8]/20' 
        };
      case 'closed':
        return { 
          label: 'Clôturée', 
          bg: 'bg-[#FAF9F6] text-[#6F7B85] border-[#E8E4D9]' 
        };
      case 'filled':
        return { 
          label: 'Pourvue', 
          bg: 'bg-[#EAF7F0] text-[#22A06B] border-[#22A06B]/20' 
        };
      case 'cancelled':
        return { 
          label: 'Annulée', 
          bg: 'bg-[#FDECEE] text-[#DC3545] border-[#DC3545]/20' 
        };
    }
  };

  const typeConfig = getTypeBadge(opportunity.type);
  const statusConfig = getStatusBadge(opportunity.status);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeConfig.bg}`}>
            {typeConfig.icon}
            {typeConfig.label}
          </span>
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <span className="bg-[#67B7E8] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                Mien
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-black text-[#111315] dark:text-white group-hover:text-[#67B7E8] transition-colors line-clamp-1 mb-1.5">
          {opportunity.title}
        </h3>
        <p className="text-[#6F7B85] dark:text-[#FAF9F6]/80 text-xs line-clamp-2 leading-relaxed mb-4">
          {opportunity.description}
        </p>

        {/* Skills Tag Pills */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {opportunity.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#19344A] dark:text-[#FAF9F6]/70 text-[10px] font-bold border border-[#E8E4D9] dark:border-[#67B7E8]/10"
              >
                <Tag className="w-2.5 h-2.5 mr-1 text-[#67B7E8]" />
                {skill}
              </span>
            ))}
            {opportunity.skills.length > 4 && (
              <span className="text-[10px] text-[#6F7B85] font-bold self-center">
                +{opportunity.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between text-xs">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            {opportunity.churchName ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-[#67B7E8] shrink-0" />
                <span className="truncate font-black text-[#19344A] dark:text-white">{opportunity.churchName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#6F7B85] shrink-0" />
                <span className="truncate font-bold text-[#19344A] dark:text-white/90">
                  {opportunity.authorName || 'Membre'} {opportunity.authorTitle ? `• ${opportunity.authorTitle}` : ''}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#6F7B85] font-semibold">
            {opportunity.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-[#67B7E8]" />
                {opportunity.location}
              </span>
            )}
            {opportunity.availability && (
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3 h-3 text-[#67B7E8]" />
                {opportunity.availability}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center text-[#67B7E8] font-black uppercase tracking-widest text-[10px] shrink-0 pl-2">
          <span>Détails</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
