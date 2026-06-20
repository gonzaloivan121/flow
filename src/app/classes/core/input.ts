import { Vector2 } from '@xloxlolex/vector-math';
import { AlreadyInitializedError, InvalidArgumentError } from '../../errors';

/**
 * The `Input` class provides a centralized system for handling user input from the keyboard and mouse.
 *
 * @export
 * @class Input
 */
export class Input {
    private static canvas: HTMLCanvasElement | null = null;
    private static keys: Set<string> = new Set<string>();
    private static mousePosition: Vector2 = new Vector2();
    private static mouseClicked = false;
    private static mouseOverCanvas = false;
    private static canvasRect: DOMRect = new DOMRect();
    private static resizeObserver?: ResizeObserver;

    /**
     * Event handler for keydown events, adding the pressed key to the `keys` set.
     *
     * @private
     * @static
     * @param {KeyboardEvent} event
     * @memberof Input
     */
    private static OnKeyDown = (event: KeyboardEvent) => this.keys.add(event.key);

    /**
     * Event handler for keyup events, removing the released key from the `keys` set.
     *
     * @private
     * @static
     * @param {KeyboardEvent} event
     * @memberof Input
     */
    private static OnKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key);

    /**
     * Event handler for mousemove events, updating the current mouse position relative to the canvas.
     *
     * @private
     * @static
     * @param {MouseEvent} event
     * @memberof Input
     */
    private static OnMouseMove = (event: MouseEvent) => {
        this.mousePosition.x = event.clientX - this.canvasRect.left;
        this.mousePosition.y = event.clientY - this.canvasRect.top;
    };

    /**
     * Event handler for mouseenter events, marking the mouse as being over the canvas and updating the canvas rect.
     *
     * @private
     * @static
     * @memberof Input
     */
    private static OnMouseEnter = () => {
        this.mouseOverCanvas = true;
        this.UpdateCanvasRect();
    };

    /**
     * Event handler for mouseleave events, marking the mouse as no longer being over the canvas and resetting click state.
     *
     * @private
     * @static
     * @memberof Input
     */
    private static OnMouseLeave = () => {
        this.mouseOverCanvas = false;
        this.mouseClicked = false;
    };

    /**
     * Event handler for mousedown events, marking the mouse as clicked if it is over the canvas.
     *
     * @private
     * @static
     * @memberof Input
     */
    private static OnMouseDown = () => {
        this.mouseClicked = this.mouseOverCanvas;
    };

    /**
     * Event handler for mouseup events, marking the mouse as no longer clicked.
     *
     * @private
     * @static
     * @memberof Input
     */
    private static OnMouseUp = () => {
        this.mouseClicked = false;
    };

    /**
     * Initializes the input system by setting up event listeners for keyboard and mouse events on the provided canvas element.
     *
     * @static
     * @param {HTMLCanvasElement} canvas - The canvas element to attach input event listeners to.
     * @throws {InvalidArgumentError} If the provided `canvas` element is invalid.
     * @throws {AlreadyInitializedError} If the input system has already been initialized.
     * @memberof Input
     */
    static Initialize(canvas: HTMLCanvasElement): void {
        if (!canvas) {
            throw new InvalidArgumentError('Invalid canvas element provided for input initialization');
        }
        
        if (this.canvas) {
            throw new AlreadyInitializedError('Input system is already initialized');
        }

        this.canvas = canvas;
        this.UpdateCanvasRect();

        this.resizeObserver = new ResizeObserver(() => {
            this.UpdateCanvasRect();
        });

        this.resizeObserver.observe(canvas);

        window.addEventListener('keydown', this.OnKeyDown, { passive: true });
        window.addEventListener('keyup', this.OnKeyUp, { passive: true });

        canvas.addEventListener('mouseenter', this.OnMouseEnter, { passive: true });
        canvas.addEventListener('mouseleave', this.OnMouseLeave, { passive: true });
        canvas.addEventListener('mousemove', this.OnMouseMove, { passive: true });
        canvas.addEventListener('mousedown', this.OnMouseDown, { passive: true });
        window.addEventListener('mouseup', this.OnMouseUp, { passive: true });
        window.addEventListener('scroll', this.UpdateCanvasRect, { passive: true });
        window.addEventListener('resize', this.UpdateCanvasRect, { passive: true });
    }

    /**
     * Updates the cached bounding rectangle of the canvas element, used for calculating mouse position relative to the canvas.
     *
     * @private
     * @static
     * @memberof Input
     */
    private static UpdateCanvasRect = (): void => {
        if (!this.canvas) {
            return;
        }

        this.canvasRect = this.canvas.getBoundingClientRect();
    };

    /**
     * Checks if a specific key is currently pressed.
     *
     * @static
     * @param {string} key - The key to check for (e.g., 'a', 'Enter', 'ArrowUp').
     * @returns {boolean} `true` if the specified key is currently pressed, `false` otherwise.
     * @memberof Input
     */
    static KeyPressed(key: string): boolean {
        return this.keys.has(key);
    }

    /**
     * Gets the current mouse position relative to the canvas.
     *
     * @static
     * @returns {Vector2} The current mouse position relative to the canvas.
     * @memberof Input
     */
    static MousePosition(): Vector2 {
        return this.mousePosition;
    }

    /**
     * Checks if the mouse is currently clicked (i.e., the primary button is pressed) while over the canvas.
     *
     * @static
     * @returns {boolean} `true` if the mouse is currently clicked, `false` otherwise.
     * @memberof Input
     */
    static MouseDown(): boolean {
        return this.mouseClicked;
    }

    /**
     * Checks if the mouse cursor is currently over the canvas element.
     *
     * @static
     * @returns {boolean} `true` if the mouse cursor is currently over the canvas, `false` otherwise.
     * @memberof Input
     */
    static MouseOverCanvas(): boolean {
        return this.mouseOverCanvas;
    }

    /**
     * Shuts down the input system by removing all event listeners and clearing internal state.
     * After calling this method, the `Input` class will need to be re-initialized before it can be used again.
     *
     * @static
     * @memberof Input
     */
    static Shutdown(): void {
        if (!this.canvas) {
            return;
        }

        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;

        window.removeEventListener('keydown', this.OnKeyDown);
        window.removeEventListener('keyup', this.OnKeyUp);

        this.canvas.removeEventListener('mouseenter', this.OnMouseEnter);
        this.canvas.removeEventListener('mouseleave', this.OnMouseLeave);
        this.canvas.removeEventListener('mousemove', this.OnMouseMove);
        this.canvas.removeEventListener('mousedown', this.OnMouseDown);
        window.removeEventListener('mouseup', this.OnMouseUp);
        window.removeEventListener('scroll', this.UpdateCanvasRect);
        window.removeEventListener('resize', this.UpdateCanvasRect);

        this.canvas = null;
        this.keys.clear();
        this.mousePosition = new Vector2();
        this.mouseClicked = false;
        this.mouseOverCanvas = false;
        this.canvasRect = new DOMRect();
    }
}
