
# Vouch & Scam Bot — Discord (FR)

**But** : Bot Discord (discord.js v14+) spécialisé pour gérer **vouches** et **reports de scam**.
Tous les messages envoyés par le bot sont des **embeds** stylés.

## Prérequis
- Node.js >= 18
- Un bot Discord (token), `CLIENT_ID` et (optionnel) `GUILD_ID` si vous déployez en guild pour tests.

## Installation
1. Cloner / copier le projet.
2. `cd vouch-scam-bot`
3. `npm install`
4. Copier `config.example.json` → `config.json` et remplir `buyerId` (ID du propriétaire) et autres champs.
5. Copier `.env.example` → `.env` et remplir `TOKEN`, `CLIENT_ID`, `GUILD_ID` si besoin.
6. (Optionnel mais recommandé en dev) Déployer les commandes slash en guild :  
   `node deploy-commands.js` (assurez-vous que `GUILD_ID` est défini dans `.env`)
7. Lancer le bot :  
   `npm start` ou `node index.js`

## Commandes

### Slash (public)
- `/vouches user:(obligatoire) commentaires:(facultatif)`  
  Envoie un embed "vouch" et enregistre dans `data/vouches.json`. Empêche si auteur blacklité.

- `/scam user:(obligatoire) commentaires:(obligatoire)`  
  Envoie un embed d'alerte et enregistre dans `data/scams.json`. Empêche si auteur blacklité.

> Limite anti-spam configurable dans `config.example.json` (`rateLimit.count` et `rateLimit.windowSec`).

### Commandes préfixées (buyer / admins)
Les commandes administratives utilisent le préfixe `.` (point), documentées ci-dessous.

**Buyer only** (`buyerId` dans config)
- `.admin @user` — ajouter admin
- `.deladmin @user` — retirer admin
- `.adminlist` — lister admins

**Admins** (IDs dans `data/admins.json`, buyer peut exécuter aussi)
- `.bl @user` — blacklist user
- `.unbl @user` — retirer blacklist
- `.bllist` — lister blacklist

> Les commandes acceptent aussi une réponse à un message : si vous répondez à un message et exécutez `.bl`, la cible est l'auteur du message.

## Structure du projet
- `index.js` - point d'entrée
- `deploy-commands.js` - script pour enregistrer les slash commands (guild)
- `src/commands/` - handlers (slash)
- `src/events/` - events Discord
- `src/utils/` - helpers (lecture/écriture JSON atomique, checks)
- `data/` - fichiers JSON (admins, blacklist, vouches, scams)
- `assets/` - images exemple
- `logs/` - fichiers de logs
- `config.example.json`, `.env.example`

## Sécurité & bonnes pratiques
- Ne partagez jamais votre `.env` contenant `TOKEN`.
- Le `buyerId` a pouvoir absolu.
- Faites des sauvegardes régulières du dossier `data/`.

## Tests manuels rapides
1. Déployer slash commands au moins dans une guild de test.
2. Utiliser `/vouches @user commentaire` puis vérifier `data/vouches.json`.
3. Tester `.admin @id` en tant que buyer.
4. Tester `.bl @id` en tant qu'admin (ou buyer), vérifier `data/blacklist.json`.

## Licence
MIT
