import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';

interface CguViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const CguView: React.FC<CguViewProps> = ({ onNavigateTab }) => {
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
          {isFr ? 'Conditions d\'Utilisation' : 'Terms of Use'}
        </span>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mb-3">
            <span>{isFr ? 'Règles d\'utilisation' : 'Usage Guidelines'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Conditions Générales d’Utilisation (CGU)' : 'Terms of Service (ToS)'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">
            {isFr ? 'Dernière mise à jour : 27 septembre 2026' : 'Last update: September 27, 2026'}
          </p>
        </div>

        <div className="space-y-6 text-sm text-[#111315] dark:text-[#FAF9F6]/90 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              1. {isFr ? 'Objet d’ALLORA' : 'Object of ALLORA'}
            </h2>
            <p>
              {isFr
                ? 'ALLORA est une plateforme collaborative chrétienne destinée à faciliter l\'entraide fraternelle, le partage de ressources, l\'organisation d\'événements, les opportunités de service et la coopération entre églises et croyants.'
                : 'ALLORA is a Christian collaborative platform designed to facilitate fraternal mutual aid, resource sharing, event organization, service opportunities and cooperation between churches and believers.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              2. {isFr ? 'Définitions' : 'Definitions'}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Plateforme :</strong> L\'application ALLORA et l'ensemble de ses services.</li>
              <li><strong>Utilisateur :</strong> Tout membre inscrit ou visiteur naviguant sur ALLORA.</li>
              <li><strong>Communauté / Église :</strong> Entité ecclésiale ou groupe enregistré possédant un code de ralliement.</li>
              <li><strong>Besoins et Ressources :</strong> Requêtes d'aide ou offres de matériel/services partagées entre utilisateurs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              3. {isFr ? 'Création et Utilisation du Compte' : 'Account Creation and Use'}
            </h2>
            <p>
              {isFr
                ? 'L\'accès à certaines fonctionnalités nécessite la création d\'un compte utilisateur. L\'utilisateur s\'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants.'
                : 'Access to certain features requires creating a user account. Users agree to provide accurate information and maintain the confidentiality of their credentials.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              4. {isFr ? 'Utilisation des Communautés et des Églises' : 'Communities and Churches Usage'}
            </h2>
            <p>
              {isFr
                ? 'Les utilisateurs peuvent rejoindre des églises via un code de ralliement unique. Les administrateurs d\'églises veillent à modérer les publications et à représenter fidèlement leur communauté.'
                : 'Users can join churches via a unique joining code. Church administrators ensure moderation of posts and faithfully represent their community.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              5. {isFr ? 'Besoins, Ressources et Collaborations' : 'Needs, Resources and Collaborations'}
            </h2>
            <p>
              {isFr
                ? 'Les annonces de besoins et de ressources reposent sur la bonne foi et la solidarité chrétienne. ALLORA n\'intervient pas dans les transactions financières et ne propose pas de service de paiement payant.'
                : 'Needs and resources postings rely on good faith and Christian solidarity. ALLORA does not intermediate financial transactions and does not offer paid payment services.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              6. {isFr ? 'Comportements Interdits et Modération' : 'Prohibited Behavior and Moderation'}
            </h2>
            <p>
              {isFr
                ? 'Tout contenu injurieux, diffamatoire, contraire aux bonnes mœurs ou frauduleux est strictement interdit. ALLORA se réserve le droit de suspendre tout compte en cas de manquement.'
                : 'Any abusive, defamatory, contrary to good morals or fraudulent content is strictly prohibited. ALLORA reserves the right to suspend any account in case of breach.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-[#19344A] dark:text-white border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-2">
              7. {isFr ? 'Contact' : 'Contact'}
            </h2>
            <p>
              {isFr
                ? 'Pour toute question relative aux présentes CGU, vous pouvez contacter l\'équipe via le centre d\'aide ou par email.'
                : 'For any questions regarding these Terms, you can contact the team via the help center or email.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
