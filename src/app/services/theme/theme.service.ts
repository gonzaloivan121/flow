// Angular Modules
import { inject, Injectable } from '@angular/core';

// App Config
import { darkModeClass } from '../../app.config';

// Services
import { SessionKeys, SessionService } from '../session/session.service';

/**
 * Theme modes available in the application.
 *
 * @export
 * @enum {number}
 */
export enum ThemeMode {
    Light,
    Dark
}

/**
 * Service to manage theme operations.
 *
 * @export
 * @class ThemeService
 */
@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    /**
     * Service to manage session storage.
     *
     * @private
     * @type {SessionService}
     * @memberof ThemeService
     */
    private sessionService: SessionService = inject(SessionService);

    /**
     * Icon representing light mode.
     *
     * @readonly
     * @type {string}
     * @memberof ThemeService
     */
    public readonly lightModeIcon: string = 'pi pi-sun';

    /**
     * Icon representing dark mode.
     *
     * @readonly
     * @type {string}
     * @memberof ThemeService
     */
    public readonly darkModeIcon: string = 'pi pi-moon';

    /**
     * Holds the current theme mode of the application.
     *
     * @private
     * @type {ThemeMode}
     * @memberof ThemeService
     */
    private themeMode: ThemeMode = ThemeMode.Light;

    /**
     * Retrieves the current theme mode of the application.
     *
     * @returns {ThemeMode} The current theme mode.
     * @memberof ThemeService
     */
    public GetThemeMode(): ThemeMode {
        return this.themeMode;
    }

    /**
     * Retrieves the icon representing the current theme mode.
     *
     * @returns {string} The icon representing the current theme mode.
     * @memberof ThemeService
     */
    public GetThemeModeIcon(): string {
        return this.themeMode === ThemeMode.Light ? this.darkModeIcon : this.lightModeIcon;
    }

    /**
     * Toggles the application's theme between light and dark modes.
     *
     * @memberof ThemeService
     */
    public ToggleDarkMode(): void {
        // Toggle the dark mode class on the HTML element.
        const element = document.querySelector('html');
        element?.classList.toggle(darkModeClass);
        this.themeMode = this.themeMode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;

        // Store the current theme mode in session storage.
        this.sessionService.Set(SessionKeys.ThemeMode, ThemeMode[this.themeMode]);
    }

    /**
     * Sets the application's theme to the specified mode.
     *
     * @param {ThemeMode} mode - The theme mode to set.
     * @memberof ThemeService
     */
    public SetThemeMode(mode: ThemeMode): void {
        // Update the HTML element's class based on the specified mode.
        const element = document.querySelector('html');

        // Apply or remove the dark mode class.
        if (mode === ThemeMode.Dark) {
            element?.classList.add(darkModeClass);
        } else {
            element?.classList.remove(darkModeClass);
        }

        // Update the current theme mode.
        this.themeMode = mode;
    }
}
