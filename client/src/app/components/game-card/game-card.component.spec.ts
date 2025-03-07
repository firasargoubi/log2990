import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { Game } from '@common/game.interface';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { of, throwError } from 'rxjs';
import { GameCardComponent } from './game-card.component';

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(async () => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['deleteGame', 'updateVisibility']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

        const activatedRouteMock = {
            snapshot: {
                paramMap: of(new Map([['id', '1']])),
            },
        };

        await TestBed.configureTestingModule({
            imports: [GameCardComponent, MatSnackBarModule, MatDialogModule, NoopAnimationsModule],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open dialog, delete game when confirmed, and show success notification', () => {
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
        expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Jeu supprimé avec succès');
    });

    it('should show error notification if game deletion fails', () => {
        spyOn(component.delete, 'emit');
        component.game = { id: '1', name: 'Test Game' } as Game;
        dialogSpy.open.and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<unknown, unknown>);
        gameServiceSpy.deleteGame.and.returnValue(throwError(() => new Error('Delete failed')));

        component.deleteGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDeleteComponent);
        expect(gameServiceSpy.deleteGame).toHaveBeenCalledWith('1');
        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de supprimer le jeu');
        expect(component.delete.emit).not.toHaveBeenCalled();
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
        expect(notificationServiceSpy.showSuccess).not.toHaveBeenCalled();
        expect(notificationServiceSpy.showError).not.toHaveBeenCalled();
        expect(component.delete.emit).not.toHaveBeenCalled();
    });

    it('should update visibility, emit event, and show success notification', () => {
        spyOn(component.visibilityChange, 'emit');
        component.game = { id: '1', name: 'Test Game', isVisible: false } as Game;
        const updatedGame = { id: '1', name: 'Test Game', isVisible: true } as Game;
        gameServiceSpy.updateVisibility.and.returnValue(of(updatedGame));

        component.toggleVisibility(true);

        expect(gameServiceSpy.updateVisibility).toHaveBeenCalledWith('1', true);
        expect(component.visibilityChange.emit).toHaveBeenCalledWith(updatedGame);
        expect(component.game).toEqual(updatedGame);
        expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Visibilité du jeu mise à jour');
    });

    it('should show error notification if visibility update fails', () => {
        spyOn(component.visibilityChange, 'emit');
        component.game = { id: '1', name: 'Test Game', isVisible: false } as Game;
        gameServiceSpy.updateVisibility.and.returnValue(throwError(() => new Error('Update failed')));

        component.toggleVisibility(true);

        expect(gameServiceSpy.updateVisibility).toHaveBeenCalledWith('1', true);
        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de modifier la visibilité');
        expect(component.visibilityChange.emit).not.toHaveBeenCalled();
    });
    it('should not open delete dialog if isLoading is true', () => {
        component.isLoading = true;
        component.game = { id: '1', name: 'Test Game' } as Game;

        component.deleteGame();

        expect(dialogSpy.open).not.toHaveBeenCalled();
        expect(gameServiceSpy.deleteGame).not.toHaveBeenCalled();
    });
    it('should not update visibility if isLoading is true', () => {
        component.isLoading = true;
        component.game = { id: '1', name: 'Test Game', isVisible: false } as Game;

        component.toggleVisibility(true);

        expect(gameServiceSpy.updateVisibility).not.toHaveBeenCalled();
    });
});
