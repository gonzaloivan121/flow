import { IApplication } from './engine';
import { InputManager } from './input.manager';
import { Vector2 } from '@xloxlolex/vector-math';

/**
 * Represents a single fluid particle with properties for position, velocity, density, pressure, mass, radius, and color.
 *
 * @export
 * @interface Particle
 */
export interface Particle {
    position: Vector2;
    velocity: Vector2;
    density: number;
    pressure: number;
    mass: number;
    radius: number;
    colorIndex: number;
    cellX: number;
    cellY: number;
}

/**
 * Simulation settings for physics constants and environmental factors.
 *
 * @export
 * @interface Physics
 */
export interface Physics {
    gravity: Vector2; // Constant downward gravity acceleration
    gravityMultiplier: number; // Scalar for the gravity acceleration
    smoothingRadius: number; // SPH Interaction Radius (h)
    targetDensity: number; // Rest density of the fluid volume
    pressureStiffness: number; // Gas constant factor (B) for Tait's equation
    viscosity: number; // Internal liquid friction dampening
    wallBounce: number; // Heavy dead-weight loss on wall collisions
    wallFriction: number; // Simulates container boundary fluid drag
    globalDamping: number; // Global velocity damping over time to allow settling
}

/**
 * Simulation settings for particle initialization and timestep control.
 *
 * @export
 * @interface Simulation
 */
export interface Simulation {
    particleColumns: number;
    particleRows: number;
    initialSpacing: number;
    particleMass: number;
    particleRadius: number;
    maxTimestep: number;
}

/**
 * Interaction settings for user input (e.g., mouse).
 *
 * @export
 * @interface Interaction
 */
export interface Interaction {
    mouseRadius: number;
    mouseForce: number;
    colorIntensity: number;
    mouseHoverColor: RgbColor;
    mouseActiveColor: RgbColor;
}

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Coloring settings for particle and background colors.
 * Color values are RGB objects in the form `{ r, g, b }`.
 *
 * @export
 * @interface Coloring
 */
export interface Coloring {
    slowColor: RgbColor; // Particle color at rest / low speed
    fastColor: RgbColor; // Particle color at maximum speed
    backgroundColor: RgbColor; // Canvas background fill color
}

export interface PerformanceSettings {
    useSpriteRendering: boolean;
    snapSpritesToPixels: boolean;
    reuseParticlePool: boolean;
    reuseSpatialBuckets: boolean;
    showMouseIndicator: boolean;
    showHud: boolean;
    pauseWhenHidden: boolean;
    maxFps: number;
}

export class FluidSimulationApp implements IApplication {
    private static readonly COLOR_STEPS = 256;

    private input!: InputManager;

    private particles: Particle[] = [];
    private particlePool: Particle[] = [];
    private spatialBuckets = new Map<number, Map<number, Particle[]>>();
    private activeBuckets: Particle[][] = [];
    private gradientColors: string[] = new Array<string>(FluidSimulationApp.COLOR_STEPS);
    private cachedBackgroundCss: string = 'rgb(15, 23, 42)';
    private cachedHoverCss: string = 'rgb(56, 189, 248)';
    private cachedHoverFillCss: string = 'rgba(56, 189, 248, 0.14)';
    private cachedActiveCss: string = 'rgb(248, 113, 113)';
    private cachedActiveFillCss: string = 'rgba(248, 113, 113, 0.14)';
    private particleSprites: HTMLCanvasElement[] = new Array(FluidSimulationApp.COLOR_STEPS);
    private spriteCacheKey = '';
    private spriteRadius = 0;
    private spriteOffset = 0;
    private gradientKey = '';
    private surfaceColorKey = '';

    public physics: Physics = {
        gravity: new Vector2(0, 9.81),
        gravityMultiplier: 100.0,
        smoothingRadius: 30.0,
        targetDensity: 0.005,
        pressureStiffness: 12000.0,
        viscosity: 0.89,
        wallBounce: -0.15,
        wallFriction: 0.7,
        globalDamping: 0.95,
    };

    public simulation: Simulation = {
        particleColumns: 30,
        particleRows: 30,
        initialSpacing: 10,
        particleMass: 1.0,
        particleRadius: 4.0,
        maxTimestep: 0.08,
    };

    public interaction: Interaction = {
        mouseRadius: 100,
        mouseForce: 1000,
        colorIntensity: 20,
        mouseHoverColor: { r: 56, g: 189, b: 248 },
        mouseActiveColor: { r: 248, g: 113, b: 113 },
    };

    public coloring: Coloring = {
        slowColor: { r: 56, g: 189, b: 248 },
        fastColor: { r: 255, g: 242, b: 248 },
        backgroundColor: { r: 15, g: 23, b: 42 },
    };

    public performance: PerformanceSettings = {
        useSpriteRendering: false,
        snapSpritesToPixels: false,
        reuseParticlePool: true,
        reuseSpatialBuckets: true,
        showMouseIndicator: true,
        showHud: true,
        pauseWhenHidden: true,
        maxFps: 0,
    };

    private readonly defaultColoring: Coloring = {
        slowColor: { r: 56, g: 189, b: 248 },
        fastColor: { r: 255, g: 242, b: 248 },
        backgroundColor: { r: 15, g: 23, b: 42 },
    };

    public Initialize(width: number, height: number, input: InputManager): void {
        this.input = input;
        this.RefreshColorCaches();
        this.Restart(width, height);
    }

    public ResetSettings(): void {
        Object.assign(this.physics, {
            gravityMultiplier: 100.0,
            smoothingRadius: 30.0,
            targetDensity: 0.005,
            pressureStiffness: 12000.0,
            viscosity: 0.89,
            wallBounce: -0.15,
            wallFriction: 0.7,
            globalDamping: 0.95,
        });
        Object.assign(this.physics.gravity, { x: 0, y: 9.81 });

        Object.assign(this.simulation, {
            particleColumns: 30,
            particleRows: 30,
            initialSpacing: 10,
            particleMass: 1.0,
            particleRadius: 4.0,
            maxTimestep: 0.08,
        });

        Object.assign(this.interaction, {
            mouseRadius: 100,
            mouseForce: 1000,
            colorIntensity: 20,
            mouseHoverColor: { r: 56, g: 189, b: 248 },
            mouseActiveColor: { r: 248, g: 113, b: 113 },
        });

        Object.assign(this.coloring.slowColor, this.defaultColoring.slowColor);
        Object.assign(this.coloring.fastColor, this.defaultColoring.fastColor);
        Object.assign(this.coloring.backgroundColor, this.defaultColoring.backgroundColor);
        Object.assign(this.performance, {
            useSpriteRendering: false,
            snapSpritesToPixels: false,
            reuseParticlePool: true,
            reuseSpatialBuckets: true,
            showMouseIndicator: true,
            showHud: true,
            pauseWhenHidden: true,
            maxFps: 0,
        });
        this.RefreshColorCaches();
    }

    public Restart(width: number, height: number): void {
        this.particles.length = 0;

        const cols: number = this.simulation.particleColumns;
        const rows: number = this.simulation.particleRows;
        const totalParticles = cols * rows;
        const spacing: number = this.simulation.initialSpacing;
        const particleMass = this.simulation.particleMass;
        const particleRadius = this.simulation.particleRadius;
        const startX: number = (width - cols * spacing) / 2;
        const startY: number = (height - rows * spacing) / 2;
        const baseColorIndex = 0;

        if (this.performance.reuseParticlePool && this.particlePool.length < totalParticles) {
            for (let i = this.particlePool.length; i < totalParticles; i++) {
                this.particlePool.push({
                    position: new Vector2(),
                    velocity: new Vector2(),
                    density: 0,
                    pressure: 0,
                    mass: particleMass,
                    radius: particleRadius,
                    colorIndex: baseColorIndex,
                    cellX: 0,
                    cellY: 0,
                });
            }
        }

        this.particles = this.performance.reuseParticlePool
            ? this.particlePool.slice(0, totalParticles)
            : new Array(totalParticles);

        let index = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const particle = this.particles[index++];
                if (!particle) {
                    this.particles[index - 1] = {
                        position: new Vector2(),
                        velocity: new Vector2(),
                        density: 0,
                        pressure: 0,
                        mass: particleMass,
                        radius: particleRadius,
                        colorIndex: baseColorIndex,
                        cellX: 0,
                        cellY: 0,
                    };
                }

                const currentParticle = this.particles[index - 1];
                currentParticle.position.x = startX + c * spacing;
                currentParticle.position.y = startY + r * spacing;
                currentParticle.velocity.x = 0;
                currentParticle.velocity.y = 0;
                currentParticle.density = 0;
                currentParticle.pressure = 0;
                currentParticle.mass = particleMass;
                currentParticle.radius = particleRadius;
                currentParticle.colorIndex = baseColorIndex;
            }
        }
    }

    public Update(ts: number, width: number, height: number): void {
        // Cap ts to avoid unstable teleportation during lag spikes
        const dt: number = Math.min(ts, this.simulation.maxTimestep);
        const smoothingRadius = this.physics.smoothingRadius;

        this.RefreshColorCaches();

        this.BuildSpatialBuckets(smoothingRadius);

        this.ComputeDensity(smoothingRadius);
        this.ComputePressure();
        this.ApplyForces(dt, smoothingRadius);
        this.UpdatePositions(dt, width, height);
        this.UpdateColors();
    }

    private ComputeDensity(smoothingRadius: number): void {
        const hSq: number = smoothingRadius * smoothingRadius;

        // 2D Poly6 Kernel Normalization factor
        const hPow8 = hSq * hSq * hSq * hSq;
        const poly6: number = 4.0 / (Math.PI * hPow8);
        const particles = this.particles;

        // Compute localized density profiles
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            let densitySum: number = 0;
            const centerX = p1.cellX;
            const centerY = p1.cellY;

            for (let x = centerX - 1; x <= centerX + 1; x++) {
                const row = this.spatialBuckets.get(x);

                if (!row) {
                    continue;
                }

                for (let y = centerY - 1; y <= centerY + 1; y++) {
                    const bucket = row.get(y);

                    if (!bucket) {
                        continue;
                    }

                    for (let j = 0; j < bucket.length; j++) {
                        const p2 = bucket[j];
                        const dx: number = p2.position.x - p1.position.x;
                        const dy: number = p2.position.y - p1.position.y;
                        const distSq: number = dx * dx + dy * dy;

                        if (distSq < hSq) {
                            // Standard SPH spiky kernel approximation
                            const delta = hSq - distSq;
                            densitySum += p2.mass * delta * delta * delta;
                        }
                    }
                }
            }

            // Fallback offset to avoid division-by-zero errors
            p1.density = Math.max(densitySum * poly6, 0.0001);
        }
    }

    private ComputePressure(): void {
        const pressureStiffness: number = this.physics.pressureStiffness;
        const targetDensity: number = this.physics.targetDensity;
        const particles = this.particles;

        // Compute state pressure equation (Ideal Gas / SPH state derivation)
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            const densityRatio: number = p1.density / targetDensity;
            p1.pressure = pressureStiffness * (densityRatio * densityRatio - 1.0);

            // Negative values cause sticking artifacts
            if (p1.pressure < 0) {
                p1.pressure = 0;
            }
        }
    }

    private ApplyForces(dt: number, h: number): void {
        const mousePosition: Vector2 = this.input.MousePosition();
        const isInteracting: boolean = this.input.MouseDown();
        const viscosity: number = this.physics.viscosity;
        const gravityX = this.physics.gravity.x * this.physics.gravityMultiplier;
        const gravityY = this.physics.gravity.y * this.physics.gravityMultiplier;
        const damping = this.physics.globalDamping;
        const mouseRadius: number = this.interaction.mouseRadius;
        const mouseRadiusSq: number = mouseRadius * mouseRadius;
        const mouseForce: number = this.interaction.mouseForce;
        const particles = this.particles;

        // 2D Spiky & Viscosity Kernel Normalization factors
        const hSq = h * h;
        const hPow5 = hSq * hSq * h;
        const spikyGrad: number = 30.0 / (Math.PI * hPow5);
        const viscLap: number = 20.0 / (Math.PI * hPow5);

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            let pForceX: number = 0;
            let pForceY: number = 0;
            let vForceX: number = 0;
            let vForceY: number = 0;
            const centerX = p1.cellX;
            const centerY = p1.cellY;

            for (let x = centerX - 1; x <= centerX + 1; x++) {
                const row = this.spatialBuckets.get(x);

                if (!row) {
                    continue;
                }

                for (let y = centerY - 1; y <= centerY + 1; y++) {
                    const bucket = row.get(y);

                    if (!bucket) {
                        continue;
                    }

                    for (let j = 0; j < bucket.length; j++) {
                        const p2 = bucket[j];

                        if (p1 === p2) {
                            continue;
                        }

                        const diffX: number = p2.position.x - p1.position.x;
                        const diffY: number = p2.position.y - p1.position.y;
                        const distSq: number = diffX * diffX + diffY * diffY;

                        if (distSq >= hSq || distSq <= 1e-12) {
                            continue;
                        }

                        const dist: number = Math.sqrt(distSq);
                        const invDist: number = 1 / dist;
                        const dirX: number = diffX * invDist;
                        const dirY: number = diffY * invDist;

                        // Fluid Pressure Vector Math (pushing from high density area to low)
                        const pressureRatio = (p1.pressure + p2.pressure) / (2.0 * p2.density);
                        const hMinusDist = h - dist;
                        const pGrad: number = pressureRatio * spikyGrad * hMinusDist * hMinusDist;

                        pForceX -= dirX * pGrad * p2.mass;
                        pForceY -= dirY * pGrad * p2.mass;

                        // Viscosity Linear Shear (Frictional fluid damping between nodes)
                        const vDiffX: number = p2.velocity.x - p1.velocity.x;
                        const vDiffY: number = p2.velocity.y - p1.velocity.y;
                        const laplacian: number = viscLap * hMinusDist;

                        // SYMMETRICAL FORCE: Multiply by p2.mass
                        const viscosityTerm = (viscosity / p2.density) * laplacian * p2.mass;
                        vForceX += vDiffX * viscosityTerm;
                        vForceY += vDiffY * viscosityTerm;
                    }
                }
            }

            // Combine Core Accumulators
            p1.velocity.x += (pForceX + vForceX) * dt;
            p1.velocity.y += (pForceY + vForceY) * dt;

            // Apply global Environment Constants (Gravity & Buoyancy vectors)
            p1.velocity.x += gravityX * dt;
            p1.velocity.y += gravityY * dt;

            // Apply global velocity damping over time to allow settling
            p1.velocity.x *= damping;
            p1.velocity.y *= damping;

            // Optional Mouse Interaction (Creates high speed external energy waves)
            if (isInteracting) {
                const toMouseX: number = mousePosition.x - p1.position.x;
                const toMouseY: number = mousePosition.y - p1.position.y;
                const mouseDistSq: number = toMouseX * toMouseX + toMouseY * toMouseY;

                if (mouseDistSq < mouseRadiusSq && mouseDistSq > 1) {
                    const invMouseDist = 1 / Math.sqrt(mouseDistSq);
                    // Left click acts like an underwater agitator/impeller
                    p1.velocity.x += toMouseX * invMouseDist * mouseForce * dt;
                    p1.velocity.y += toMouseY * invMouseDist * mouseForce * dt;
                }
            }
        }
    }

    private BuildSpatialBuckets(cellSize: number): void {
        if (!this.performance.reuseSpatialBuckets) {
            this.spatialBuckets.clear();

            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                const cellX = Math.floor(particle.position.x / cellSize);
                const cellY = Math.floor(particle.position.y / cellSize);
                particle.cellX = cellX;
                particle.cellY = cellY;

                let row = this.spatialBuckets.get(cellX);

                if (!row) {
                    row = new Map<number, Particle[]>();
                    this.spatialBuckets.set(cellX, row);
                }

                let bucket = row.get(cellY);

                if (!bucket) {
                    bucket = [];
                    row.set(cellY, bucket);
                }

                bucket.push(particle);
            }

            return;
        }

        for (let i = 0; i < this.activeBuckets.length; i++) {
            this.activeBuckets[i].length = 0;
        }
        this.activeBuckets.length = 0;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const cellX = Math.floor(particle.position.x / cellSize);
            const cellY = Math.floor(particle.position.y / cellSize);
            particle.cellX = cellX;
            particle.cellY = cellY;

            let row = this.spatialBuckets.get(cellX);

            if (!row) {
                row = new Map<number, Particle[]>();
                this.spatialBuckets.set(cellX, row);
            }

            let bucket = row.get(cellY);

            if (!bucket) {
                bucket = [];
                row.set(cellY, bucket);
            }

            if (bucket.length === 0) {
                this.activeBuckets.push(bucket);
            }

            bucket.push(particle);
        }
    }

    private UpdatePositions(dt: number, width: number, height: number): void {
        const bounce: number = this.physics.wallBounce;
        const friction: number = this.physics.wallFriction;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.position.x += particle.velocity.x * dt;
            particle.position.y += particle.velocity.y * dt;

            // Strict Boundary Collision (Solid container walls create realistic surface sloshing)
            if (particle.position.x < particle.radius) {
                particle.position.x = particle.radius;
                particle.velocity.x *= bounce;
                particle.velocity.y *= friction;
            }

            if (particle.position.x > width - particle.radius) {
                particle.position.x = width - particle.radius;
                particle.velocity.x *= bounce;
                particle.velocity.y *= friction;
            }

            if (particle.position.y < particle.radius) {
                particle.position.y = particle.radius;
                particle.velocity.y *= bounce;
                particle.velocity.x *= friction;
            }

            if (particle.position.y > height - particle.radius) {
                particle.position.y = height - particle.radius;
                particle.velocity.y *= bounce;
                particle.velocity.x *= friction;
            }
        }
    }

    private ClampColorChannel(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(255, Math.round(value)));
    }

    private NormalizeRgbColor(value: unknown, fallback: RgbColor): RgbColor {
        if (typeof value === 'object' && value !== null) {
            const channelRecord = value as Record<string, unknown>;
            const r = channelRecord['r'];
            const g = channelRecord['g'];
            const b = channelRecord['b'];

            if (
                typeof r === 'number' &&
                typeof g === 'number' &&
                typeof b === 'number' &&
                Number.isInteger(r) &&
                Number.isInteger(g) &&
                Number.isInteger(b) &&
                r >= 0 &&
                r <= 255 &&
                g >= 0 &&
                g <= 255 &&
                b >= 0 &&
                b <= 255
            ) {
                return value as RgbColor;
            }

            return {
                r: this.ClampColorChannel(Number(r)),
                g: this.ClampColorChannel(Number(g)),
                b: this.ClampColorChannel(Number(b)),
            };
        }

        if (typeof value === 'string') {
            const rgbMatch = value.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);

            if (rgbMatch) {
                return {
                    r: this.ClampColorChannel(Number(rgbMatch[1])),
                    g: this.ClampColorChannel(Number(rgbMatch[2])),
                    b: this.ClampColorChannel(Number(rgbMatch[3])),
                };
            }
        }

        return {
            r: fallback.r,
            g: fallback.g,
            b: fallback.b,
        };
    }

    private ColorToCss(color: RgbColor): string {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    private EnsureParticleSprites(radius: number): void {
        const diameter = Math.max(2, Math.ceil(radius * 2) + 2);
        const offset = diameter / 2;
        const cacheKey = `${this.gradientKey}|${diameter}`;

        if (cacheKey === this.spriteCacheKey) {
            return;
        }

        for (let i = 0; i < FluidSimulationApp.COLOR_STEPS; i++) {
            let sprite = this.particleSprites[i];

            if (!sprite || sprite.width !== diameter || sprite.height !== diameter) {
                sprite = document.createElement('canvas');
                sprite.width = diameter;
                sprite.height = diameter;
                this.particleSprites[i] = sprite;
            }

            const spriteCtx = sprite.getContext('2d');

            if (!spriteCtx) {
                continue;
            }

            spriteCtx.clearRect(0, 0, diameter, diameter);
            spriteCtx.fillStyle = this.gradientColors[i];
            spriteCtx.beginPath();
            spriteCtx.arc(offset, offset, radius, 0, 2 * Math.PI);
            spriteCtx.fill();
        }

        this.spriteRadius = radius;
        this.spriteOffset = offset;
        this.spriteCacheKey = cacheKey;
    }

    private RefreshColorCaches(): void {
        this.coloring.slowColor = this.NormalizeRgbColor(
            this.coloring.slowColor,
            this.defaultColoring.slowColor,
        );
        this.coloring.fastColor = this.NormalizeRgbColor(
            this.coloring.fastColor,
            this.defaultColoring.fastColor,
        );
        this.coloring.backgroundColor = this.NormalizeRgbColor(
            this.coloring.backgroundColor,
            this.defaultColoring.backgroundColor,
        );

        this.interaction.mouseHoverColor = this.NormalizeRgbColor(
            this.interaction.mouseHoverColor,
            {
                r: 56,
                g: 189,
                b: 248,
            },
        );
        this.interaction.mouseActiveColor = this.NormalizeRgbColor(
            this.interaction.mouseActiveColor,
            {
                r: 248,
                g: 113,
                b: 113,
            },
        );

        const slow = this.coloring.slowColor;
        const fast = this.coloring.fastColor;

        const gradientKey = `${slow.r},${slow.g},${slow.b}|${fast.r},${fast.g},${fast.b}`;

        if (gradientKey !== this.gradientKey) {
            for (let i = 0; i < FluidSimulationApp.COLOR_STEPS; i++) {
                const t = i / (FluidSimulationApp.COLOR_STEPS - 1);
                const r = Math.round(slow.r + (fast.r - slow.r) * t);
                const g = Math.round(slow.g + (fast.g - slow.g) * t);
                const b = Math.round(slow.b + (fast.b - slow.b) * t);
                this.gradientColors[i] = `rgb(${r}, ${g}, ${b})`;
            }

            this.gradientKey = gradientKey;
        }

        const background = this.coloring.backgroundColor;
        const hover = this.interaction.mouseHoverColor;
        const active = this.interaction.mouseActiveColor;
        const surfaceColorKey = `${background.r},${background.g},${background.b}|${hover.r},${hover.g},${hover.b}|${active.r},${active.g},${active.b}`;

        if (surfaceColorKey !== this.surfaceColorKey) {
            this.cachedBackgroundCss = this.ColorToCss(background);
            this.cachedHoverCss = this.ColorToCss(hover);
            this.cachedHoverFillCss = `rgba(${hover.r}, ${hover.g}, ${hover.b}, 0.14)`;
            this.cachedActiveCss = this.ColorToCss(active);
            this.cachedActiveFillCss = `rgba(${active.r}, ${active.g}, ${active.b}, 0.14)`;
            this.surfaceColorKey = surfaceColorKey;
        }
    }

    private UpdateColors(): void {
        const colorIntensity: number = this.interaction.colorIntensity;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            // Dynamic color tracking based on velocity magnitude (visually indicates waves/energy)
            const vx = particle.velocity.x;
            const vy = particle.velocity.y;
            const speed: number = Math.sqrt(vx * vx + vy * vy);
            const index = Math.max(
                0,
                Math.min(FluidSimulationApp.COLOR_STEPS - 1, Math.round(speed * colorIntensity)),
            );
            particle.colorIndex = index;
        }
    }

    Draw(ctx: CanvasRenderingContext2D, width: number, height: number, ts: number): void {
        this.DrawBackground(ctx, width, height);
        this.DrawParticles(ctx);
        this.DrawMouseIndicator(ctx);
        this.DrawHUD(ctx, ts);
    }

    private DrawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = this.cachedBackgroundCss;
        ctx.fillRect(0, 0, width, height);
    }

    private DrawParticles(ctx: CanvasRenderingContext2D): void {
        if (this.particles.length <= 0) {
            return;
        }

        // Draw fluid particles
        if (this.performance.useSpriteRendering) {
            this.DrawParticlesSprite(ctx);
        } else {
            this.DrawParticlesPath(ctx);
        }
    }

    private DrawParticlesSprite(ctx: CanvasRenderingContext2D): void {
        const firstRadius = this.particles[0].radius;
        this.EnsureParticleSprites(firstRadius);

        const spriteOffset = this.spriteOffset;
        const snapSprites = this.performance.snapSpritesToPixels;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const sprite = this.particleSprites[particle.colorIndex];

            if (sprite) {
                const drawX = particle.position.x - spriteOffset;
                const drawY = particle.position.y - spriteOffset;
                ctx.drawImage(
                    sprite,
                    snapSprites ? Math.round(drawX) : drawX,
                    snapSprites ? Math.round(drawY) : drawY,
                );
                continue;
            }

            this.DrawParticle(ctx, particle);
        }
    }

    private DrawParticlesPath(ctx: CanvasRenderingContext2D): void {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            this.DrawParticle(ctx, particle);
        }
    }

    private DrawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.gradientColors[particle.colorIndex];
        ctx.fill();
    }

    private DrawMouseIndicator(ctx: CanvasRenderingContext2D): void {
        if (!this.performance.showMouseIndicator || !this.input.IsMouseOverCanvas()) {
            return;
        }

        const mousePosition: Vector2 = this.input.MousePosition();
        const radius: number = this.interaction.mouseRadius;
        const isInteracting: boolean = this.input.MouseDown();
        const indicatorCss: string = isInteracting
            ? this.cachedActiveCss
            : this.cachedHoverCss;
        const indicatorFillCss: string = isInteracting
            ? this.cachedActiveFillCss
            : this.cachedHoverFillCss;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = indicatorCss;
        ctx.fillStyle = indicatorFillCss;
        ctx.beginPath();
        ctx.arc(mousePosition.x, mousePosition.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mousePosition.x, mousePosition.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = indicatorCss;
        ctx.fill();
        ctx.restore();
    }

    private DrawHUD(ctx: CanvasRenderingContext2D, ts: number): void {
        if (!this.performance.showHud) {
            return;
        }

        const fps = ts > 0 ? Math.round(1 / ts) : 0;
        const ms = ts * 1000;
        const particles = this.particles.length;
        const isHovering = this.input.IsMouseOverCanvas();
        const isInteracting = this.input.MouseDown();

        const x = 16;
        const y = 16;
        const width = 266;
        const height = 110;
        const radius = 16;

        ctx.save();
        ctx.shadowColor = 'rgba(2, 6, 23, 0.24)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        this.RoundRect(ctx, x, y, width, height, radius);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
        this.RoundRect(ctx, x + 14, y + 14, 10, 10, 3);
        ctx.fill();

        ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
        ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('SIMULATION STATUS', x + 32, y + 24);

        ctx.fillStyle = 'rgba(226, 232, 240, 0.86)';
        ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`Particles: ${particles}`, x + 16, y + 48);
        ctx.fillText(`FPS: ${fps}`, x + 16, y + 67);
        ctx.fillText(`Frame: ${ms.toFixed(2)} ms`, x + 16, y + 86);

        const statusLabel = isHovering ? (isInteracting ? 'AGITATING' : 'INTERACTIVE') : 'IDLE';
        const statusFill = isInteracting
            ? 'rgba(248, 113, 113, 0.18)'
            : isHovering
                ? 'rgba(56, 189, 248, 0.18)'
                : 'rgba(148, 163, 184, 0.12)';
        const statusText = isInteracting ? 'rgba(254, 226, 226, 0.96)' : 'rgba(226, 232, 240, 0.95)';

        this.RoundRect(ctx, x + 166, y + 18, 84, 22, 11);
        ctx.fillStyle = statusFill;
        ctx.fill();
        ctx.strokeStyle = isInteracting
            ? 'rgba(248, 113, 113, 0.26)'
            : isHovering
                ? 'rgba(56, 189, 248, 0.26)'
                : 'rgba(148, 163, 184, 0.16)';
        ctx.stroke();
        ctx.fillStyle = statusText;
        ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusLabel, x + 208, y + 29);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }

    private RoundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
    ): void {
        const right = x + width;
        const bottom = y + height;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(right - radius, y);
        ctx.quadraticCurveTo(right, y, right, y + radius);
        ctx.lineTo(right, bottom - radius);
        ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
        ctx.lineTo(x + radius, bottom);
        ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
