import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { GameCardComponent } from './game-card.component';

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        const gameServiceMock = jasmine.createSpyObj('GameService', ['deleteGame', 'updateVisibility']);
        const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        const activatedRouteMock = {
            snapshot: {
                paramMap: of(new Map([['id', '1']])),
            },
        };

        await TestBed.configureTestingModule({
            imports: [GameCardComponent, MatSnackBarModule, MatDialogModule, NoopAnimationsModule],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: MatDialog, useValue: dialogMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        gameServiceSpy = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open dialog and delete game when confirmed', () => {
        spyOn(component.delete, 'emit');
        component.game = { id: '1', name: 'Test Game' } as Game;
        dialogSpy.open.and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<unknown, unknown>);
        gameServiceSpy.deleteGame.and.returnValue(of(void 0));

        component.deleteGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDeleteComponent);
        expect(gameServiceSpy.deleteGame).toHaveBeenCalledWith('1');
        expect(component.delete.emit).toHaveBeenCalledWith(component.game);
    });

    it('should not delete game when dialog is cancelled', () => {
        spyOn(component.delete, 'emit');
        component.game = { id: '1', name: 'Test Game' } as Game;
        dialogSpy.open.and.returnValue({
            afterClosed: () => of(false),
        } as MatDialogRef<unknown, unknown>);

        component.deleteGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDeleteComponent);
        expect(gameServiceSpy.deleteGame).not.toHaveBeenCalled();
        expect(component.delete.emit).not.toHaveBeenCalled();
    });

    it('should update visibility and emit visibilityChange event', () => {
        spyOn(component.visibilityChange, 'emit');
        component.game = { id: '1', name: 'Test Game' } as Game;
        const updatedGame = { id: '1', name: 'Test Game', isVisible: true } as Game;
        gameServiceSpy.updateVisibility.and.returnValue(of(updatedGame));

        component.toggleVisibility(true);

        expect(gameServiceSpy.updateVisibility).toHaveBeenCalledWith('1', true);
        expect(component.visibilityChange.emit).toHaveBeenCalledWith(updatedGame);
        expect(component.game).toEqual(updatedGame);
    });
});
