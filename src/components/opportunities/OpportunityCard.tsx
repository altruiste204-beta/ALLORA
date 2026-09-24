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
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        };
      case 'job':
        return {
          label: 'Emploi / Mission',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1 text-blue-600" />
        };
      case 'volunteer':
        return {
          label: 'Bénévolat',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <HeartHandshake className="w-3.5 h-3.5 mr-1 text-purple-600" />
        };
      case 'skill_request':
        return {
          label: 'Recherche de compétence',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Search className="w-3.5 h-3.5 mr-1 text-amber-600" />
        };
      default:
        return {
          label: 'Opportunité',
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1 text-gray-600" />
        };
    }
  };

  const getStatusBadge = (status: Opportunity['status']) => {
    switch (status) {
      case 'open':
        return { label: 'Ouverte', bg: 'bg-green-100 text-green-800' };
      case 'closed':
        return { label: 'Clôturée', bg: 'bg-gray-100 text-gray-700' };
      case 'filled':
        return { label: 'Pourvue', bg: 'bg-indigo-100 text-indigo-800' };
      case 'cancelled':
        return { label: 'Annulée', bg: 'bg-red-100 text-red-700' };
    }
  };

  const typeConfig = getTypeBadge(opportunity.type);
  const statusConfig = getStatusBadge(opportunity.status);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig.bg}`}>
            {typeConfig.icon}
            {typeConfig.label}
          </span>
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Votre annonce
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
          {opportunity.title}
        </h3>
        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed mb-4">
          {opportunity.description}
        </p>

        {/* Skills Tag Pills */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opportunity.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
              >
                <Tag className="w-2.5 h-2.5 mr-1 opacity-50" />
                {skill}
              </span>
            ))}
            {opportunity.skills.length > 4 && (
              <span className="text-[11px] text-gray-400 font-medium self-center">
                +{opportunity.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            {opportunity.churchName ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate font-medium text-gray-800">{opportunity.churchName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate font-medium text-gray-800">
                  {opportunity.authorName || 'Membre'} {opportunity.authorTitle ? `• ${opportunity.authorTitle}` : ''}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            {opportunity.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {opportunity.location}
              </span>
            )}
            {opportunity.availability && (
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3 h-3" />
                {opportunity.availability}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center text-primary font-semibold text-xs shrink-0 pl-2">
          <span>Détails</span>
          <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
