# WarEngine - Jeu de Stratégie en Temps Réel

## 🎮 Description

WarEngine est un jeu de stratégie en temps réel multijoueur développé avec Node.js et Socket.IO. Le jeu propose toutes les fonctionnalités classiques d'un RTS moderne :

### ✨ Fonctionnalités

- **Système d'unités complet** : Déplacement, barres de vie, statistiques détaillées
- **Système de combat avancé** : 
  - Attaques directes et à distance
  - Dégâts en zone (AoE) avec effets visuels
  - Projectiles avec différents types (normal, explosif, perforant, magique)
- **Système d'équipes** : 3 équipes avec couleurs distinctes (Bleu, Rouge, Vert)
- **Construction de bâtiments** : Base, caserne, mines, scierie, carrière
- **Sélection d'unités** : Boîte de sélection avec surlignement jaune
- **Caméra top-down** : Déplacement aux bords de l'écran
- **Mini-map** : Vue d'ensemble de la carte avec indicateurs
- **Interface utilisateur** : Canvas personnalisable avec informations en temps réel
- **Multijoueur** : Réplication client-serveur avec Socket.IO

### 🎯 Types d'unités

- **Soldat** : Unité de base, attaque normale
- **Tank** : Unité lourde, attaque explosive (AoE)
- **Éclaireur** : Unité rapide, attaque perforante

### 🏗️ Types de bâtiments

- **Base** : Bâtiment principal, produit des soldats et éclaireurs
- **Caserne** : Produit des soldats et tanks
- **Mine** : Génère de l'or
- **Scierie** : Génère du bois
- **Carrière** : Génère de la pierre

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation
```bash
# Cloner ou télécharger le projet
cd APPNodeJS

# Installer les dépendances
npm install

# Lancer le serveur
node server.js
```

### Accès au jeu
1. Ouvrez votre navigateur
2. Allez à l'adresse : `http://localhost:3000`
3. Acceptez le disclaimer
4. Créez un compte ou connectez-vous
5. Choisissez votre équipe (Bleue, Rouge ou Verte)
6. Commencez à jouer !

## 🎮 Contrôles

- **Clic gauche + glisser** : Sélectionner des unités
- **Clic droit** : Déplacer les unités sélectionnées
- **A + clic** : Attaquer à la position
- **B** : Ouvrir le menu de construction
- **Déplacement souris aux bords** : Déplacer la caméra
- **Molette** : Zoom (à venir)

## 🛠️ Architecture Technique

### Structure du projet
```
APPNodeJS/
├── game/                  # Moteur de jeu côté serveur
│   ├── GameEngine.js     # Moteur principal
│   ├── Unit.js           # Système d'unités
│   ├── Player.js         # Gestion des joueurs
│   ├── Structure.js      # Système de bâtiments
│   ├── Projectile.js     # Système de projectiles
│   └── Effect.js         # Effets visuels
├── public/               # Client web
│   ├── game/
│   │   └── GameClient.js # Client de jeu
│   ├── client.js         # Interface utilisateur
│   ├── index.html        # Page principale
│   └── style.css         # Styles
├── server.js             # Serveur principal
└── package.json          # Dépendances
```

### Technologies utilisées
- **Backend** : Node.js, Express, Socket.IO, SQLite3
- **Frontend** : HTML5 Canvas, JavaScript ES6+, CSS3
- **Base de données** : SQLite (pour les comptes utilisateurs)

## 🎨 Fonctionnalités Visuelles

- **Grille de fond** : Aide à la navigation
- **Barres de vie** : Affichage en temps réel
- **Effets d'explosion** : Animations pour les attaques AoE
- **Traînées de projectiles** : Effets visuels pour les attaques perforantes
- **Surlignement de sélection** : Bordures jaunes pour les unités sélectionnées
- **Mini-map interactive** : Vue d'ensemble avec indicateurs de caméra

## 🔧 Développement

Le jeu est conçu de manière modulaire pour faciliter l'ajout de nouvelles fonctionnalités :

- Ajout de nouveaux types d'unités dans `Unit.js`
- Ajout de nouveaux bâtiments dans `Structure.js`
- Ajout de nouveaux types de projectiles dans `Projectile.js`
- Ajout d'effets visuels dans `Effect.js`

## 📝 Notes

- Le jeu fonctionne en temps réel avec une boucle de jeu à 60 FPS
- Tous les calculs de jeu sont effectués côté serveur pour éviter la triche
- Le client ne fait que l'affichage et l'envoi des commandes
- La synchronisation se fait via Socket.IO pour une latence minimale

## 🎯 Prochaines Améliorations

- Système de zoom avec la molette
- Plus de types d'unités et de bâtiments
- Système de technologies et d'améliorations
- Cartes personnalisables
- Système de chat multijoueur
- Sauvegarde des parties