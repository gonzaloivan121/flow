# FLOW STUDIO

<p align="left">
	<img alt="Angular" src="https://img.shields.io/badge/Angular-21.2.10-DD0031?logo=angular&logoColor=white">
	<img alt="PrimeNG" src="https://img.shields.io/badge/PrimeNG-21.x-3B82F6">
	<img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-Enabled-06B6D4?logo=tailwindcss&logoColor=white">
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white">
	<img alt="Tests" src="https://img.shields.io/badge/Unit%20Tests-Vitest-6E9F18?logo=vitest&logoColor=white">
	<img alt="Status" src="https://img.shields.io/badge/Status-Active%20Development-1f6feb">
</p>

Flow Studio is an Angular application focused on interactive fluid simulation workflows. It combines a simulation engine and render pipeline with a modern UI layer built using PrimeNG v21 visual components and Tailwind CSS utility styling. The codebase is organized to keep simulation logic, rendering concerns, and user interface concerns clearly separated.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [Fluid Simulation](#fluid-simulation)
- [Testing](#testing)
- [Build and Deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Overview

This project was generated with Angular CLI `21.2.10` and includes:

- A real-time simulation engine and dedicated fluid simulation modules
- A component-driven UI (`layout`, `toolbar`, `sidebar`, `viewport`) for simulation controls and viewport composition
- Service-layer abstractions for session, persistence, and theming
- PrimeNG v21 component usage for polished visual primitives and interaction patterns
- Tailwind CSS utility styling for fast, consistent layout and responsive design
- Vitest-based unit testing setup

At a high level, the application is designed for experimentation and iteration: users can interact with simulation behavior through the UI while the underlying core updates simulation state and rendering in real time.

## Tech Stack

- Angular 21
- PrimeNG 21
- Tailwind CSS
- TypeScript
- Vitest
- Modern Angular standalone app configuration

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

Then open:

```text
http://localhost:4200/
```

The app reloads automatically as you edit source files.

## Development Commands

```bash
# Start local dev server
npm start

# Run unit tests (watch mode depending on local configuration)
npm test

# Build production bundle
npm run build

# Generate Angular artifacts
ng generate component features/example
ng generate --help
```

## Project Structure

```text
src/
	app/
		classes/
			core/
			fluid-simulation/
		components/
			layout/
			sidebar/
			toolbar/
			viewport/
		services/
			session/
			simulation-persistence/
			theme/
		types/
		app.config.ts
		app.routes.ts
```

## Architecture Notes

- `classes/core` contains core runtime concerns such as engine lifecycle, rendering, and input processing.
- `classes/fluid-simulation` contains simulation-specific rendering and physics behavior.
- `components/*` represent UI building blocks and screen composition.
- `services/*` centralize cross-cutting concerns and stateful integrations.
- PrimeNG v21 is used for reusable visual components and interaction-heavy UI controls.
- Tailwind CSS is used to compose layout, spacing, and responsive behavior quickly and consistently.

This separation keeps UI concerns independent from simulation logic and supports easier testing and maintenance.

## Fluid Simulation

The fluid simulation subsystem is organized under `src/app/classes/fluid-simulation` and works together with the core engine in `src/app/classes/core`.

Core responsibilities include:

- Physics update loops that evolve the simulation state over time
- Specialized rendering paths for fluid visualization in the viewport
- HUD overlays for simulation feedback and diagnostics
- Integration hooks so UI controls can influence simulation parameters

In practice, the runtime loop follows a clear sequence:

1. Gather input and UI-driven parameter changes.
2. Advance simulation physics by timestep.
3. Render the updated simulation frame.
4. Draw overlays and refresh user-facing controls.

This architecture supports smooth interaction while keeping simulation calculations encapsulated from presentation concerns.

## Testing

Run unit tests with:

```bash
npm test
```

The workspace is configured to use Vitest for unit testing.

## Build and Deployment

Create a production build:

```bash
npm run build
```

Build output is generated under:

```text
dist/
```

## Troubleshooting

- If the dev server does not start, clear and reinstall dependencies:

```bash
# PowerShell (Windows)
Remove-Item -Recurse -Force node_modules, package-lock.json

# macOS/Linux
rm -rf node_modules package-lock.json

npm install
```

- If port `4200` is occupied, run Angular on a custom port:

```bash
ng serve --port 4300
```

## Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev)
- [Vitest Documentation](https://vitest.dev)
- [PrimeNG Documentation](https://primeng.org)
- [Tailwind Documentation](https://tailwindcss.com/docs)
