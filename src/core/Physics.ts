import { CONFIG } from '../data/Config';
import { Vector2 } from '../utils/Vector2';
import type { Ball, LevelData, Wall, Obstacle } from '../types';

export class Physics {
    constructor() {
    }

    checkRectCollision(rect: Wall | Obstacle, nextPos: Vector2, radius: number): Vector2 | null {
        let clampX = Math.max(rect.x, Math.min(nextPos.x, rect.x + rect.w));
        let clampY = Math.max(rect.y, Math.min(nextPos.y, rect.y + rect.h));

        let deltaX = nextPos.x - clampX;
        let deltaY = nextPos.y - clampY;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < radius) {
            return Vector2.acquire(deltaX, deltaY).normMut();
        }
        return null;
    }

    update(ball: Ball, currentLevel: LevelData, gameState: string): string | null {
        currentLevel.obstacles.forEach(o => {
            if (o.type === 'moving_wall') {
                o.x += (o.speed || 0) * (o.dir || 1);
                if (o.x > (o.startX || 0) + (o.range || 0) || o.x < (o.startX || 0)) {
                    if (o.dir !== undefined) o.dir *= -1;
                }
            }
        });

        let event: string | null = null;

        if (gameState === 'MOVING' && ball.active) {
            let proposedPos = Vector2.acquire(ball.pos.x, ball.pos.y).addMut(ball.vel);

            let allWalls: (Wall | Obstacle)[] = [...currentLevel.walls];
            currentLevel.obstacles.forEach(o => {
                if (o.type === 'moving_wall') {
                    allWalls.push(o);
                }
            });

            let didCollide = false;
            for (let w of allWalls) {
                let normal = this.checkRectCollision(w, proposedPos, ball.radius);
                if (normal) {
                    let dot = ball.vel.x * normal.x + ball.vel.y * normal.y;
                    let reflection = normal.mult(2 * dot);

                    ball.vel.subMut(reflection).multMut(CONFIG.WALL_BOUNCE);
                    ball.pos.addMut(normal);

                    didCollide = true;

                    normal.release();
                    reflection.release();
                }
            }

            if (!didCollide) {
                ball.pos.addMut(ball.vel);
                ball.vel.multMut(CONFIG.FRICTION);
            }

            proposedPos.release();

            if (ball.vel.mag() < CONFIG.STOP_THRESHOLD) {
                ball.vel.set(0, 0);
            }
        }

        if (ball.active) {
            let distToHole = ball.pos.sub(currentLevel.hole).mag();

            if (distToHole < CONFIG.MAGNET_DIST && ball.vel.mag() < 3) {
                let dir = currentLevel.hole.sub(ball.pos).normMut();
                let pull = dir.multMut(CONFIG.MAGNET_FORCE);
                ball.vel.addMut(pull);

                dir.release();
            }

            if (distToHole < CONFIG.WIN_DIST) {
                ball.vel.set(0, 0);
                ball.pos.copy(currentLevel.hole);
                event = 'WON';
            }
        }

        return event;
    }
}
