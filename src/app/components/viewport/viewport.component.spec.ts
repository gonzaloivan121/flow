import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewportComponent } from './viewport.component';

describe('ViewportComponent', () => {
    let component: ViewportComponent;
    let fixture: ComponentFixture<ViewportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ViewportComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
