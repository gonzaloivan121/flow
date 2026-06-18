import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { FluidSimulationApp } from '../../classes/fluid-simulation.app';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarComponent);
        fixture.componentRef.setInput('app', new FluidSimulationApp());
        fixture.detectChanges();
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
