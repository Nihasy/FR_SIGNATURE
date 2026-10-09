# FR Signature Auto — site vitrine & back-office

Site portfolio de **Faniry Raoilison**, photographe Auto-Moto à Antananarivo.
Next.js 16 (App Router, Cache Components) · Supabase (Postgres, Storage, Auth) · Vercel.
Conçu pour rester dans les **offres gratuites** de Supabase et Vercel.

## Ce que contient le projet

**Site public** — accueil (diaporama plein écran, manifeste, sélection, séries, valeurs, disciplines, approche, références),
portfolio filtrable par discipline avec visionneuse plein écran (clavier, glisser au doigt), séries (reportages),
prestations & tarifs, à propos, contact (formulaire enregistré en base), mentions légales, sitemap, robots, JSON-LD.

**Back-office `/admin`** (compte administrateur unique) :

| Écran | Fonctions |
| --- | --- |
| Tableau de bord | chiffres clés, jauge de stockage (quota gratuit 1 Go), derniers messages |
| Photos | import glisser-déposer (redimensionnement + WebP dans le navigateur), recherche, filtres, sélection multiple : publier / dépublier, sélection d'accueil, discipline, série, suppression ; panneau d'édition (titre, texte alternatif, diaporama, couverture…) |
| Séries | création, ordre des séries, édition, publication, photos glisser-déposer (souris, tactile, clavier), couverture, ajout depuis la bibliothèque ou import direct |
| Messages | messages du formulaire, lu / non lu, réponse par e-mail, suppression |
| Réglages | e-mail, téléphone, WhatsApp, Instagram, Facebook, LinkedIn, disponibilité ; disciplines |

Chaque modification du back-office invalide le cache des pages publiques (`updateTag`) : le site est à jour immédiatement.

## Pourquoi c'est gratuit

- **Images** : chaque photo est réduite dans le navigateur à 2400 px (WebP ≈ 200–400 Ko) + miniature 960 px + aperçu flou.
  1 Go de stockage Supabase ≈ 3 000 à 4 000 photos. Pas d'optimisation d'image Vercel (quota) : les fichiers sont déjà prêts.
- **Pages** : tout le site public est pré-rendu en statique (`ensureStatic = "navigation"`) et servi par le CDN Vercel ;
  la base n'est sollicitée qu'après une modification.
- **Sécurité** : RLS sur toutes les tables, inscriptions désactivées, écriture réservée à la table `admins`,
  formulaire de contact limité (3 messages / 10 min par e-mail, 30 / heure au total), champ piège anti-robots.

> Supabase met en pause les projets gratuits après 7 jours sans activité de la base. Les pages restant servies
> depuis le cache Vercel, le site reste visible ; un simple passage dans le back-office relance le projet.

## Démarrage local

Prérequis : Node 20+, Docker (pour Supabase local).

```bash
npm install
npx supabase start            # base locale (ports 553xx, voir supabase/config.toml)
cp .env.example .env.local    # puis renseigner les clés affichées par `supabase start`
npm run seed -- <dossier-images>   # optionnel : importe la sélection de scripts/seed-manifest.json
npm run create-admin -- vous@exemple.com "MotDePasseLong"
npm run dev
```

## Tests

```bash
npm run build
npx playwright install chromium
npm test        # 25 tests : RLS/sécurité, site public, back-office complet, mobile
```

Les tests importent de vraies images, vérifient le WebP, l'orientation EXIF, l'invalidation du cache public,
l'ordre des séries, la suppression des fichiers, etc. Ils nettoient leurs données (préfixe `E2E`).

## Mise en production

1. **Supabase** (projet gratuit) : `npx supabase link --project-ref <ref>` puis `npx supabase db push`.
   Dans *Authentication → Sign In / Providers*, désactiver « Allow new users to sign up ».
2. **Admin** : `node --env-file=.env.production.local scripts/create-admin.mjs <email> "<mot de passe>"`
   (fichier contenant l'URL du projet et la clé `service_role`, jamais commité).
3. **Vercel** (offre Hobby) : importer le dépôt, variables d'environnement
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
   La clé `service_role` n'est **pas** nécessaire sur Vercel.

## Arborescence

```
src/app/(site)/      pages publiques
src/app/admin/       back-office (rendu côté navigateur, protégé par RLS)
src/components/      composants (visionneuse, grilles, en-tête…)
src/lib/data.ts      lectures publiques mises en cache (tag « content »)
src/lib/admin/       import et traitement d'images, opérations du back-office
supabase/migrations  schéma, RLS, bucket de stockage, données de départ
scripts/             seed, création d'admin, captures d'écran
tests/               Playwright
```
