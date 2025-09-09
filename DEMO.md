# 🎮 Démonstration WarEngine

## 🚀 Lancement Rapide

### 1. Installation
```bash
# Assurez-vous d'avoir Node.js installé
npm install

# Lancez le serveur
node server.js
```

### 2. Accès au Jeu
1. Ouvrez votre navigateur
2. Allez à `http://localhost:3000`
3. Acceptez le disclaimer
4. Créez un compte ou connectez-vous
5. Choisissez votre équipe

## 🎯 Scénarios de Test

### Test 1 : Déplacement d'Unités
1. **Sélection** : Clic gauche + glisser pour sélectionner vos unités
2. **Déplacement** : Clic droit sur une position pour déplacer
3. **Observation** : Les unités se déplacent avec des barres de vie visibles

### Test 2 : Combat de Base
1. **Sélection** : Sélectionnez vos unités
2. **Attaque** : Appuyez sur `A` puis cliquez sur une position
3. **Observation** : Les projectiles volent vers la cible

### Test 3 : Combat AoE (Tanks)
1. **Production** : Construisez une caserne (`R`) puis produisez des tanks
2. **Attaque** : Attaquez avec les tanks
3. **Observation** : Explosions avec dégâts en zone

### Test 4 : Construction
1. **Base** : Construisez une base (`B`)
2. **Ressources** : Construisez des mines (`M`), scieries (`L`), carrières (`Q`)
3. **Production** : Construisez une caserne (`R`) pour produire des unités

### Test 5 : Multijoueur
1. **Ouvrez plusieurs onglets** du navigateur
2. **Connectez-vous** avec différents comptes
3. **Choisissez** des équipes différentes
4. **Combattez** entre équipes !

## 🎨 Fonctionnalités Visuelles à Observer

### Interface Utilisateur
- **Mini-map** : Vue d'ensemble en haut à gauche
- **Informations d'unités** : Statistiques détaillées
- **Ressources** : Or, bois, pierre en temps réel
- **Menu de construction** : Raccourcis clavier

### Effets Visuels
- **Grille de fond** : Aide à la navigation
- **Barres de vie** : Vertes, jaunes, rouges selon les dégâts
- **Surlignement de sélection** : Bordures jaunes
- **Projectiles** : Différentes couleurs selon le type
- **Explosions AoE** : Cercles d'explosion animés
- **Traînées** : Effets pour les projectiles perforants

### Caméra
- **Déplacement aux bords** : Bougez la souris aux bords de l'écran
- **Suivi des unités** : La caméra suit vos actions
- **Mini-map** : Indicateur de position de la caméra

## 🎮 Types d'Unités à Tester

### Soldat (Bleu)
- **Attaque** : Projectile normal (doré)
- **Statistiques** : 100 PV, 25 dégâts, portée 150

### Tank (Rouge)
- **Attaque** : Projectile explosif (rouge-orange)
- **Effet** : Dégâts en zone de 80 pixels
- **Statistiques** : 200 PV, 50 dégâts, portée 200

### Éclaireur (Vert)
- **Attaque** : Projectile perforant (cyan)
- **Effet** : Traînée visuelle
- **Statistiques** : 60 PV, 15 dégâts, portée 120

## 🏗️ Bâtiments à Construire

### Base
- **Coût** : 500 or
- **Production** : Soldats, éclaireurs
- **Ressources** : +10 or, +5 bois, +2 pierre/seconde

### Caserne
- **Coût** : 300 or
- **Production** : Soldats, tanks
- **Ressources** : Aucune

### Mine
- **Coût** : 200 or
- **Ressources** : +20 or/seconde

### Scierie
- **Coût** : 200 or
- **Ressources** : +15 bois/seconde

### Carrière
- **Coût** : 200 or
- **Ressources** : +10 pierre/seconde

## 🎯 Objectifs de Test

### Objectif 1 : Maîtrise des Contrôles
- [ ] Sélectionner des unités
- [ ] Déplacer des unités
- [ ] Attaquer des cibles
- [ ] Construire des bâtiments

### Objectif 2 : Stratégie de Base
- [ ] Économie : Construire des bâtiments de ressources
- [ ] Production : Créer une armée diversifiée
- [ ] Combat : Utiliser les différents types d'attaques

### Objectif 3 : Multijoueur
- [ ] Jouer avec plusieurs équipes
- [ ] Tester la synchronisation
- [ ] Observer les effets visuels en temps réel

## 🐛 Points de Test

### Performance
- **Fluidité** : Le jeu doit tourner à 60 FPS
- **Latence** : Les actions doivent être instantanées
- **Synchronisation** : Tous les joueurs voient la même chose

### Fonctionnalités
- **Sélection** : Boîte de sélection fonctionnelle
- **Combat** : Tous les types d'attaques marchent
- **Construction** : Tous les bâtiments se construisent
- **Production** : Les unités se produisent automatiquement

### Interface
- **Mini-map** : Affiche correctement les unités
- **Informations** : Statistiques à jour
- **Ressources** : Compteurs en temps réel
- **Contrôles** : Tous les raccourcis fonctionnent

## 🎉 Résultat Attendu

Après avoir testé toutes ces fonctionnalités, vous devriez avoir un jeu de stratégie en temps réel entièrement fonctionnel avec :

✅ **Système d'unités complet** avec déplacement et combat  
✅ **Système de combat avancé** avec AoE et projectiles  
✅ **Système d'équipes** avec couleurs distinctes  
✅ **Construction de bâtiments** avec production d'unités  
✅ **Sélection d'unités** avec surlignement  
✅ **Caméra top-down** avec déplacement aux bords  
✅ **Mini-map** interactive  
✅ **Interface utilisateur** complète  
✅ **Multijoueur** avec réplication client-serveur  

Le jeu est prêt à être joué et peut être étendu avec de nouvelles fonctionnalités !
