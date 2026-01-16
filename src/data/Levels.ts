import { Vector2 } from '../utils/Vector2';
import type { LevelData } from '../types';

export const LEVELS: LevelData[] = [
    {
        start: new Vector2(100, 400),
        hole: new Vector2(100, 100),
        walls: [
            { x: 0, y: 0, w: 200, h: 10 },
            { x: 0, y: 490, w: 200, h: 10 },
            { x: 0, y: 0, w: 10, h: 500 },
            { x: 190, y: 0, w: 10, h: 500 }
        ],
        obstacles: []
    },
    {
        start: new Vector2(100, 400),
        hole: new Vector2(100, 100),
        walls: [
            { x: 0, y: 0, w: 200, h: 10 },
            { x: 0, y: 490, w: 200, h: 10 },
            { x: 0, y: 0, w: 10, h: 500 },
            { x: 190, y: 0, w: 10, h: 500 },
            { x: 60, y: 240, w: 80, h: 20 }
        ],
        obstacles: []
    },
    {
        start: new Vector2(100, 400),
        hole: new Vector2(100, 100),
        walls: [
            { x: 0, y: 0, w: 200, h: 10 },
            { x: 0, y: 490, w: 200, h: 10 },
            { x: 0, y: 0, w: 10, h: 500 },
            { x: 190, y: 0, w: 10, h: 500 },
        ],
        obstacles: [
            { type: 'moving_wall', x: 20, y: 220, w: 40, h: 20, speed: 2, range: 120, dir: 1, startX: 20 }
        ]
    }
];
