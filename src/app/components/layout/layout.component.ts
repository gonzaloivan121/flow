import { Component, inject, viewChild } from '@angular/core';

import { ToolbarComponent } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ViewportComponent } from '../viewport/viewport.component';

import { SplitterModule } from 'primeng/splitter';
import { FluidSimulationApp, Interaction, Particle, Physics, Simulation } from '../../classes/fluid-simulation.app';
import { SessionKeys, SessionService } from '../../services/session/session.service';

@Component({
    selector: 'app-layout',
    imports: [ToolbarComponent, SidebarComponent, ViewportComponent, SplitterModule],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css',
})
export class LayoutComponent {
    private sessionService: SessionService = inject(SessionService);

    app = new FluidSimulationApp();
    viewport = viewChild(ViewportComponent);

    Save(): void {
        this.sessionService.Set(SessionKeys.PhysicsData, JSON.stringify(this.app.physics));
        this.sessionService.Set(SessionKeys.SimulationData, JSON.stringify(this.app.simulation));
        this.sessionService.Set(SessionKeys.InteractionData, JSON.stringify(this.app.interaction));
    }

    Load(): void {
        const physics = this.sessionService.Get(SessionKeys.PhysicsData);
        const simulation = this.sessionService.Get(SessionKeys.SimulationData);
        const interaction = this.sessionService.Get(SessionKeys.InteractionData);

        if (physics) {
            this.app.physics = JSON.parse(physics) as Physics;
        }

        if (simulation) {
            this.app.simulation = JSON.parse(simulation) as Simulation;
        }

        if (interaction) {
            this.app.interaction = JSON.parse(interaction) as Interaction;
        }
    }

    Delete(): void {
        this.sessionService.Remove(SessionKeys.PhysicsData);
        this.sessionService.Remove(SessionKeys.SimulationData);
        this.sessionService.Remove(SessionKeys.InteractionData);
    }

    Restart(): void {
        this.viewport()?.RestartSimulation();
    }
}
