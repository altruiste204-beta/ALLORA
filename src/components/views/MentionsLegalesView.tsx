import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';

interface MentionsLegalesViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const MentionsLegalesView: React.FC<MentionsLegalesViewProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  // Editable fields placeholders as requested
  const [editorName, setEditorName] = useState('ALLORA Association / Réseau');
  const [legalForm, setLegalForm] = useState(isFr ? 'Association cultuelle / Loi 1901' : 'Non-profit Association');
  const [address, setAddress] = useState('12 Rue de la Paix, 75001 Paris');
  const [country, setCountry] = useState(isFr ? 'France' : 'France');
  const [email, setEmail] = useState('contact@allora-reseau.org');
  const [phone, setPhone] = useState('+33 1 23 45 67 89');
  const [publisher, setPublisher] = useState('Direction de la Publication ALLORA');
  const [host, setHost] = useState('Google Cloud Platform / Firebase Hosting');
  const [lastUpdate, setLastUpdate] = useState('27 septembre 2026');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigateTab('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 text-xs font-bold text-[#19344A] dark:text-white hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors cursor-pointer shadow-xs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{isFr ? 'Retour à l\'accueil' : 'Back to home'}</span>
        </button>
        <span className="text-[11px] font-bold text-[#6F7B85] uppercase tracking-widest">
          {isFr ? 'Informations légales' : 'Legal Information'}
        </span>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mb-3">
            <span>{isFr ? 'Conformité & Édition' : 'Compliance & Publishing'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Mentions Légales' : 'Legal Notice'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">
            {isFr ? `Dernière mise à jour : ${lastUpdate}` : `Last update: ${lastUpdate}`}
          </p>
        </div>

        <div className="space-y-6 text-sm text-[#111315] dark:text-[#FAF9F6]/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              1. {isFr ? 'Éditeur de l\'Application' : 'Application Publisher'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF9F6] dark:bg-[#1D334D]/60 p-4 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Nom de l\'éditeur' : 'Publisher Name'}</p>
                <p className="font-bold text-sm">{editorName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Forme juridique' : 'Legal Form'}</p>
                <p className="font-bold text-sm">{legalForm}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Adresse' : 'Address'}</p>
                <p className="font-bold text-sm">{address}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Pays' : 'Country'}</p>
                <p className="font-bold text-sm">{country}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Email de contact' : 'Contact Email'}</p>
                <p className="font-bold text-sm text-[#67B7E8]">{email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6F7B85]">{isFr ? 'Téléphone' : 'Phone'}</p>
                <p className="font-bold text-sm">{phone}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              2. {isFr ? 'Responsable de la Publication' : 'Publication Manager'}
            </h2>
            <p>
              {isFr 
                ? `Le responsable de la publication et de la rédaction des contenus est : ${publisher}.`
                : `The publication and editorial manager is: ${publisher}.`}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              3. {isFr ? 'Hébergement' : 'Hosting'}
            </h2>
            <p>
              {isFr
                ? `L'application ALLORA est hébergée par : ${host}, garantissant la sécurité, la disponibilité et la conformité des données à l'échelle internationale et européenne.`
                : `The ALLORA application is hosted by: ${host}, ensuring data security, availability and compliance at international and European levels.`}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              4. {isFr ? 'Propriété Intellectuelle' : 'Intellectual Property'}
            </h2>
            <p>
              {isFr
                ? 'L\'ensemble des éléments graphiques, structures, logos, textes et bases de données constituant l\'application ALLORA sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.'
                : 'All graphical elements, structures, logos, texts and databases making up the ALLORA application are protected by intellectual property law. Any unauthorized reproduction, representation or use is strictly prohibited.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
