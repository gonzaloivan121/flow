import { inject, Injectable } from '@angular/core';

import {
    FluidSimulationApp,
    Interaction,
    Physics,
    Simulation,
} from '../../classes/fluid-simulation.app';
import { SessionKeys, SessionService } from '../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class SimulationPersistenceService {
    private readonly sessionService: SessionService = inject(SessionService);

    Save(app: FluidSimulationApp): void {
        this.sessionService.SetJSON(SessionKeys.PhysicsData, app.physics);
        this.sessionService.SetJSON(SessionKeys.SimulationData, app.simulation);
        this.sessionService.SetJSON(SessionKeys.InteractionData, app.interaction);
    }

    Load(app: FluidSimulationApp): boolean {
        const physics = this.sessionService.GetJSON<Physics>(SessionKeys.PhysicsData);
        const simulation = this.sessionService.GetJSON<Simulation>(SessionKeys.SimulationData);
        const interaction = this.sessionService.GetJSON<Interaction>(SessionKeys.InteractionData);

        if (physics) {
            app.physics = {
                ...app.physics,
                ...physics,
            };
        }

        if (simulation) {
            app.simulation = {
                ...app.simulation,
                ...simulation,
            };
        }

        if (interaction) {
            app.interaction = {
                ...app.interaction,
                ...interaction,
            };
        }

        return Boolean(physics || simulation || interaction);
    }

    Clear(): void {
        this.sessionService.Remove(SessionKeys.PhysicsData);
        this.sessionService.Remove(SessionKeys.SimulationData);
        this.sessionService.Remove(SessionKeys.InteractionData);
    }
}
