import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    NgZone,
    signal,
    viewChild,
    afterRenderEffect,
    OnDestroy,
    input,
} from '@angular/core';

import { Engine } from '../../classes/core/engine';
import { FluidSimulationApp } from '../../classes/fluid-simulation/fluid-simulation.app';

@Component({
    selector: 'app-viewport',
    imports: [],
    templateUrl: './viewport.component.html',
    styleUrl: './viewport.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewportComponent implements OnDestroy {
    private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
    private ngZone = inject(NgZone);

    private resizeObserver?: ResizeObserver;
    private resizeRafId?: number;
    private engine!: Engine;
    private isEngineInitialized: boolean = false;
    private lastPixelWidth: number = 0;
    private lastPixelHeight: number = 0;

    readonly app = input.required<FluidSimulationApp>();

    // Standard signals exposed for structural metadata tracking if template needs them
    protected canvasWidth = signal<number>(0);
    protected canvasHeight = signal<number>(0);

    constructor() {
        afterRenderEffect(() => {
            if (this.isEngineInitialized) {
                return;
            }

            const canvasElement = this.canvasRef().nativeElement;

            // Grab the initial CSS layout dimensions
            const rect: DOMRect = canvasElement.getBoundingClientRect();
            this.SyncResolution(rect.width, rect.height, canvasElement);

            // Instantiate engine and target app configuration
            this.engine = new Engine(canvasElement, this.app());

            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;

                    if (this.resizeRafId) {
                        cancelAnimationFrame(this.resizeRafId);
                    }

                    this.resizeRafId = requestAnimationFrame(() => {
                        this.SyncResolution(width, height, canvasElement);
                    });
                }
            });

            this.resizeObserver.observe(canvasElement);

            this.ngZone.runOutsideAngular(() => {
                this.engine.Start();
            });

            this.isEngineInitialized = true;
        });
    }

    /**
     * Restarts the simulation using the current logical canvas dimensions.
     */
    public RestartSimulation(): void {
        if (this.isEngineInitialized) {
            const canvas = this.canvasRef().nativeElement;
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            this.app().Restart(canvas.width / dpr, canvas.height / dpr);
        }
    }

    /**
     * Synchronizes the canvas backing resolution with the viewport display size.
     */
    private SyncResolution(width: number, height: number, canvas: HTMLCanvasElement): void {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const pixelWidth = Math.floor(width * dpr);
        const pixelHeight = Math.floor(height * dpr);

        if (pixelWidth === this.lastPixelWidth && pixelHeight === this.lastPixelHeight) {
            return;
        }

        this.lastPixelWidth = pixelWidth;
        this.lastPixelHeight = pixelHeight;

        canvas.width = pixelWidth;
        canvas.height = pixelHeight;

        const context = canvas.getContext('2d');
        context?.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Update state signals
        this.canvasWidth.set(width);
        this.canvasHeight.set(height);
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.resizeRafId) {
            cancelAnimationFrame(this.resizeRafId);
        }

        if (this.engine) {
            this.engine.Stop();
        }
    }
}
