const Unit = require('./Unit');
const Player = require('./Player');
const Structure = require('./Structure');
const Projectile = require('./Projectile');
const Effect = require('./Effect');

class GameEngine {
    constructor() {
        this.players = new Map();
        this.units = new Map();
        this.structures = new Map();
        this.projectiles = new Map();
        this.effects = new Map();
        this.gameState = {
            mapWidth: 2000,
            mapHeight: 2000,
            tickRate: 60,
            lastUpdate: Date.now()
        };
        this.unitIdCounter = 0;
        this.structureIdCounter = 0;
        this.projectileIdCounter = 0;
        this.effectIdCounter = 0;
        
        // Démarrer la boucle de jeu
        this.startGameLoop();
    }

    addPlayer(socketId, username, team) {
        const player = new Player(socketId, username, team);
        this.players.set(socketId, player);
        
        // Créer des unités de départ pour le joueur
        this.createStartingUnits(player);
        
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            // Supprimer toutes les unités du joueur
            for (const [unitId, unit] of this.units) {
                if (unit.ownerId === socketId) {
                    this.units.delete(unitId);
                }
            }
            this.players.delete(socketId);
        }
    }

    createStartingUnits(player) {
        const startX = player.team === 'blue' ? 100 : 1900;
        const startY = 1000;
        
        // Créer 5 unités de base
        for (let i = 0; i < 5; i++) {
            const unit = new Unit(
                this.unitIdCounter++,
                'soldier',
                startX + (i * 50),
                startY,
                player.socketId,
                player.team
            );
            this.units.set(unit.id, unit);
        }
        
        // Créer un bâtiment de base
        const base = new Structure(
            this.structureIdCounter++,
            'base',
            startX,
            startY - 100,
            player.socketId,
            player.team
        );
        this.structures.set(base.id, base);
    }

    moveUnits(unitIds, targetX, targetY) {
        unitIds.forEach(unitId => {
            const unit = this.units.get(unitId);
            if (unit) {
                unit.moveTo(targetX, targetY);
            }
        });
    }

    selectUnits(playerId, unitIds) {
        const player = this.players.get(playerId);
        if (player) {
            player.selectedUnits = unitIds;
        }
    }

    attackTarget(unitIds, targetX, targetY, targetId) {
        unitIds.forEach(unitId => {
            const unit = this.units.get(unitId);
            if (unit) {
                if (targetId) {
                    const target = this.units.get(targetId) || this.structures.get(targetId);
                    if (target) {
                        unit.attackTarget(target);
                    }
                } else {
                    unit.attackPosition(targetX, targetY);
                }
            }
        });
    }

    buildStructure(playerId, type, x, y) {
        const player = this.players.get(playerId);
        if (!player) return null;

        const structure = new Structure(
            this.structureIdCounter++,
            type,
            x,
            y,
            playerId,
            player.team
        );
        
        this.structures.set(structure.id, structure);
        return structure;
    }

    updateCameraPosition(playerId, x, y) {
        const player = this.players.get(playerId);
        if (player) {
            player.cameraX = x;
            player.cameraY = y;
        }
    }

    createProjectile(fromX, fromY, toX, toY, damage, ownerId, type = 'normal') {
        const projectile = new Projectile(
            this.projectileIdCounter++,
            fromX,
            fromY,
            toX,
            toY,
            damage,
            ownerId,
            type
        );
        this.projectiles.set(projectile.id, projectile);
        return projectile;
    }

    getGameState() {
        return {
            players: Array.from(this.players.values()),
            units: Array.from(this.units.values()),
            structures: Array.from(this.structures.values()),
            projectiles: Array.from(this.projectiles.values()),
            effects: Array.from(this.effects.values()),
            gameState: this.gameState
        };
    }

    startGameLoop() {
        setInterval(() => {
            this.update();
        }, 1000 / this.gameState.tickRate);
    }

    update() {
        const now = Date.now();
        const deltaTime = (now - this.gameState.lastUpdate) / 1000;
        this.gameState.lastUpdate = now;

        // Mettre à jour les unités
        for (const [unitId, unit] of this.units) {
            unit.update(deltaTime);
            
            // Vérifier les attaques
            if (unit.attackTarget && unit.canAttack()) {
                this.handleUnitAttack(unit);
            }
        }

        // Mettre à jour les projectiles
        for (const [projectileId, projectile] of this.projectiles) {
            projectile.update(deltaTime);
            
            if (projectile.hasReachedTarget()) {
                this.handleProjectileHit(projectile);
                this.projectiles.delete(projectileId);
            }
        }

        // Mettre à jour les structures
        for (const [structureId, structure] of this.structures) {
            const producedUnit = structure.update(deltaTime);
            if (producedUnit) {
                // Créer l'unité produite
                const unit = new Unit(
                    this.unitIdCounter++,
                    producedUnit.type,
                    producedUnit.x,
                    producedUnit.y,
                    producedUnit.ownerId,
                    producedUnit.team
                );
                this.units.set(unit.id, unit);
            }
        }

        // Mettre à jour les effets
        for (const [effectId, effect] of this.effects) {
            effect.update(deltaTime);
            if (!effect.isActive) {
                this.effects.delete(effectId);
            }
        }
    }

    handleUnitAttack(unit) {
        if (unit.attackTarget instanceof Unit || unit.attackTarget instanceof Structure) {
            // Attaque directe
            const damage = unit.getDamage();
            unit.attackTarget.takeDamage(damage);
            unit.lastAttackTime = Date.now();
        } else if (unit.attackTarget.x !== undefined && unit.attackTarget.y !== undefined) {
            // Attaque à distance
            this.createProjectile(
                unit.x, unit.y,
                unit.attackTarget.x, unit.attackTarget.y,
                unit.getDamage(),
                unit.ownerId,
                unit.attackType
            );
            unit.lastAttackTime = Date.now();
        }
    }

    handleProjectileHit(projectile) {
        // Gestion des dégâts AoE
        const aoeRadius = projectile.aoeRadius || 0;
        
        if (aoeRadius > 0) {
            // Dégâts en zone
            this.handleAoEDamage(projectile.targetX, projectile.targetY, aoeRadius, projectile.damage, projectile.ownerId);
            
            // Créer un effet d'explosion
            this.createEffect(projectile.targetX, projectile.targetY, 'explosion');
        } else {
            // Dégâts directs
            let closestTarget = null;
            let closestDistance = Infinity;

            // Vérifier les unités
            for (const [unitId, unit] of this.units) {
                if (unit.ownerId !== projectile.ownerId) {
                    const distance = Math.sqrt(
                        Math.pow(unit.x - projectile.targetX, 2) + 
                        Math.pow(unit.y - projectile.targetY, 2)
                    );
                    if (distance < 30 && distance < closestDistance) {
                        closestTarget = unit;
                        closestDistance = distance;
                    }
                }
            }

            // Vérifier les structures
            for (const [structureId, structure] of this.structures) {
                if (structure.ownerId !== projectile.ownerId) {
                    const distance = Math.sqrt(
                        Math.pow(structure.x - projectile.targetX, 2) + 
                        Math.pow(structure.y - projectile.targetY, 2)
                    );
                    if (distance < 50 && distance < closestDistance) {
                        closestTarget = structure;
                        closestDistance = distance;
                    }
                }
            }

            if (closestTarget) {
                closestTarget.takeDamage(projectile.damage);
            }
        }
    }

    handleAoEDamage(centerX, centerY, radius, damage, ownerId) {
        // Dégâts aux unités dans la zone
        for (const [unitId, unit] of this.units) {
            if (unit.ownerId !== ownerId) {
                const distance = Math.sqrt(
                    Math.pow(unit.x - centerX, 2) + 
                    Math.pow(unit.y - centerY, 2)
                );
                if (distance <= radius) {
                    // Dégâts réduits selon la distance
                    const damageMultiplier = Math.max(0.1, 1 - (distance / radius));
                    unit.takeDamage(damage * damageMultiplier);
                }
            }
        }

        // Dégâts aux structures dans la zone
        for (const [structureId, structure] of this.structures) {
            if (structure.ownerId !== ownerId) {
                const distance = Math.sqrt(
                    Math.pow(structure.x - centerX, 2) + 
                    Math.pow(structure.y - centerY, 2)
                );
                if (distance <= radius) {
                    const damageMultiplier = Math.max(0.1, 1 - (distance / radius));
                    structure.takeDamage(damage * damageMultiplier);
                }
            }
        }
    }

    createEffect(x, y, type, duration = 1000) {
        const effect = new Effect(
            this.effectIdCounter++,
            x,
            y,
            type,
            duration
        );
        this.effects.set(effect.id, effect);
        return effect;
    }
}

module.exports = GameEngine;
