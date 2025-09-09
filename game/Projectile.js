class Projectile {
    constructor(id, fromX, fromY, toX, toY, damage, ownerId, type = 'normal') {
        this.id = id;
        this.x = fromX;
        this.y = fromY;
        this.startX = fromX;
        this.startY = fromY;
        this.targetX = toX;
        this.targetY = toY;
        this.damage = damage;
        this.ownerId = ownerId;
        this.type = type;
        
        // Calcul de la trajectoire
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.speed = 300; // pixels par seconde
        this.maxDistance = distance;
        this.traveledDistance = 0;
        
        // Direction normalisée
        this.directionX = dx / distance;
        this.directionY = dy / distance;
        
        // Configuration par type
        this.configureByType();
    }

    configureByType() {
        switch (this.type) {
            case 'normal':
                this.size = 3;
                this.color = '#FFD700'; // Or
                this.aoeRadius = 0;
                break;
            case 'explosive':
                this.size = 5;
                this.color = '#FF4500'; // Rouge-orange
                this.aoeRadius = 80;
                this.damage *= 1.5; // Dégâts augmentés
                break;
            case 'piercing':
                this.size = 2;
                this.color = '#00FFFF'; // Cyan
                this.aoeRadius = 0;
                this.piercing = true; // Traverse les cibles
                break;
            case 'magic':
                this.size = 4;
                this.color = '#8A2BE2'; // Violet
                this.aoeRadius = 60;
                this.damage *= 1.2;
                break;
            default:
                this.size = 3;
                this.color = '#FFD700';
                this.aoeRadius = 0;
        }
    }

    update(deltaTime) {
        const moveDistance = this.speed * deltaTime;
        this.x += this.directionX * moveDistance;
        this.y += this.directionY * moveDistance;
        this.traveledDistance += moveDistance;
    }

    hasReachedTarget() {
        return this.traveledDistance >= this.maxDistance;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            targetX: this.targetX,
            targetY: this.targetY,
            damage: this.damage,
            ownerId: this.ownerId,
            type: this.type,
            size: this.size,
            color: this.color,
            aoeRadius: this.aoeRadius,
            progress: this.traveledDistance / this.maxDistance
        };
    }
}

module.exports = Projectile;
