class Structure {
    constructor(id, type, x, y, ownerId, team) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.team = team;
        
        // Configuration par type de structure
        this.configureByType();
        
        // État de construction
        this.isUnderConstruction = true;
        this.constructionProgress = 0;
        this.constructionTime = this.buildTime;
        
        // Production
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionStartTime = 0;
    }

    configureByType() {
        switch (this.type) {
            case 'base':
                this.maxHealth = 500;
                this.health = this.maxHealth;
                this.size = 60;
                this.buildTime = 30; // secondes
                this.canProduce = ['soldier', 'scout'];
                this.productionCosts = {
                    soldier: { gold: 100, wood: 50, stone: 0 },
                    scout: { gold: 150, wood: 75, stone: 25 }
                };
                this.productionTimes = {
                    soldier: 10,
                    scout: 15
                };
                this.resourceGeneration = { gold: 10, wood: 5, stone: 2 };
                break;
                
            case 'barracks':
                this.maxHealth = 300;
                this.health = this.maxHealth;
                this.size = 40;
                this.buildTime = 20;
                this.canProduce = ['soldier', 'tank'];
                this.productionCosts = {
                    soldier: { gold: 100, wood: 50, stone: 0 },
                    tank: { gold: 300, wood: 150, stone: 100 }
                };
                this.productionTimes = {
                    soldier: 8,
                    tank: 25
                };
                this.resourceGeneration = { gold: 0, wood: 0, stone: 0 };
                break;
                
            case 'resource_mine':
                this.maxHealth = 200;
                this.health = this.maxHealth;
                this.size = 30;
                this.buildTime = 15;
                this.canProduce = [];
                this.productionCosts = {};
                this.productionTimes = {};
                this.resourceGeneration = { gold: 20, wood: 0, stone: 0 };
                break;
                
            case 'lumber_mill':
                this.maxHealth = 200;
                this.health = this.maxHealth;
                this.size = 30;
                this.buildTime = 15;
                this.canProduce = [];
                this.productionCosts = {};
                this.productionTimes = {};
                this.resourceGeneration = { gold: 0, wood: 15, stone: 0 };
                break;
                
            case 'quarry':
                this.maxHealth = 200;
                this.health = this.maxHealth;
                this.size = 30;
                this.buildTime = 15;
                this.canProduce = [];
                this.productionCosts = {};
                this.productionTimes = {};
                this.resourceGeneration = { gold: 0, wood: 0, stone: 10 };
                break;
                
            default:
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.size = 20;
                this.buildTime = 10;
                this.canProduce = [];
                this.productionCosts = {};
                this.productionTimes = {};
                this.resourceGeneration = { gold: 0, wood: 0, stone: 0 };
        }
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

    isConstructionComplete() {
        return !this.isUnderConstruction;
    }

    canProduceUnit(unitType) {
        return this.isConstructionComplete() && 
               this.canProduce.includes(unitType) && 
               !this.currentProduction;
    }

    startProduction(unitType) {
        if (this.canProduceUnit(unitType)) {
            this.currentProduction = unitType;
            this.productionStartTime = Date.now();
            return true;
        }
        return false;
    }

    queueProduction(unitType) {
        if (this.canProduce.includes(unitType)) {
            this.productionQueue.push(unitType);
            return true;
        }
        return false;
    }

    getTeamColor() {
        switch (this.team) {
            case 'blue': return '#0066CC';
            case 'red': return '#CC0000';
            case 'green': return '#00CC00';
            default: return '#666666';
        }
    }

    update(deltaTime) {
        // Gestion de la construction
        if (this.isUnderConstruction) {
            this.constructionProgress += deltaTime;
            if (this.constructionProgress >= this.constructionTime) {
                this.isUnderConstruction = false;
                this.constructionProgress = this.constructionTime;
            }
        }

        // Gestion de la production
        if (this.currentProduction && this.isConstructionComplete()) {
            const productionTime = this.productionTimes[this.currentProduction] * 1000; // en millisecondes
            const elapsed = Date.now() - this.productionStartTime;
            
            if (elapsed >= productionTime) {
                // Production terminée
                const producedUnit = {
                    type: this.currentProduction,
                    x: this.x + (Math.random() - 0.5) * 100,
                    y: this.y + (Math.random() - 0.5) * 100,
                    ownerId: this.ownerId,
                    team: this.team
                };
                
                this.currentProduction = null;
                this.productionStartTime = 0;
                
                // Commencer la production suivante dans la queue
                if (this.productionQueue.length > 0) {
                    const nextUnit = this.productionQueue.shift();
                    this.startProduction(nextUnit);
                }
                
                return producedUnit;
            }
        }
        
        return null;
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            ownerId: this.ownerId,
            team: this.team,
            health: this.health,
            maxHealth: this.maxHealth,
            size: this.size,
            isUnderConstruction: this.isUnderConstruction,
            constructionProgress: this.constructionProgress,
            constructionTime: this.constructionTime,
            currentProduction: this.currentProduction,
            productionQueue: this.productionQueue,
            canProduce: this.canProduce,
            resourceGeneration: this.resourceGeneration
        };
    }
}

module.exports = Structure;
