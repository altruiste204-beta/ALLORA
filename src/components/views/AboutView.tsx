import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveTab } from '../../types';
import { AlloraLogo } from '../common/AlloraLogo';

interface AboutViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigateTab }) => {
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
          {isFr ? 'À propos d\'ALLORA' : 'About ALLORA'}
        </span>
      </div>

      {/* Hero Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#19344A] to-[#111315] text-white shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <AlloraLogo size="xl" variant="white" withContainer={false} />
        </div>
        
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md mx-auto border border-white/20 shadow-xl">
          <AlloraLogo size="md" variant="white" withContainer={false} />
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            ALLORA
          </h1>
          <p className="text-lg sm:text-xl font-bold text-[#67B7E8] tracking-wide">
            {isFr ? '« ALLORA — Connectés pour servir. »' : '« ALLORA — Connected to serve. »'}
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm space-y-10 text-sm sm:text-base text-[#111315] dark:text-[#FAF9F6]/90 leading-relaxed">
        
        {/* Notre idée */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF6FD] dark:bg-[#1D334D] text-[#67B7E8] text-xs font-black uppercase tracking-wider">
            <span>{isFr ? 'Notre Idée' : 'Our Idea'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#19344A] dark:text-white">
            {isFr ? 'Une idée simple et puissante' : 'A simple and powerful idea'}
          </h2>
          <p>
            {isFr ? 'ALLORA est né d\'une idée simple :' : 'ALLORA was born from a simple idea:'}
          </p>
          <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D]/70 border border-[#E8E4D9] dark:border-[#67B7E8]/20 space-y-3 font-bold text-[#19344A] dark:text-white">
            <p className="text-base sm:text-lg">
              « {isFr ? 'Ce que tu as peut répondre au besoin de quelqu\'un d\'autre.' : 'What you have can meet someone else\'s need.'} »
            </p>
            <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/60">
              {isFr ? 'Et inversement :' : 'And vice versa:'}
            </p>
            <p className="text-base sm:text-lg">
              « {isFr ? 'Le besoin de quelqu\'un peut trouver une réponse dans la communauté.' : 'Someone\'s need can find an answer in the community.'} »
            </p>
          </div>
          <p>
            {isFr 
              ? 'ALLORA a été imaginé pour faciliter la coopération entre les églises et leurs membres. Une église peut avoir besoin de chaises, d\'un vidéaste, d\'une salle, d\'instruments, de bénévoles ou d\'un moyen de transport. Une autre église ou un membre de la communauté peut justement disposer de cette ressource ou de cette compétence.'
              : 'ALLORA was designed to facilitate cooperation between churches and their members. A church may need chairs, a videographer, a room, instruments, volunteers, or transportation. Another church or community member may have precisely that resource or skill.'}
          </p>
          <p>
            {isFr 
              ? 'ALLORA permet de rendre cette rencontre plus simple, plus visible et mieux organisée.'
              : 'ALLORA makes this connection simpler, more visible, and better organized.'}
          </p>
        </section>

        <hr className="border-[#E8E4D9] dark:border-[#67B7E8]/10" />

        {/* Notre vision */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF6FD] dark:bg-[#1D334D] text-[#67B7E8] text-xs font-black uppercase tracking-wider">
            <span>{isFr ? 'Notre Vision' : 'Our Vision'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#19344A] dark:text-white">
            {isFr ? 'Bâtir l\'entraide entre communautés' : 'Building mutual aid between communities'}
          </h2>
          <p>
            {isFr 
              ? 'Construire un espace où les communautés chrétiennes peuvent :'
              : 'Building a space where Christian communities can:'}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              isFr ? 'S\'entraider activement' : 'Actively help one another',
              isFr ? 'Partager leurs ressources matérielles' : 'Share material resources',
              isFr ? 'Mettre leurs compétences au service des autres' : 'Put skills at the service of others',
              isFr ? 'Créer des collaborations durables' : 'Create lasting collaborations',
              isFr ? 'Organiser des événements ensemble' : 'Organize events together',
              isFr ? 'Découvrir des opportunités de service' : 'Discover service opportunities',
              isFr ? 'Développer des relations utiles entre communautés' : 'Develop useful inter-community relations'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-[#67B7E8] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-[#E8E4D9] dark:border-[#67B7E8]/10" />

        {/* Notre philosophie */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF6FD] dark:bg-[#1D334D] text-[#67B7E8] text-xs font-black uppercase tracking-wider">
            <span>{isFr ? 'Notre Philosophie' : 'Our Philosophy'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#19344A] dark:text-white">
            {isFr ? 'De la connexion à l\'action' : 'From connection to action'}
          </h2>
          <p>
            {isFr 
              ? 'ALLORA n\'est pas conçu comme un simple réseau social de divertissement. L\'objectif est de transformer la connexion en coopération et la coopération en action concrète sur le terrain.'
              : 'ALLORA is not designed as a mere social entertainment network. The goal is to transform connection into cooperation and cooperation into concrete action on the ground.'}
          </p>
        </section>

        {/* Signature */}
        <div className="p-6 rounded-3xl bg-[#EAF6FD] dark:bg-[#1D334D]/40 border border-[#67B7E8]/30 text-center space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-[#67B7E8]">
            {isFr ? 'Notre Signature' : 'Our Signature'}
          </p>
          <p className="text-xl sm:text-2xl font-black text-[#19344A] dark:text-white font-['Kaushan_Script']">
            ALLORA — Connectés pour servir.
          </p>
        </div>

      </div>
    </div>
  );
};
