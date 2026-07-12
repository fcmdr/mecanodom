# MécanoDom — Mécanicien à domicile

Site vitrine + application de réservation pour un mécanicien automobile intervenant à domicile.

Fonctionnalités :

- **Prise de rendez-vous** avec créneaux calculés dynamiquement (horaires, délais, anti double-réservation)
- **Zone de couverture** par code postal (carte OpenStreetMap + vérification)
- **Tarifs transparents** éditables depuis l'admin (sans toucher au code)
- **Interface d'administration** protégée (services, disponibilités, zones, réservations)
- **Vue calendrier** hebdomadaire dans l'admin (navigation semaine par semaine)
- **Notifications e-mail** (Resend) : confirmation client + alerte mécanicien à la
  réservation, et e-mail au client lors du passage en « confirmé » / « annulé »
- **Annulation par le client** via un lien sécurisé (jeton) reçu par e-mail

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- Prisma + **PostgreSQL** (conteneur Docker en dev, base managée en prod)
- Auth admin : cookie JWT signé (`jose`) + mot de passe bcrypt (`bcryptjs`)
- Carte : `react-leaflet` + OpenStreetMap (sans clé API)
- E-mails : `resend`
- pnpm · Docker (Postgres local)

## Démarrage rapide

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env
#   puis générer un hash de mot de passe admin :
pnpm hash "votre-mot-de-passe"
#   copiez la ligne ADMIN_PASSWORD_HASH générée dans .env
#   et renseignez ADMIN_EMAIL + SESSION_SECRET

# 3. Démarrer la base PostgreSQL (conteneur Docker)
pnpm db:up            # docker compose up -d (Postgres sur le port 5433)

# 4. Créer le schéma et injecter les données de démo
pnpm prisma migrate dev
pnpm db:seed

# 5. Lancer le serveur de développement
pnpm dev
```

> Prérequis : **Docker Desktop** doit être lancé pour la base de dev.
> Pour arrêter la base : `pnpm db:down` (ajouter `-v` pour effacer les données).

Le site est disponible sur http://localhost:3000.
L'administration est sur http://localhost:3000/admin.

### Identifiants admin par défaut (démo)

- Email : `admin@mecano.fr`
- Mot de passe : `admin1234`

> Changez impérativement ces valeurs (et `SESSION_SECRET`) avant toute mise en production.

## Variables d'environnement

| Variable              | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `DATABASE_URL`        | URL PostgreSQL (dev : conteneur Docker port 5433)      |
| `APP_URL`             | URL publique du site (liens dans les e-mails)          |
| `ADMIN_EMAIL`         | Email de connexion admin                               |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt (généré via `pnpm hash`, `$` échappés)     |
| `SESSION_SECRET`      | Secret de signature des sessions (min. 32 caractères)  |
| `RESEND_API_KEY`      | Clé API Resend (vide = e-mails désactivés)             |
| `MAIL_FROM`           | Expéditeur, ex. `MécanoDom <onboarding@resend.dev>`    |
| `MAIL_ADMIN`          | Destinataire des alertes mécanicien                    |

> Astuce : dans les fichiers `.env`, Next.js interprète `$` comme une variable.
> Le script `pnpm hash` échappe automatiquement les `$` du hash bcrypt (`\$`).

### E-mails (Resend)

Les envois sont **optionnels** : sans `RESEND_API_KEY`, l'application fonctionne
normalement et les e-mails sont simplement ignorés (log). Pour les activer :

1. Créez une clé sur [resend.com](https://resend.com) (offre gratuite).
2. Renseignez `RESEND_API_KEY` et `MAIL_ADMIN` dans `.env`.
3. En démo, gardez `MAIL_FROM="MécanoDom <onboarding@resend.dev>"` (aucune config
   DNS requise) ; en production, utilisez une adresse d'un domaine vérifié.

## Scripts utiles

```bash
pnpm dev            # Serveur de développement
pnpm build          # Build de production (génère aussi le client Prisma)
pnpm start          # Serveur de production
pnpm hash "<pwd>"   # Génère un hash bcrypt pour l'admin
pnpm db:up          # Démarre PostgreSQL (docker compose up -d)
pnpm db:down        # Arrête PostgreSQL (ajouter -v pour effacer les données)
pnpm db:migrate     # Applique les migrations Prisma
pnpm db:seed        # Injecte les données de démonstration
pnpm db:reset       # Réinitialise la base (efface les données)
```

## Structure

```
docker-compose.yml PostgreSQL de développement
prisma/            schema.prisma, seed.ts, migrations/
src/app/
  (public)/        pages publiques (accueil, services, zone, contact,
                   rendez-vous, rendez-vous/annulation)
  admin/           login + (dashboard) protégé (dont calendrier)
  api/             auth, services, availability, coverage, bookings
src/components/    layout/, booking/, admin/, carte, checker
src/lib/           prisma, auth, session, availability, coverage, validators,
                   utils, site, mail, urls
src/actions/       server actions admin + annulation publique (public-cancel)
src/middleware.ts  protège /admin/*
```

## Logique métier

- **Prix** stockés en centimes (`Int`) pour éviter les erreurs de flottant.
- **Dates** stockées en **UTC**, affichées en **Europe/Paris** (`date-fns-tz`).
- **Créneaux** : voir `src/lib/availability.ts` (horaires hebdo, jours bloqués,
  délai minimum, fenêtre max, marge tampon, exclusion des chevauchements).
- **Anti double-réservation** : re-vérification du chevauchement dans une
  transaction Prisma lors de la création (`src/app/api/bookings/route.ts`).
- **Annulation client** : chaque réservation porte un `cancelToken` unique ; le
  lien `/rendez-vous/annulation?id=…&token=…` (envoyé par e-mail uniquement)
  permet au client d'annuler et de libérer le créneau, sans compte.
- **E-mails** : `src/lib/mail.ts` (Resend), envois non bloquants — un échec
  d'e-mail ne compromet jamais la réservation.
