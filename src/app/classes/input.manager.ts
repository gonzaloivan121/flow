import { Vector2 } from '@xloxlolex/vector-math';

export class InputManager {
    private keys: Set<string> = new Set<string>();
    private mousePosition: Vector2 = new Vector2();
    private mouseClicked: boolean = false;
    private mouseOverCanvas: boolean = false;

    private OnKeyDown = (event: KeyboardEvent) => this.keys.add(event.key);
    private OnKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key);

    private OnMouseMove = (event: MouseEvent) => {
        const rect: DOMRect = this.canvas.getBoundingClientRect();

        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
    };

    private OnMouseEnter = () => (this.mouseOverCanvas = true);
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

    private Initialize(): void {
        // Keyboard Events
        window.addEventListener('keydown', this.OnKeyDown);
        window.addEventListener('keyup', this.OnKeyUp);

        // Mouse Events
        this.canvas.addEventListener('mouseenter', this.OnMouseEnter);
        this.canvas.addEventListener('mouseleave', this.OnMouseLeave);
        this.canvas.addEventListener('mousemove', this.OnMouseMove);
        this.canvas.addEventListener('mousedown', this.OnMouseDown);
        window.addEventListener('mouseup', this.OnMouseUp);
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
        // Keyboard Events
        window.removeEventListener('keydown', this.OnKeyDown);
        window.removeEventListener('keyup', this.OnKeyUp);

        // Mouse Events
        this.canvas.removeEventListener('mouseenter', this.OnMouseEnter);
        this.canvas.removeEventListener('mouseleave', this.OnMouseLeave);
        this.canvas.removeEventListener('mousemove', this.OnMouseMove);
        this.canvas.removeEventListener('mousedown', this.OnMouseDown);
        window.removeEventListener('mouseup', this.OnMouseUp);
    }
}