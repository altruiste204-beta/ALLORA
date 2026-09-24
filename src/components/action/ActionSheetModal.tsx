import React from 'react';
import { Modal } from '../common/Modal';
import { i18n } from '../../i18n';

interface ActionSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}

export const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const actions = [
    {
      key: 'ask_help',
      title: i18n.actions.askHelp,
      subtitle: 'Exprimer un besoin pour votre communauté ou église (matériel, aide, salle...)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: 'share_resource',
      title: i18n.actions.shareResource,
      subtitle: 'Proposer ce que vous possédez (chaises, sono, transport, hébergement...)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
        </svg>
      ),
    },
    {
      key: 'create_event',
      title: i18n.actions.createEvent,
      subtitle: 'Organiser une conférence, un culte spécial ou une activité communautaire',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>
      ),
    },
    {
      key: 'publish_opportunity',
      title: 'Opportunité / Compétence',
      subtitle: 'Proposer un service professionnel, un volontariat ou rechercher un talent',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      key: 'publish_community',
      title: 'Publier',
      subtitle: 'Partager une annonce, un témoignage ou une information utile à la communauté',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agir avec ALLORA"
      subtitle="Connectés pour servir et coopérer"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5">
          {actions.map((act) => (
            <button
              key={act.key}
              onClick={() => {
                onSelectAction(act.key);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl border border-[#E8E4D9] bg-[#FFFFFF] hover:bg-[#FAF9F6] hover:border-[#19344A]/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4D9]/40 transition-colors">
                  {act.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#19344A]">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#19344A]/60 mt-0.5 leading-snug">
                    {act.subtitle}
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#19344A]/40 group-hover:text-[#19344A] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
