import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { CreatePageComponent } from './create-page.component';
import { GameService } from '@app/services/game.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { Game } from '@app/interfaces/game.model';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
        const mockGamesSubject = new BehaviorSubject<Game[]>([
            {
                id: '1',
                name: 'Chess',
                mapSize: 'medium',
                mode: 'normal',
                previewImage: 'chess.png',
                description: 'A normal board game.',
                lastModified: new Date('2024-01-01T10:00:00Z'),
                isVisible: true,
                board: [
                    [0, 1],
                    [1, 0],
                ],
                objects: [],
            },
            {
                id: '2',
                name: 'Poker',
                mapSize: 'medium',
                mode: 'normal',
                previewImage: 'poker.png',
                description: 'A popular card game.',
                lastModified: new Date('2024-01-02T15:30:00Z'),
                isVisible: true,
                board: [
                    [1, 1],
                    [0, 0],
                ],
                objects: [],
            },
        ]);

        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchVisibleGames', 'verifyGameAccessible']);
        gameServiceSpy.fetchVisibleGames.and.returnValue(mockGamesSubject.asObservable());

        const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { params: {} } });

        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj<MatDialogRef<BoxFormDialogComponent>>('MatDialogRef', ['afterClosed', 'close']);
        mockDialogRef.afterClosed.and.returnValue(of(true));
        matDialogSpy.open.and.returnValue(mockDialogRef);

        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        await TestBed.configureTestingModule({
            imports: [
                CreatePageComponent,
                GameCreationCardComponent,
                CommonModule,
                ReactiveFormsModule,
                MatCardModule,
                RouterModule.forRoot([{ path: 'waiting', component: CreatePageComponent }]),
            ],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on initialization', fakeAsync(() => {
        gameServiceSpy.fetchVisibleGames.and.returnValue(
            of([
                {
                    id: '1',
                    name: 'Chess',
                    mapSize: 'medium',
                    mode: 'normal',
                    previewImage: 'chess.png',
                    description: 'A normal board game.',
                    lastModified: new Date(),
                    isVisible: true,
                    board: [
                        [0, 1],
                        [1, 0],
                    ],
                    objects: [],
                },
            ]),
        );

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(gameServiceSpy.fetchVisibleGames).toHaveBeenCalled();
        expect(component.games.length).toBe(1);

        discardPeriodicTasks();
    }));

    it('should reload games when dialog is closed with a result', fakeAsync(() => {
        const newMockGame: Game = {
            id: '3',
            name: 'Go',
            mapSize: 'medium',
            mode: 'normal',
            previewImage: 'go.png',
            description: 'A normal board game.',
            lastModified: new Date(),
            isVisible: true,
            board: [
                [0, 1],
                [1, 0],
            ],
            objects: [],
        };
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(true));

        mockDialogRef.afterClosed.and.returnValue(of(newMockGame));
        spyOn(component as unknown as { loadGames: () => void }, 'loadGames');
        component.onBoxClick(newMockGame);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();

        tick();
        fixture.detectChanges();

        expect(component['loadGames']).toHaveBeenCalled();

        discardPeriodicTasks();
    }));

    it('should handle error when fetching games fails', fakeAsync(() => {
        gameServiceSpy.fetchVisibleGames.and.returnValue(throwError(() => new Error('Error')));

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(snackBarSpy.open).toHaveBeenCalledWith('Erreur lors du chargement des jeux', 'Fermer', {
            duration: 3000,
            panelClass: ['error-notification'],
        });

        discardPeriodicTasks();
    }));

    it('should not update games array if fetched games are the same', fakeAsync(() => {
        const initialGames = component.games;
        gameServiceSpy.fetchVisibleGames.and.returnValue(of(initialGames));

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(component.games).toEqual(initialGames);

        discardPeriodicTasks();
    }));
});
