import {
    Component,
    ElementRef,
    signal,
    viewChild,
    afterRenderEffect,
    OnDestroy,
    input,
} from '@angular/core';

import { Engine } from '../../classes/engine';
import { FluidSimulationApp } from '../../classes/fluid-simulation.app';

@Component({
    selector: 'app-viewport',
    imports: [],
    templateUrl: './viewport.component.html',
    styleUrl: './viewport.component.css',
})
export class ViewportComponent implements OnDestroy {
    private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
    private resizeObserver?: ResizeObserver;
    private engine!: Engine;
    private isEngineInitialized: boolean = false;

    app = input.required<FluidSimulationApp>();

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
                    this.SyncResolution(width, height, canvasElement);
                }
            });

            this.resizeObserver.observe(canvasElement);
            this.engine.Start();
            this.isEngineInitialized = true;
        });
    }

    public RestartSimulation(): void {
        if (this.isEngineInitialized) {
            const canvas = this.canvasRef().nativeElement;
            this.app().Restart(canvas.width, canvas.height);
        }
    }

    private SyncResolution(width: number, height: number, canvas: HTMLCanvasElement): void {
        // Sync backing store drawing resolution to match visual CSS layout dimensions
        canvas.width = width;
        canvas.height = height;

        // Update state signals
        this.canvasWidth.set(width);
        this.canvasHeight.set(height);
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.engine) {
            this.engine.Stop();
        }
    }
}
