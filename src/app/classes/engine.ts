import { NotFoundError } from '../errors';
import { InputManager } from './input.manager';

export interface IApplication {
    Initialize(width: number, height: number, input: InputManager): void;
    Restart(width: number, height: number): void;
    Update(ts: number, width: number, height: number): void;
    Draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}

export class Engine {
    private ctx!: CanvasRenderingContext2D;
    private inputManager!: InputManager;
    private app!: IApplication;

    private isRunning: boolean = false;
    private lastTickTime: number = 0;
    private animationFrameId?: number;

    constructor(
        private canvas: HTMLCanvasElement,
        app: IApplication,
    ) {
        this.Initialize(canvas, app);
    }

    private Initialize(canvas: HTMLCanvasElement, app: IApplication): void {
        const context = canvas.getContext('2d');

        if (!context) {
            throw new NotFoundError('Could not obtain 2D canvas context');
        }

        this.ctx = context;
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

        // Delta time calculation (converted to standard seconds)
        const ts = (currentTime - this.lastTickTime) / 1000;
        this.lastTickTime = currentTime;

        // Orchestrate update and render cycles
        const width = this.LogicalWidth();
        const height = this.LogicalHeight();

        this.app.Update(ts, width, height);
        this.app.Draw(this.ctx, width, height);

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
