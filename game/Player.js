class Player {
    constructor(socketId, username, team) {
        this.socketId = socketId;
        this.username = username;
        this.team = team;
        this.selectedUnits = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraZoom = 1;
        
        // Ressources
        this.resources = {
            gold: 1000,
            wood: 500,
            stone: 300
        };
        
        // Statistiques
        this.stats = {
            unitsKilled: 0,
            unitsLost: 0,
            structuresBuilt: 0,
            structuresDestroyed: 0
        };
    }

    canAfford(cost) {
        return this.resources.gold >= cost.gold && 
               this.resources.wood >= cost.wood && 
               this.resources.stone >= cost.stone;
    }

    spendResources(cost) {
        if (this.canAfford(cost)) {
            this.resources.gold -= cost.gold;
            this.resources.wood -= cost.wood;
            this.resources.stone -= cost.stone;
            return true;
        }
        return false;
    }

    addResources(amount) {
        this.resources.gold += amount.gold || 0;
        this.resources.wood += amount.wood || 0;
        this.resources.stone += amount.stone || 0;
    }

    getTeamColor() {
        switch (this.team) {
            case 'blue': return '#0066CC';
            case 'red': return '#CC0000';
            case 'green': return '#00CC00';
            default: return '#666666';
        }
    }

    serialize() {
        return {
            socketId: this.socketId,
            username: this.username,
            team: this.team,
            selectedUnits: this.selectedUnits,
            cameraX: this.cameraX,
            cameraY: this.cameraY,
            cameraZoom: this.cameraZoom,
            resources: this.resources,
            stats: this.stats
        };
    }
}

module.exports = Player;
