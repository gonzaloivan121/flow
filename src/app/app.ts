import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { LayoutComponent } from './components/layout/layout.component';

import { ThemeMode, ThemeService } from './services/theme/theme.service';
import { SessionKeys, SessionService } from './services/session/session.service';

@Component({
    selector: 'app-root',
    imports: [LayoutComponent],
    templateUrl: './app.html',
    styleUrls: ['./app.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
    private themeService: ThemeService = inject(ThemeService);
    private sessionService: SessionService = inject(SessionService);

    ngOnInit(): void {
        this.ApplyDarkMode();
        this.ApplySavedThemeMode();
    }

    private ApplyDarkMode(): void {
        this.themeService.SetThemeMode(ThemeMode.Dark);
    }

    private ApplySavedThemeMode(): void {
        if (!this.sessionService.Has(SessionKeys.ThemeMode)) {
            return;
        }

        const savedThemeModeStr = this.sessionService.Get(SessionKeys.ThemeMode);

        
        if (!savedThemeModeStr) {
            return;
        }
        
        const savedThemeMode = savedThemeModeStr as keyof typeof ThemeMode;
        this.themeService.SetThemeMode(ThemeMode[savedThemeMode]);
    }
}
