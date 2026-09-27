import React from 'react';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();

  const actions = [
    {
      key: 'ask_help',
      title: t.actions.askHelp,
      subtitle: t.actions.askHelpSubtitle,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: 'share_resource',
      title: t.actions.shareResource,
      subtitle: t.actions.shareResourceSubtitle,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
        </svg>
      ),
    },
    {
      key: 'create_event',
      title: t.actions.createEvent,
      subtitle: t.actions.createEventSubtitle,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>
      ),
    },
    {
      key: 'publish_opportunity',
      title: t.actions.publishOpportunity,
      subtitle: t.actions.publishOpportunitySubtitle,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      key: 'publish_community',
      title: t.actions.publishCommunity,
      subtitle: t.actions.publishCommunitySubtitle,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.actions.actionSheetTitle}
      subtitle={t.actions.actionSheetSubtitle}
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
              className="w-full text-left p-3.5 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-[#FAF9F6] dark:bg-[#19344A] hover:bg-white dark:hover:bg-[#19344A]/80 hover:border-[#67B7E8] dark:hover:border-[#67B7E8] transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#19344A]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-center shrink-0 group-hover:bg-[#67B7E8] dark:group-hover:bg-[#67B7E8] text-[#67B7E8] group-hover:text-white transition-all">
                  {act.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111315] dark:text-white group-hover:text-[#67B7E8] dark:group-hover:text-[#67B7E8] transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-0.5 leading-snug">
                    {act.subtitle}
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#6F7B85] dark:text-[#FAF9F6]/70 group-hover:text-[#67B7E8] dark:group-hover:text-[#67B7E8] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
