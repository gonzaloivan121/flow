import { computed, inject, Injectable, signal } from '@angular/core';

import { darkModeClass } from '../../app.config';
import { SessionKeys, SessionService } from '../session/session.service';

/**
 * Theme modes available in the application.
 *
 * @export
 * @enum {number}
 */
export enum ThemeMode {
    Light = 'Light',
    Dark = 'Dark',
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
    private readonly sessionService: SessionService = inject(SessionService);

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
     * @memberof ThemeService
     */
    private readonly themeMode = signal<ThemeMode>(ThemeMode.Light);

    readonly themeModeIcon = computed(() =>
        this.themeMode() === ThemeMode.Light ? this.darkModeIcon : this.lightModeIcon,
    );

    /**
     * Retrieves the current theme mode of the application.
     *
     * @returns {ThemeMode} The current theme mode.
     * @memberof ThemeService
     */
    public GetThemeMode(): ThemeMode {
        return this.themeMode();
    }

    /**
     * Retrieves the icon representing the current theme mode.
     *
     * @returns {string} The icon representing the current theme mode.
     * @memberof ThemeService
     */
    public GetThemeModeIcon(): string {
        return this.themeModeIcon();
    }

    /**
     * Toggles the application's theme between light and dark modes.
     *
     * @memberof ThemeService
     */
    public ToggleDarkMode(): void {
        const nextMode = this.themeMode() === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
        this.SetThemeMode(nextMode);
        this.sessionService.Set(SessionKeys.ThemeMode, ThemeMode[nextMode]);
    }

    /**
     * Sets the application's theme to the specified mode.
     *
     * @param {ThemeMode} mode - The theme mode to set.
     * @memberof ThemeService
     */
    public SetThemeMode(mode: ThemeMode): void {
        // Update the HTML element's class based on the specified mode.
        const element = document.documentElement;

        // Apply or remove the dark mode class.
        if (mode === ThemeMode.Dark) {
            element?.classList.add(darkModeClass);
        } else {
            element?.classList.remove(darkModeClass);
        }

        // Update the current theme mode.
        this.themeMode.set(mode);
    }
}
