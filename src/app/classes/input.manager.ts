import { Vector2 } from '@xloxlolex/vector-math';

export class InputManager {
    private keys: Set<string> = new Set<string>();
    private mousePosition: Vector2 = new Vector2();
    private mouseClicked: boolean = false;
    private mouseOverCanvas: boolean = false;
    private canvasRect: DOMRect = new DOMRect();
    private resizeObserver?: ResizeObserver;

    private OnKeyDown = (event: KeyboardEvent) => this.keys.add(event.key);
    private OnKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key);

    private OnMouseMove = (event: MouseEvent) => {
        this.mousePosition.x = event.clientX - this.canvasRect.left;
        this.mousePosition.y = event.clientY - this.canvasRect.top;
    };

    private OnMouseEnter = () => {
        this.mouseOverCanvas = true;
        this.UpdateCanvasRect();
    };
    private OnMouseLeave = () => {
        this.mouseOverCanvas = false;
        this.mouseClicked = false;
    };

    private OnMouseDown = () => {
        this.mouseClicked = this.mouseOverCanvas;
    };
    private OnMouseUp = () => (this.mouseClicked = false);

    constructor(private canvas: HTMLCanvasElement) {
        this.Initialize();
    }

    private UpdateCanvasRect = (): void => {
        this.canvasRect = this.canvas.getBoundingClientRect();
    };

    private Initialize(): void {
        this.UpdateCanvasRect();

        this.resizeObserver = new ResizeObserver(() => {
            this.UpdateCanvasRect();
        });

        this.resizeObserver.observe(this.canvas);

        // Keyboard Events
        window.addEventListener('keydown', this.OnKeyDown, { passive: true });
        window.addEventListener('keyup', this.OnKeyUp, { passive: true });

        // Mouse Events
        this.canvas.addEventListener('mouseenter', this.OnMouseEnter, { passive: true });
        this.canvas.addEventListener('mouseleave', this.OnMouseLeave, { passive: true });
        this.canvas.addEventListener('mousemove', this.OnMouseMove, { passive: true });
        this.canvas.addEventListener('mousedown', this.OnMouseDown, { passive: true });
        window.addEventListener('mouseup', this.OnMouseUp, { passive: true });
        window.addEventListener('scroll', this.UpdateCanvasRect, { passive: true });
        window.addEventListener('resize', this.UpdateCanvasRect, { passive: true });
    }

    public KeyPressed(key: string): boolean {
        return this.keys.has(key);
    }

    public MousePosition(): Vector2 {
        return this.mousePosition;
    }

    public MouseDown(): boolean {
        return this.mouseClicked;
    }

    public IsMouseOverCanvas(): boolean {
        return this.mouseOverCanvas;
    }

    /**
     * Shuts down the `InputManager`.
     *
     * @memberof InputManager
     */
    public Shutdown(): void {
        this.resizeObserver?.disconnect();

        // Keyboard Events
        window.removeEventListener('keydown', this.OnKeyDown);
        window.removeEventListener('keyup', this.OnKeyUp);

        // Mouse Events
        this.canvas.removeEventListener('mouseenter', this.OnMouseEnter);
        this.canvas.removeEventListener('mouseleave', this.OnMouseLeave);
        this.canvas.removeEventListener('mousemove', this.OnMouseMove);
        this.canvas.removeEventListener('mousedown', this.OnMouseDown);
        window.removeEventListener('mouseup', this.OnMouseUp);
        window.removeEventListener('scroll', this.UpdateCanvasRect);
        window.removeEventListener('resize', this.UpdateCanvasRect);
    }
}
