import { IApplication } from '../core/engine';
import { FluidRenderer } from './fluid-renderer';
import { PhysicsModule } from './physics';
import { HudModule } from './hud';
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
    mouseHoverColor: RGBColor;
    mouseActiveColor: RGBColor;
}

/**
 * Color representation without alpha channel.
 *
 * @export
 * @interface RGBColor
 */
export interface RGBColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Color representation with alpha channel for opacity.
 *
 * @export
 * @interface RGBAColor
 */
export interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Coloring settings for particle and background colors.
 * Color values are RGB objects in the form `{ r, g, b }`.
 *
 * @export
 * @interface Coloring
 */
export interface Coloring {
    slowColor: RGBColor; // Particle color at rest / low speed
    fastColor: RGBColor; // Particle color at maximum speed
    backgroundColor: RGBColor; // Canvas background fill color
}

export interface PerformanceSettings {
    useSpriteRendering: boolean;
    enableParticleGlow: boolean;
    snapSpritesToPixels: boolean;
    reuseParticlePool: boolean;
    reuseSpatialBuckets: boolean;
    showMouseIndicator: boolean;
    showHud: boolean;
    pauseWhenHidden: boolean;
    maxFps: number;
}

export class FluidSimulationApp implements IApplication {
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

    public particles: Particle[] = [];
    public particlePool: Particle[] = [];
    public spatialBuckets = new Map<number, Map<number, Particle[]>>();
    public activeBuckets: Particle[][] = [];
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
        enableParticleGlow: false,
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

    public Initialize(width: number, height: number): void {
        FluidRenderer.RefreshColorCaches(this);
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
            useSpriteRendering: true,
            enableParticleGlow: true,
            snapSpritesToPixels: false,
            reuseParticlePool: true,
            reuseSpatialBuckets: true,
            showMouseIndicator: true,
            showHud: true,
            pauseWhenHidden: true,
            maxFps: 0,
        });
        FluidRenderer.RefreshColorCaches(this);
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
        FluidRenderer.RefreshColorCaches(this);
        PhysicsModule.Update(this, ts, width, height);
    }

    public Draw(ts: number, width: number, height: number): void {
        FluidRenderer.DrawScene(this, width, height);
        HudModule.Draw(this, ts);
    }
}
