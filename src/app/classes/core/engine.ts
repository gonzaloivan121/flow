import { AlreadyInitializedError, NotFoundError } from '../../errors';
import { Input } from './input';
import { Renderer } from './renderer';

/**
 * Interface defining the structure of an `Application` that can be run by the `Engine`.
 *
 * @export
 * @interface IApplication
 */
export interface IApplication {
    /**
     * Initializes the `Application` with the given dimensions.
     *
     * This method is called once during startup.
     *
     * @param {number} width
     * @param {number} height
     * @memberof IApplication
     */
    Initialize(width: number, height: number): void;

    /**
     * Restarts the `Application` with the given dimensions.
     *
     * @param {number} width
     * @param {number} height
     * @memberof IApplication
     */
    Restart(width: number, height: number): void;

    /**
     * Updates the `Application` state.
     *
     * This method is called on every animation frame with the elapsed time since
     * the last update and the current dimensions.
     *
     * @param {number} ts - The elapsed time in seconds since the last update.
     * @param {number} width - The current `width` of the `Application`.
     * @param {number} height - The current `height` of the `Application`.
     * @memberof IApplication
     */
    Update(ts: number, width: number, height: number): void;

    /**
     * Renders the `Application` state to the screen.
     *
     * This method is called on every animation frame after `Update` with the
     * elapsed time since the last update and the current dimensions.
     *
     * @param {number} ts - The elapsed time in seconds since the last update.
     * @param {number} width - The current `width` of the `Application`.
     * @param {number} height - The current `height` of the `Application`.
     * @memberof IApplication
     */
    Draw(ts: number, width: number, height: number): void;
}

/**
 * The main engine class responsible for managing the application lifecycle,
 * including initialization, update, and rendering cycles.
 *
 * @export
 * @class Engine
 */
export class Engine {
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

    /**
     * Initializes the engine by setting up the `Renderer`, `Input` system, and `Application`.
     *
     * @private
     * @param {HTMLCanvasElement} canvas - The canvas element to use for rendering.
     * @param {IApplication} app - The application instance to run on the engine.
     * @memberof Engine
     */
    private Initialize(canvas: HTMLCanvasElement, app: IApplication): void {
        const context = canvas.getContext('2d', {
            alpha: false,
        });

        if (!context) {
            throw new NotFoundError('Could not obtain 2D canvas context');
        }

        Renderer.Initialize(context);
        Input.Initialize(canvas);

        this.app = app;
        this.app.Initialize(this.LogicalWidth(), this.LogicalHeight());
    }

    /**
     * Calculates the logical width of the canvas by accounting for the device pixel ratio.
     *
     * @private
     * @returns {number} The logical width of the canvas.
     * @memberof Engine
     */
    private LogicalWidth(): number {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        return this.canvas.width / dpr;
    }

    /**
     * Calculates the logical height of the canvas by accounting for the device pixel ratio.
     *
     * @private
     * @returns {number} The logical height of the canvas.
     * @memberof Engine
     */
    private LogicalHeight(): number {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        return this.canvas.height / dpr;
    }

    /**
     * The main loop of the `Engine`, responsible for orchestrating the update and render cycles.
     *
     * @private
     * @param {number} currentTime - The current timestamp provided by `requestAnimationFrame`.
     * @memberof Engine
     */
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
        this.app.Draw(ts, width, height);

        this.animationFrameId = requestAnimationFrame(this.Loop);
    };

    /**
     * Starts the main loop, allowing the `Application` to begin updating and rendering.
     *
     * @throws {AlreadyInitializedError} If the `Engine` is already running.
     * @memberof Engine
     */
    public Start(): void {
        if (this.isRunning) {
            throw new AlreadyInitializedError('Engine is already running');
        }

        this.isRunning = true;
        this.lastTickTime = performance.now();
        this.Loop(this.lastTickTime);
    }

    /**
     * Stops the main loop, halting updates and rendering of the `Application`.
     *
     * @memberof Engine
     */
    public Stop(): void {
        this.isRunning = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        Input.Shutdown();
        Renderer.Shutdown();
    }
}
