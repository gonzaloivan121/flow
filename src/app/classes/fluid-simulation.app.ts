import { IApplication } from './engine';
import { InputManager } from './input.manager';
import { Vector2 } from '@xloxlolex/vector-math';

export interface Particle {
    position: Vector2;
    velocity: Vector2;
    density: number;
    pressure: number;
    mass: number;
    radius: number;
    color: string;
}

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

export interface Simulation {
    particleColumns: number;
    particleRows: number;
    initialSpacing: number;
    particleMass: number;
    particleRadius: number;
    maxTimestep: number;
}

export interface Interaction {
    mouseRadius: number;
    mouseForce: number;
    colorIntensity: number;
}

export class FluidSimulationApp implements IApplication {
    private input!: InputManager;

    private particles: Particle[] = [];
    private spatialBuckets = new Map<string, Particle[]>();

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
    };

    public Initialize(width: number, height: number, input: InputManager): void {
        this.input = input;
        this.Restart(width, height);
    }

    public Restart(width: number, height: number): void {
        this.particles = [];

        const cols: number = this.simulation.particleColumns;
        const rows: number = this.simulation.particleRows;
        const spacing: number = this.simulation.initialSpacing;
        const startX: number = (width - cols * spacing) / 2;
        const startY: number = (height - rows * spacing) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const particle: Particle = {
                    position: new Vector2(startX + c * spacing, startY + r * spacing),
                    velocity: new Vector2(),
                    density: 0,
                    pressure: 0,
                    mass: this.simulation.particleMass,
                    radius: this.simulation.particleRadius,
                    color: '#38bdf8',
                };

                this.particles.push(particle);
            }
        }
    }

    public Update(ts: number, width: number, height: number): void {
        // Cap ts to avoid unstable teleportation during lag spikes
        const dt: number = Math.min(ts, this.simulation.maxTimestep);
        const smoothingRadius = this.physics.smoothingRadius;

        this.BuildSpatialBuckets(smoothingRadius);

        this.ComputeDensity(smoothingRadius);
        this.ComputePressure();
        this.ApplyForces(dt, smoothingRadius);
        this.UpdatePositions(dt, width, height);
        this.UpdateColors(dt);
    }

    private ComputeDensity(smoothingRadius: number): void {
        const hSq: number = smoothingRadius * smoothingRadius;

        // 2D Poly6 Kernel Normalization factor
        const hPow8 = hSq * hSq * hSq * hSq;
        const poly6: number = 4.0 / (Math.PI * hPow8);
        const particles = this.particles;

        // Compute localized density profiles
        for (const p1 of particles) {
            let densitySum: number = 0;

            for (const p2 of this.GetNearbyParticles(p1, smoothingRadius)) {
                const dx: number = p2.position.x - p1.position.x;
                const dy: number = p2.position.y - p1.position.y;
                const distSq: number = dx * dx + dy * dy;

                if (distSq < hSq) {
                    // Standard SPH spiky kernel approximation
                    const delta = hSq - distSq;
                    densitySum += p2.mass * delta * delta * delta;
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
        for (const p1 of particles) {
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
        const mouseForce: number = this.interaction.mouseForce;
        const particles = this.particles;

        // 2D Spiky & Viscosity Kernel Normalization factors
        const hSq = h * h;
        const hPow5 = hSq * hSq * h;
        const spikyGrad: number = 30.0 / (Math.PI * hPow5);
        const viscLap: number = 20.0 / (Math.PI * hPow5);

        for (const p1 of particles) {
            let pForceX: number = 0;
            let pForceY: number = 0;
            let vForceX: number = 0;
            let vForceY: number = 0;

            for (const p2 of this.GetNearbyParticles(p1, h)) {
                if (p1 === p2) {
                    continue;
                }

                let diffX: number = p2.position.x - p1.position.x;
                let diffY: number = p2.position.y - p1.position.y;

                if (diffX === 0 && diffY === 0) {
                    diffX = (Math.random() - 0.5) * 0.01;
                    diffY = (Math.random() - 0.5) * 0.01;
                }

                const dist: number = Math.sqrt(diffX * diffX + diffY * diffY);

                if (dist < h) {
                    const dirX: number = diffX / dist;
                    const dirY: number = diffY / dist;

                    // Fluid Pressure Vector Math (pushing from high density area to low)
                    const pGrad: number =
                        ((p1.pressure + p2.pressure) / (2.0 * p2.density)) *
                        spikyGrad *
                        (h - dist) *
                        (h - dist);

                    pForceX -= dirX * pGrad * p2.mass;
                    pForceY -= dirY * pGrad * p2.mass;

                    // Viscosity Linear Shear (Frictional fluid damping between nodes)
                    const vDiffX: number = p2.velocity.x - p1.velocity.x;
                    const vDiffY: number = p2.velocity.y - p1.velocity.y;
                    const laplacian: number = viscLap * (h - dist);

                    // SYMMETRICAL FORCE: Multiply by p2.mass
                    vForceX += vDiffX * (viscosity / p2.density) * laplacian * p2.mass;
                    vForceY += vDiffY * (viscosity / p2.density) * laplacian * p2.mass;
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
                const mouseDist: number = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);

                if (mouseDist < mouseRadius && mouseDist > 1) {
                    // Left click acts like an underwater agitator/impeller
                    p1.velocity.x += (toMouseX / mouseDist) * mouseForce * dt;
                    p1.velocity.y += (toMouseY / mouseDist) * mouseForce * dt;
                }
            }
        }
    }

    private BuildSpatialBuckets(cellSize: number): void {
        this.spatialBuckets.clear();

        for (const particle of this.particles) {
            const key = this.GetCellKey(particle.position.x, particle.position.y, cellSize);
            const bucket = this.spatialBuckets.get(key);

            if (bucket) {
                bucket.push(particle);
                continue;
            }

            this.spatialBuckets.set(key, [particle]);
        }
    }

    private GetNearbyParticles(center: Particle, cellSize: number): Particle[] {
        const nearby: Particle[] = [];
        const centerX = Math.floor(center.position.x / cellSize);
        const centerY = Math.floor(center.position.y / cellSize);

        for (let x = centerX - 1; x <= centerX + 1; x++) {
            for (let y = centerY - 1; y <= centerY + 1; y++) {
                const bucket = this.spatialBuckets.get(`${x},${y}`);

                if (!bucket) {
                    continue;
                }

                nearby.push(...bucket);
            }
        }

        return nearby;
    }

    private GetCellKey(x: number, y: number, cellSize: number): string {
        return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
    }

    private UpdatePositions(dt: number, width: number, height: number): void {
        const bounce: number = this.physics.wallBounce;
        const friction: number = this.physics.wallFriction;

        for (const particle of this.particles) {
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

    private UpdateColors(dt: number): void {
        for (const particle of this.particles) {
            // Dynamic color tracking based on velocity magnitude (visually indicates waves/energy)
            const speed: number = particle.velocity.magnitude;
            const colorIntensity: number = this.interaction.colorIntensity;
            const intensity: number = Math.min(Math.floor(speed * colorIntensity), 255);
            particle.color = `rgb(${intensity}, ${140 + Math.floor(intensity * 0.4)}, 248)`;
        }
    }

    Draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Draw fluid particles
        for (const particle of this.particles) {
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, 2 * Math.PI);
            ctx.fillStyle = particle.color;
            ctx.fill();
        }

        // Context HUD
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`FLUID PARTICLES: ${this.particles.length}`, 20, 30);
        ctx.fillText(`MOUSE ACTIONS: CLICK AND DRAG TO AGITATE WAVE GENERATION`, 20, 50);
    }
}
