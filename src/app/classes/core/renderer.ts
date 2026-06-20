import { AlreadyInitializedError, InvalidArgumentError, NotInitializedError } from '../../errors';

/**
 * Interface defining the options for drawing text with the `Renderer`.
 *
 * @interface TextOptions
 */
interface TextOptions {
    /**
     * The fill style to use for the text, which can be a color string, gradient, or pattern.
     *
     * @type {string}
     * @memberof TextOptions
     */
    fillStyle?: string;

    /**
     * The font to use for the text, which should be a valid CSS font string (e.g., '16px Arial').
     *
     * @type {string}
     * @memberof TextOptions
     */
    font?: string;

    /**
     * The text alignment to use for the text, which determines how the text is aligned relative to the specified coordinates.
     *
     * @type {CanvasTextAlign}
     * @memberof TextOptions
     */
    textAlign?: CanvasTextAlign;

    /**
     * The text baseline to use for the text, which determines how the text is aligned vertically relative to the specified coordinates.
     *
     * @type {CanvasTextBaseline}
     * @memberof TextOptions
     */
    textBaseline?: CanvasTextBaseline;
}

/**
 * The `Renderer` class provides a centralized system for managing the canvas rendering context and drawing operations.
 *
 * @export
 * @class Renderer
 */
export class Renderer {
    private static context: CanvasRenderingContext2D | null = null;

    /**
     * Initializes the `Renderer` by setting the provided canvas rendering context and configuring default settings.
     *
     * @static
     * @param {CanvasRenderingContext2D} context - The canvas rendering context to use for all drawing operations.
     * @throws {InvalidArgumentError} If the provided `context` is invalid.
     * @throws {AlreadyInitializedError} If the `Renderer` has already been initialized.
     * @memberof Renderer
     */
    static Initialize(context: CanvasRenderingContext2D): void {
        if (!context) {
            throw new InvalidArgumentError(
                'Invalid canvas context provided for renderer initialization',
            );
        }

        if (this.context) {
            throw new AlreadyInitializedError('Renderer is already initialized');
        }

        this.context = context;
        this.context.imageSmoothingEnabled = true;
    }

    /**
     * Shuts down the `Renderer` by clearing the canvas context.
     * After calling this method, the `Renderer` will need to be re-initialized before it can be used again.
     *
     * @static
     * @memberof Renderer
     */
    static Shutdown(): void {
        this.context = null;
    }

    /**
     * Saves the current state of the canvas context, allowing it to be restored later with `Restore()`.
     * 
     * This is useful for temporarily changing drawing settings or transformations and then reverting back to the previous state.
     * It is important to ensure that `Restore()` is called after `Save()` to avoid errors due to an empty state stack.
     *
     * @static
     * @memberof Renderer
     */
    static Save(): void {
        this.GetContext().save();
    }

    /**
     * Restores the canvas context to the last saved state.
     * 
     * If there is no saved state, this will throw an error. It is important to ensure that `Save()` has been called before calling `Restore()`.
     * This is useful for temporarily changing drawing settings or transformations and then reverting back to the previous state.
     * This should be used in conjunction with `Save()` to manage complex drawing states.
     *
     * @static
     * @memberof Renderer
     */
    static Restore(): void {
        this.GetContext().restore();
    }

    /**
     * Sets the fill style for subsequent fill operations. This can be a color string, gradient, or pattern.
     *
     * @static
     * @param {(string | CanvasGradient | CanvasPattern)} fillStyle - The fill style to set for subsequent fill operations.
     * @memberof Renderer
     */
    static SetFillStyle(fillStyle: string | CanvasGradient | CanvasPattern): void {
        this.GetContext().fillStyle = fillStyle;
    }

    /**
     * Sets the stroke style for subsequent stroke operations. This can be a color string, gradient, or pattern.
     *
     * @static
     * @param {(string | CanvasGradient | CanvasPattern)} strokeStyle
     * @memberof Renderer
     */
    static SetStrokeStyle(strokeStyle: string | CanvasGradient | CanvasPattern): void {
        this.GetContext().strokeStyle = strokeStyle;
    }

    /**
     * Sets the line width for subsequent stroke operations.
     *
     * @static
     * @param {number} lineWidth
     * @memberof Renderer
     */
    static SetLineWidth(lineWidth: number): void {
        this.GetContext().lineWidth = lineWidth;
    }

    /**
     * Sets the global composite operation for subsequent drawing operations, which determines how new drawings are composited with existing canvas content.
     *
     * @static
     * @param {GlobalCompositeOperation} compositeOperation
     * @memberof Renderer
     */
    static SetCompositeOperation(compositeOperation: GlobalCompositeOperation): void {
        this.GetContext().globalCompositeOperation = compositeOperation;
    }

    /**
     * Sets the font for subsequent text drawing operations. This should be a valid CSS font string (e.g., '16px Arial').
     *
     * @static
     * @param {string} font - The font to set for subsequent text drawing operations.
     * @memberof Renderer
     */
    static SetFont(font: string): void {
        this.GetContext().font = font;
    }

    /**
     * Sets the text alignment for subsequent text drawing operations. This determines how the text is aligned relative to the specified coordinates.
     *
     * @static
     * @param {CanvasTextAlign} textAlign - The text alignment to set for subsequent text drawing operations (e.g., 'left', 'center', 'right').
     * @memberof Renderer
     */
    static SetTextAlign(textAlign: CanvasTextAlign): void {
        this.GetContext().textAlign = textAlign;
    }

    /**
     * Sets the text baseline for subsequent text drawing operations. This determines how the text is aligned vertically relative to the specified coordinates.
     *
     * @static
     * @param {CanvasTextBaseline} textBaseline - The text baseline to set for subsequent text drawing operations (e.g., 'top', 'middle', 'bottom', 'alphabetic').
     * @memberof Renderer
     */
    static SetTextBaseline(textBaseline: CanvasTextBaseline): void {
        this.GetContext().textBaseline = textBaseline;
    }

    /**
     * Draws a filled rectangle at the specified coordinates with the given dimensions and fill style.
     *
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {string} fillStyle - The fill style to use for the rectangle (e.g., a color string, gradient, or pattern).
     * @memberof Renderer
     */
    static FillRect(x: number, y: number, width: number, height: number, fillStyle: string): void {
        const ctx = this.GetContext();

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, width, height);
    }

    /**
     * Draws a stroked rectangle at the specified coordinates with the given dimensions, stroke style, and line width.
     *
     * @static
     * @param {CanvasImageSource} image - The image to draw on the canvas.
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle.
     * @memberof Renderer
     */
    static DrawImage(image: CanvasImageSource, x: number, y: number): void {
        this.GetContext().drawImage(image, x, y);
    }


    /**
     * Draws a circle at the specified coordinates with the given radius, fill style, and optional stroke style and line width.
     *
     * @static
     * @param {number} x - The x-coordinate of the center of the circle.
     * @param {number} y - The y-coordinate of the center of the circle.
     * @param {number} radius - The radius of the circle.
     * @param {string} fillStyle - The fill style to use for the circle (e.g., a color string, gradient, or pattern).
     * @param {string} [strokeStyle] - Optional stroke style to use for the circle's outline (e.g., a color string, gradient, or pattern). If not provided, the circle will not be stroked.
     * @param {number} [lineWidth] - Optional line width to use for the circle's outline when `strokeStyle` is provided. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawCircle(
        x: number,
        y: number,
        radius: number,
        fillStyle: string,
        strokeStyle?: string,
        lineWidth?: number,
    ): void {
        const ctx = this.GetContext();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fillStyle;
        ctx.fill();

        if (strokeStyle) {
            if (lineWidth !== undefined) {
                ctx.lineWidth = lineWidth;
            }

            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    /**
     * Draws a rectangle with rounded corners at the specified coordinates with the given dimensions, corner radius, fill style, and optional stroke style and line width.
     *
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {number} radius - The radius of the corners of the rectangle.
     * @param {string} [fillStyle] - Optional fill style to use for the rectangle (e.g., a color string, gradient, or pattern). If not provided, the rectangle will not be filled.
     * @param {string} [strokeStyle] - Optional stroke style to use for the rectangle's outline (e.g., a color string, gradient, or pattern). If not provided, the rectangle will not be stroked.
     * @param {number} [lineWidth] - Optional line width to use for the rectangle's outline when `strokeStyle` is provided. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fillStyle?: string,
        strokeStyle?: string,
        lineWidth?: number,
    ): void {
        const ctx = this.GetContext();

        this.RoundRectPath(x, y, width, height, radius);

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            if (lineWidth !== undefined) {
                ctx.lineWidth = lineWidth;
            }

            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    /**
     * Draws text at the specified coordinates with the given options for fill style, font, text alignment, and text baseline.
     *
     * @static
     * @param {string} text - The text to draw on the canvas.
     * @param {number} x - The x-coordinate of the point at which to draw the text, interpreted according to the current `textAlign` setting.
     * @param {number} y - The y-coordinate of the point at which to draw the text, interpreted according to the current `textBaseline` setting.
     * @param {TextOptions} [options] - Optional drawing options for the text, including fill style, font, text alignment, and text baseline. If not provided, default settings will be used.
     * @memberof Renderer
     */
    static DrawText(
        text: string,
        x: number,
        y: number,
        options?: TextOptions,
    ): void {
        const ctx = this.GetContext();

        if (options?.fillStyle) {
            ctx.fillStyle = options.fillStyle;
        }

        if (options?.font) {
            ctx.font = options.font;
        }

        if (options?.textAlign) {
            ctx.textAlign = options.textAlign;
        }

        if (options?.textBaseline) {
            ctx.textBaseline = options.textBaseline;
        }

        ctx.fillText(text, x, y);
    }

    /**
     * Converts RGB color values to a CSS color string in the format 'rgb(r, g, b)'.
     *
     * @static
     * @param {number} r - The red component of the color (0-255).
     * @param {number} g - The green component of the color (0-255).
     * @param {number} b - The blue component of the color (0-255).
     * @returns {string} The CSS color string in the format 'rgb(r, g, b)'.
     * @memberof Renderer
     */
    static RGBToCSS(r: number, g: number, b: number): string {
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Converts RGBA color values to a CSS color string in the format 'rgba(r, g, b, a)'.
     *
     * @static
     * @param {number} r - The red component of the color (0-255).
     * @param {number} g - The green component of the color (0-255).
     * @param {number} b - The blue component of the color (0-255).
     * @param {number} alpha - The alpha component of the color (0-1).
     * @returns {string} The CSS color string in the format 'rgba(r, g, b, a)'.
     * @memberof Renderer
     */
    static RGBToRGBA(r: number, g: number, b: number, alpha: number): string {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Retrieves the current canvas rendering context.
     *
     * @private
     * @static
     * @throws {NotInitializedError} If the `Renderer` has not been initialized.
     * @returns {CanvasRenderingContext2D} The current canvas rendering context.
     * @memberof Renderer
     */
    private static GetContext(): CanvasRenderingContext2D {
        if (!this.context) {
            throw new NotInitializedError('Renderer has not been initialized');
        }

        return this.context;
    }

    /**
     * Creates a path for a rectangle with rounded corners on the provided canvas rendering context.
     * This method does not stroke or fill the path; it only defines the path for subsequent drawing operations.
     *
     * @private
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {number} radius - The radius of the corners of the rectangle.
     * @memberof Renderer
     */
    private static RoundRectPath(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
    ): void {
        const ctx = this.GetContext();

        const right = x + width;
        const bottom = y + height;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(right - radius, y);
        ctx.quadraticCurveTo(right, y, right, y + radius);
        ctx.lineTo(right, bottom - radius);
        ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
        ctx.lineTo(x + radius, bottom);
        ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
