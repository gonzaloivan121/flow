import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';

import { ThemeService } from '../../services/theme/theme.service';

export type ToolbarCommand = 'save' | 'load' | 'delete' | 'restart' | 'export' | 'toggle-theme';

@Component({
    selector: 'app-toolbar',
    imports: [ToolbarModule, ButtonModule, FileUploadModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
    private themeService: ThemeService = inject(ThemeService);

    readonly command = output<ToolbarCommand>();
    readonly onUpload = output<File>();

    readonly actionButtons = [
        { label: 'Save', icon: 'pi pi-save', command: 'save' },
        { label: 'Load', icon: 'pi pi-upload', command: 'load' },
        { label: 'Delete', icon: 'pi pi-trash', command: 'delete' },
        { label: 'Restart', icon: 'pi pi-refresh', command: 'restart' },
        { label: 'Export', icon: 'pi pi-file-export', command: 'export' },
    ] as const;

    readonly themeModeIcon = computed(() => this.themeService.GetThemeModeIcon());

    HandleImportUpload(event: { files: File[] }): void {
        const file = event.files?.[0];

        if (!file) {
            return;
        }

        this.onUpload.emit(file);
    }

    EmitCommand(command: ToolbarCommand): void {
        if (command === 'toggle-theme') {
            this.themeService.ToggleDarkMode();
        }

        this.command.emit(command);
    }
}
