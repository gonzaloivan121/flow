import { Component, computed, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccordionModule } from 'primeng/accordion';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';

import { FluidSimulationApp, Interaction, Physics, Simulation } from '../../classes/fluid-simulation.app';
import { Vector2 } from '@xloxlolex/vector-math';

interface Row {
    name: string;
    description: string;
    obj: any;
    key: string;
    min: number;
    max: number;
    step: number;
}

@Component({
    selector: 'app-sidebar',
    imports: [FormsModule, AccordionModule, SliderModule, InputNumberModule, TooltipModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
    app = input.required<FluidSimulationApp>();

    constructor() {
        effect(() => {});
    }

    physicsRows = computed<Row[]>(() => [
        {
            name: 'Gravity X',
            description:
                'Controls sideways wind/tilt. Going beyond 20 usually just pins the fluid against the wall unnaturally.',
            obj: this.app().physics.gravity,
            key: 'x',
            min: -20,
            max: 20,
            step: 0.1,
        },
        {
            name: 'Gravity Y',
            description: '9.81 mimics Earth. Negative values invert gravity (fluid falls up).',
            obj: this.app().physics.gravity,
            key: 'y',
            min: -20,
            max: 20,
            step: 0.1,
        },
        {
            name: 'Gravity Multiplier',
            description:
                'Scales gravity to screen coordinates. 0 creates a zero-gravity space simulation.',
            obj: this.app().physics,
            key: 'gravityMultiplier',
            min: 0,
            max: 500,
            step: 1,
        },
        {
            name: 'Smoothing Radius',
            description:
                'The "interaction zone" for particles. < 10: Particles don\'t "see" each other and act like dry sand. > 100: Destroys performance (too many neighbor checks) and makes the fluid look like mush.',
            obj: this.app().physics,
            key: 'smoothingRadius',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Target Density',
            description:
                "The fluid's resting state. If particles compress closer than this, they repel. Too high, and the fluid expands violently; too low, and it collapses into a dense puddle.",
            obj: this.app().physics,
            key: 'targetDensity',
            min: 0.001,
            max: 0.02,
            step: 0.001,
        },
        {
            name: 'Pressure Stiffness',
            description:
                'How violently the fluid resists compression. Lower values (1000) act like a squishy, compressible gas. Higher values act like water, but going past 50000 often causes the simulation to jitter and explode unless your timestep is microscopic.',
            obj: this.app().physics,
            key: 'pressureStiffness',
            min: 1000,
            max: 50000,
            step: 100,
        },
        {
            name: 'Viscosity',
            description:
                'Friction between moving particles. 0 is a frictionless superfluid. 0.89 is roughly water. 2.0+ starts looking like thick motor oil or honey.',
            obj: this.app().physics,
            key: 'viscosity',
            min: 0,
            max: 5,
            step: 0.01,
        },
        {
            name: 'Wall Bounce',
            description:
                'Energy lost hitting a wall. -1.0 is perfectly elastic; 0.0 is a dead stop.',
            obj: this.app().physics,
            key: 'wallBounce',
            min: -1.0,
            max: 0.0,
            step: 0.01,
        },
        {
            name: 'Wall Friction',
            description: 'Drag applied sliding along walls. 1.0 means no friction.',
            obj: this.app().physics,
            key: 'wallFriction',
            min: 0.0,
            max: 1.0,
            step: 0.01,
        },
        {
            name: 'Global Damping',
            description: 'Constant velocity loss to help the fluid settle to a resting state.',
            obj: this.app().physics,
            key: 'globalDamping',
            min: 0.8,
            max: 1.0,
            step: 0.01,
        },
    ]);

    simulationRows = computed<Row[]>(() => [
        {
            name: 'Particle Columns',
            description: 'Grid width for particle spawning.',
            obj: this.app().simulation,
            key: 'particleColumns',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Particle Rows',
            description: 'Grid height for particle spawning.',
            obj: this.app().simulation,
            key: 'particleRows',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Initial Spacing',
            description: 'Distance between particles at spawn.',
            obj: this.app().simulation,
            key: 'initialSpacing',
            min: 2,
            max: 20,
            step: 1,
        },
        {
            name: 'Particle Mass',
            description: 'Weight multiplier used in pressure/density gradients.',
            obj: this.app().simulation,
            key: 'particleMass',
            min: 0.1,
            max: 5,
            step: 0.1,
        },
        {
            name: 'Particle Radius',
            description: 'The visual rendering size and wall collision boundary.',
            obj: this.app().simulation,
            key: 'particleRadius',
            min: 1,
            max: 10,
            step: 0.5,
        },
        {
            name: 'Max Timestep',
            description:
                'The delta time cap preventing particles from teleporting through walls during lag spikes.',
            obj: this.app().simulation,
            key: 'maxTimestep',
            min: 0.01,
            max: 0.1,
            step: 0.01,
        },
    ]);

    interactionRows = computed<Row[]>(() => [
        {
            name: 'Mouse Radius',
            description: 'How close the mouse needs to be to a particle to push it.',
            obj: this.app().interaction,
            key: 'mouseRadius',
            min: 10,
            max: 500,
            step: 1,
        },
        {
            name: 'Mouse Force',
            description: 'The multiplier for the velocity injected into the fluid by the mouse.',
            obj: this.app().interaction,
            key: 'mouseForce',
            min: 100,
            max: 5000,
            step: 100,
        },
        {
            name: 'Color Intensity',
            description:
                'Scales how rapidly a fast-moving particle shifts from deep blue to bright cyan/white.',
            obj: this.app().interaction,
            key: 'colorIntensity',
            min: 1,
            max: 50,
            step: 1,
        },
    ]);
}
