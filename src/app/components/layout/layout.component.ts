import { ChangeDetectionStrategy, Component, inject, OnInit, viewChild } from '@angular/core';

import { ToolbarComponent } from '../toolbar/toolbar.component';
import { ToolbarCommand } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ViewportComponent } from '../viewport/viewport.component';

import { SplitterModule } from 'primeng/splitter';
import { FluidSimulationApp } from '../../classes/fluid-simulation/fluid-simulation.app';
import { SimulationPersistenceService } from '../../services/simulation-persistence/simulation-persistence.service';

@Component({
    selector: 'app-layout',
    imports: [ToolbarComponent, SidebarComponent, ViewportComponent, SplitterModule],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
    private simulationPersistence = inject(SimulationPersistenceService);
    
    readonly app = new FluidSimulationApp();
    readonly viewport = viewChild(ViewportComponent);

    ngOnInit(): void {
        this.Load();
    }

    HandleCommand(command: ToolbarCommand): void {
        switch (command) {
            case 'save':    this.Save();    return;
            case 'load':    this.Load();    return;
            case 'delete':  this.Delete();  return;
            case 'restart': this.Restart(); return;
            case 'export':  this.Export();  return;
        }
    }

    private Save(): void {
        this.simulationPersistence.Save(this.app);
    }

    private Load(): void {
        this.simulationPersistence.Load(this.app);
    }

    private Delete(): void {
        this.simulationPersistence.Clear();
        this.Reset();
    }

    private Restart(): void {
        this.viewport()?.RestartSimulation();
    }

    private Export(): void {
        this.simulationPersistence.Export(this.app);
    }

    Import(file: File): void {
        this.simulationPersistence.Import(file, this.app);
    }

    private Reset(): void {
        this.app.ResetSettings();
    }
}
