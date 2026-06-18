import { Vector2 } from '@xloxlolex/vector-math';

export class InputManager {
    private keys: Set<string> = new Set<string>();
    private mousePosition: Vector2 = new Vector2();
    private mouseClicked: boolean = false;

    private OnKeyDown = (event: KeyboardEvent) => this.keys.add(event.key);
    private OnKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key);

    private OnMouseMove = (event: MouseEvent) => {
        const rect: DOMRect = this.canvas.getBoundingClientRect();

        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
    };

    private OnMouseDown = () => (this.mouseClicked = true);
    private OnMouseUp = () => (this.mouseClicked = false);

    constructor(private canvas: HTMLCanvasElement) {
        this.Initialize();
    }

    private Initialize(): void {
        // Keyboard Events
        window.addEventListener('keydown', this.OnKeyDown);
        window.addEventListener('keyup', this.OnKeyUp);

        // Mouse Events
        this.canvas.addEventListener('mousemove', this.OnMouseMove);
        this.canvas.addEventListener('mousedown', this.OnMouseDown);
        this.canvas.addEventListener('mouseup', this.OnMouseUp);
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
        this.canvas.removeEventListener('mousemove', this.OnMouseMove);
        this.canvas.removeEventListener('mousedown', this.OnMouseDown);
        this.canvas.removeEventListener('mouseup', this.OnMouseUp);
    }
}