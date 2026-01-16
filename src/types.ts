import { Vector2 } from './utils/Vector2';

export interface Wall {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Obstacle {
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    speed?: number;
    range?: number;
    dir?: number;
    startX?: number;
}

export interface Ball {
    pos: Vector2;
    vel: Vector2;
    radius: number;
    active: boolean;
    activate(x: number, y: number): void;
}

export interface Cloud {
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
}

export interface LevelData {
    start: Vector2;
    hole: Vector2;
    walls: Wall[];
    obstacles: Obstacle[];
}
