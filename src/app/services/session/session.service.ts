// Angular Modules
import { Injectable } from '@angular/core';

/**
 * Enum for predefined session storage keys.
 *
 * @export
 * @enum {number}
 */
export enum SessionKeys {
    /**
     * Key for storing the theme mode preference.
     *
     * @type {string}
     */
    ThemeMode = 'theme-mode',

    /**
     * Key for storing the currently logged in user.
     *
     * @type {string}
     */
    User = 'user',

    /**
     * Key for storing the current physics data.
     *
     * @type {string}
     */
    PhysicsData = 'physics-data',

    /**
     * Key for storing the current simulation data.
     *
     * @type {string}
     */
    SimulationData = 'simulation-data',

    /**
     * Key for storing the current interaction data.
     *
     * @type {string}
     */
    InteractionData = 'interaction-data',

    /**
     * Key for storing the current coloring data.
     *
     * @type {string}
     */
    ColoringData = 'coloring-data',

    /**
     * Key for storing current performance settings.
     *
     * @type {string}
     */
    PerformanceData = 'performance-data',
}

/**
 * Service to manage session storage operations.
 *
 * @export
 * @class SessionService
 */
@Injectable({
    providedIn: 'root',
})
export class SessionService {
    /**
     * The session storage instance.
     *
     * @private
     * @type {Storage}
     * @memberof SessionService
     */
    private sessionStorage: Storage = window.sessionStorage;

    /**
     * Sets a key-value pair in session storage.
     *
     * @param {string} key The key to set.
     * @param {string} value The value to set.
     * @memberof SessionService
     */
    public Set(key: string, value: string): void {
        this.sessionStorage.setItem(key, value);
    }

    /**
     * Gets a value from session storage by key.
     *
     * @param {string} key The key to get.
     * @returns {(string | null)} The value associated with the key, or null if not found.
     * @memberof SessionService
     */
    public Get(key: string): string | null {
        return this.sessionStorage.getItem(key);
    }

    /**
     * Removes a key-value pair from session storage by key.
     *
     * @param {string} key The key to remove.
     * @memberof SessionService
     */
    public Remove(key: string): void {
        this.sessionStorage.removeItem(key);
    }

    /**
     * Clears all key-value pairs from session storage.
     *
     * @memberof SessionService
     */
    public Clear(): void {
        this.sessionStorage.clear();
    }

    /**
     * Checks if a key exists in session storage.
     *
     * @param {string} key The key to check.
     * @returns {boolean} `true` if the key exists, `false` otherwise.
     * @memberof SessionService
     */
    public Has(key: string): boolean {
        return this.Get(key) !== null;
    }

    /**
     * Gets all keys in session storage.
     *
     * @returns {string[]} An array of all keys in session storage.
     * @memberof SessionService
     */
    public Keys(): string[] {
        const keys: string[] = [];

        for (let i = 0; i < this.sessionStorage.length; i++) {
            const key = this.sessionStorage.key(i);

            if (key) {
                keys.push(key);
            }
        }

        return keys;
    }

    /**
     * Gets the number of key-value pairs in session storage.
     *
     * @returns {number} The number of key-value pairs in session storage.
     * @memberof SessionService
     */
    public Size(): number {
        return this.sessionStorage.length;
    }

    /**
     * Checks if session storage is empty.
     *
     * @returns {boolean} `true` if session storage is empty, `false` otherwise.
     * @memberof SessionService
     */
    public IsEmpty(): boolean {
        return this.Size() === 0;
    }

    /**
     * Gets all key-value pairs in session storage.
     *
     * @returns {[key: string]: string} An object containing all key-value pairs in session storage.
     * @memberof SessionService
     */
    public GetAll(): { [key: string]: string } {
        const allItems: { [key: string]: string } = {};

        this.Keys().forEach((key) => {
            const value = this.Get(key);

            if (value !== null) {
                allItems[key] = value;
            }
        });

        return allItems;
    }

    /**
     * Replaces all key-value pairs in session storage with the provided items.
     *
     * @param {{ [key: string]: string }} items The items to set.
     * @memberof SessionService
     */
    public ReplaceAll(items: { [key: string]: string }): void {
        this.Clear();

        Object.keys(items).forEach((key) => {
            this.Set(key, items[key]);
        });
    }

    /**
     * Prints all key-value pairs in session storage to the console.
     *
     * @memberof SessionService
     */
    public PrintContents(): void {
        console.log('Session Storage Contents:');
        console.table(this.GetAll());
    }

    /**
     * Exports all key-value pairs in session storage as a JSON string.
     *
     * @returns {string} A JSON string representing all key-value pairs in session storage.
     * @memberof SessionService
     */
    public ExportContents(): string {
        return JSON.stringify(this.GetAll());
    }

    /**
     * Imports key-value pairs from a JSON string and replaces the current session storage contents.
     *
     * @template T The type of the values in the JSON object.
     * @param {string} key The key under which to store the JSON string in session storage.
     * @param {T} value The value to convert to JSON and store.
     * @memberof SessionService
     */
    public SetJSON<T>(key: string, value: T): void {
        this.Set(key, JSON.stringify(value));
    }

    /**
     * Retrieves a value from session storage by key and parses it as JSON.
     *
     * @template T The expected type of the parsed JSON value.
     * @param {string} key The key to get.
     * @returns {(T | null)} The parsed JSON value, or `null` if parsing fails or the key does not exist.
     * @memberof SessionService
     */
    public GetJSON<T>(key: string): T | null {
        const value = this.Get(key);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }
}
