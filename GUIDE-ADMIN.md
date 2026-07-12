# Guide d'administration — MécanoDom

Ce guide explique comment gérer votre site au quotidien depuis l'espace
administrateur. Aucune compétence technique n'est nécessaire.

---

## Se connecter

1. Rendez-vous sur **votre-site.fr/admin** (ou cliquez sur « Espace
   administrateur » en bas de page).
2. Saisissez votre **e-mail** et votre **mot de passe**.
3. Cliquez sur **Se connecter**.

Pour vous déconnecter : bouton **Déconnexion** en bas du menu de gauche.

> À la première connexion, faites changer votre mot de passe par défaut
> (demandez-le à votre prestataire technique). Ne le partagez jamais.

---

## Le menu

Une fois connecté, le menu à gauche donne accès à :

- **Tableau de bord** — vue d'ensemble
- **Calendrier** — vos rendez-vous semaine par semaine
- **Réservations** — la liste de toutes les demandes
- **Prestations & tarifs** — vos services et leurs prix
- **Disponibilités** — vos horaires et jours de fermeture
- **Zones d'intervention** — les codes postaux couverts

---

## Tableau de bord

C'est votre page d'accueil. Vous y voyez en un coup d'œil :

- le nombre de demandes **En attente** (à traiter),
- le nombre de **RDV à venir**,
- le nombre de **prestations** et de **zones** actives,
- la liste des **prochains rendez-vous** (cliquez dessus pour voir le détail).

---

## Calendrier

Affiche vos rendez-vous de la semaine, jour par jour.

- Boutons **Précédente / Cette semaine / Suivante** pour naviguer.
- Chaque rendez-vous indique l'heure, le client et la prestation.
- Un **code couleur** indique le statut (voir la légende en bas) :
  - jaune = en attente, vert = confirmé, bleu = terminé, gris = annulé.
- Cliquez sur un rendez-vous pour ouvrir sa fiche.

---

## Réservations

La liste de toutes les demandes, de la plus récente à la plus ancienne.

- **Filtres** en haut : Tous, En attente, Confirmés, Terminés, Annulés.
- Chaque ligne affiche la date, le client, la prestation, le lieu et le statut.
- Cliquez sur **Détails** pour ouvrir la fiche.

### La fiche d'une réservation

Vous y trouvez toutes les informations : prestation, date/heure, lieu, prix,
coordonnées du client (téléphone et e-mail cliquables) et véhicule.

**Changer le statut :**
1. Choisissez le nouveau statut dans la liste déroulante.
2. Cliquez sur **Enregistrer**.

**Supprimer** une réservation : bouton rouge « Supprimer la réservation »
(action définitive, une confirmation est demandée).

### Comprendre les statuts

| Statut | Signification | Effet sur vos créneaux |
|--------|---------------|------------------------|
| **En attente** | Nouvelle demande à traiter | Le créneau est bloqué |
| **Confirmé** | Vous avez validé l'intervention | Le créneau reste bloqué |
| **Terminé** | Intervention effectuée | — |
| **Annulé** | Rendez-vous annulé | Le créneau **se libère** |

> Passer une réservation en **Annulé** libère automatiquement le créneau, qui
> redevient réservable par un autre client.

---

## Prestations & tarifs

C'est ici que vous gérez ce que vous proposez et à quel prix. **Tout changement
est immédiatement visible sur le site public.**

### Organisation

Les prestations sont regroupées par **catégories** (ex. « Entretien courant »,
« Freinage »).

### Ajouter une catégorie

Encadré **« Nouvelle catégorie »** : saisissez un nom, un « slug » (identifiant
en minuscules pour l'adresse, ex. `freinage`) et un ordre d'affichage, puis
**Ajouter la catégorie**.

### Ajouter une prestation

Encadré **« Nouvelle prestation »** :
- **Nom** et **description**,
- **Prix (€)** — en euros (ex. `49,90`),
- **Durée (min)** — durée estimée de l'intervention (sert à calculer les créneaux),
- **Catégorie**,
- **Ordre** d'affichage,
- case **« Prestation active »** (décochée = masquée du site).

Puis **Ajouter la prestation**.

### Modifier / masquer / supprimer

Sous chaque catégorie, pour chaque prestation :
- **Modifier cette prestation** — dépliez pour changer nom, prix, durée, etc.
- **Masquer / Activer** — retire ou remet la prestation sur le site sans la supprimer.
- **Supprimer** — définitif.

> Conseil : pour retirer temporairement une prestation, **masquez-la** plutôt que
> de la supprimer.

---

## Disponibilités

Trois réglages déterminent quand les clients peuvent réserver.

### 1. Paramètres de réservation

- **Pas des créneaux (min)** — intervalle entre deux débuts de créneaux (ex. 30).
- **Marge entre RDV (min)** — temps tampon avant/après chaque intervention
  (déplacement, imprévu).
- **Délai minimum (heures)** — on ne peut pas réserver en dessous de ce délai
  (ex. 12 h : pas de RDV pour dans 2 h).
- **Réservation max (jours)** — jusqu'à combien de jours à l'avance on peut réserver.

Cliquez sur **Enregistrer** après modification.

### 2. Horaires hebdomadaires

Vos plages de travail récurrentes, jour par jour.

- Pour **ajouter** une plage : choisissez le jour, l'heure de début et de fin,
  puis **Ajouter le créneau** (ex. Lundi 08:00–12:00, puis 13:00–18:00).
- Sur chaque plage existante : bouton pour la **désactiver** temporairement (⏸)
  ou la **supprimer** (✕).
- Un jour sans plage = **fermé** (aucun créneau proposé).

### 3. Jours indisponibles

Pour bloquer des dates exceptionnelles (congés, jours fériés).

- Choisissez une **date**, ajoutez un **motif** (facultatif), puis
  **Bloquer cette date**.
- Aucun rendez-vous ne pourra être pris ce jour-là.
- Supprimez un blocage pour rouvrir la date.

---

## Zones d'intervention

La liste des **codes postaux** où vous vous déplacez. Un client dont le code
postal n'est pas dans la liste **ne peut pas** réserver.

- **Ajouter une zone** : code postal (5 chiffres) + ville, puis **Ajouter la zone**.
- Sur chaque zone : **Désactiver/Activer**, **Modifier**, **Supprimer**.
- Une grande ville à plusieurs codes postaux = une ligne par code (ex. Paris
  75001, 75002, …).

---

## Les e-mails automatiques

Le site envoie des e-mails tout seul (si l'envoi est configuré) :

- **Nouvelle réservation** → un e-mail de confirmation au **client** + une
  alerte à **vous** (le mécanicien).
- **Passage en « Confirmé »** → e-mail au client confirmant le rendez-vous.
- **Passage en « Annulé »** → e-mail au client l'informant de l'annulation.

Chaque e-mail au client contient aussi un **lien d'annulation** : le client peut
annuler lui-même son rendez-vous. Vous en êtes averti par e-mail, et le créneau
se libère automatiquement.

---

## Questions fréquentes

**Un client dit ne pas trouver de créneau.**
Vérifiez : vos **horaires** (Disponibilités), qu'il n'y a pas de **jour bloqué**,
le **délai minimum**, et que la prestation choisie n'est pas trop longue pour vos
plages.

**Je veux fermer une semaine (vacances).**
Ajoutez chaque jour concerné dans **Jours indisponibles**, ou désactivez
temporairement vos plages horaires.

**Je change un prix : est-ce visible tout de suite ?**
Oui, immédiatement sur la page publique des tarifs.

**Un client s'est trompé / veut annuler.**
Ouvrez sa réservation et passez-la en **Annulé** (le créneau se libère). Le client
peut aussi le faire lui-même via le lien reçu par e-mail.

**J'ai supprimé quelque chose par erreur.**
Les suppressions sont définitives. En cas de doute, préférez **Masquer** ou
**Désactiver**.

---

## Bonnes pratiques

- Traitez régulièrement les demandes **En attente** (les confirmer rassure le client).
- Gardez vos **horaires** et **jours bloqués** à jour pour éviter les créneaux
  impossibles.
- Ne partagez pas vos identifiants ; déconnectez-vous sur un ordinateur partagé.
