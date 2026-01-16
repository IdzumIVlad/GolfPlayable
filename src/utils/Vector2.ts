export class Vector2 {
    public x: number;
    public y: number;

    private static pool: Vector2[] = [];

    constructor(x: number, y: number) { this.x = x; this.y = y; }

    static acquire(x: number, y: number): Vector2 {
        if (Vector2.pool.length > 0) {
            let v = Vector2.pool.pop()!;
            v.x = x;
            v.y = y;
            return v;
        }
        return new Vector2(x, y);
    }

    release(): void {
        Vector2.pool.push(this);
    }

    add(v: Vector2): Vector2 {
        if (!v) { return this; }
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    sub(v: Vector2): Vector2 {
        if (!v) { return this; }
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    mult(s: number): Vector2 { return new Vector2(this.x * s, this.y * s); }

    set(x: number, y: number): Vector2 { this.x = x; this.y = y; return this; }
    copy(v: Vector2): Vector2 {
        if (!v) { return this; }
        this.x = v.x; this.y = v.y; return this;
    }
    addMut(v: Vector2): Vector2 {
        if (!v) { return this; }
        this.x += v.x; this.y += v.y; return this;
    }
    subMut(v: Vector2): Vector2 {
        if (!v) { return this; }
        this.x -= v.x; this.y -= v.y; return this;
    }
    multMut(s: number): Vector2 { this.x *= s; this.y *= s; return this; }

    mag(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
    norm(): Vector2 {
        let m = this.mag();
        return m > 0 ? new Vector2(this.x / m, this.y / m) : new Vector2(0, 0);
    }

    normMut(): Vector2 {
        let m = this.mag();
        if (m > 0) { this.x /= m; this.y /= m; }
        else { this.x = 0; this.y = 0; }
        return this;
    }
}
