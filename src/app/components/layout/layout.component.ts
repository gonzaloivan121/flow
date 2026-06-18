import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';

import { ToolbarComponent } from '../toolbar/toolbar.component';
import { ToolbarCommand } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ViewportComponent } from '../viewport/viewport.component';

import { SplitterModule } from 'primeng/splitter';
import { FluidSimulationApp } from '../../classes/fluid-simulation.app';
import { SimulationPersistenceService } from '../../services/simulation-persistence/simulation-persistence.service';

@Component({
    selector: 'app-layout',
    imports: [ToolbarComponent, SidebarComponent, ViewportComponent, SplitterModule],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
    private simulationPersistence = inject(SimulationPersistenceService);

    readonly app = new FluidSimulationApp();
    readonly viewport = viewChild(ViewportComponent);

    HandleCommand(command: ToolbarCommand): void {
        switch (command) {
            case 'save':    this.Save();    return;
            case 'load':    this.Load();    return;
            case 'delete':  this.Delete();  return;
            case 'restart': this.Restart(); return;
        }
    }

    private Save(): void {
        this.simulationPersistence.Save(this.app);
    }

    private Load(): void {
        const hasLoadedState = this.simulationPersistence.Load(this.app);

        if (hasLoadedState) {
            this.viewport()?.RestartSimulation();
        }
    }

    private Delete(): void {
        this.simulationPersistence.Clear();
    }

    private Restart(): void {
        this.viewport()?.RestartSimulation();
    }
}
