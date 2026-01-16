import { CONFIG } from './data/Config';
import { LEVELS } from './data/Levels';
import { Vector2 } from './utils/Vector2';
import { Renderer } from './core/Renderer';
import { Physics } from './core/Physics';
import { Particle } from './core/Particles';
import type { Ball, LevelData, Cloud, Obstacle } from './types';

export class Game {
    public canvas: HTMLCanvasElement;
    public renderer: Renderer;
    public physics: Physics;
    public ball: Ball;
    public levelIndex: number;
    public lives: number;
    public gameState: string;
    public currentLevel: LevelData;
    public dragStart: Vector2 | null;
    public dragCurrent: Vector2 | null;
    public ui: {
        level: HTMLElement;
        hearts: HTMLElement;
        overlay: HTMLElement;
        title: HTMLElement;
        nextBtn: HTMLElement;
        resetBtn: HTMLElement;
        ctaBtn: HTMLAnchorElement;
    };
    public clouds: Cloud[];
    public particles: Particle[];
    public lastTime: number;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.renderer = new Renderer(this.canvas);
        this.physics = new Physics();

        this.ball = {
            pos: new Vector2(0, 0),
            vel: new Vector2(0, 0),
            radius: CONFIG.BALL_RADIUS,
            active: false,
            activate: function (x: number, y: number) {
                this.pos.set(x, y);
                this.vel.set(0, 0);
                this.active = true;
            }
        };

        this.levelIndex = 0;
        this.lives = CONFIG.MAX_LIVES;
        this.gameState = 'AIMING';
        this.currentLevel = LEVELS[0];

        this.dragStart = null;
        this.dragCurrent = null;

        this.ui = {
            level: document.getElementById('level-display')!,
            hearts: document.getElementById('hearts-container')!,
            overlay: document.getElementById('message-overlay')!,
            title: document.getElementById('message-text')!,
            nextBtn: document.getElementById('next-btn')!,
            resetBtn: document.getElementById('reset-btn')!,
            ctaBtn: document.getElementById('cta-btn') as HTMLAnchorElement
        };

        this.clouds = [];
        this.particles = [];

        this.bindEvents();
        this.initClouds();
        this.loadLevel(0);

        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents(): void {
        this.canvas.addEventListener('pointerdown', (e) => this.handleInputStart(e));
        this.canvas.addEventListener('pointermove', (e) => this.handleInputMove(e));
        window.addEventListener('pointerup', (e) => this.handleInputEnd(e));

        this.ui.resetBtn.addEventListener('click', () => this.loadLevel(this.levelIndex));
        this.ui.nextBtn.addEventListener('click', () => this.loadLevel(this.levelIndex + 1));
    }

    getCanvasPos(e: PointerEvent): Vector2 {
        let rect = this.canvas.getBoundingClientRect();
        let scaleX = this.canvas.width / rect.width;
        let scaleY = this.canvas.height / rect.height;
        return new Vector2(
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        );
    }

    handleInputStart(e: PointerEvent): void {
        if (this.gameState !== 'AIMING') return;
        e.preventDefault();

        let pos = this.getCanvasPos(e);
        let ballScreen = this.renderer.worldToScreen(this.ball.pos);

        let dist = pos.sub(ballScreen).mag();
        if (dist < 40) {
            this.dragStart = pos;
            this.dragCurrent = pos;
        }
    }

    handleInputMove(e: PointerEvent): void {
        if (!this.dragStart) return;
        e.preventDefault();
        this.dragCurrent = this.getCanvasPos(e);
    }

    handleInputEnd(_e: PointerEvent): void {
        if (!this.dragStart || !this.dragCurrent) return;

        let vector = this.dragStart.sub(this.dragCurrent);
        let power = vector.mag() * CONFIG.POWER_SCALE;

        if (power > 1) {
            if (power > CONFIG.MAX_POWER) power = CONFIG.MAX_POWER;

            let wStart = this.renderer.screenToWorld(this.dragStart);
            let wEnd = this.renderer.screenToWorld(this.dragCurrent);
            let wPull = wStart.sub(wEnd);

            power = wPull.mag() * 0.15;
            if (power > CONFIG.MAX_POWER) power = CONFIG.MAX_POWER;

            let finalPower = wPull.norm().mult(power);
            this.ball.vel = finalPower;
            this.gameState = 'MOVING';

            this.lives--;
            this.updateHUD();
        }

        this.dragStart = null;
        this.dragCurrent = null;
    }

    loadLevel(idx: number): void {
        this.levelIndex = idx;
        if (this.levelIndex >= LEVELS.length) this.levelIndex = 0;

        let data = LEVELS[this.levelIndex];

        let obs: Obstacle[] = [];
        if (data.obstacles) {
            obs = data.obstacles.map(o => ({ ...o }));
        }

        this.currentLevel = {
            start: data.start,
            hole: data.hole,
            walls: data.walls,
            obstacles: obs
        };

        this.ball.activate(data.start.x, data.start.y);
        this.lives = CONFIG.MAX_LIVES;
        this.gameState = 'AIMING';
        this.particles = [];

        this.renderer.renderBackgroundToCache(this.currentLevel);
        this.updateHUD();
        this.ui.overlay.classList.add('hidden');
        this.ui.ctaBtn.classList.add('hidden');
    }

    updateHUD(): void {
        this.ui.level.textContent = (this.levelIndex + 1).toString();

        let heartsHTML = '';
        for (let i = 0; i < CONFIG.MAX_LIVES; i++) {
            heartsHTML += (i < this.lives) ? '❤️' : '🖤';
        }
        this.ui.hearts.innerHTML = heartsHTML;
    }

    initClouds(): void {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                speed: 0.2 + Math.random() * 0.2,
                size: 30 + Math.random() * 40,
                opacity: 0.4 + Math.random() * 0.3
            });
        }
    }

    updateClouds(): void {
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > CONFIG.CANVAS_WIDTH + c.size * 2) {
                c.x = -c.size * 2;
                c.y = Math.random() * CONFIG.CANVAS_HEIGHT;
                c.speed = 0.2 + Math.random() * 0.2;
            }
        });
    }

    drawClouds(): void {
        this.clouds.forEach(c => {
            this.renderer.ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            this.renderer.ctx.arc(c.x - c.size * 0.8, c.y + c.size * 0.3, c.size * 0.7, 0, Math.PI * 2);
            this.renderer.ctx.arc(c.x + c.size * 0.8, c.y + c.size * 0.3, c.size * 0.7, 0, Math.PI * 2);
            this.renderer.ctx.fill();
        });
    }

    spawnConfetti(): void {
        let center = this.renderer.worldToScreen(this.currentLevel.hole);
        for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
            this.particles.push(Particle.acquire(center.x, center.y));
        }
    }

    loop(timestamp: number): void {
        try {
            this.lastTime = timestamp;

            this.updateClouds();

            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.update();
                if (p.life <= 0) {
                    p.release();
                    this.particles.splice(i, 1);
                }
            }

            let event = this.physics.update(this.ball, this.currentLevel, this.gameState);

            if (event === 'WON' && this.gameState !== 'WON') {
                this.gameState = 'WON';
                this.ui.title.innerText = "Nice!";
                this.spawnConfetti();
                this.ui.overlay.classList.remove('hidden');

                this.ui.ctaBtn.href = CONFIG.CTA_URL;
                this.ui.ctaBtn.classList.remove('hidden');
            }

            if (event === null && this.ball.vel.mag() === 0 && this.gameState === 'MOVING') {
                if (this.lives <= 0) {
                    this.ui.title.innerText = "Try Again!";
                    this.ui.ctaBtn.classList.add('hidden');
                    setTimeout(() => this.loadLevel(this.levelIndex), 1000);
                } else {
                    this.gameState = 'AIMING';
                }
            }

            this.renderer.clear();
            this.drawClouds();
            this.renderer.drawBackgroundFromCache();
            this.renderer.drawCircleIso(this.currentLevel.hole, CONFIG.HOLE_RADIUS, CONFIG.COLORS.hole);

            this.currentLevel.obstacles.forEach(o => {
                this.renderer.drawIsoRect(o.x, o.y, o.w, o.h, '#F44336', 1);
            });

            if (this.ball.active) {
                this.renderer.drawBallIso(this.ball.pos, this.ball.radius);
            }

            this.particles.forEach(p => p.draw(this.renderer.ctx));

            if (this.dragStart && this.gameState === 'AIMING') {
                this.drawDragLine();
                this.drawClub();
            } else if (this.gameState === 'AIMING') {
                this.drawClub();
            }

            requestAnimationFrame((t) => this.loop(t));
        } catch (e: any) {
            console.error(e);
            this.ui.title.innerText = "Error: " + e.message;
            this.ui.overlay.classList.remove('hidden');
        }
    }

    drawDragLine(): void {
        if (!this.dragStart || !this.dragCurrent) return;

        let start = this.dragStart;
        let current = this.dragCurrent;
        let dragVec = current.sub(start);
        let maxDragDist = CONFIG.MAX_POWER / CONFIG.POWER_SCALE;

        if (dragVec.mag() > maxDragDist) {
            dragVec = dragVec.norm().mult(maxDragDist);
            current = start.add(dragVec);
        }

        let power = dragVec.mag() * CONFIG.POWER_SCALE;
        let powerRatio = power / CONFIG.MAX_POWER;

        let ballScreen = this.renderer.worldToScreen(this.ball.pos);
        let endObj = ballScreen.sub(dragVec);

        let ctx = this.renderer.ctx;

        ctx.beginPath();
        ctx.moveTo(ballScreen.x, ballScreen.y);
        ctx.lineTo(current.x, current.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();

        let hue = 120 * (1 - powerRatio);
        let color = `hsl(${hue}, 100%, 50%)`;

        ctx.beginPath();
        ctx.moveTo(ballScreen.x, ballScreen.y);
        ctx.lineTo(endObj.x, endObj.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
    }

    drawClub(): void {
        let handsZ = 60;
        let handsScreen = this.renderer.worldToScreen(this.ball.pos);
        handsScreen.y -= handsZ;

        let headScreen: Vector2;
        let headZ = 0;

        if (this.dragStart && this.dragCurrent) {
            let wDrag = this.renderer.screenToWorld(this.dragCurrent);
            let vec = wDrag.sub(this.ball.pos);
            let dist = vec.mag();
            headZ = Math.min(dist * 0.4, 40);
            headScreen = this.renderer.worldToScreen(wDrag);
            headScreen.y -= headZ;
        } else {
            headScreen = this.renderer.worldToScreen(this.ball.pos.add(new Vector2(5, 5)));
        }

        let ctx = this.renderer.ctx;
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(handsScreen.x, handsScreen.y);
        ctx.lineTo(headScreen.x, headScreen.y);
        ctx.stroke();

        let dx = handsScreen.x - headScreen.x;
        let dy = handsScreen.y - headScreen.y;
        let shaftAngle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(headScreen.x, headScreen.y);
        ctx.rotate(shaftAngle - Math.PI / 2);

        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 0);
        ctx.lineTo(8, 12);
        ctx.lineTo(-6, 12);
        ctx.lineTo(-2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#78909C';
        ctx.fillRect(-4, 9, 8, 1);
        ctx.restore();
    }
}
