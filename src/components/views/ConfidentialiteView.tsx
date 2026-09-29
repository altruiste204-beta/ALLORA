import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';

interface ConfidentialiteViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ConfidentialiteView: React.FC<ConfidentialiteViewProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

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
          {isFr ? 'Protection des données' : 'Data Privacy'}
        </span>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mb-3">
            <span>{isFr ? 'Confidentialité & Sécurité' : 'Privacy & Security'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Politique de Confidentialité' : 'Privacy Policy'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">
            {isFr ? 'Dernière mise à jour : 27 septembre 2026' : 'Last update: September 27, 2026'}
          </p>
        </div>

        <div className="space-y-6 text-sm text-[#111315] dark:text-[#FAF9F6]/90 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              1. {isFr ? 'Données Collectées' : 'Collected Data'}
            </h2>
            <p>
              {isFr
                ? 'ALLORA collecte uniquement les données nécessaires au bon fonctionnement du réseau d\'entraide : nom, email, informations de profil, églises et communautés rattachées, besoins et ressources publiés, ainsi que les collaborations et événements.'
                : 'ALLORA collects only the data necessary for the proper functioning of the mutual aid network: name, email, profile information, associated churches and communities, published needs and resources, as well as collaborations and events.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              2. {isFr ? 'Finalités de Traitement' : 'Processing Purposes'}
            </h2>
            <p>
              {isFr
                ? 'Les informations recueillies servent à la mise en relation fraternelle, à la gestion des comptes utilisateurs, à l\'affichage des annonces d\'entraide et à l\'envoi de notifications pertinentes.'
                : 'The information collected is used for fraternal connection, user account management, displaying mutual aid announcements and sending relevant notifications.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              3. {isFr ? 'Stockage et Sécurité' : 'Storage and Security'}
            </h2>
            <p>
              {isFr
                ? 'Toutes les données sont stockées de manière sécurisée via l\'infrastructure Supabase / PostgreSQL avec des politiques RLS strictes garantissant l\'accès aux seuls utilisateurs autorisés.'
                : 'All data is stored securely via Supabase / PostgreSQL infrastructure with strict Row Level Security policies ensuring access only to authorized users.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              4. {isFr ? 'Droits des Utilisateurs et Suppression' : 'User Rights and Deletion'}
            </h2>
            <p>
              {isFr
                ? 'Conformément aux réglementations en vigueur, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données personnelles. Vous pouvez à tout moment désactiver ou supprimer définitivement votre compte depuis les paramètres de votre profil.'
                : 'In accordance with applicable regulations, you have the right to access, rectify and delete your personal data. You can at any time deactivate or permanently delete your account from your profile settings.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              5. {isFr ? 'Contact Données Personnelles' : 'Personal Data Contact'}
            </h2>
            <p>
              {isFr
                ? 'Pour toute question relative à la protection de vos données personnelles, contactez-nous à : privacy@allora-reseau.org'
                : 'For any questions regarding the protection of your personal data, contact us at: privacy@allora-reseau.org'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
