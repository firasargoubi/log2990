import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Routes, provideRouter } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { LobbyFormComponent } from '@app/components/lobby-form/lobby-form.component';
import { of } from 'rxjs';

const routes: Routes = [];

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainPageComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                provideHttpClientTesting(),
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'Tile Bound'", () => {
        expect(component.title).toEqual('Tile Bound');
    });

    it('should open the lobby form dialog', () => {
        const dialogSpy = spyOn(component.dialog, 'open').and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<LobbyFormComponent>);

        component.openLobbyForm();

        expect(dialogSpy).toHaveBeenCalledWith(LobbyFormComponent, {
            width: '700px',
            height: '400px',
        });
    });

    it('should set message to "Salle Rejointe" when dialog is closed with a result', () => {
        spyOn(component.dialog, 'open').and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<LobbyFormComponent>);

        component.openLobbyForm();

        component.message.subscribe((msg) => {
            expect(msg).toBe('Salle Rejointe');
        });
    });

    it('should not set message when dialog is closed without a result', () => {
        spyOn(component.dialog, 'open').and.returnValue({
            afterClosed: () => of(false),
        } as MatDialogRef<LobbyFormComponent>);

        component.openLobbyForm();

        component.message.subscribe((msg) => {
            expect(msg).toBe('');
        });
    });
});
