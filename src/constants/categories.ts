export const CATEGORIES = [
  'Matériel',
  'Locaux',
  'Transport',
  'Compétences',
  'Bénévolat',
  'Événementiel',
  'Communication',
  'Technique',
  'Musique',
  'Formation',
  'Logistique',
  'Hébergement',
  'Restauration',
  'Autre'
] as const;

export type CategoryType = typeof CATEGORIES[number];

export const SUBCATEGORIES: Record<CategoryType, string[]> = {
  'Matériel': ['Chaises', 'Tables', 'Sonorisation', 'Vidéoprojecteur', 'Éclairage', 'Bibles', 'Autre'],
  'Locaux': ['Salle de culte', 'Salle de réunion', 'Cuisine', 'Bureau', 'Terrain extérieur', 'Autre'],
  'Transport': ['Véhicule utilitaire', 'Minibus (9 places)', 'Voiture personnelle', 'Chauffeur', 'Autre'],
  'Compétences': ['Vidéaste / Montage', 'Technicien son', 'Infographiste', 'Traducteur', 'Prédicateur', 'Autre'],
  'Bénévolat': ['Accueil / Placement', 'Ménage / Entretien', 'Garderie / Enfants', 'Aide sociale', 'Autre'],
  'Événementiel': ['Organisation de concert', 'Conférence', 'Évangélisation', 'Foire / Brocante', 'Autre'],
  'Communication': ['Réseaux sociaux', 'Site web', 'Affiches / Flyers', 'Newsletter', 'Autre'],
  'Technique': ['Électricité', 'Plomberie', 'Peinture / Rénovation', 'Informatique / Réseau', 'Autre'],
  'Musique': ['Chanteur / Choriste', 'Pianiste / Claviériste', 'Guitariste', 'Batteur', 'Conducteur de louange', 'Autre'],
  'Formation': ['Cours de théologie', 'Formation technique', 'Soutien scolaire', 'Autre'],
  'Logistique': ['Manutention', 'Stockage', 'Déménagement', 'Autre'],
  'Hébergement': ['Chambre d\'amis', 'Logement temporaire', 'Accueil d\'orateurs', 'Autre'],
  'Restauration': ['Repas communautaire', 'Cafétéria / Collation', 'Traiteur bénévolat', 'Autre'],
  'Autre': ['Divers']
};
