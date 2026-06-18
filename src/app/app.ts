import { Component, inject, OnInit } from '@angular/core';

import { LayoutComponent } from './components/layout/layout.component';

import { ThemeMode, ThemeService } from './services/theme/theme.service';
import { SessionKeys, SessionService } from './services/session/session.service';

@Component({
    selector: 'app-root',
    imports: [LayoutComponent],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App implements OnInit {
    private themeService: ThemeService = inject(ThemeService);
    private sessionService: SessionService = inject(SessionService);

    ngOnInit(): void {
        const savedThemeMode = this.sessionService.Get(SessionKeys.ThemeMode) as keyof typeof ThemeMode;

        if (savedThemeMode) {
            this.themeService.SetThemeMode(ThemeMode[savedThemeMode]);
        }
    }
}
