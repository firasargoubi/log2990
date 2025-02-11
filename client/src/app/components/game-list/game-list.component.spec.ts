import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameListComponent } from './game-list.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Game } from '@app/interfaces/game.model';
import { GameModeDialogComponent } from '@app/components/game-mode/game-mode.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { data: of({ games: [] }) },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should emit deleteGame event when deleteGame is called', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            description: 'Test Description',
            mode: 'normal',
            mapSize: 'medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
            previewImage: '',
            lastModified: new Date(),
            objects: [],
        };
        spyOn(component.deleteGame, 'emit');

        component.deleteGame.emit(game);

        expect(component.deleteGame.emit).toHaveBeenCalledWith(game);
    });

    it('should emit visibilityChange event when onVisibilityChange is called', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            description: 'Test Description',
            mode: 'normal',
            mapSize: 'medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
            previewImage: '',
            lastModified: new Date(),
            objects: [],
        };
        spyOn(component.visibilityChange, 'emit');

        component.onVisibilityChange(game);

        expect(component.visibilityChange.emit).toHaveBeenCalledWith(game);
    });

    it('should render game cards for each game in the games array', () => {
        component.games = [
            {
                id: '1',
                name: 'Test Game 1',
                description: 'Test Description 1',
                mode: 'normal',
                mapSize: 'medium',
                isVisible: true,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                previewImage: '',
                lastModified: new Date(),
                objects: [],
            },
            {
                id: '2',
                name: 'Test Game 2',
                description: 'Test Description 2',
                mode: 'normal',
                mapSize: 'medium',
                isVisible: true,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                previewImage: '',
                lastModified: new Date(),
                objects: [],
            },
        ];
        fixture.detectChanges();

        const gameCards = fixture.nativeElement.querySelectorAll('app-game-card');
        expect(gameCards.length).toBe(2);
    });
    it('should open the create dialog when openCreateDialog is called', () => {
        const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<GameModeDialogComponent>);

        component.openCreateDialog();

        expect(dialogSpy).toHaveBeenCalledWith(GameModeDialogComponent, {
            width: '400px',
        });
    });

    it('should navigate to edit page with correct query params when dialog is closed with result', () => {
        const routerSpy = spyOn(component['router'], 'navigate');
        spyOn(component['dialog'], 'open').and.returnValue({
            afterClosed: () => of({ type: 'Classic', size: 'Medium' }),
        } as MatDialogRef<GameModeDialogComponent>);

        component.openCreateDialog();

        expect(routerSpy).toHaveBeenCalledWith(['/edit'], {
            queryParams: { mode: 'Classic', size: 'Medium' },
        });
    });

    it('should not navigate when dialog is closed without result', () => {
        const routerSpy = spyOn(component['router'], 'navigate');

        component.openCreateDialog();

        expect(routerSpy).not.toHaveBeenCalled();
    });
});
