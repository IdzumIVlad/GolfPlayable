import { CONFIG } from '../data/Config';
import { Vector2 } from '../utils/Vector2';

export class Particle {
    pos: Vector2;
    vel: Vector2;
    size: number;
    color: string;
    life: number;
    decay: number;

    private static pool: Particle[] = [];

    constructor(x: number, y: number) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.size = 0;
        this.color = '#fff';
        this.life = 0;
        this.decay = 0;
        this.reset(x, y);
    }

    reset(x: number, y: number): void {
        this.pos.set(x, y);
        this.vel.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 1) * 10
        );
        this.size = Math.random() * 6 + 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.01 + 0.005;

        let colors = ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    static acquire(x: number, y: number): Particle {
        if (Particle.pool.length > 0) {
            let p = Particle.pool.pop()!;
            p.reset(x, y);
            return p;
        }
        return new Particle(x, y);
    }

    release(): void {
        Particle.pool.push(this);
    }

    update(): void {
        this.vel.y += CONFIG.CONFETTI_GRAVITY;
        this.vel.multMut(CONFIG.CONFETTI_DRAG);
        this.pos.addMut(this.vel);
        this.life -= this.decay;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}
