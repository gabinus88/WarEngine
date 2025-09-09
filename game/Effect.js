class Effect {
    constructor(id, x, y, type, duration = 1000) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        this.duration = duration;
        this.startTime = Date.now();
        this.isActive = true;
        
        this.configureByType();
    }

    configureByType() {
        switch (this.type) {
            case 'explosion':
                this.radius = 0;
                this.maxRadius = 80;
                this.color = '#FF4500';
                this.alpha = 1;
                break;
            case 'magic_burst':
                this.radius = 0;
                this.maxRadius = 60;
                this.color = '#8A2BE2';
                this.alpha = 1;
                break;
            case 'damage_text':
                this.radius = 0;
                this.maxRadius = 0;
                this.color = '#FF0000';
                this.alpha = 1;
                this.text = '0';
                this.offsetY = 0;
                break;
            default:
                this.radius = 0;
                this.maxRadius = 50;
                this.color = '#FFFFFF';
                this.alpha = 1;
        }
    }

    update(deltaTime) {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.isActive = false;
            return;
        }

        switch (this.type) {
            case 'explosion':
            case 'magic_burst':
                this.radius = this.maxRadius * progress;
                this.alpha = 1 - progress;
                break;
            case 'damage_text':
                this.offsetY = -progress * 50;
                this.alpha = 1 - progress;
                break;
        }
    }

    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type,
            radius: this.radius,
            maxRadius: this.maxRadius,
            color: this.color,
            alpha: this.alpha,
            text: this.text,
            offsetY: this.offsetY,
            progress: (Date.now() - this.startTime) / this.duration
        };
    }
}

module.exports = Effect;
