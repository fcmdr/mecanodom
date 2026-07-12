# Checklist de déploiement — MécanoDom

Guide de mise en production et de passation client. Cochez au fur et à mesure.

---

## 0. Pré-requis (comptes à créer)

- [ ] Nom de domaine acheté (ex. `mecanodom.fr`) — OVH, Gandi, Cloudflare…
- [ ] Compte hébergeur choisi (voir §3)
- [ ] Compte **Resend** (e-mails) — https://resend.com
- [ ] Accès au dépôt de code (Git)

---

## 1. Base de données

Le projet utilise **PostgreSQL** (en dev : conteneur Docker `docker-compose.yml`).

- [ ] **Provisionner une base Postgres managée** pour la prod (Neon, Supabase,
      Vercel Postgres, RDS…). Récupérer l'URL de connexion.
- [ ] Renseigner `DATABASE_URL` avec cette URL (souvent avec `?sslmode=require`).
- [ ] Appliquer les migrations en production : `pnpm prisma migrate deploy`.
- [ ] (Optionnel) Injecter des données initiales : `pnpm db:seed`, ou saisir le
      contenu réel via l'admin.
- [ ] Sauvegardes automatiques activées (fournies par la plupart des Postgres managés).

---

## 2. Variables d'environnement (production)

À définir dans l'interface de l'hébergeur (**ne jamais committer `.env`**) :

- [ ] `DATABASE_URL` — chaîne de connexion (SQLite `file:./prod.db` ou URL Postgres)
- [ ] `APP_URL` — URL publique **HTTPS** réelle (ex. `https://mecanodom.fr`) → liens e-mail
- [ ] `ADMIN_EMAIL` — email de connexion admin **du client**
- [ ] `ADMIN_PASSWORD_HASH` — **nouveau** hash (voir §4), `$` échappés
- [ ] `SESSION_SECRET` — **nouvelle** chaîne aléatoire ≥ 32 caractères
- [ ] `RESEND_API_KEY` — clé Resend de production
- [ ] `MAIL_FROM` — adresse d'un **domaine vérifié** (ex. `MécanoDom <contact@mecanodom.fr>`)
- [ ] `MAIL_ADMIN` — email où le mécanicien reçoit les alertes de réservation

> Générer un secret : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 3. Hébergement

### Option A — Vercel (nécessite PostgreSQL)
- [ ] Importer le dépôt sur Vercel
- [ ] Renseigner toutes les variables d'environnement (§2)
- [ ] Vérifier que le build lance bien `prisma generate` (déjà dans le script `build`)
- [ ] Appliquer les migrations : `prisma migrate deploy` (build hook ou manuel)

### Option B — VPS / plateforme à disque persistant (SQLite OK)
- [ ] `pnpm install`
- [ ] `pnpm prisma migrate deploy`
- [ ] `pnpm build`
- [ ] Lancer avec un gestionnaire de process (`pm2`, `systemd`) : `pnpm start`
- [ ] Reverse-proxy (Nginx/Caddy) + HTTPS

---

## 4. Sécurité (critique avant ouverture)

- [ ] **Changer le mot de passe admin par défaut** :
      `pnpm hash "nouveau-mot-de-passe-fort"` → coller la ligne dans `ADMIN_PASSWORD_HASH`
- [ ] `ADMIN_EMAIL` = vraie adresse du client
- [ ] `SESSION_SECRET` unique et long (jamais celui de dev)
- [ ] Cookie `secure` : automatique en prod (`NODE_ENV=production`) — **ne pas** forcer `NODE_ENV=development`
- [ ] HTTPS actif (obligatoire pour le cookie sécurisé et le SEO)
- [ ] Vérifier que `.env` n'est pas dans le dépôt (déjà dans `.gitignore`)

---

## 5. E-mails (Resend)

- [ ] Domaine ajouté et **vérifié** dans Resend (enregistrements SPF/DKIM chez le registrar)
- [ ] `MAIL_FROM` utilise ce domaine (pas `onboarding@resend.dev` en prod)
- [ ] Test : créer une réservation de bout en bout → e-mails client + mécanicien reçus
- [ ] Vérifier que les mails n'arrivent pas en spam

---

## 6. Personnalisation client

- [ ] `src/lib/site.ts` : nom, tagline, téléphone, email, adresse, horaires, `mapCenter`
- [ ] `tailwind.config.ts` : couleur `brand` du client
- [ ] Logo (remplacer le « M »)
- [ ] Contenu métier via l'admin : **prestations, tarifs, zones, horaires, jours bloqués**
- [ ] Supprimer/adapter les **données de démo** (le seed contient des exemples)

---

## 7. Contenu légal (France — obligatoire)

- [ ] **Mentions légales** (identité de l'entreprise, hébergeur, SIRET…)
- [ ] **Politique de confidentialité / RGPD** (données collectées, finalité, durée, droits)
- [ ] **CGV** si engagement de prestation/prix
- [ ] Rappel : un seul cookie de session (fonctionnel) → pas de bandeau cookies requis,
      **sauf** si vous ajoutez de l'analytics/tracking plus tard (alors consentement obligatoire)

---

## 8. Tests post-déploiement (recette en production)

- [ ] Page d'accueil, `/services`, `/zone`, `/contact` s'affichent
- [ ] `/zone` : la carte se charge, le vérificateur de code postal répond
- [ ] Parcours `/rendez-vous` complet : prestation → créneau → code postal → coordonnées → confirmation
- [ ] Code postal **non couvert** bloqué ; **couvert** accepté
- [ ] Créneau réservé **disparaît** des disponibilités
- [ ] E-mails de confirmation reçus (client + mécanicien)
- [ ] Lien **d'annulation** dans l'e-mail fonctionne (créneau re-libéré)
- [ ] Connexion admin OK avec les **nouveaux** identifiants
- [ ] Admin : ajouter une prestation → visible sur `/services`
- [ ] Admin : modifier des horaires → impacte les créneaux
- [ ] Admin : changer un statut (Confirmé/Annulé) → e-mail client envoyé
- [ ] **Calendrier** admin affiche les RDV de la semaine
- [ ] Anti-spam : le formulaire reste utilisable normalement

---

## 9. Exploitation & maintenance

- [ ] Sauvegardes de base planifiées et **testées** (restauration)
- [ ] Monitoring/alertes de disponibilité (uptime)
- [ ] Politique de mises à jour (dépendances, sécurité)
- [ ] Note : le rate-limiter anti-spam est **en mémoire** → pour du multi-instance,
      prévoir un store partagé (Redis)

---

## 10. Passation au client

- [ ] Transfert des accès : hébergeur, domaine, Resend, dépôt de code
- [ ] Remise des identifiants admin (et invitation à les changer)
- [ ] Mini-guide admin (ajouter une prestation, gérer créneaux, traiter une réservation)
- [ ] Clarifier la **propriété du code** (cession vs licence) et la maintenance
- [ ] Facturation / contrat signé
