# ALLORA — version Supabase durcie

Cette archive est une **correction de la version migrée vers Supabase**, pas une nouvelle migration.

## Important pour Google AI Studio

1. Conserver l'architecture **Supabase + PostgreSQL**.
2. Ne pas réintroduire Firebase, Firestore ou Firebase Auth.
3. Appliquer les migrations dans l'ordre :
   - `supabase/migrations/20260928_initial_schema.sql`
   - `supabase/migrations/20260929000000_security_hardening.sql`
4. Déployer les Edge Functions présentes dans `supabase/functions/`.
5. Configurer uniquement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Ne jamais mettre `SUPABASE_SERVICE_ROLE_KEY` dans le frontend.
7. Installer les dépendances puis exécuter :
   - `npm install`
   - `npm run lint`
   - `npm run build`

## Corrections incluses

- Suppression des artefacts et dépendances Firebase.
- Création d'église atomique côté PostgreSQL avec code d'adhésion privé.
- Cycle d'adhésion sécurisé par RPC.
- Codes d'adhésion jamais lisibles directement depuis `church_secrets`.
- RLS réinstallé sur les tables applicatives.
- Blocage des comptes désactivés.
- Inscription aux événements avec verrouillage et contrôle de capacité côté serveur.
- Annulation d'inscription atomique.
- Réactions et compteurs de commentaires contrôlés côté serveur.
- Protection des identités et propriétaires dans les réponses/collaborations.
- Projection `public_profiles` maintenue automatiquement depuis `profiles`.
- Trigger réel à la création d'un utilisateur Supabase Auth.
- Suppression de compte basée sur les cascades PostgreSQL + Edge Function serveur.
- Tests de sécurité transformés en catalogue honnête : aucune fausse déclaration de « 100 % réussi ».
- Interface strictement Français / English.
