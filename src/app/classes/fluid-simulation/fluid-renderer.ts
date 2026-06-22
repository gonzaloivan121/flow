import type { FluidSimulationApp, Particle, RGBColor } from './fluid-simulation.app';
import { Input } from '../core/input';
import { Renderer } from '../core/renderer';

export class FluidRenderer {
    private static readonly COLOR_STEPS = 256;

    private static gradientColors: string[] = new Array<string>(FluidRenderer.COLOR_STEPS);
    private static cachedBackgroundCss = Renderer.RGBToCSS(15, 23, 42);
    private static cachedHoverCss = Renderer.RGBToCSS(56, 189, 248);
    private static cachedHoverFillCss = Renderer.RGBToRGBA(56, 189, 248, 0.14);
    private static cachedActiveCss = Renderer.RGBToCSS(248, 113, 113);
    private static cachedActiveFillCss = Renderer.RGBToRGBA(248, 113, 113, 0.14);
    private static particleSprites: HTMLCanvasElement[] = new Array(FluidRenderer.COLOR_STEPS);
    private static spriteCacheKey = '';
    private static spriteOffset = 0;
    private static gradientKey = '';
    private static surfaceColorKey = '';

    static RefreshColorCaches(app: FluidSimulationApp): void {
        app.coloring.slowColor = this.NormalizeRGBColor(app.coloring.slowColor, {
            r: 56,
            g: 189,
            b: 248,
        });

        app.coloring.fastColor = this.NormalizeRGBColor(app.coloring.fastColor, {
            r: 255,
            g: 242,
            b: 248,
        });

        app.coloring.backgroundColor = this.NormalizeRGBColor(app.coloring.backgroundColor, {
            r: 15,
            g: 23,
            b: 42,
        });

        app.interaction.mouseHoverColor = this.NormalizeRGBColor(app.interaction.mouseHoverColor, {
            r: 56,
            g: 189,
            b: 248,
        });

        app.interaction.mouseActiveColor = this.NormalizeRGBColor(
            app.interaction.mouseActiveColor,
            {
                r: 248,
                g: 113,
                b: 113,
            },
        );

        const slow = app.coloring.slowColor;
        const fast = app.coloring.fastColor;
        const gradientKey = `${slow.r},${slow.g},${slow.b}|${fast.r},${fast.g},${fast.b}`;

        if (gradientKey !== this.gradientKey) {
            for (let i = 0; i < FluidRenderer.COLOR_STEPS; i++) {
                const t = i / (FluidRenderer.COLOR_STEPS - 1);
                const r = Math.round(slow.r + (fast.r - slow.r) * t);
                const g = Math.round(slow.g + (fast.g - slow.g) * t);
                const b = Math.round(slow.b + (fast.b - slow.b) * t);
                this.gradientColors[i] = Renderer.RGBToCSS(r, g, b);
            }

            this.gradientKey = gradientKey;
        }

        const background = app.coloring.backgroundColor;
        const hover = app.interaction.mouseHoverColor;
        const active = app.interaction.mouseActiveColor;
        const surfaceColorKey = `${background.r},${background.g},${background.b}|${hover.r},${hover.g},${hover.b}|${active.r},${active.g},${active.b}`;

        if (surfaceColorKey !== this.surfaceColorKey) {
            this.cachedBackgroundCss = Renderer.RGBToCSS(background.r, background.g, background.b);
            this.cachedHoverCss = Renderer.RGBToCSS(hover.r, hover.g, hover.b);
            this.cachedHoverFillCss = Renderer.RGBToRGBA(hover.r, hover.g, hover.b, 0.14);
            this.cachedActiveCss = Renderer.RGBToCSS(active.r, active.g, active.b);
            this.cachedActiveFillCss = Renderer.RGBToRGBA(active.r, active.g, active.b, 0.14);
            this.surfaceColorKey = surfaceColorKey;
        }
    }

    static DrawScene(app: FluidSimulationApp, width: number, height: number): void {
        this.DrawBackground(width, height);
        this.DrawParticles(app);
        this.DrawMouseIndicator(app);
    }

    private static DrawBackground(width: number, height: number): void {
        Renderer.FillRect(0, 0, width, height, this.cachedBackgroundCss);
    }

    private static DrawParticles(app: FluidSimulationApp): void {
        if (app.particles.length <= 0) {
            return;
        }

        if (app.performance.useSpriteRendering) {
            this.DrawParticlesSprite(app);
            return;
        }

        this.DrawParticlesPath(app);
    }

    private static DrawParticlesSprite(app: FluidSimulationApp): void {
        const firstRadius = app.particles[0].radius;
        this.EnsureParticleSprites(app, firstRadius);

        const spriteOffset = this.spriteOffset;
        const snapSprites = app.performance.snapSpritesToPixels;

        for (let i = 0; i < app.particles.length; i++) {
            const particle = app.particles[i];
            const sprite = this.particleSprites[particle.colorIndex];

            if (sprite) {
                const drawX = particle.position.x - spriteOffset;
                const drawY = particle.position.y - spriteOffset;
                Renderer.DrawImage(
                    sprite,
                    snapSprites ? Math.round(drawX) : drawX,
                    snapSprites ? Math.round(drawY) : drawY,
                );
                continue;
            }

            this.DrawParticle(app, particle);
        }
    }

    private static DrawParticlesPath(app: FluidSimulationApp): void {
        Renderer.Save();

        if (app.performance.enableParticleGlow) {
            Renderer.SetCompositeOperation('lighter');
        }

        for (let i = 0; i < app.particles.length; i++) {
            this.DrawParticle(app, app.particles[i]);
        }

        Renderer.Restore();
    }

    private static DrawParticle(
        app: FluidSimulationApp,
        particle: Particle,
    ): void {
        const color = this.gradientColors[particle.colorIndex];
        Renderer.DrawCircle(particle.position.x, particle.position.y, particle.radius, color);

        if (!app.performance.enableParticleGlow) {
            return;
        }

        Renderer.DrawCircle(
            particle.position.x - particle.radius * 0.25,
            particle.position.y - particle.radius * 0.25,
            Math.max(1, particle.radius * 0.35),
            Renderer.RGBToRGBA(255, 255, 255, 0.24),
        );
    }

    private static DrawMouseIndicator(app: FluidSimulationApp): void {
        if (!app.performance.showMouseIndicator || !Input.MouseOverCanvas()) {
            return;
        }

        const mousePosition = Input.MousePosition();
        const radius: number = app.interaction.mouseRadius;
        const isInteracting: boolean = Input.MouseDown();
        const indicatorCss = isInteracting ? this.cachedActiveCss : this.cachedHoverCss;
        const indicatorFillCss = isInteracting ? this.cachedActiveFillCss : this.cachedHoverFillCss;

        Renderer.Save();
        Renderer.DrawCircle(
            mousePosition.x,
            mousePosition.y,
            radius,
            indicatorFillCss,
            indicatorCss,
            2,
        );
        Renderer.DrawCircle(mousePosition.x, mousePosition.y, 3, indicatorCss);
        Renderer.Restore();
    }

    private static EnsureParticleSprites(app: FluidSimulationApp, radius: number): void {
        const glowEnabled = app.performance.enableParticleGlow;
        const glowPadding = glowEnabled ? Math.max(3, Math.ceil(radius * 1.2)) : 0;
        const diameter = Math.max(2, Math.ceil(radius * 2) + glowPadding * 2);
        const offset = diameter / 2;
        const cacheKey = `${this.gradientKey}|${diameter}|${glowEnabled ? 'glow' : 'flat'}`;

        if (cacheKey === this.spriteCacheKey) {
            return;
        }

        for (let i = 0; i < FluidRenderer.COLOR_STEPS; i++) {
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
            const color = this.gradientColors[i];

            if (glowEnabled) {
                const halo = spriteCtx.createRadialGradient(
                    offset,
                    offset,
                    radius * 0.3,
                    offset,
                    offset,
                    radius + glowPadding,
                );
                halo.addColorStop(0, Renderer.RGBToRGBA(255, 255, 255, 0.28));
                halo.addColorStop(0.45, color);
                halo.addColorStop(1, Renderer.RGBToRGBA(255, 255, 255, 0));

                spriteCtx.fillStyle = halo;
                spriteCtx.beginPath();
                spriteCtx.arc(offset, offset, radius + glowPadding, 0, 2 * Math.PI);
                spriteCtx.fill();

                const core = spriteCtx.createRadialGradient(
                    offset - radius * 0.25,
                    offset - radius * 0.3,
                    radius * 0.1,
                    offset,
                    offset,
                    radius,
                );
                core.addColorStop(0, Renderer.RGBToRGBA(255, 255, 255, 0.9));
                core.addColorStop(0.35, color);
                core.addColorStop(1, color);

                spriteCtx.fillStyle = core;
                spriteCtx.beginPath();
                spriteCtx.arc(offset, offset, radius, 0, 2 * Math.PI);
                spriteCtx.fill();
                continue;
            }

            spriteCtx.fillStyle = color;
            spriteCtx.beginPath();
            spriteCtx.arc(offset, offset, radius, 0, 2 * Math.PI);
            spriteCtx.fill();
        }

        this.spriteOffset = offset;
        this.spriteCacheKey = cacheKey;
    }

    private static ClampColorChannel(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(255, Math.round(value)));
    }

    private static NormalizeRGBColor(value: unknown, fallback: RGBColor): RGBColor {
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
                return value as RGBColor;
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
}
