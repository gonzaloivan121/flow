import { Vector2 } from '@xloxlolex/vector-math';
import type { FluidSimulationApp } from './fluid-simulation.app';

import { Input } from '../core/input';
import { Renderer } from '../core/renderer';

export class HudModule {
    private static position: Vector2 = new Vector2(16, 16);
    private static size: Vector2 = new Vector2(266, 110);
    private static radius: number = 16;

    static Draw(app: FluidSimulationApp, ts: number): void {
        if (!app.performance.showHud) {
            return;
        }

        const fps = ts > 0 ? Math.round(1 / ts) : 0;
        const ms = ts * 1000;
        const particles = app.particles.length;
        const isHovering = Input.MouseOverCanvas();
        const isInteracting = Input.MouseDown();
        const position = this.position;
        const size = this.size;
        const radius = this.radius;

        Renderer.Save();

        Renderer.DrawRoundedRect(
            this.position.x,
            position.y,
            size.x,
            size.y,
            radius,
            'rgba(15, 23, 42, 0.72)',
            'rgba(148, 163, 184, 0.18)',
            1,
        );

        Renderer.DrawRoundedRect(position.x + 14, position.y + 14, 10, 10, 3, 'rgba(56, 189, 248, 0.95)');

        Renderer.DrawText('SIMULATION STATUS', position.x + 32, position.y + 24, {
            fillStyle: 'rgba(248, 250, 252, 0.95)',
            font: '700 12px "Segoe UI", system-ui, sans-serif',
        });

        Renderer.DrawText(`Particles: ${particles}`, position.x + 16, position.y + 48, {
            fillStyle: 'rgba(226, 232, 240, 0.86)',
            font: '500 11px "Segoe UI", system-ui, sans-serif',
        });

        Renderer.DrawText(`FPS: ${fps}`, position.x + 16, position.y + 67, {
            fillStyle: 'rgba(226, 232, 240, 0.86)',
            font: '500 11px "Segoe UI", system-ui, sans-serif',
        });

        Renderer.DrawText(`Frame: ${ms.toFixed(2)} ms`, position.x + 16, position.y + 86, {
            fillStyle: 'rgba(226, 232, 240, 0.86)',
            font: '500 11px "Segoe UI", system-ui, sans-serif',
        });

        const statusLabel = isHovering ? (isInteracting ? 'AGITATING' : 'INTERACTIVE') : 'IDLE';
        const statusFill = isInteracting
            ? 'rgba(248, 113, 113, 0.18)'
            : isHovering
                ? 'rgba(56, 189, 248, 0.18)'
                : 'rgba(148, 163, 184, 0.12)';
        const statusText = isInteracting
            ? 'rgba(254, 226, 226, 0.96)'
            : 'rgba(226, 232, 240, 0.95)';
        const statusStroke = isInteracting
            ? 'rgba(248, 113, 113, 0.26)'
            : isHovering
                ? 'rgba(56, 189, 248, 0.26)'
                : 'rgba(148, 163, 184, 0.16)';

        Renderer.DrawRoundedRect(position.x + 166, position.y + 18, 84, 22, 11, statusFill, statusStroke, 1);

        Renderer.DrawText(statusLabel, position.x + 208, position.y + 29, {
            fillStyle: statusText,
            font: '700 10px "Segoe UI", system-ui, sans-serif',
            textAlign: 'center',
            textBaseline: 'middle',
        });

        Renderer.Restore();
    }
}
