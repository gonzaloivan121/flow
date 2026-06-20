import { Vector2 } from '@xloxlolex/vector-math';

import type { FluidSimulationApp, Particle } from './fluid-simulation.app';
import { Input } from '../core/input';

export class PhysicsModule {
    static Update(app: FluidSimulationApp, ts: number, width: number, height: number): void {
        const dt: number = Math.min(ts, app.simulation.maxTimestep);
        const smoothingRadius = app.physics.smoothingRadius;

        this.BuildSpatialBuckets(app, smoothingRadius);
        this.ComputeDensity(app, smoothingRadius);
        this.ComputePressure(app);
        this.ApplyForces(app, dt, smoothingRadius);
        this.UpdatePositions(app, dt, width, height);
        this.UpdateColors(app);
    }

    private static ComputeDensity(app: FluidSimulationApp, smoothingRadius: number): void {
        const hSq: number = smoothingRadius * smoothingRadius;

        // 2D Poly6 Kernel Normalization factor
        const hPow8 = hSq * hSq * hSq * hSq;
        const poly6: number = 4.0 / (Math.PI * hPow8);
        const particles = app.particles;

        // Compute localized density profiles
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            let densitySum: number = 0;
            const centerX = p1.cellX;
            const centerY = p1.cellY;

            for (let x = centerX - 1; x <= centerX + 1; x++) {
                const row = app.spatialBuckets.get(x);

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
                            const delta = hSq - distSq;
                            densitySum += p2.mass * delta * delta * delta;
                        }
                    }
                }
            }

            p1.density = Math.max(densitySum * poly6, 0.0001);
        }
    }

    private static ComputePressure(app: FluidSimulationApp): void {
        const pressureStiffness: number = app.physics.pressureStiffness;
        const targetDensity: number = app.physics.targetDensity;
        const particles = app.particles;

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            const densityRatio: number = p1.density / targetDensity;
            p1.pressure = pressureStiffness * (densityRatio * densityRatio - 1.0);

            if (p1.pressure < 0) {
                p1.pressure = 0;
            }
        }
    }

    private static ApplyForces(app: FluidSimulationApp, dt: number, h: number): void {
        const mousePosition: Vector2 = Input.MousePosition();
        const isInteracting: boolean = Input.MouseDown();
        const viscosity: number = app.physics.viscosity;
        const gravityX = app.physics.gravity.x * app.physics.gravityMultiplier;
        const gravityY = app.physics.gravity.y * app.physics.gravityMultiplier;
        const damping = app.physics.globalDamping;
        const mouseRadius: number = app.interaction.mouseRadius;
        const mouseRadiusSq: number = mouseRadius * mouseRadius;
        const mouseForce: number = app.interaction.mouseForce;
        const particles = app.particles;

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
                const row = app.spatialBuckets.get(x);

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

                        const pressureRatio = (p1.pressure + p2.pressure) / (2.0 * p2.density);
                        const hMinusDist = h - dist;
                        const pGrad: number = pressureRatio * spikyGrad * hMinusDist * hMinusDist;

                        pForceX -= dirX * pGrad * p2.mass;
                        pForceY -= dirY * pGrad * p2.mass;

                        const vDiffX: number = p2.velocity.x - p1.velocity.x;
                        const vDiffY: number = p2.velocity.y - p1.velocity.y;
                        const laplacian: number = viscLap * hMinusDist;
                        const viscosityTerm = (viscosity / p2.density) * laplacian * p2.mass;
                        vForceX += vDiffX * viscosityTerm;
                        vForceY += vDiffY * viscosityTerm;
                    }
                }
            }

            p1.velocity.x += (pForceX + vForceX) * dt;
            p1.velocity.y += (pForceY + vForceY) * dt;
            p1.velocity.x += gravityX * dt;
            p1.velocity.y += gravityY * dt;
            p1.velocity.x *= damping;
            p1.velocity.y *= damping;

            if (isInteracting) {
                const toMouseX: number = mousePosition.x - p1.position.x;
                const toMouseY: number = mousePosition.y - p1.position.y;
                const mouseDistSq: number = toMouseX * toMouseX + toMouseY * toMouseY;

                if (mouseDistSq < mouseRadiusSq && mouseDistSq > 1) {
                    const invMouseDist = 1 / Math.sqrt(mouseDistSq);
                    p1.velocity.x += toMouseX * invMouseDist * mouseForce * dt;
                    p1.velocity.y += toMouseY * invMouseDist * mouseForce * dt;
                }
            }
        }
    }

    private static BuildSpatialBuckets(app: FluidSimulationApp, cellSize: number): void {
        if (!app.performance.reuseSpatialBuckets) {
            app.spatialBuckets.clear();

            for (let i = 0; i < app.particles.length; i++) {
                const particle = app.particles[i];
                const cellX = Math.floor(particle.position.x / cellSize);
                const cellY = Math.floor(particle.position.y / cellSize);
                particle.cellX = cellX;
                particle.cellY = cellY;

                let row = app.spatialBuckets.get(cellX);

                if (!row) {
                    row = new Map<number, Particle[]>();
                    app.spatialBuckets.set(cellX, row);
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

        for (let i = 0; i < app.activeBuckets.length; i++) {
            app.activeBuckets[i].length = 0;
        }

        app.activeBuckets.length = 0;

        for (let i = 0; i < app.particles.length; i++) {
            const particle = app.particles[i];
            const cellX = Math.floor(particle.position.x / cellSize);
            const cellY = Math.floor(particle.position.y / cellSize);
            particle.cellX = cellX;
            particle.cellY = cellY;

            let row = app.spatialBuckets.get(cellX);

            if (!row) {
                row = new Map<number, Particle[]>();
                app.spatialBuckets.set(cellX, row);
            }

            let bucket = row.get(cellY);

            if (!bucket) {
                bucket = [];
                row.set(cellY, bucket);
            }

            if (bucket.length === 0) {
                app.activeBuckets.push(bucket);
            }

            bucket.push(particle);
        }
    }

    private static UpdatePositions(app: FluidSimulationApp, dt: number, width: number, height: number): void {
        const bounce: number = app.physics.wallBounce;
        const friction: number = app.physics.wallFriction;

        for (let i = 0; i < app.particles.length; i++) {
            const particle = app.particles[i];
            particle.position.x += particle.velocity.x * dt;
            particle.position.y += particle.velocity.y * dt;

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

    private static UpdateColors(app: FluidSimulationApp): void {
        const colorIntensity: number = app.interaction.colorIntensity;

        for (let i = 0; i < app.particles.length; i++) {
            const particle = app.particles[i];
            const vx = particle.velocity.x;
            const vy = particle.velocity.y;
            const speed: number = Math.sqrt(vx * vx + vy * vy);
            const index = Math.max(0, Math.min(255, Math.round(speed * colorIntensity)));
            particle.colorIndex = index;
        }
    }
}
