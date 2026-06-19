import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccordionModule } from 'primeng/accordion';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ColorPickerModule } from 'primeng/colorpicker';

import { FluidSimulationApp, RgbColor } from '../../classes/fluid-simulation.app';

interface Row {
    name: string;
    description: string;
    obj: Record<string, number>;
    key: string;
    id: string;
    min: number;
    max: number;
    step: number;
}

interface ColorRow {
    name: string;
    description: string;
    obj: Record<string, RgbColor>;
    key: string;
}

@Component({
    selector: 'app-sidebar',
    imports: [FormsModule, AccordionModule, SliderModule, InputNumberModule, TooltipModule, ColorPickerModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
    readonly app = input.required<FluidSimulationApp>();

    physicsRows = computed<Row[]>(() => [
        {
            name: 'Gravity X',
            description:
                'Controls sideways wind/tilt. Going beyond 20 usually just pins the fluid against the wall unnaturally.',
            obj: this.app().physics.gravity as unknown as Record<string, number>,
            key: 'x',
            id: 'physics-gravity-x',
            min: -20,
            max: 20,
            step: 0.1,
        },
        {
            name: 'Gravity Y',
            description: '9.81 mimics Earth. Negative values invert gravity (fluid falls up).',
            obj: this.app().physics.gravity as unknown as Record<string, number>,
            key: 'y',
            id: 'physics-gravity-y',
            min: -20,
            max: 20,
            step: 0.1,
        },
        {
            name: 'Gravity Multiplier',
            description:
                'Scales gravity to screen coordinates. 0 creates a zero-gravity space simulation.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'gravityMultiplier',
            id: 'physics-gravity-multiplier',
            min: 0,
            max: 500,
            step: 1,
        },
        {
            name: 'Smoothing Radius',
            description:
                'The "interaction zone" for particles. < 10: Particles don\'t "see" each other and act like dry sand. > 100: Destroys performance (too many neighbor checks) and makes the fluid look like mush.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'smoothingRadius',
            id: 'physics-smoothing-radius',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Target Density',
            description:
                "The fluid's resting state. If particles compress closer than this, they repel. Too high, and the fluid expands violently; too low, and it collapses into a dense puddle.",
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'targetDensity',
            id: 'physics-target-density',
            min: 0.001,
            max: 0.02,
            step: 0.001,
        },
        {
            name: 'Pressure Stiffness',
            description:
                'How violently the fluid resists compression. Lower values (1000) act like a squishy, compressible gas. Higher values act like water, but going past 50000 often causes the simulation to jitter and explode unless your timestep is microscopic.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'pressureStiffness',
            id: 'physics-pressure-stiffness',
            min: 1000,
            max: 50000,
            step: 100,
        },
        {
            name: 'Viscosity',
            description:
                'Friction between moving particles. 0 is a frictionless superfluid. 0.89 is roughly water. 2.0+ starts looking like thick motor oil or honey.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'viscosity',
            id: 'physics-viscosity',
            min: 0,
            max: 5,
            step: 0.01,
        },
        {
            name: 'Wall Bounce',
            description:
                'Energy lost hitting a wall. -1.0 is perfectly elastic; 0.0 is a dead stop.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'wallBounce',
            id: 'physics-wall-bounce',
            min: -1.0,
            max: 0.0,
            step: 0.01,
        },
        {
            name: 'Wall Friction',
            description: 'Drag applied sliding along walls. 1.0 means no friction.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'wallFriction',
            id: 'physics-wall-friction',
            min: 0.0,
            max: 1.0,
            step: 0.01,
        },
        {
            name: 'Global Damping',
            description: 'Constant velocity loss to help the fluid settle to a resting state.',
            obj: this.app().physics as unknown as Record<string, number>,
            key: 'globalDamping',
            id: 'physics-global-damping',
            min: 0.8,
            max: 1.0,
            step: 0.01,
        },
    ]);

    simulationRows = computed<Row[]>(() => [
        {
            name: 'Particle Columns',
            description: 'Grid width for particle spawning.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'particleColumns',
            id: 'simulation-particle-columns',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Particle Rows',
            description: 'Grid height for particle spawning.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'particleRows',
            id: 'simulation-particle-rows',
            min: 10,
            max: 100,
            step: 1,
        },
        {
            name: 'Initial Spacing',
            description: 'Distance between particles at spawn.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'initialSpacing',
            id: 'simulation-initial-spacing',
            min: 2,
            max: 20,
            step: 1,
        },
        {
            name: 'Particle Mass',
            description: 'Weight multiplier used in pressure/density gradients.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'particleMass',
            id: 'simulation-particle-mass',
            min: 0.1,
            max: 5,
            step: 0.1,
        },
        {
            name: 'Particle Radius',
            description: 'The visual rendering size and wall collision boundary.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'particleRadius',
            id: 'simulation-particle-radius',
            min: 1,
            max: 10,
            step: 0.5,
        },
        {
            name: 'Max Timestep',
            description:
                'The delta time cap preventing particles from teleporting through walls during lag spikes.',
            obj: this.app().simulation as unknown as Record<string, number>,
            key: 'maxTimestep',
            id: 'simulation-max-timestep',
            min: 0.01,
            max: 0.1,
            step: 0.01,
        },
    ]);

    interactionRows = computed<Row[]>(() => [
        {
            name: 'Mouse Radius',
            description: 'How close the mouse needs to be to a particle to push it.',
            obj: this.app().interaction as unknown as Record<string, number>,
            key: 'mouseRadius',
            id: 'interaction-mouse-radius',
            min: 10,
            max: 500,
            step: 1,
        },
        {
            name: 'Mouse Force',
            description: 'The multiplier for the velocity injected into the fluid by the mouse.',
            obj: this.app().interaction as unknown as Record<string, number>,
            key: 'mouseForce',
            id: 'interaction-mouse-force',
            min: 100,
            max: 5000,
            step: 100,
        },
        {
            name: 'Color Intensity',
            description:
                'Scales how rapidly a fast-moving particle shifts from the slow color to the fast color.',
            obj: this.app().interaction as unknown as Record<string, number>,
            key: 'colorIntensity',
            id: 'interaction-color-intensity',
            min: 1,
            max: 50,
            step: 1,
        },
    ]);

    coloringColors = computed<ColorRow[]>(() => [
        {
            name: 'Slow Color',
            description: 'Particle color at rest or low speed.',
            obj: this.app().coloring as unknown as Record<string, RgbColor>,
            key: 'slowColor',
        },
        {
            name: 'Fast Color',
            description: 'Particle color blended towards at high speed.',
            obj: this.app().coloring as unknown as Record<string, RgbColor>,
            key: 'fastColor',
        },
        {
            name: 'Background Color',
            description: 'Canvas background fill color.',
            obj: this.app().coloring as unknown as Record<string, RgbColor>,
            key: 'backgroundColor',
        },
        {
            name: 'Hover Radius Color',
            description: 'Color of the mouse radius ring while hovering over the canvas.',
            obj: this.app().interaction as unknown as Record<string, RgbColor>,
            key: 'mouseHoverColor',
        },
        {
            name: 'Active Radius Color',
            description: 'Color of the mouse radius ring while the mouse button is held down.',
            obj: this.app().interaction as unknown as Record<string, RgbColor>,
            key: 'mouseActiveColor',
        },
    ]);
}
