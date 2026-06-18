import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

import { ThemeService } from '../../services/theme/theme.service';

export type ToolbarCommand = 'save' | 'load' | 'delete' | 'restart' | 'toggle-theme';

@Component({
    selector: 'app-toolbar',
    imports: [ToolbarModule, ButtonModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
    private themeService: ThemeService = inject(ThemeService);

    readonly command = output<ToolbarCommand>();

    readonly actionButtons = [
        { label: 'Save', icon: 'pi pi-save', command: 'save' },
        { label: 'Load', icon: 'pi pi-upload', command: 'load' },
        { label: 'Delete', icon: 'pi pi-trash', command: 'delete' },
        { label: 'Restart', icon: 'pi pi-refresh', command: 'restart' },
    ] as const;

    readonly themeModeIcon = computed(() => this.themeService.GetThemeModeIcon());

    EmitCommand(command: ToolbarCommand): void {
        if (command === 'toggle-theme') {
            this.themeService.ToggleDarkMode();
        }

        this.command.emit(command);
    }
}
