import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';

interface AideViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const AideView: React.FC<AideViewProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: isFr ? 'Premiers pas avec ALLORA' : 'Getting Started with ALLORA',
      description: isFr ? 'Découvrez comment fonctionne la plateforme et créez votre compte.' : 'Discover how the platform works and set up your account.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
      ),
      articles: [
        { q: isFr ? 'Qu\'est-ce qu\'ALLORA ?' : 'What is ALLORA?', a: isFr ? 'ALLORA est une plateforme de mise en relation et d\'entraide entre églises et chrétiens (besoins, ressources, événements, opportunités).' : 'ALLORA is a connection and mutual aid platform between churches and Christians.' },
        { q: isFr ? 'Comment créer un compte ?' : 'How to create an account?', a: isFr ? 'Cliquez sur « Connexion / Inscription » en haut à droite pour vous inscrire en quelques secondes avec votre email.' : 'Click "Sign In / Register" in the top right to register in seconds with your email.' }
      ]
    },
    {
      id: 'profile',
      title: isFr ? 'Compte et profil' : 'Account & Profile',
      description: isFr ? 'Gérez vos informations personnelles, votre rôle, vos compétences et vos disponibilités.' : 'Manage your personal info, role, skills, and availability.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
      articles: [
        { q: isFr ? 'Comment modifier mon profil ?' : 'How to edit my profile?', a: isFr ? 'Rendez-vous dans l\'onglet « Profil » puis cliquez sur le bouton « Modifier le profil ».' : 'Go to the "Profile" tab and click the "Edit profile" button.' },
        { q: isFr ? 'Comment renseigner mes compétences ?' : 'How to add my skills?', a: isFr ? 'Dans votre profil, utilisez la section dédiée aux compétences pour ajouter vos talents et expertises.' : 'In your profile, use the dedicated skills section to add your talents and expertise.' }
      ]
    },
    {
      id: 'churches',
      title: isFr ? 'Églises et Communautés' : 'Churches & Communities',
      description: isFr ? 'Référencez votre église, rejoignez une communauté ou gérez des membres.' : 'Reference your church, join a community, or manage members.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10l-6-5-6 5v10"/><path d="M12 2v3"/><path d="M10 20v-5h4v5"/></svg>
      ),
      articles: [
        { q: isFr ? 'Comment référencer mon église ?' : 'How to reference my church?', a: isFr ? 'Dans l\'onglet « Églises », cliquez sur « Référencer une église » et remplissez les informations.' : 'In the "Churches" tab, click "Reference a church" and fill out the details.' },
        { q: isFr ? 'À quoi sert le code de connexion ?' : 'What is the connection code for?', a: isFr ? 'Le code permet de lier un membre à son église de rattachement lors de la demande d\'adhésion.' : 'The code links a member to their home church during the membership request.' }
      ]
    },
    {
      id: 'needs-resources',
      title: isFr ? 'Besoins et Ressources' : 'Needs & Resources',
      description: isFr ? 'Publiez une demande d\'aide ou proposez du matériel et des services.' : 'Publish a help request or offer equipment and services.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      ),
      articles: [
        { q: isFr ? 'Comment demander de l\'aide ?' : 'How to ask for help?', a: isFr ? 'Utilisez le bouton central « + » pour créer un nouveau besoin dans la section correspondante.' : 'Use the central "+" button to create a new need in the corresponding section.' },
        { q: isFr ? 'Comment proposer une ressource ?' : 'How to offer a resource?', a: isFr ? 'Rendez-vous dans la section « Ressources » et publiez votre offre de prêt ou de don.' : 'Go to the "Resources" section and publish your loan or donation offer.' }
      ]
    },
    {
      id: 'events-opps',
      title: isFr ? 'Événements et Opportunités' : 'Events & Opportunities',
      description: isFr ? 'Organisez des cultes, ateliers ou publiez des missions professionnelles.' : 'Organize services, workshops, or publish professional missions.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ),
      articles: [
        { q: isFr ? 'Qui peut créer un événement ?' : 'Who can create an event?', a: isFr ? 'Tous les membres connectés peuvent publier des événements pour leur église ou la communauté.' : 'All connected members can publish events for their church or community.' }
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(cat => 
    cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.articles.some(a => a.q.toLowerCase().includes(searchTerm.toLowerCase()) || a.a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          {isFr ? 'Centre d\'aide & Assistance' : 'Help Center & Support'}
        </span>
      </div>

      {/* Hero Header */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF6FD] dark:bg-blue-950/40 text-[#67B7E8] mx-auto flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Comment pouvons-nous vous aider ?' : 'How can we help you?'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70">
            {isFr ? 'Recherchez dans notre base de connaissances ou explorez les catégories ci-dessous.' : 'Search our knowledge base or explore the categories below.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F7B85]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isFr ? 'Rechercher une question, une aide...' : 'Search for a topic, question...'}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs font-bold outline-none focus:border-[#67B7E8]"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-4 hover:border-[#67B7E8]/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF6FD] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center shrink-0">
                {cat.icon}
              </div>
              <div>
                <h2 className="text-base font-black text-[#111315] dark:text-white">{cat.title}</h2>
                <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60">{cat.description}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {cat.articles.map((art, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-1">
                  <p className="text-xs font-black text-[#19344A] dark:text-white">{art.q}</p>
                  <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/80 leading-relaxed">{art.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#19344A] to-[#111315] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-black">{isFr ? 'Vous ne trouvez pas la réponse ?' : 'Still need help?'}</h2>
          <p className="text-xs text-white/70">
            {isFr ? 'Notre équipe d\'assistance est à votre disposition pour vous répondre rapidement.' : 'Our support team is available to assist you.'}
          </p>
        </div>
        <a
          href="mailto:contact@allora-reseau.org"
          className="px-6 py-3.5 rounded-2xl bg-[#67B7E8] hover:bg-[#52a3d4] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0"
        >
          {isFr ? 'Contacter l\'assistance' : 'Contact Support'}
        </a>
      </div>
    </div>
  );
};
