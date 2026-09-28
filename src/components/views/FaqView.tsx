import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';

interface FaqViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  const categories = [
    {
      title: isFr ? 'Compte' : 'Account',
      questions: [
        {
          q: isFr ? 'Comment créer un compte ?' : 'How to create an account?',
          a: isFr 
            ? 'Cliquez sur le bouton "Connexion" en haut de page, puis choisissez l\'option pour créer un compte avec votre email et mot de passe ou via Google.'
            : 'Click the "Sign In" button at the top of the page, then choose the option to create an account with your email and password or via Google.'
        },
        {
          q: isFr ? 'Comment modifier mon profil ?' : 'How to edit my profile?',
          a: isFr
            ? 'Rendez-vous dans l\'onglet "Profil", puis cliquez sur "Modifier mon profil" pour mettre à jour vos informations personnelles, votre bio et vos compétences.'
            : 'Go to the "Profile" tab, then click "Edit profile" to update your personal information, bio and skills.'
        },
        {
          q: isFr ? 'Comment changer ma langue ?' : 'How to change my language?',
          a: isFr
            ? 'Vous pouvez basculer entre le français et l\'anglais à tout moment depuis les paramètres de votre profil ou le menu de navigation.'
            : 'You can switch between French and English at any time from your profile settings or navigation menu.'
        },
        {
          q: isFr ? 'Comment supprimer mon compte ?' : 'How to delete my account?',
          a: isFr
            ? 'Dans les paramètres de votre profil, une option sécurisée vous permet de désactiver ou de supprimer définitivement votre compte et vos données.'
            : 'In your profile settings, a secure option allows you to deactivate or permanently delete your account and data.'
        }
      ]
    },
    {
      title: isFr ? 'Églises' : 'Churches',
      questions: [
        {
          q: isFr ? 'Comment référencer une église ?' : 'How to list a church?',
          a: isFr
            ? 'Dans l\'onglet "Églises", cliquez sur le bouton pour ajouter une nouvelle église en renseignant son nom, sa ville, sa dénomination et ses informations de contact.'
            : 'In the "Churches" tab, click the button to add a new church by entering its name, city, denomination and contact information.'
        },
        {
          q: isFr ? 'Comment rejoindre une église ?' : 'How to join a church?',
          a: isFr
            ? 'Choisissez l\'église de votre choix dans l\'annuaire et saisissez le code de ralliement unique fourni par les responsables de votre communauté.'
            : 'Choose the church of your choice in the directory and enter the unique joining code provided by your community leaders.'
        },
        {
          q: isFr ? 'À quoi sert le code de connexion ?' : 'What is the joining code for?',
          a: isFr
            ? 'Il garantit que seuls les membres authentiques et vérifiés de la communauté locale accèdent aux espaces réservés de l\'église.'
            : 'It guarantees that only authentic and verified members of the local community have access to the church\'s reserved spaces.'
        },
        {
          q: isFr ? 'Comment gérer une communauté ?' : 'How to manage a community?',
          a: isFr
            ? 'Les créateurs et administrateurs d\'églises peuvent valider les demandes de nouveaux membres et publier des annonces spécifiques.'
            : 'Church creators and administrators can approve new member requests and publish specific announcements.'
        }
      ]
    },
    {
      title: isFr ? 'Besoins & ressources' : 'Needs & Resources',
      questions: [
        {
          q: isFr ? 'Comment demander de l\'aide ?' : 'How to ask for help?',
          a: isFr
            ? 'Utilisez le bouton d\'action rapide "+" ou l\'onglet "Besoins" pour exprimer une requête (matériel, aide pratique, transport, prière...).'
            : 'Use the quick action button "+" or the "Needs" tab to express a request (equipment, practical help, transport, prayer...).'
        },
        {
          q: isFr ? 'Comment proposer une ressource ?' : 'How to offer a resource?',
          a: isFr
            ? 'Dans l\'onglet "Ressources", partagez ce que vous mettez à disposition de la communauté (prêt de matériel, don, service, bénévolat).'
            : 'In the "Resources" tab, share what you are making available to the community (equipment loan, donation, service, volunteering).'
        },
        {
          q: isFr ? 'Comment fonctionne la mise en relation ?' : 'How does matching work?',
          a: isFr
            ? 'ALLORA suggère automatiquement les ressources compatibles avec les besoins exprimés et permet de lancer une collaboration en un clic.'
            : 'ALLORA automatically suggests resources compatible with expressed needs and allows launching a collaboration in one click.'
        }
      ]
    },
    {
      title: isFr ? 'Collaborations & Événements' : 'Collaborations & Events',
      questions: [
        {
          q: isFr ? 'Comment suivre une collaboration ?' : 'How to track a collaboration?',
          a: isFr
            ? 'Le suivi de vos collaborations en cours ou terminées se fait directement depuis votre profil dans la section dédiée.'
            : 'Tracking your ongoing or completed collaborations is done directly from your profile in the dedicated section.'
        },
        {
          q: isFr ? 'Comment créer un événement ?' : 'How to create an event?',
          a: isFr
            ? 'Dans l\'onglet "Événements", publiez un culte spécial, une réunion de prière, un atelier ou une formation ouverte aux membres.'
            : 'In the "Events" tab, publish a special service, prayer meeting, workshop or training open to members.'
        }
      ]
    },
    {
      title: isFr ? 'Sécurité & confidentialité' : 'Security & Privacy',
      questions: [
        {
          q: isFr ? 'Comment sont protégées mes données ?' : 'How is my data protected?',
          a: isFr
            ? 'Vos données sont sécurisées sur les serveurs Google Cloud avec un chiffrement aux standards de l\'industrie et des accès restreints.'
            : 'Your data is secured on Google Cloud servers with industry-standard encryption and restricted access.'
        },
        {
          q: isFr ? 'Comment signaler un comportement problématique ?' : 'How to report problematic behavior?',
          a: isFr
            ? 'Vous pouvez signaler toute publication ou utilisateur via le bouton de signalement ou en contactant directement le support.'
            : 'You can report any post or user via the report button or by contacting support directly.'
        }
      ]
    }
  ];

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
          {isFr ? 'Foire aux Questions' : 'Frequently Asked Questions'}
        </span>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mb-3">
            <span>{isFr ? 'Assistance & Réponses' : 'Support & Answers'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Foire Aux Questions (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">
            {isFr 
              ? 'Trouvez rapidement des réponses aux questions les plus fréquentes sur l\'utilisation d\'ALLORA.' 
              : 'Quickly find answers to the most frequent questions about using ALLORA.'}
          </p>
        </div>

        <div className="space-y-6">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-3">
              <h2 className="text-sm font-black text-[#67B7E8] uppercase tracking-wider">
                {cat.title}
              </h2>
              <div className="space-y-2">
                {cat.questions.map((item, qIdx) => {
                  const key = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div 
                      key={qIdx}
                      className="rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-[#FAF9F6]/50 dark:bg-[#1D334D]/40 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleAccordion(key)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#111315] dark:text-white hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                          className={`shrink-0 text-[#67B7E8] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/80 leading-relaxed border-t border-[#E8E4D9]/40 dark:border-[#67B7E8]/10">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
