class Unit {
    constructor(id, type, x, y, ownerId, team) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.team = team;
        this.selected = false;
        
        // Statistiques de base
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 100; // pixels par seconde
        this.attackDamage = 25;
        this.attackRange = 150;
        this.attackSpeed = 1; // attaques par seconde
        
        // État de mouvement
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.path = [];
        
        // État de combat
        this.attackTarget = null;
        this.lastAttackTime = 0;
        
        // Configuration par type d'unité
        this.configureByType();
        
        // Type d'attaque
        this.attackType = 'normal';
    }

    configureByType() {
        switch (this.type) {
            case 'soldier':
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.speed = 100;
                this.attackDamage = 25;
                this.attackRange = 150;
                this.attackSpeed = 1;
                this.size = 15;
                break;
            case 'tank':
                this.maxHealth = 200;
                this.health = this.maxHealth;
                this.speed = 60;
                this.attackDamage = 50;
                this.attackRange = 200;
                this.attackSpeed = 0.5;
                this.size = 20;
                this.attackType = 'explosive';
                break;
            case 'scout':
                this.maxHealth = 60;
                this.health = this.maxHealth;
                this.speed = 150;
                this.attackDamage = 15;
                this.attackRange = 120;
                this.attackSpeed = 1.5;
                this.size = 12;
                this.attackType = 'piercing';
                break;
            default:
                this.size = 15;
        }
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
        this.attackTarget = null; // Arrêter l'attaque si on bouge
    }

    attackTarget(target) {
        this.attackTarget = target;
        this.isMoving = false;
    }

    attackPosition(x, y) {
        this.attackTarget = { x, y };
        this.isMoving = false;
    }

    canAttack() {
        const now = Date.now();
        return (now - this.lastAttackTime) >= (1000 / this.attackSpeed);
    }

    getDamage() {
        return this.attackDamage;
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0;
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }

    update(deltaTime) {
        if (this.isDead()) return;

        // Gestion du mouvement
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const moveDistance = this.speed * deltaTime;
                const moveX = (dx / distance) * moveDistance;
                const moveY = (dy / distance) * moveDistance;
                
                this.x += moveX;
                this.y += moveY;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            }
        }

        // Gestion de l'attaque
        if (this.attackTarget && this.canAttack()) {
            if (this.attackTarget instanceof Unit || this.attackTarget instanceof Structure) {
                const distance = Math.sqrt(
                    Math.pow(this.attackTarget.x - this.x, 2) + 
                    Math.pow(this.attackTarget.y - this.y, 2)
                );
                
                if (distance <= this.attackRange) {
                    // Attaque directe
                    this.attackTarget.takeDamage(this.getDamage());
                    this.lastAttackTime = Date.now();
                } else {
                    // Se rapprocher de la cible
                    this.moveTo(this.attackTarget.x, this.attackTarget.y);
                }
            } else if (this.attackTarget.x !== undefined && this.attackTarget.y !== undefined) {
                // Attaque à distance
                const distance = Math.sqrt(
                    Math.pow(this.attackTarget.x - this.x, 2) + 
                    Math.pow(this.attackTarget.y - this.y, 2)
                );
                
                if (distance <= this.attackRange) {
                    // Créer un projectile (sera géré par le GameEngine)
                    this.lastAttackTime = Date.now();
                } else {
                    // Se rapprocher de la position
                    this.moveTo(this.attackTarget.x, this.attackTarget.y);
                }
            }
        }
    }

    getTeamColor() {
        switch (this.team) {
            case 'blue': return '#0066CC';
            case 'red': return '#CC0000';
            case 'green': return '#00CC00';
            default: return '#666666';
        }
    }

    getSelectionColor() {
        return '#FFFF00'; // Jaune pour la sélection
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            ownerId: this.ownerId,
            team: this.team,
            selected: this.selected,
            health: this.health,
            maxHealth: this.maxHealth,
            isMoving: this.isMoving,
            targetX: this.targetX,
            targetY: this.targetY,
            size: this.size
        };
    }
}

module.exports = Unit;
