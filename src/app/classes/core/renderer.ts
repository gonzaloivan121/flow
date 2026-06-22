import {
    AlreadyInitializedError,
    InvalidArgumentError,
    InvalidStateError,
    NotInitializedError,
} from '../../errors';

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
 * Type defining the possible repetition options for patterns used in the `Renderer`.
 */
type Repetition = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | null;

/**
 * Type defining the possible fill styles for drawing operations in the `Renderer`, which can be a color string, gradient, or pattern.
 */
type StrokeStyle = string | CanvasGradient | CanvasPattern;

/**
 * Type defining the possible fill styles for drawing operations in the `Renderer`, which can be a color string, gradient, or pattern.
 */
type FillStyle = string | CanvasGradient | CanvasPattern;

/**
 * The `Renderer` class provides a centralized system for managing the canvas rendering context and drawing operations.
 *
 * @export
 * @class Renderer
 */
export class Renderer {
    /**
     * The canvas rendering context used for all drawing operations.
     *
     * This is set during initialization and should not be accessed directly outside of the `Renderer` class.
     *
     * @private
     * @static
     * @type {(CanvasRenderingContext2D | null)}
     * @memberof Renderer
     */
    private static context: CanvasRenderingContext2D | null = null;

    /**
     * A flag to track whether the canvas context state has been saved with `Save()` and not yet restored with `Restore()`.
     *
     * @private
     * @static
     * @type {boolean}
     * @memberof Renderer
     */
    private static isContextSaved: boolean = false;

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
                'Invalid canvas context provided for Renderer initialization. Please ensure that a valid CanvasRenderingContext2D is passed to Renderer.Initialize().',
            );
        }

        if (this.context) {
            throw new AlreadyInitializedError(
                'Renderer is already initialized. Please call Renderer.Shutdown() before initializing again.',
            );
        }

        this.context = context;
        this.context.imageSmoothingEnabled = true;
    }

    /**
     * Shuts down the `Renderer` by clearing the canvas context.
     * After calling this method, the `Renderer` will need to be re-initialized before it can be used again.
     *
     * @static
     * @throws {NotInitializedError} If the `Renderer` is not currently initialized.
     * @memberof Renderer
     */
    static Shutdown(): void {
        if (!this.context) {
            throw new NotInitializedError(
                'Renderer has not been initialized. Please call Renderer.Initialize() with a valid canvas context before using the Renderer.',
            );
        }

        this.context = null;
    }

    /**
     * Saves the current state of the canvas context, allowing it to be restored later with `Restore()`.
     *
     * This is useful for temporarily changing drawing settings or transformations and then reverting back to the previous state.
     * It is important to ensure that `Restore()` is called after `Save()` to avoid errors due to an empty state stack.
     *
     * @static
     * @throws {InvalidStateError} If the context state is already saved and has not been restored yet.
     * @memberof Renderer
     */
    static Save(): void {
        if (this.isContextSaved) {
            throw new InvalidStateError(
                'Context state is already saved. Please check that Restore() is called after Save().',
            );
        }

        this.GetContext().save();
        this.isContextSaved = true;
    }

    /**
     * Restores the canvas context to the last saved state.
     *
     * If there is no saved state, this will throw an error. It is important to ensure that `Save()` has been called before calling `Restore()`.
     * This is useful for temporarily changing drawing settings or transformations and then reverting back to the previous state.
     * This should be used in conjunction with `Save()` to manage complex drawing states.
     *
     * @static
     * @throws {InvalidStateError} If there is no saved context state to restore.
     * @memberof Renderer
     */
    static Restore(): void {
        if (!this.isContextSaved) {
            throw new InvalidStateError(
                'No saved context state to restore. Please check that Save() is called before Restore().',
            );
        }

        this.GetContext().restore();
        this.isContextSaved = false;
    }

    /**
     * Sets the fill style for subsequent fill operations. This can be a color string, gradient, or pattern.
     *
     * @static
     * @param {FillStyle} fillStyle - The fill style to set for subsequent fill operations.
     * @memberof Renderer
     */
    static SetFillStyle(fillStyle: FillStyle): void {
        this.GetContext().fillStyle = fillStyle;
    }

    /**
     * Sets the stroke style for subsequent stroke operations. This can be a color string, gradient, or pattern.
     *
     * @static
     * @param {StrokeStyle} strokeStyle
     * @memberof Renderer
     */
    static SetStrokeStyle(strokeStyle: StrokeStyle): void {
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
     * @param {GlobalCompositeOperation} compositeOperation - The global composite operation to set for subsequent drawing operations (e.g., 'source-over', 'destination-over', 'lighter', 'xor').
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
     * @param {FillStyle} fillStyle - The fill style to use for the rectangle (e.g., a color string, gradient, or pattern).
     * @memberof Renderer
     */
    static FillRect(
        x: number,
        y: number,
        width: number,
        height: number,
        fillStyle: FillStyle,
    ): void {
        this.SetFillStyle(fillStyle);
        this.GetContext().fillRect(x, y, width, height);
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
    static DrawImage(image: CanvasImageSource, x: number, y: number): void;

    /**
     * Draws an image on the canvas at the specified coordinates with the given dimensions.
     *
     * @static
     * @param {CanvasImageSource} image - The image to draw on the canvas.
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle where the image will be drawn.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle where the image will be drawn.
     * @param {number} width - The width to draw the image. This will stretch or shrink the image to fit the specified width.
     * @param {number} height - The height to draw the image. This will stretch or shrink the image to fit the specified height.
     * @memberof Renderer
     */
    static DrawImage(
        image: CanvasImageSource,
        x: number,
        y: number,
        width: number,
        height: number,
    ): void;

    /**
     * Draws a portion of an image on the canvas at the specified coordinates with the given dimensions.
     * The portion of the image to draw is defined by the source rectangle (sx, sy, sw, sh),
     * and the destination rectangle on the canvas is defined by (dx, dy, dw, dh).
     *
     * @static
     * @param {CanvasImageSource} image - The image to draw on the canvas.
     * @param {number} sx - The x-coordinate of the upper-left corner of the source rectangle within the image.
     * @param {number} sy - The y-coordinate of the upper-left corner of the source rectangle within the image.
     * @param {number} sw - The width of the source rectangle within the image.
     * @param {number} sh - The height of the source rectangle within the image.
     * @param {number} dx - The x-coordinate of the upper-left corner of the destination rectangle on the canvas where the image will be drawn.
     * @param {number} dy - The y-coordinate of the upper-left corner of the destination rectangle on the canvas where the image will be drawn.
     * @param {number} dw - The width to draw the image on the canvas. This will stretch or shrink the image to fit the specified width of the destination rectangle.
     * @param {number} dh - The height to draw the image on the canvas. This will stretch or shrink the image to fit the specified height of the destination rectangle.
     * @memberof Renderer
     */
    static DrawImage(
        image: CanvasImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
    ): void;
    static DrawImage(image: CanvasImageSource, ...args: number[]): void {
        if (args.length !== 2 && args.length !== 4 && args.length !== 8) {
            throw new InvalidArgumentError(
                'Invalid DrawImage arguments. Expected 2, 4, or 8 numeric arguments.',
            );
        }

        const ctx = this.GetContext();

        if (args.length === 2) {
            ctx.drawImage(image, args[0], args[1]);
            return;
        }

        if (args.length === 4) {
            ctx.drawImage(image, args[0], args[1], args[2], args[3]);
            return;
        }

        ctx.drawImage(
            image,
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            args[5],
            args[6],
            args[7],
        );
    }

    /**
     * Draws a circle at the specified coordinates with the given radius, fill style, and optional stroke style and line width.
     *
     * @static
     * @param {number} x - The x-coordinate of the center of the circle.
     * @param {number} y - The y-coordinate of the center of the circle.
     * @param {number} radius - The radius of the circle.
     * @param {FillStyle} fillStyle - The fill style to use for the circle (e.g., a color string, gradient, or pattern).
     * @param {StrokeStyle} [strokeStyle] - Optional stroke style to use for the circle's outline (e.g., a color string, gradient, or pattern). If not provided, the circle will not be stroked.
     * @param {number} [lineWidth] - Optional line width to use for the circle's outline when `strokeStyle` is provided. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawCircle(
        x: number,
        y: number,
        radius: number,
        fillStyle: FillStyle,
        strokeStyle?: StrokeStyle,
        lineWidth?: number,
    ): void {
        this.BeginPath();
        this.Arc(x, y, radius, 0, 2 * Math.PI);
        this.SetFillStyle(fillStyle);
        this.Fill();

        if (strokeStyle !== undefined) {
            if (lineWidth !== undefined) {
                this.SetLineWidth(lineWidth);
            }

            this.SetStrokeStyle(strokeStyle);
            this.Stroke();
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
     * @param {FillStyle} [fillStyle] - Optional fill style to use for the rectangle (e.g., a color string, gradient, or pattern). If not provided, the rectangle will not be filled.
     * @param {StrokeStyle} [strokeStyle] - Optional stroke style to use for the rectangle's outline (e.g., a color string, gradient, or pattern). If not provided, the rectangle will not be stroked.
     * @param {number} [lineWidth] - Optional line width to use for the rectangle's outline when `strokeStyle` is provided. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fillStyle?: FillStyle,
        strokeStyle?: StrokeStyle,
        lineWidth?: number,
    ): void {
        this.RoundRectPath(x, y, width, height, radius);

        if (fillStyle !== undefined) {
            this.SetFillStyle(fillStyle);
            this.Fill();
        }

        if (strokeStyle !== undefined) {
            if (lineWidth !== undefined) {
                this.SetLineWidth(lineWidth);
            }

            this.SetStrokeStyle(strokeStyle);
            this.Stroke();
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
    static DrawText(text: string, x: number, y: number, options?: TextOptions): void {
        if (options?.fillStyle) {
            this.SetFillStyle(options.fillStyle);
        }

        if (options?.font) {
            this.SetFont(options.font);
        }

        if (options?.textAlign) {
            this.SetTextAlign(options.textAlign);
        }

        if (options?.textBaseline) {
            this.SetTextBaseline(options.textBaseline);
        }

        this.FillText(text, x, y);
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
     * @param {number} a - The alpha component of the color (0-1).
     * @returns {string} The CSS color string in the format 'rgba(r, g, b, a)'.
     * @memberof Renderer
     */
    static RGBToRGBA(r: number, g: number, b: number, a: number): string {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Converts HSL color values to a CSS color string in the format 'hsl(h, s%, l%)'.
     *
     * @static
     * @param {number} h - The hue component of the color (0-360).
     * @param {number} s - The saturation component of the color (0-100).
     * @param {number} l - The lightness component of the color (0-100).
     * @returns {string} The CSS color string in the format 'hsl(h, s%, l%)'.
     * @memberof Renderer
     */
    static HSLToCSS(h: number, s: number, l: number): string {
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /**
     * Converts HSLA color values to a CSS color string in the format 'hsla(h, s%, l%, a)'.
     *
     * @static
     * @param {number} h - The hue component of the color (0-360).
     * @param {number} s - The saturation component of the color (0-100).
     * @param {number} l - The lightness component of the color (0-100).
     * @param {number} a - The alpha component of the color (0-1).
     * @returns {string} The CSS color string in the format 'hsla(h, s%, l%, a)'.
     * @memberof Renderer
     */
    static HSLAToCSS(h: number, s: number, l: number, a: number): string {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    /**
     * Clears the entire canvas, removing all existing drawings and resetting it to a blank state.
     *
     * @static
     * @memberof Renderer
     */
    static Clear(): void {
        this.ClearRect(0, 0, this.GetWidth(), this.GetHeight());
    }

    /**
     * Clears a specific rectangular area of the canvas, removing any existing drawings within that area and resetting it to a blank state.
     *
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle to clear.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle to clear.
     * @param {number} width - The width of the rectangle to clear.
     * @param {number} height - The height of the rectangle to clear.
     * @memberof Renderer
     */
    static ClearRect(x: number, y: number, width: number, height: number): void {
        this.GetContext().clearRect(x, y, width, height);
    }

    /**
     * Retrieves the width of the canvas associated with the current rendering context.
     *
     * @static
     * @returns {number} The width of the canvas.
     * @memberof Renderer
     */
    static GetWidth(): number {
        return this.GetContext().canvas.width;
    }

    /**
     * Retrieves the height of the canvas associated with the current rendering context.
     *
     * @static
     * @returns {number} The height of the canvas.
     * @memberof Renderer
     */
    static GetHeight(): number {
        return this.GetContext().canvas.height;
    }

    /**
     * Draws a line between two points with the specified stroke style and optional line width.
     *
     * @static
     * @param {number} x1 - The x-coordinate of the starting point of the line.
     * @param {number} y1 - The y-coordinate of the starting point of the line.
     * @param {number} x2 - The x-coordinate of the ending point of the line.
     * @param {number} y2 - The y-coordinate of the ending point of the line.
     * @param {StrokeStyle} strokeStyle - The stroke style (color) of the line.
     * @param {number} [lineWidth] - The optional line width.
     * @memberof Renderer
     */
    static DrawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        strokeStyle: StrokeStyle,
        lineWidth?: number,
    ): void {
        this.BeginPath();
        this.MoveTo(x1, y1);
        this.LineTo(x2, y2);
        this.SetStrokeStyle(strokeStyle);

        if (lineWidth !== undefined) {
            this.SetLineWidth(lineWidth);
        }

        this.Stroke();
    }

    /**
     * Draws a series of connected lines between an array of points with the specified stroke style, optional line width, and optional closed path.
     *
     * @static
     * @param {{ x: number; y: number }[]} points - An array of points defining the vertices of the lines to be drawn. Each point should have an `x` and `y` property representing its coordinates.
     * @param {StrokeStyle} strokeStyle - The stroke style (color) of the lines. This can be a color string, gradient, or pattern.
     * @param {number} [lineWidth] - The optional line width. If not provided, the default line width will be used.
     * @param {boolean} [closed] - Whether to close the path by connecting the last point to the first point. If `true`, the path will be closed; if `false` or not provided, the path will remain open.
     * @memberof Renderer
     */
    static DrawLines(
        points: { x: number; y: number }[],
        strokeStyle: StrokeStyle,
        lineWidth?: number,
        closed?: boolean,
    ): void {
        if (points.length < 2) {
            return;
        }

        this.BeginPath();
        this.MoveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.LineTo(points[i].x, points[i].y);
        }

        if (closed) {
            this.ClosePath();
        }

        this.SetStrokeStyle(strokeStyle);

        if (lineWidth !== undefined) {
            this.SetLineWidth(lineWidth);
        }

        this.Stroke();
    }

    /**
     * Draws a filled and/or stroked polygon defined by an array of points with the specified fill style, stroke style, and optional line width.
     *
     * @static
     * @param {{ x: number; y: number }[]} points - An array of points defining the vertices of the polygon to be drawn. Each point should have an `x` and `y` property representing its coordinates.
     * @param {FillStyle} [fillStyle] - The fill style (color) of the polygon. This can be a color string, gradient, or pattern.
     * @param {StrokeStyle} [strokeStyle] - The stroke style (color) of the polygon. This can be a color string, gradient, or pattern.
     * @param {number} [lineWidth] - The optional line width. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawPolygon(
        points: { x: number; y: number }[],
        fillStyle?: FillStyle,
        strokeStyle?: StrokeStyle,
        lineWidth?: number,
    ): void {
        if (points.length < 3) {
            return;
        }

        this.BeginPath();
        this.MoveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.LineTo(points[i].x, points[i].y);
        }

        this.ClosePath();

        if (fillStyle) {
            this.SetFillStyle(fillStyle);
            this.Fill();
        }

        if (strokeStyle) {
            if (lineWidth !== undefined) {
                this.SetLineWidth(lineWidth);
            }

            this.SetStrokeStyle(strokeStyle);
            this.Stroke();
        }
    }

    /**
     * Draws an ellipse at the specified coordinates with the given radii, rotation, fill style, and optional stroke style and line width.
     *
     * @static
     * @param {number} x - The x-coordinate of the center of the ellipse.
     * @param {number} y - The y-coordinate of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {number} [rotation=0] - The rotation of the ellipse in radians. Defaults to 0 (no rotation).
     * @param {FillStyle} [fillStyle] - The fill style to use for the ellipse (e.g., a color string, gradient, or pattern). If not provided, the ellipse will not be filled.
     * @param {StrokeStyle} [strokeStyle] - The stroke style to use for the ellipse's outline (e.g., a color string, gradient, or pattern). If not provided, the ellipse will not be stroked.
     * @param {number} [lineWidth] - The optional line width to use for the ellipse's outline when `strokeStyle` is provided. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static DrawEllipse(
        x: number,
        y: number,
        radiusX: number,
        radiusY: number,
        rotation: number = 0,
        fillStyle?: FillStyle,
        strokeStyle?: StrokeStyle,
        lineWidth?: number,
    ): void {
        this.BeginPath();
        this.Ellipse(x, y, radiusX, radiusY, rotation, 0, 2 * Math.PI);

        if (fillStyle) {
            this.SetFillStyle(fillStyle);
            this.Fill();
        }

        if (strokeStyle) {
            if (lineWidth !== undefined) {
                this.SetLineWidth(lineWidth);
            }

            this.SetStrokeStyle(strokeStyle);
            this.Stroke();
        }
    }

    /**
     * Draws a stroked rectangle at the specified coordinates with the given dimensions, stroke style, and optional line width.
     *
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {StrokeStyle} strokeStyle - The stroke style to use for the rectangle's outline (e.g., a color string, gradient, or pattern).
     * @param {number} [lineWidth] - The optional line width to use for the rectangle's outline. If not provided, the default line width will be used.
     * @memberof Renderer
     */
    static StrokeRect(
        x: number,
        y: number,
        width: number,
        height: number,
        strokeStyle: StrokeStyle,
        lineWidth?: number,
    ): void {
        if (lineWidth !== undefined) {
            this.SetLineWidth(lineWidth);
        }

        this.SetStrokeStyle(strokeStyle);
        this.GetContext().strokeRect(x, y, width, height);
    }

    /**
     * Sets the global alpha (transparency) for subsequent drawing operations.
     * The alpha value should be a number between 0 (fully transparent) and 1 (fully opaque).
     *
     * @static
     * @param {number} alpha - The global alpha value to set for subsequent drawing operations (0-1).
     * @memberof Renderer
     */
    static SetGlobalAlpha(alpha: number): void {
        this.GetContext().globalAlpha = alpha;
    }

    /**
     * Applies a translation transformation to the canvas context, moving the origin to the specified coordinates (x, y).
     *
     * @static
     * @param {number} x - The x-coordinate to translate the origin to.
     * @param {number} y - The y-coordinate to translate the origin to.
     * @memberof Renderer
     */
    static Translate(x: number, y: number): void {
        this.GetContext().translate(x, y);
    }

    /**
     * Applies a rotation transformation to the canvas context, rotating the coordinate system by the specified angle in radians.
     *
     * @static
     * @param {number} angle - The angle in radians to rotate the coordinate system by.
     * @memberof Renderer
     */
    static Rotate(angle: number): void {
        this.GetContext().rotate(angle);
    }

    /**
     * Applies a scaling transformation to the canvas context, scaling the coordinate system by the specified factors.
     *
     * @static
     * @param {number} x - The horizontal scaling factor.
     * @param {number} y - The vertical scaling factor.
     * @memberof Renderer
     */
    static Scale(x: number, y: number): void {
        this.GetContext().scale(x, y);
    }

    /**
     * Resets the current transformation matrix to the identity matrix, effectively removing all transformations and returning to the default coordinate system.
     *
     * @static
     * @memberof Renderer
     */
    static ResetTransform(): void {
        this.GetContext().resetTransform();
    }

    /**
     * Applies a custom transformation matrix to the canvas context, allowing for complex transformations such as skewing or perspective effects.
     * The parameters correspond to the elements of the transformation matrix.
     *
     * @static
     * @param {number} a - Horizontal scaling.
     * @param {number} b - Horizontal skewing.
     * @param {number} c - Vertical skewing.
     * @param {number} d - Vertical scaling.
     * @param {number} e - Horizontal translation.
     * @param {number} f - Vertical translation.
     * @memberof Renderer
     */
    static SetTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.GetContext().setTransform(a, b, c, d, e, f);
    }

    /**
     * Creates a linear gradient object that can be used as a fill or stroke style.
     * The gradient is defined by two points (x0, y0) and (x1, y1), which represent the start and end points of the gradient.
     *
     * @static
     * @param {number} x0 - The x-coordinate of the start point of the gradient.
     * @param {number} y0 - The y-coordinate of the start point of the gradient.
     * @param {number} x1 - The x-coordinate of the end point of the gradient.
     * @param {number} y1 - The y-coordinate of the end point of the gradient.
     * @returns {CanvasGradient} A `CanvasGradient` object representing the linear gradient that can be used as a fill or stroke style.
     * @memberof Renderer
     */
    static CreateLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        return this.GetContext().createLinearGradient(x0, y0, x1, y1);
    }

    /**
     * Creates a radial gradient object that can be used as a fill or stroke style.
     *
     * @static
     * @param {number} x0 - The x-coordinate of the center of the start circle of the gradient.
     * @param {number} y0 - The y-coordinate of the center of the start circle of the gradient.
     * @param {number} r0 - The radius of the start circle of the gradient.
     * @param {number} x1 - The x-coordinate of the center of the end circle of the gradient.
     * @param {number} y1 - The y-coordinate of the center of the end circle of the gradient.
     * @param {number} r1 - The radius of the end circle of the gradient.
     * @returns {CanvasGradient} A `CanvasGradient` object representing the radial gradient that can be used as a fill or stroke style.
     * @memberof Renderer
     */
    static CreateRadialGradient(
        x0: number,
        y0: number,
        r0: number,
        x1: number,
        y1: number,
        r1: number,
    ): CanvasGradient {
        return this.GetContext().createRadialGradient(x0, y0, r0, x1, y1, r1);
    }

    /**
     * Creates a pattern object that can be used as a fill or stroke style by repeating an image in a specified way.
     *
     * @static
     * @param {CanvasImageSource} image - The image to use as the pattern. This can be an HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement.
     * @param {Repetition} repetition - The repetition type for the pattern, which determines how the image is repeated. This can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.
     * @returns {(CanvasPattern | null)} A `CanvasPattern` object representing the pattern that can be used as a fill or stroke style, or `null` if the pattern could not be created.
     * @memberof Renderer
     */
    static CreatePattern(image: CanvasImageSource, repetition: Repetition): CanvasPattern | null {
        return this.GetContext().createPattern(image, repetition);
    }

    /**
     * Sets the shadow properties for subsequent drawing operations, including the shadow color, blur level, and offset.
     *
     * @static
     * @param {string} color - The color of the shadow, which can be a color string, gradient, or pattern.
     * @param {number} blur - The level of blur for the shadow. A higher value will result in a more blurred shadow.
     * @param {number} [offsetX=0] - The horizontal offset of the shadow. A positive value will move the shadow to the right, while a negative value will move it to the left. Defaults to 0 (no horizontal offset).
     * @param {number} [offsetY=0] - The vertical offset of the shadow. A positive value will move the shadow down, while a negative value will move it up. Defaults to 0 (no vertical offset).
     * @memberof Renderer
     */
    static SetShadow(color: string, blur: number, offsetX: number = 0, offsetY: number = 0): void {
        this.SetShadowColor(color);
        this.SetShadowBlur(blur);
        this.SetShadowOffsetX(offsetX);
        this.SetShadowOffsetY(offsetY);
    }

    /**
     * Clears the shadow properties for subsequent drawing operations, effectively removing any shadow effects and resetting the shadow settings to their default state.
     *
     * @static
     * @memberof Renderer
     */
    static ClearShadow(): void {
        this.SetShadowColor('transparent');
        this.SetShadowBlur(0);
        this.SetShadowOffsetX(0);
        this.SetShadowOffsetY(0);
    }

    /**
     * Sets the line cap style for subsequent stroke operations, which determines how the end points of lines are drawn (e.g., 'butt', 'round', 'square').
     *
     * @static
     * @param {CanvasLineCap} lineCap - The line cap style to set for subsequent stroke operations.
     * @memberof Renderer
     */
    static SetLineCap(lineCap: CanvasLineCap): void {
        this.GetContext().lineCap = lineCap;
    }

    /**
     * Sets the line join style for subsequent stroke operations, which determines how the junctions between connected lines are drawn (e.g., 'bevel', 'round', 'miter').
     *
     * @static
     * @param {CanvasLineJoin} lineJoin - The line join style to set for subsequent stroke operations.
     * @memberof Renderer
     */
    static SetLineJoin(lineJoin: CanvasLineJoin): void {
        this.GetContext().lineJoin = lineJoin;
    }

    /**
     * Sets the line dash pattern for subsequent stroke operations, which determines the pattern of dashes and gaps used when stroking lines.
     * The `segments` array should contain numbers that specify the lengths of dashes and gaps in an alternating sequence
     * (e.g., [5, 3] would create a pattern of 5 units of dash followed by 3 units of gap).
     *
     * @static
     * @param {number[]} segments - An array of numbers specifying the lengths of dashes and gaps for the line dash pattern.
     * @memberof Renderer
     */
    static SetLineDash(segments: number[]): void {
        this.GetContext().setLineDash(segments);
    }

    /**
     * Sets the line dash offset for subsequent stroke operations, which determines the starting point of the dash pattern.
     *
     * @static
     * @param {number} offset - The offset for the line dash pattern.
     * @memberof Renderer
     */
    static SetLineDashOffset(offset: number): void {
        this.GetContext().lineDashOffset = offset;
    }

    /**
     * Measures the width of the specified text string when rendered with the current font settings, returning a `TextMetrics` object that contains information about the dimensions of the text.
     *
     * @static
     * @param {string} text - The text string to measure.
     * @returns {TextMetrics} A `TextMetrics` object containing information about the dimensions of the measured text, including properties such as `width`, `actualBoundingBoxLeft`, `actualBoundingBoxRight`, `actualBoundingBoxAscent`, and `actualBoundingBoxDescent`.
     * @memberof Renderer
     */
    static MeasureText(text: string): TextMetrics {
        return this.GetContext().measureText(text);
    }

    /**
     * Draws an image onto the canvas at the specified coordinates with the given dimensions, allowing for scaling of the image to fit the specified width and height.
     *
     * @static
     * @param {CanvasImageSource} image - The image to draw on the canvas. This can be an HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement.
     * @param {number} x - The x-coordinate of the upper-left corner where the image should be drawn on the canvas.
     * @param {number} y - The y-coordinate of the upper-left corner where the image should be drawn on the canvas.
     * @param {number} width - The width to draw the image on the canvas. The image will be scaled to fit this width.
     * @param {number} height - The height to draw the image on the canvas. The image will be scaled to fit this height.
     * @memberof Renderer
     */
    static DrawImageScaled(
        image: CanvasImageSource,
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        this.DrawImage(image, x, y, width, height);
    }

    /**
     * Draws a cropped portion of an image onto the canvas at the specified coordinates with the given dimensions, allowing for scaling of the cropped area to fit the specified width and height.
     *
     * @static
     * @param {CanvasImageSource} image - The image to draw on the canvas. This can be an HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement.
     * @param {number} sx - The x-coordinate of the top-left corner of the source rectangle.
     * @param {number} sy - The y-coordinate of the top-left corner of the source rectangle.
     * @param {number} sw - The width of the source rectangle.
     * @param {number} sh - The height of the source rectangle.
     * @param {number} dx - The x-coordinate of the top-left corner of the destination rectangle on the canvas.
     * @param {number} dy - The y-coordinate of the top-left corner of the destination rectangle on the canvas.
     * @param {number} dw - The width of the destination rectangle on the canvas.
     * @param {number} dh - The height of the destination rectangle on the canvas.
     * @memberof Renderer
     */
    static DrawImageCropped(
        image: CanvasImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
    ): void {
        this.DrawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    /**
     * Retrieves the pixel data for a specified rectangular area of the canvas, returning an `ImageData` object that contains the color and alpha information for each pixel in the area.
     *
     * @static
     * @param {number} x - The x-coordinate of the upper-left corner of the rectangle from which to retrieve pixel data.
     * @param {number} y - The y-coordinate of the upper-left corner of the rectangle from which to retrieve pixel data.
     * @param {number} width - The width of the rectangle from which to retrieve pixel data.
     * @param {number} height - The height of the rectangle from which to retrieve pixel data.
     * @returns {ImageData} The `ImageData` object containing the pixel data for the specified rectangle.
     * @memberof Renderer
     */
    static GetImageData(x: number, y: number, width: number, height: number): ImageData {
        return this.GetContext().getImageData(x, y, width, height);
    }

    /**
     * Draws pixel data from an `ImageData` object onto the canvas at the specified coordinates, allowing for direct manipulation of pixel data on the canvas.
     *
     * @static
     * @param {ImageData} imageData - The `ImageData` object containing the pixel data to be drawn onto the canvas.
     * @param {number} x - The x-coordinate of the upper-left corner where the image data should be drawn on the canvas.
     * @param {number} y - The y-coordinate of the upper-left corner where the image data should be drawn on the canvas.
     * @memberof Renderer
     */
    static PutImageData(imageData: ImageData, x: number, y: number): void {
        this.GetContext().putImageData(imageData, x, y);
    }

    /**
     * Creates a new `ImageData` object with the specified width and height, which can be used to manipulate pixel data before drawing it onto the canvas.
     *
     * @static
     * @param {number} width - The width of the new `ImageData` object in pixels.
     * @param {number} height - The height of the new `ImageData` object in pixels.
     * @returns {ImageData} The newly created `ImageData` object.
     * @memberof Renderer
     */
    static CreateImageData(width: number, height: number): ImageData {
        return this.GetContext().createImageData(width, height);
    }

    /**
     * Begins a new path by emptying the list of sub-paths.
     * Call this method when you want to create a new path.
     *
     * @static
     * @memberof Renderer
     */
    static BeginPath(): void {
        this.GetContext().beginPath();
    }

    /**
     * Closes the current path by connecting the last point of the path back to the starting point, creating a closed shape.
     *
     * @static
     * @memberof Renderer
     */
    static ClosePath(): void {
        this.GetContext().closePath();
    }

    /**
     * Moves the starting point of a new sub-path to the specified (x, y) coordinates without drawing anything.
     * This method is used to set the starting point for subsequent drawing operations, such as lines or curves.
     *
     * @static
     * @param {number} x - The x-coordinate of the new starting point for the path.
     * @param {number} y - The y-coordinate of the new starting point for the path.
     * @memberof Renderer
     */
    static MoveTo(x: number, y: number): void {
        this.GetContext().moveTo(x, y);
    }

    /**
     * Adds a straight line to the current path by connecting the last point in the path to the specified (x, y) coordinates.
     *
     * @static
     * @param {number} x - The x-coordinate of the end point of the line to be added to the path.
     * @param {number} y - The y-coordinate of the end point of the line to be added to the path.
     * @memberof Renderer
     */
    static LineTo(x: number, y: number): void {
        this.GetContext().lineTo(x, y);
    }

    /**
     * Adds an arc to the current path, defined by a center point (x, y), a radius, a start angle, and an end angle.
     * The arc can be drawn in a clockwise or counterclockwise direction based on the `counterClockwise` parameter.
     *
     * @static
     * @param {number} x - The x-coordinate of the center of the arc.
     * @param {number} y - The y-coordinate of the center of the arc.
     * @param {number} radius - The radius of the arc.
     * @param {number} startAngle - The starting angle of the arc in radians, measured from the positive x-axis.
     * @param {number} endAngle - The ending angle of the arc in radians, measured from the positive x-axis.
     * @param {boolean} [counterClockwise] - Optional parameter that specifies the direction in which to draw the arc. If `true`, the arc will be drawn counterclockwise; if `false` or not provided, the arc will be drawn clockwise.
     * @memberof Renderer
     */
    static Arc(
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        counterClockwise?: boolean,
    ): void {
        this.GetContext().arc(x, y, radius, startAngle, endAngle, counterClockwise);
    }

    /**
     * Adds an ellipse to the current path, defined by a center point (x, y), horizontal and vertical radii, a rotation angle, and start and end angles.
     *
     * @static
     * @param {number} x - The x-coordinate of the center of the ellipse.
     * @param {number} y - The y-coordinate of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {number} rotation - The rotation of the ellipse in radians, measured from the positive x-axis.
     * @param {number} startAngle - The starting angle of the ellipse in radians, measured from the positive x-axis.
     * @param {number} endAngle - The ending angle of the ellipse in radians, measured from the positive x-axis.
     * @param {boolean} [counterClockwise] - Optional parameter that specifies the direction in which to draw the ellipse. If `true`, the ellipse will be drawn counterclockwise; if `false` or not provided, the ellipse will be drawn clockwise.
     * @memberof Renderer
     */
    static Ellipse(
        x: number,
        y: number,
        radiusX: number,
        radiusY: number,
        rotation: number,
        startAngle: number,
        endAngle: number,
        counterClockwise?: boolean,
    ): void {
        this.GetContext().ellipse(
            x,
            y,
            radiusX,
            radiusY,
            rotation,
            startAngle,
            endAngle,
            counterClockwise,
        );
    }

    /**
     * Adds a filled text string to the canvas at the specified coordinates, using the current fill style and font settings.
     *
     * @static
     * @param {string} text - The text string to be drawn on the canvas.
     * @param {number} x - The x-coordinate of the point at which to begin drawing the text string on the canvas.
     * @param {number} y - The y-coordinate of the point at which to begin drawing the text string on the canvas.
     * @memberof Renderer
     */
    static FillText(text: string, x: number, y: number): void {
        this.GetContext().fillText(text, x, y);
    }

    /**
     * Sets the color of the shadow for subsequent drawing operations.
     * This property determines the color of the shadow cast by shapes and text drawn on the canvas.
     *
     * @static
     * @param {string} color - The color of the shadow.
     * @memberof Renderer
     */
    static SetShadowColor(color: string): void {
        this.GetContext().shadowColor = color;
    }

    /**
     * Sets the level of blur for shadows cast by subsequent drawing operations.
     * A higher value will result in a more blurred shadow, while a value of 0 will produce a sharp shadow.
     *
     * @static
     * @param {number} blur
     * @memberof Renderer
     */
    static SetShadowBlur(blur: number): void {
        this.GetContext().shadowBlur = blur;
    }

    /**
     * Sets the horizontal offset of the shadow for subsequent drawing operations, which determines how far the shadow is displaced horizontally from the shape or text that casts it.
     *
     * @static
     * @param {number} offsetX - The horizontal offset of the shadow. A positive value will move the shadow to the right, while a negative value will move it to the left.
     * @memberof Renderer
     */
    static SetShadowOffsetX(offsetX: number): void {
        this.GetContext().shadowOffsetX = offsetX;
    }

    /**
     * Sets the vertical offset of the shadow for subsequent drawing operations, which determines how far the shadow is displaced vertically from the shape or text that casts it.
     *
     * @static
     * @param {number} offsetY - The vertical offset of the shadow. A positive value will move the shadow down, while a negative value will move it up.
     * @memberof Renderer
     */
    static SetShadowOffsetY(offsetY: number): void {
        this.GetContext().shadowOffsetY = offsetY;
    }

    /**
     * Sets both the horizontal and vertical offsets of the shadow for subsequent drawing operations,
     * allowing you to specify the displacement of the shadow in both directions with a single method call.
     *
     * @static
     * @param {number} offsetX - The horizontal offset of the shadow. A positive value will move the shadow to the right, while a negative value will move it to the left.
     * @param {number} offsetY - The vertical offset of the shadow. A positive value will move the shadow down, while a negative value will move it up.
     * @memberof Renderer
     */
    static SetShadowOffset(offsetX: number, offsetY: number): void {
        this.SetShadowOffsetX(offsetX);
        this.SetShadowOffsetY(offsetY);
    }

    /**
     * Adds a cubic Bezier curve to the current path, defined by two control points (cp1x, cp1y) and (cp2x, cp2y) and an end point (x, y).
     *
     * @static
     * @param {number} cp1x - The x-coordinate of the first control point for the cubic Bezier curve.
     * @param {number} cp1y - The y-coordinate of the first control point for the cubic Bezier curve.
     * @param {number} cp2x - The x-coordinate of the second control point for the cubic Bezier curve.
     * @param {number} cp2y - The y-coordinate of the second control point for the cubic Bezier curve.
     * @param {number} x - The x-coordinate of the end point of the cubic Bezier curve.
     * @param {number} y - The y-coordinate of the end point of the cubic Bezier curve.
     * @memberof Renderer
     */
    static BezierCurveTo(
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        x: number,
        y: number,
    ): void {
        this.GetContext().bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    /**
     * Adds a quadratic Bezier curve to the current path, defined by a control point (cpx, cpy) and an end point (x, y).
     *
     * @static
     * @param {number} cpx - The x-coordinate of the control point for the quadratic Bezier curve.
     * @param {number} cpy - The y-coordinate of the control point for the quadratic Bezier curve.
     * @param {number} x - The x-coordinate of the end point of the quadratic Bezier curve.
     * @param {number} y - The y-coordinate of the end point of the quadratic Bezier curve.
     * @memberof Renderer
     */
    static QuadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.GetContext().quadraticCurveTo(cpx, cpy, x, y);
    }

    /**
     * Fills the current path with the current fill style, using the specified fill rule to determine how the interior of the path is calculated.
     *
     * @static
     * @param {CanvasFillRule} [fillRule] - Optional parameter that specifies the fill rule to use when filling the path. This can be 'nonzero' (the default) or 'evenodd', which determines how the interior of the path is calculated for complex shapes.
     * @memberof Renderer
     */
    static Fill(fillRule?: CanvasFillRule): void {
        this.GetContext().fill(fillRule);
    }

    /**
     * Strokes the current path with the current stroke style, outlining the path according to the current line width and other stroke properties.
     *
     * @static
     * @memberof Renderer
     */
    static Stroke(): void {
        this.GetContext().stroke();
    }

    /**
     * Clips the current path using the specified fill rule, which defines the area that will be affected by subsequent drawing operations.
     * After calling this method, only the area within the clipped path will be drawn on the canvas.
     *
     * @static
     * @param {CanvasFillRule} [fillRule]
     * @memberof Renderer
     */
    static Clip(fillRule?: CanvasFillRule): void {
        this.GetContext().clip(fillRule);
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
            throw new NotInitializedError(
                'Renderer has not been initialized. Please call Renderer.Initialize() with a valid canvas context before using the Renderer.',
            );
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
        const right = x + width;
        const bottom = y + height;

        this.BeginPath();
        this.MoveTo(x + radius, y);
        this.LineTo(right - radius, y);
        this.QuadraticCurveTo(right, y, right, y + radius);
        this.LineTo(right, bottom - radius);
        this.QuadraticCurveTo(right, bottom, right - radius, bottom);
        this.LineTo(x + radius, bottom);
        this.QuadraticCurveTo(x, bottom, x, bottom - radius);
        this.LineTo(x, y + radius);
        this.QuadraticCurveTo(x, y, x + radius, y);
        this.ClosePath();
    }
}
