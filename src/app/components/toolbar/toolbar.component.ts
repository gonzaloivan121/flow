import { Component, inject, output } from '@angular/core';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

import { ThemeService } from '../../services/theme/theme.service';

@Component({
    selector: 'app-toolbar',
    imports: [ToolbarModule, ButtonModule],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.css',
})
export class ToolbarComponent {
    private themeService: ThemeService = inject(ThemeService);

    onSave = output<void>();
    onLoad = output<void>();
    onDelete = output<void>();
    onRestart = output<void>();

    Save(): void {
        this.onSave.emit();
    }

    Load(): void {
        this.onLoad.emit();
    }

    Delete(): void {
        this.onDelete.emit();
    }

    Restart(): void {
        this.onRestart.emit();
    }

    ToggleDarkMode(): void {
        this.themeService.ToggleDarkMode();
    }

    GetThemeModeIcon(): string {
        return this.themeService.GetThemeModeIcon();
    }
}
