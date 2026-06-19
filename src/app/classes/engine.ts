import { NotFoundError } from '../errors';
import { InputManager } from './input.manager';

export interface IApplication {
    Initialize(width: number, height: number, input: InputManager): void;
    Restart(width: number, height: number): void;
    Update(ts: number, width: number, height: number): void;
    Draw(ctx: CanvasRenderingContext2D, width: number, height: number, ts: number): void;
}

export class Engine {
    private ctx!: CanvasRenderingContext2D;
    private inputManager!: InputManager;
    private app!: IApplication;

    private isRunning: boolean = false;
    private lastTickTime: number = 0;
    private animationFrameId?: number;
    private hiddenAtLeastOnce: boolean = false;

    private GetPerformanceOptions(): { pauseWhenHidden: boolean; maxFps: number } {
        const appWithPerformance = this.app as IApplication & {
            performance?: { pauseWhenHidden?: boolean; maxFps?: number };
        };

        const pauseWhenHidden = appWithPerformance.performance?.pauseWhenHidden ?? true;
        const maxFps = appWithPerformance.performance?.maxFps ?? 0;

        return { pauseWhenHidden, maxFps };
    }

    constructor(
        private canvas: HTMLCanvasElement,
        app: IApplication,
    ) {
        this.Initialize(canvas, app);
    }

    private Initialize(canvas: HTMLCanvasElement, app: IApplication): void {
        const context = canvas.getContext('2d', {
            alpha: false,
        });

        if (!context) {
            throw new NotFoundError('Could not obtain 2D canvas context');
        }

        this.ctx = context;
        this.ctx.imageSmoothingEnabled = true;
        this.app = app;
        this.inputManager = new InputManager(canvas);

        this.app.Initialize(this.LogicalWidth(), this.LogicalHeight(), this.inputManager);
    }

    private LogicalWidth(): number {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        return this.canvas.width / dpr;
    }

    private LogicalHeight(): number {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        return this.canvas.height / dpr;
    }

    private Loop = (currentTime: number): void => {
        if (!this.isRunning) {
            return;
        }

        const performance = this.GetPerformanceOptions();

        if (performance.pauseWhenHidden && document.hidden) {
            this.hiddenAtLeastOnce = true;
            this.lastTickTime = currentTime;
            this.animationFrameId = requestAnimationFrame(this.Loop);
            return;
        }

        if (this.hiddenAtLeastOnce) {
            this.hiddenAtLeastOnce = false;
            this.lastTickTime = currentTime;
        }

        // Delta time calculation (converted to standard seconds)
        const elapsedSeconds = (currentTime - this.lastTickTime) / 1000;

        if (performance.maxFps > 0) {
            const minFrameTime = 1 / Math.max(1, performance.maxFps);

            if (elapsedSeconds < minFrameTime) {
                this.animationFrameId = requestAnimationFrame(this.Loop);
                return;
            }
        }

        const ts = elapsedSeconds;
        this.lastTickTime = currentTime;

        // Orchestrate update and render cycles
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;

        this.app.Update(ts, width, height);
        this.app.Draw(this.ctx, width, height, ts);

        this.animationFrameId = requestAnimationFrame(this.Loop);
    };

    public Start(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastTickTime = performance.now();
        this.Loop(this.lastTickTime);
    }

    public Stop(): void {
        this.isRunning = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.inputManager.Shutdown();
    }
}
