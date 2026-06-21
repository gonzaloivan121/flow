import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

import { routes } from './app.routes';

export const darkModeClass = 'p-dark';
export const darkModeSelector = `.${darkModeClass}`;

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes, withComponentInputBinding()),
        providePrimeNG({
            theme: {
                preset: Lara,
                options: {
                    ripple: true,
                    darkModeSelector: darkModeSelector,
                },
            },
        }),
    ],
};
