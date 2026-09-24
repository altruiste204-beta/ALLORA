export interface TranslationStrings {
  brand: {
    name: string;
    pronunciation: string;
    tagline: string;
    corePhilosophy1: string;
    corePhilosophy2: string;
    footer: string;
  };
  nav: {
    home: string;
    churches: string;
    create: string;
    events: string;
    profile: string;
  };
  actions: {
    askHelp: string;
    shareResource: string;
    offerHelp: string;
    findChurch: string;
    createEvent: string;
    proposeSkill: string;
    createCollab: string;
    searchPlaceholder: string;
    save: string;
    cancel: string;
    signIn: string;
    signUp: string;
    signOut: string;
    editProfile: string;
  };
  home: {
    greeting: string;
    searchQuestion: string;
    aroundYou: string;
    tabs: {
      needs: string;
      resources: string;
      events: string;
      collaborations: string;
    };
    emptyStateTitle: string;
    emptyStateSubtitle: string;
  };
  profile: {
    title: string;
    unauthenticatedTitle: string;
    unauthenticatedSubtitle: string;
    memberSince: string;
    location: string;
    bio: string;
    skills: string;
    interests: string;
    availability: string;
    churches: string;
    noBio: string;
    noSkills: string;
    noChurches: string;
  };
  phases: {
    phase1Badge: string;
    phase2Notice: string;
    phase3Notice: string;
    phase4Notice: string;
    phase5Notice: string;
  };
}

export const fr: TranslationStrings = {
  brand: {
    name: 'ALLORA',
    pronunciation: 'Ayora',
    tagline: 'Connectés pour servir.',
    corePhilosophy1: 'Ce que tu as peut répondre au besoin de quelqu\'un d\'autre.',
    corePhilosophy2: 'Le besoin de quelqu\'un peut trouver une réponse dans la communauté.',
    footer: '©ALLORA • All rights reserved.',
  },
  nav: {
    home: 'Accueil',
    churches: 'Églises',
    create: 'Ajouter',
    events: 'Événements',
    profile: 'Profil',
  },
  actions: {
    askHelp: 'Demander de l\'aide',
    shareResource: 'Partager une ressource',
    offerHelp: 'Proposer mon aide',
    findChurch: 'Trouver une église',
    createEvent: 'Créer un événement',
    proposeSkill: 'Proposer une compétence',
    createCollab: 'Créer une collaboration',
    searchPlaceholder: 'Rechercher une église, un besoin, une ressource...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    signIn: 'Connexion',
    signUp: 'Créer un compte',
    signOut: 'Se déconnecter',
    editProfile: 'Modifier mon profil',
  },
  home: {
    greeting: 'Bonjour',
    searchQuestion: 'Qu\'est-ce que vous cherchez aujourd\'hui ?',
    aroundYou: 'Autour de vous',
    tabs: {
      needs: 'Besoins',
      resources: 'Ressources',
      events: 'Événements',
      collaborations: 'Collaborations',
    },
    emptyStateTitle: 'Rien ici pour le moment.',
    emptyStateSubtitle: 'Peut-être que vous serez la première personne à partager quelque chose.',
  },
  profile: {
    title: 'Mon Profil',
    unauthenticatedTitle: 'Rejoignez la communauté ALLORA',
    unauthenticatedSubtitle: 'Connectez-vous pour exprimer un besoin, partager vos ressources ou rejoindre votre église locale.',
    memberSince: 'Membre depuis',
    location: 'Localisation',
    bio: 'Présentation',
    skills: 'Compétences',
    interests: 'Centres d\'intérêt',
    availability: 'Disponibilités',
    churches: 'Églises rattachées',
    noBio: 'Aucune présentation renseignée.',
    noSkills: 'Aucune compétence enregistrée.',
    noChurches: 'Aucune église rattachée pour l\'instant.',
  },
  phases: {
    phase1Badge: 'Phase 1 : Fondations actives',
    phase2Notice: 'La gestion approfondie des églises et rôles sera activée en Phase 2.',
    phase3Notice: 'La publication et le filtrage avancé des besoins seront activés en Phase 3.',
    phase4Notice: 'Le matching et les collaborations inter-églises seront activés en Phase 4.',
    phase5Notice: 'L\'inscription aux événements communautaires sera enrichie en Phase 5.',
  },
};

export const i18n = fr;
