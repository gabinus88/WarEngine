class GameClient {
    constructor(socket) {
        this.socket = socket;
        this.canvas = null;
        this.ctx = null;
        this.gameState = null;
        this.playerId = null;
        this.playerTeam = null;
        
        // Système de caméra
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetX: 0,
            targetY: 0,
            speed: 500
        };
        
        // Système de sélection
        this.selectedUnits = [];
        this.selectionBox = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            isActive: false
        };
        
        // Interface utilisateur
        this.ui = {
            minimap: { x: 10, y: 10, width: 200, height: 150 },
            unitInfo: { x: 10, y: 170, width: 300, height: 200 },
            resources: { x: 10, y: 380, width: 300, height: 100 },
            buildMenu: { x: 10, y: 490, width: 300, height: 150 }
        };
        
        // État du jeu
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.keys = {};
        this.lastUpdate = Date.now();
        
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.startGameLoop();
    }

    createCanvas() {
        // Créer le canvas principal
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1000';
        this.canvas.style.cursor = 'crosshair';
        
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        
        // Masquer l'interface existante
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Événements de souris
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Événements de clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Redimensionnement de fenêtre
        window.addEventListener('resize', () => this.handleResize());
        
        // Gestion du déplacement de caméra aux bords
        this.canvas.addEventListener('mousemove', (e) => this.handleCameraEdgeMovement(e));
    }

    setupSocketListeners() {
        this.socket.on('game_state', (gameState) => {
            this.gameState = gameState;
        });

        this.socket.on('units_moved', (data) => {
            // Mettre à jour les unités côté client
            if (this.gameState) {
                data.unitIds.forEach(unitId => {
                    const unit = this.gameState.units.find(u => u.id === unitId);
                    if (unit) {
                        unit.targetX = data.targetX;
                        unit.targetY = data.targetY;
                        unit.isMoving = true;
                    }
                });
            }
        });

        this.socket.on('units_selected', (data) => {
            if (data.playerId === this.playerId) {
                this.selectedUnits = data.unitIds;
            }
        });

        this.socket.on('attack_initiated', (data) => {
            // Gérer l'attaque côté client
            if (this.gameState) {
                data.unitIds.forEach(unitId => {
                    const unit = this.gameState.units.find(u => u.id === unitId);
                    if (unit) {
                        unit.attackTarget = { x: data.targetX, y: data.targetY };
                    }
                });
            }
        });

        this.socket.on('structure_built', (data) => {
            if (this.gameState) {
                this.gameState.structures.push(data.structure);
            }
        });

        this.socket.on('camera_updated', (data) => {
            if (data.playerId !== this.playerId) {
                // Mettre à jour la caméra d'autres joueurs si nécessaire
            }
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.worldX = this.screenToWorldX(this.mouse.x);
        this.mouse.worldY = this.screenToWorldY(this.mouse.y);

        if (e.button === 0) { // Clic gauche
            this.selectionBox.startX = this.mouse.x;
            this.selectionBox.startY = this.mouse.y;
            this.selectionBox.isActive = true;
        } else if (e.button === 2) { // Clic droit
            this.handleRightClick();
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.worldX = this.screenToWorldX(this.mouse.x);
        this.mouse.worldY = this.screenToWorldY(this.mouse.y);

        if (this.selectionBox.isActive) {
            this.selectionBox.endX = this.mouse.x;
            this.selectionBox.endY = this.mouse.y;
        }
    }

    handleMouseUp(e) {
        if (e.button === 0 && this.selectionBox.isActive) {
            this.selectionBox.isActive = false;
            this.handleSelection();
        }
    }

    handleRightClick() {
        if (this.selectedUnits.length > 0) {
            // Déplacer les unités sélectionnées
            this.socket.emit('move_units', {
                unitIds: this.selectedUnits,
                targetX: this.mouse.worldX,
                targetY: this.mouse.worldY
            });
        }
    }

    handleSelection() {
        const box = this.selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        const selectedUnits = [];
        
        if (this.gameState) {
            this.gameState.units.forEach(unit => {
                if (unit.ownerId === this.playerId) {
                    const screenX = this.worldToScreenX(unit.x);
                    const screenY = this.worldToScreenY(unit.y);
                    
                    if (screenX >= minX && screenX <= maxX && 
                        screenY >= minY && screenY <= maxY) {
                        selectedUnits.push(unit.id);
                    }
                }
            });
        }

        this.selectedUnits = selectedUnits;
        this.socket.emit('select_units', { unitIds: selectedUnits });
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        // Raccourcis clavier
        if (e.code === 'KeyA' && this.selectedUnits.length > 0) {
            // Attaquer à la position de la souris
            this.socket.emit('attack_target', {
                unitIds: this.selectedUnits,
                targetX: this.mouse.worldX,
                targetY: this.mouse.worldY
            });
        }
        
        if (e.code === 'KeyB') {
            this.showBuildMenu();
        }
        
        // Raccourcis de construction
        if (e.code === 'KeyR') {
            this.startBuilding('barracks');
        }
        if (e.code === 'KeyM') {
            this.startBuilding('resource_mine');
        }
        if (e.code === 'KeyL') {
            this.startBuilding('lumber_mill');
        }
        if (e.code === 'KeyQ') {
            this.startBuilding('quarry');
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleCameraEdgeMovement(e) {
        const edgeThreshold = 50;
        const moveSpeed = 300;
        
        if (e.clientX < edgeThreshold) {
            this.camera.targetX -= moveSpeed * 0.016; // 60 FPS
        } else if (e.clientX > window.innerWidth - edgeThreshold) {
            this.camera.targetX += moveSpeed * 0.016;
        }
        
        if (e.clientY < edgeThreshold) {
            this.camera.targetY -= moveSpeed * 0.016;
        } else if (e.clientY > window.innerHeight - edgeThreshold) {
            this.camera.targetY += moveSpeed * 0.016;
        }
    }

    // Conversion de coordonnées
    screenToWorldX(screenX) {
        return (screenX - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
    }

    screenToWorldY(screenY) {
        return (screenY - this.canvas.height / 2) / this.camera.zoom + this.camera.y;
    }

    worldToScreenX(worldX) {
        return (worldX - this.camera.x) * this.camera.zoom + this.canvas.width / 2;
    }

    worldToScreenY(worldY) {
        return (worldY - this.camera.y) * this.camera.zoom + this.canvas.height / 2;
    }

    // Boucle de jeu
    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // Mettre à jour la caméra
        this.updateCamera(deltaTime);
        
        // Mettre à jour les unités côté client
        if (this.gameState) {
            this.gameState.units.forEach(unit => {
                this.updateUnit(unit, deltaTime);
            });
        }
    }

    updateCamera(deltaTime) {
        // Interpolation de la caméra
        const lerpFactor = 0.1;
        this.camera.x += (this.camera.targetX - this.camera.x) * lerpFactor;
        this.camera.y += (this.camera.targetY - this.camera.y) * lerpFactor;
    }

    updateUnit(unit, deltaTime) {
        if (unit.isMoving) {
            const dx = unit.targetX - unit.x;
            const dy = unit.targetY - unit.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const speed = 100; // pixels par seconde
                const moveDistance = speed * deltaTime;
                const moveX = (dx / distance) * moveDistance;
                const moveY = (dy / distance) * moveDistance;
                
                unit.x += moveX;
                unit.y += moveY;
            } else {
                unit.x = unit.targetX;
                unit.y = unit.targetY;
                unit.isMoving = false;
            }
        }
    }

    render() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameState) return;

        // Sauvegarder le contexte
        this.ctx.save();
        
        // Appliquer la transformation de caméra
        this.ctx.translate(this.canvas.width / 2 - this.camera.x * this.camera.zoom, 
                          this.canvas.height / 2 - this.camera.y * this.camera.zoom);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Rendre la grille de fond
        this.renderGrid();
        
        // Rendre les structures
        this.renderStructures();
        
        // Rendre les unités
        this.renderUnits();
        
        // Rendre les projectiles
        this.renderProjectiles();
        
        // Rendre les effets
        this.renderEffects();
        
        // Restaurer le contexte
        this.ctx.restore();
        
        // Rendre l'interface utilisateur
        this.renderUI();
        
        // Rendre la boîte de sélection
        this.renderSelectionBox();
    }

    renderGrid() {
        const gridSize = 50;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = startX + this.canvas.width / this.camera.zoom + gridSize;
        const endY = startY + this.canvas.height / this.camera.zoom + gridSize;

        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1 / this.camera.zoom;
        
        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    renderUnits() {
        if (!this.gameState) return;

        this.gameState.units.forEach(unit => {
            // Rendre l'unité
            this.ctx.fillStyle = this.getTeamColor(unit.team);
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y, unit.size || 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rendre la bordure de sélection
            if (this.selectedUnits.includes(unit.id)) {
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = 3 / this.camera.zoom;
                this.ctx.stroke();
            }
            
            // Rendre la barre de vie
            this.renderHealthBar(unit);
        });
    }

    renderStructures() {
        if (!this.gameState) return;

        this.gameState.structures.forEach(structure => {
            // Rendre la structure
            this.ctx.fillStyle = this.getTeamColor(structure.team);
            this.ctx.fillRect(
                structure.x - structure.size / 2,
                structure.y - structure.size / 2,
                structure.size,
                structure.size
            );
            
            // Rendre la barre de vie
            this.renderHealthBar(structure);
            
            // Rendre l'indicateur de construction
            if (structure.isUnderConstruction) {
                this.renderConstructionProgress(structure);
            }
        });
    }

    renderProjectiles() {
        if (!this.gameState) return;

        this.gameState.projectiles.forEach(projectile => {
            // Rendre le projectile
            this.ctx.fillStyle = projectile.color || '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.size || 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rendre l'effet de traînée pour les projectiles rapides
            if (projectile.type === 'piercing') {
                this.ctx.strokeStyle = projectile.color || '#00FFFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(projectile.x - this.directionX * 20, projectile.y - this.directionY * 20);
                this.ctx.lineTo(projectile.x, projectile.y);
                this.ctx.stroke();
            }
        });
    }

    renderEffects() {
        if (!this.gameState) return;

        this.gameState.effects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha || 1;
            
            switch (effect.type) {
                case 'explosion':
                case 'magic_burst':
                    // Cercle d'explosion
                    this.ctx.strokeStyle = effect.color;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    // Remplissage avec dégradé
                    const gradient = this.ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, effect.radius
                    );
                    gradient.addColorStop(0, effect.color + '80');
                    gradient.addColorStop(1, effect.color + '00');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    break;
                    
                case 'damage_text':
                    this.ctx.fillStyle = effect.color;
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        effect.text || '0',
                        effect.x,
                        effect.y + effect.offsetY
                    );
                    break;
            }
            
            this.ctx.restore();
        });
    }

    renderHealthBar(entity) {
        const barWidth = entity.size || 30;
        const barHeight = 4;
        const barY = entity.y - (entity.size || 15) - 10;
        
        // Fond de la barre
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(entity.x - barWidth / 2, barY, barWidth, barHeight);
        
        // Barre de vie
        const healthPercentage = entity.health / entity.maxHealth;
        this.ctx.fillStyle = healthPercentage > 0.5 ? '#00FF00' : 
                           healthPercentage > 0.25 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(entity.x - barWidth / 2, barY, barWidth * healthPercentage, barHeight);
    }

    renderConstructionProgress(structure) {
        const progress = structure.constructionProgress / structure.constructionTime;
        const barWidth = structure.size;
        const barHeight = 6;
        const barY = structure.y - structure.size / 2 - 15;
        
        // Fond
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(structure.x - barWidth / 2, barY, barWidth, barHeight);
        
        // Progression
        this.ctx.fillStyle = '#00AAFF';
        this.ctx.fillRect(structure.x - barWidth / 2, barY, barWidth * progress, barHeight);
    }

    renderUI() {
        // Mini-map
        this.renderMinimap();
        
        // Informations des unités sélectionnées
        this.renderUnitInfo();
        
        // Ressources
        this.renderResources();
        
        // Menu de construction
        this.renderBuildMenu();
    }

    renderMinimap() {
        const minimap = this.ui.minimap;
        
        // Fond de la mini-map
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimap.x, minimap.y, minimap.width, minimap.height);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimap.x, minimap.y, minimap.width, minimap.height);
        
        if (this.gameState) {
            // Rendre les unités sur la mini-map
            this.gameState.units.forEach(unit => {
                const mapX = minimap.x + (unit.x / this.gameState.gameState.mapWidth) * minimap.width;
                const mapY = minimap.y + (unit.y / this.gameState.gameState.mapHeight) * minimap.height;
                
                this.ctx.fillStyle = this.getTeamColor(unit.team);
                this.ctx.fillRect(mapX - 1, mapY - 1, 2, 2);
            });
            
            // Rendre les structures sur la mini-map
            this.gameState.structures.forEach(structure => {
                const mapX = minimap.x + (structure.x / this.gameState.gameState.mapWidth) * minimap.width;
                const mapY = minimap.y + (structure.y / this.gameState.gameState.mapHeight) * minimap.height;
                
                this.ctx.fillStyle = this.getTeamColor(structure.team);
                this.ctx.fillRect(mapX - 2, mapY - 2, 4, 4);
            });
            
            // Indicateur de caméra
            const cameraMapX = minimap.x + (this.camera.x / this.gameState.gameState.mapWidth) * minimap.width;
            const cameraMapY = minimap.y + (this.camera.y / this.gameState.gameState.mapHeight) * minimap.height;
            
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cameraMapX - 10, cameraMapY - 10, 20, 20);
        }
    }

    renderUnitInfo() {
        const unitInfo = this.ui.unitInfo;
        
        // Fond
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(unitInfo.x, unitInfo.y, unitInfo.width, unitInfo.height);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(unitInfo.x, unitInfo.y, unitInfo.width, unitInfo.height);
        
        if (this.selectedUnits.length > 0 && this.gameState) {
            const unit = this.gameState.units.find(u => u.id === this.selectedUnits[0]);
            if (unit) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(`Type: ${unit.type}`, unitInfo.x + 10, unitInfo.y + 25);
                this.ctx.fillText(`Vie: ${unit.health}/${unit.maxHealth}`, unitInfo.x + 10, unitInfo.y + 45);
                this.ctx.fillText(`Dégâts: ${unit.attackDamage}`, unitInfo.x + 10, unitInfo.y + 65);
                this.ctx.fillText(`Portée: ${unit.attackRange}`, unitInfo.x + 10, unitInfo.y + 85);
                this.ctx.fillText(`Vitesse: ${unit.speed}`, unitInfo.x + 10, unitInfo.y + 105);
            }
        }
    }

    renderResources() {
        const resources = this.ui.resources;
        
        // Fond
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(resources.x, resources.y, resources.width, resources.height);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(resources.x, resources.y, resources.width, resources.height);
        
        if (this.gameState) {
            const player = this.gameState.players.find(p => p.socketId === this.playerId);
            if (player) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Or: ${player.resources.gold}`, resources.x + 10, resources.y + 25);
                this.ctx.fillText(`Bois: ${player.resources.wood}`, resources.x + 10, resources.y + 50);
                this.ctx.fillText(`Pierre: ${player.resources.stone}`, resources.x + 10, resources.y + 75);
            }
        }
    }

    renderBuildMenu() {
        const buildMenu = this.ui.buildMenu;
        
        // Fond
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(buildMenu.x, buildMenu.y, buildMenu.width, buildMenu.height);
        
        // Bordure
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buildMenu.x, buildMenu.y, buildMenu.width, buildMenu.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Constructions:', buildMenu.x + 10, buildMenu.y + 20);
        this.ctx.fillText('B - Base (500 or)', buildMenu.x + 10, buildMenu.y + 40);
        this.ctx.fillText('R - Caserne (300 or)', buildMenu.x + 10, buildMenu.y + 60);
        this.ctx.fillText('M - Mine (200 or)', buildMenu.x + 10, buildMenu.y + 80);
        this.ctx.fillText('L - Scierie (200 or)', buildMenu.x + 10, buildMenu.y + 100);
        this.ctx.fillText('Q - Carrière (200 or)', buildMenu.x + 10, buildMenu.y + 120);
    }

    renderSelectionBox() {
        if (this.selectionBox.isActive) {
            const box = this.selectionBox;
            const x = Math.min(box.startX, box.endX);
            const y = Math.min(box.startY, box.endY);
            const width = Math.abs(box.endX - box.startX);
            const height = Math.abs(box.endY - box.startY);
            
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);
            
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            this.ctx.fillRect(x, y, width, height);
        }
    }

    getTeamColor(team) {
        switch (team) {
            case 'blue': return '#0066CC';
            case 'red': return '#CC0000';
            case 'green': return '#00CC00';
            default: return '#666666';
        }
    }

    showBuildMenu() {
        // Implémenter le menu de construction
        console.log('Menu de construction ouvert');
    }

    startBuilding(buildingType) {
        // Commencer la construction d'un bâtiment à la position de la souris
        this.socket.emit('build_structure', {
            type: buildingType,
            x: this.mouse.worldX,
            y: this.mouse.worldY
        });
    }

    joinGame(username, team) {
        this.playerId = this.socket.id;
        this.playerTeam = team;
        this.socket.emit('join_game', { username, team });
        
        // Afficher les instructions de contrôle
        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel) {
            controlsPanel.style.display = 'block';
        }
    }
}

// Export pour utilisation dans client.js
window.GameClient = GameClient;
