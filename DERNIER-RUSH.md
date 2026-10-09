# Dernier rush — mise en ligne

État au 09/10/2026 : le site et le back-office sont terminés et testés **en local**
(25/25 tests Playwright : sécurité RLS, site public, back-office complet, mobile).
Il reste la mise en ligne. Compter ~30 minutes.

---

## 0. À décider avant de commencer

- [ ] **Offre Supabase** de l'organisation « 261 WEAR » : vérifier sur
      https://supabase.com/dashboard/org/lqfwalffualpmbiimglm/billing qu'elle est sur **Free**.
      - Free : on peut y créer un 2e projet gratuit (limite : 2 projets actifs).
      - Payante : un nouveau projet y serait **facturé** → créer plutôt une nouvelle organisation Free
        (« FR Signature ») et y mettre le projet.
- [ ] **E-mail du compte admin** du back-office (ex. `fraoilison@gmail.com`).
- [ ] **Liens réseaux** : URL Instagram et Facebook de « FR Signature Auto »
      (modifiables ensuite dans `/admin/reglages`, pas besoin de redéployer).

## 1. Supabase (gratuit)

```bash
# Créer le projet (région Francfort, la plus proche de Madagascar)
npx supabase projects create fr-signature --org-id <ID_ORG_FREE> --region eu-central-1 --db-password "<mot de passe fort>"

# Relier le dossier au projet puis appliquer le schéma (tables, RLS, bucket « photos », disciplines, coordonnées)
npx supabase link --project-ref <REF>
npx supabase db push
```

Puis dans le tableau de bord Supabase du projet :

- [ ] *Authentication → Sign In / Providers* : **décocher « Allow new users to sign up »**
      (les inscriptions publiques doivent être fermées ; seul l'admin se connecte).
- [ ] *Project Settings → API* : copier l'**URL**, la clé **anon / publishable** et la clé **service_role**.

Créer le fichier `.env.production.local` (jamais commité, déjà ignoré par git) :

```
NEXT_PUBLIC_SUPABASE_URL=https://<REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
NEXT_PUBLIC_SITE_URL=https://<projet>.vercel.app
SUPABASE_SERVICE_ROLE_KEY=<clé service_role>
```

## 2. Photos de départ + compte admin

Les 83 photos sélectionnées du dossier PDF sont dans `_ref/img` (extraites du PDF, non commitées).

```bash
node --env-file=.env.production.local scripts/seed.mjs _ref/img
node --env-file=.env.production.local scripts/create-admin.mjs <email-admin> "<mot de passe ≥ 10 caractères>"
```

> Si `_ref/img` a disparu : relancer l'extraction depuis `FRS2026...pdf` (PyMuPDF), voir l'historique de la session.

## 3. Vercel (offre Hobby, gratuite)

- [ ] https://vercel.com/new → importer le dépôt GitHub **Nihasy/FR_SIGNATURE** (framework : Next.js, détecté).
- [ ] Variables d'environnement (Production) :
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
      ⚠️ **Ne pas** mettre `SUPABASE_SERVICE_ROLE_KEY` sur Vercel (inutile au site).
- [ ] Déployer, puis corriger `NEXT_PUBLIC_SITE_URL` avec l'URL finale si besoin et redéployer
      (sert au sitemap, aux balises Open Graph et au robots.txt).
- [ ] Dans Supabase *Authentication → URL Configuration* : mettre l'URL Vercel dans *Site URL*.

Alternative en ligne de commande : `vercel link`, `vercel env add …`, `vercel --prod`.

## 4. Vérifications en production

- [ ] Accueil, portfolio (filtres + visionneuse), une série, prestations, contact s'affichent.
- [ ] `/admin` → connexion avec le compte admin.
- [ ] Importer 1 photo → elle apparaît sur `/portfolio` après rechargement.
- [ ] Envoyer un message depuis `/contact` → visible dans `/admin/messages`.
- [ ] `/admin/reglages` : renseigner Instagram et Facebook.
- [ ] Lancer les tests sur la prod (optionnel, ils créent puis suppriment des données « E2E ») :
      `E2E_BASE_URL=https://<projet>.vercel.app E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npx playwright test`
      (nécessite les variables Supabase de prod dans `.env.local` le temps du test).

## Bon à savoir

- Le projet Supabase gratuit se met **en pause après 7 jours sans activité** de la base. Le site reste
  visible (pages servies depuis le cache Vercel) ; se connecter au back-office ou rouvrir le projet
  dans le tableau de bord le relance.
- Stockage gratuit : 1 Go ≈ 3 000 à 4 000 photos (jauge dans le tableau de bord du back-office).
- Domaine perso (ex. `frsignature.mg`) : à ajouter dans Vercel → *Domains*, puis mettre à jour
  `NEXT_PUBLIC_SITE_URL`.
