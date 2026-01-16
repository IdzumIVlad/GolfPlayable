import { CONFIG } from '../data/Config';
import { Vector2 } from '../utils/Vector2';
import type { LevelData } from '../types';

export class Renderer {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public bgCanvas: HTMLCanvasElement;
    public bgCtx: CanvasRenderingContext2D;
    public width: number;
    public height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;

        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d')!;
        this.bgCtx.imageSmoothingEnabled = false;

        this.width = CONFIG.CANVAS_WIDTH;
        this.height = CONFIG.CANVAS_HEIGHT;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize(): void {
        let scale = Math.min(
            window.innerWidth / this.width,
            window.innerHeight / this.height
        );
        this.canvas.style.width = (this.width * scale) + 'px';
        this.canvas.style.height = (this.height * scale) + 'px';
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    worldToScreen(v: Vector2): Vector2 {
        if (!v) return new Vector2(0, 0);
        let isoX = (v.x - v.y) * CONFIG.ISO_SCALE_X;
        let isoY = (v.x + v.y) * CONFIG.ISO_SCALE_Y;
        return new Vector2(
            isoX + CONFIG.WORLD_OFFSET_X,
            isoY + CONFIG.WORLD_OFFSET_Y
        );
    }

    screenToWorld(v: Vector2): Vector2 {
        if (!v) return new Vector2(0, 0);
        let x = v.x - CONFIG.WORLD_OFFSET_X;
        let y = v.y - CONFIG.WORLD_OFFSET_Y;
        let wy = (y / CONFIG.ISO_SCALE_Y - x / CONFIG.ISO_SCALE_X) / 2;
        let wx = (y / CONFIG.ISO_SCALE_Y + x / CONFIG.ISO_SCALE_X) / 2;
        return new Vector2(wx, wy);
    }

    drawIsoRect(x: number, y: number, w: number, h: number, color: string, height: number = 0, targetCtx: CanvasRenderingContext2D = this.ctx): void {
        let c0 = Vector2.acquire(x, y);
        let c1 = Vector2.acquire(x + w, y);
        let c2 = Vector2.acquire(x + w, y + h);
        let c3 = Vector2.acquire(x, y + h);

        let sc0 = this.worldToScreen(c0);
        let sc1 = this.worldToScreen(c1);
        let sc2 = this.worldToScreen(c2);
        let sc3 = this.worldToScreen(c3);

        sc0.y -= height;
        sc1.y -= height;
        sc2.y -= height;
        sc3.y -= height;

        targetCtx.fillStyle = color;
        targetCtx.beginPath();
        targetCtx.moveTo(sc0.x, sc0.y);
        targetCtx.lineTo(sc1.x, sc1.y);
        targetCtx.lineTo(sc2.x, sc2.y);
        targetCtx.lineTo(sc3.x, sc3.y);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.strokeStyle = "rgba(0,0,0,0.2)";
        targetCtx.stroke();

        if (height > 0) {
            let wallHeight = 20 * CONFIG.ISO_SCALE_X;

            targetCtx.fillStyle = CONFIG.COLORS.wall;
            targetCtx.beginPath();
            targetCtx.moveTo(sc1.x, sc1.y);
            targetCtx.lineTo(sc2.x, sc2.y);
            targetCtx.lineTo(sc2.x, sc2.y + wallHeight);
            targetCtx.lineTo(sc1.x, sc1.y + wallHeight);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.beginPath();
            targetCtx.moveTo(sc2.x, sc2.y);
            targetCtx.lineTo(sc3.x, sc3.y);
            targetCtx.lineTo(sc3.x, sc3.y + wallHeight);
            targetCtx.lineTo(sc2.x, sc2.y + wallHeight);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.fillStyle = CONFIG.COLORS.wallTop;
            targetCtx.beginPath();
            targetCtx.moveTo(sc0.x, sc0.y);
            targetCtx.lineTo(sc1.x, sc1.y);
            targetCtx.lineTo(sc2.x, sc2.y);
            targetCtx.lineTo(sc3.x, sc3.y);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.stroke();
        }

        c0.release(); c1.release(); c2.release(); c3.release();
        // sc0-sc3 are created by worldToScreen (new instances currently), no method to release 'new' unless I change worldToScreen.
        // Assuming worldToScreen returns new instances for now as agreed.
    }

    drawCircleIso(pos: Vector2, radius: number, color: string): void {
        let center = this.worldToScreen(pos);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        let r = radius * CONFIG.ISO_SCALE_X * 2;
        this.ctx.ellipse(center.x, center.y, r, r * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.stroke();
    }

    drawBallIso(pos: Vector2, radius: number): void {
        let center = this.worldToScreen(pos);
        let r = radius * CONFIG.ISO_SCALE_X * 2;

        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(center.x, center.y + 2, r, r * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        let ballY = center.y - 4;
        this.ctx.fillStyle = CONFIG.COLORS.ball;
        this.ctx.beginPath();
        this.ctx.arc(center.x, ballY, r, 0, Math.PI * 2);
        this.ctx.fill();

        let grad = this.ctx.createRadialGradient(center.x - r * 0.3, ballY - r * 0.3, r * 0.1, center.x, ballY, r);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, '#cccccc');
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    renderBackgroundToCache(currentLevel: LevelData | null): void {
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;

        let tileSize = 20;
        for (let x = 0; x < 200; x += tileSize) {
            for (let y = 0; y < 500; y += tileSize) {
                let col = (x / tileSize + y / tileSize) % 2 === 0 ? CONFIG.COLORS.floor : CONFIG.COLORS.floorDark;
                this.drawIsoRect(x, y, tileSize, tileSize, col, 0, this.bgCtx);
            }
        }

        if (currentLevel) {
            currentLevel.walls.forEach(w => {
                this.drawIsoRect(w.x, w.y, w.w, w.h, CONFIG.COLORS.wallTop, 1, this.bgCtx);
            });
        }
    }

    drawBackgroundFromCache(): void {
        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }
}
