import { inject, Injectable } from '@angular/core';

import {
    Coloring,
    FluidSimulationApp,
    Interaction,
    PerformanceSettings,
    Physics,
    Simulation,
} from '../../classes/fluid-simulation/fluid-simulation.app';
import { SessionKeys, SessionService } from '../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class SimulationPersistenceService {
    private readonly sessionService: SessionService = inject(SessionService);

    private MergePhysics(target: Physics, source: Physics): void {
        const { gravity, ...restPhysics } = source;

        Object.assign(target, restPhysics);

        if (gravity) {
            Object.assign(target.gravity, gravity);
        }
    }

    private MergeColoring(target: Coloring, source: Coloring): void {
        const { slowColor, fastColor, backgroundColor, ...restColoring } = source;

        Object.assign(target, restColoring);

        if (slowColor) {
            Object.assign(target.slowColor, slowColor);
        }

        if (fastColor) {
            Object.assign(target.fastColor, fastColor);
        }

        if (backgroundColor) {
            Object.assign(target.backgroundColor, backgroundColor);
        }
    }

    Save(app: FluidSimulationApp): void {
        this.sessionService.SetJSON(SessionKeys.PhysicsData, app.physics);
        this.sessionService.SetJSON(SessionKeys.SimulationData, app.simulation);
        this.sessionService.SetJSON(SessionKeys.InteractionData, app.interaction);
        this.sessionService.SetJSON(SessionKeys.ColoringData, app.coloring);
        this.sessionService.SetJSON(SessionKeys.PerformanceData, app.performance);
    }

    Load(app: FluidSimulationApp): boolean {
        const physics = this.sessionService.GetJSON<Physics>(SessionKeys.PhysicsData);
        const simulation = this.sessionService.GetJSON<Simulation>(SessionKeys.SimulationData);
        const interaction = this.sessionService.GetJSON<Interaction>(SessionKeys.InteractionData);
        const coloring = this.sessionService.GetJSON<Coloring>(SessionKeys.ColoringData);
        const performance = this.sessionService.GetJSON<PerformanceSettings>(SessionKeys.PerformanceData);

        if (physics) {
            this.MergePhysics(app.physics, physics);
        }

        if (simulation) {
            Object.assign(app.simulation, simulation);
        }

        if (interaction) {
            Object.assign(app.interaction, interaction);
        }

        if (coloring) {
            this.MergeColoring(app.coloring, coloring);
        }

        if (performance) {
            Object.assign(app.performance, performance);
        }

        return Boolean(physics || simulation || interaction || coloring || performance);
    }

    Clear(): void {
        this.sessionService.Remove(SessionKeys.PhysicsData);
        this.sessionService.Remove(SessionKeys.SimulationData);
        this.sessionService.Remove(SessionKeys.InteractionData);
        this.sessionService.Remove(SessionKeys.ColoringData);
        this.sessionService.Remove(SessionKeys.PerformanceData);
    }

    Export(app: FluidSimulationApp): void {
        const exportData = {
            physics: app.physics,
            simulation: app.simulation,
            interaction: app.interaction,
            coloring: app.coloring,
            performance: app.performance,
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'fluid-simulation-settings.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    Import(file: File, app: FluidSimulationApp): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const importData = JSON.parse(reader.result as string);
                    const { physics, simulation, interaction, coloring, performance } = importData;

                    this.sessionService.SetJSON<Physics>(SessionKeys.PhysicsData, physics);
                    this.sessionService.SetJSON<Simulation>(SessionKeys.SimulationData, simulation);
                    this.sessionService.SetJSON<Interaction>(SessionKeys.InteractionData, interaction);
                    this.sessionService.SetJSON<Coloring>(SessionKeys.ColoringData, coloring);
                    this.sessionService.SetJSON<PerformanceSettings>(SessionKeys.PerformanceData, performance);

                    this.Load(app);

                    resolve();
                } catch (error) {
                    reject(new Error('Invalid file format'));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}
