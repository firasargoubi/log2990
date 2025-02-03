import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePageComponent } from './create-page.component';
import { GameService } from '@app/services/game.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Game } from '@app/interfaces/game.model';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;

    beforeEach(async () => {
        // Mock GameService
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchVisibleGames']);

        // Mock ActivatedRoute
        const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { params: {} } });

        // ✅ **Corrected Mock Game Data**
        const mockGames: Game[] = [
            {
                id: "1",
                name: 'Chess',
                mapSize: '8x8',
                mode: 'Classic',
                previewImage: 'chess.png',
                description: 'A strategic board game.',
                lastModified: new Date('2024-01-01T10:00:00Z'),
                isVisible: true,
                board: [[0, 1], [1, 0]] // ✅ **Added missing "board" field**
            },
            {
                id: "2",
                name: 'Poker',
                mapSize: 'Card Table',
                mode: 'Texas Hold\'em',
                previewImage: 'poker.png',
                description: 'A popular card game.',
                lastModified: new Date('2024-01-02T15:30:00Z'),
                isVisible: true,
                board: [[1, 1], [0, 0]] // ✅ **Added missing "board" field**
            }
        ];

        gameServiceSpy.fetchVisibleGames.and.returnValue(of(mockGames));

        // Mock MatDialog
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj<MatDialogRef<BoxFormDialogComponent>>('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(true));
        matDialogSpy.open.and.returnValue(mockDialogRef);

        await TestBed.configureTestingModule({
            imports: [
                CreatePageComponent,  // ✅ Ensure it's imported as standalone
                GameCreationCardComponent, // ✅ Properly imported standalone component
                CommonModule,
                ReactiveFormsModule,
                MatCardModule,
                RouterModule
            ],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy }  // ✅ Fix for ActivatedRoute error
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on initialization', () => {
        component.ngOnInit();
        expect(gameServiceSpy.fetchVisibleGames).toHaveBeenCalled();
        expect(component.games.length).toBe(2);
        expect(component.games[0].name).toBe('Chess');
    });

    it('should open dialog when onBoxClick is called', () => {
        const mockGame: Game = {
            id: "1",
            name: 'Chess',
            mapSize: '8x8',
            mode: 'Classic',
            previewImage: 'chess.png',
            description: 'A strategic board game.',
            lastModified: new Date(),
            isVisible: true,
            board: [[0, 1], [1, 0]]
        };

        component.onBoxClick(mockGame);
        expect(matDialogSpy.open).toHaveBeenCalledWith(BoxFormDialogComponent, {
            width: '400px',
            data: { boxId: mockGame.id, game: mockGame },
        });
    });

    it('should handle dialog close with result', () => {
        const mockGame: Game = {
            id: "1",
            name: 'Chess',
            mapSize: '8x8',
            mode: 'Classic',
            previewImage: 'chess.png',
            description: 'A strategic board game.',
            lastModified: new Date('2024-01-01T10:00:00Z'),
            isVisible: true,
            board: [[0, 1], [1, 0]]
        };

        component.onBoxClick(mockGame);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });

    it('should handle dialog close properly', () => {
        mockDialogRef.afterClosed.and.returnValue(of(null)); // ✅ Simulating a cancelled dialog

        const mockGame: Game = {
            id: "1",
            name: 'Chess',
            mapSize: '8x8',
            mode: 'Classic',
            previewImage: 'chess.png',
            description: 'A strategic board game.',
            lastModified: new Date(),
            isVisible: true,
            board: [[0, 1], [1, 0]]
        };

        component.onBoxClick(mockGame);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });

    it('should handle dialog close when cancelled', () => {
        mockDialogRef.afterClosed.and.returnValue(of(null)); // ✅ Simulate dialog cancellation

        const mockGame: Game = {
            id: "1",
            name: 'Chess',
            mapSize: '8x8',
            mode: 'Classic',
            previewImage: 'chess.png',
            description: 'A strategic board game.',
            lastModified: new Date('2024-01-01T10:00:00Z'),
            isVisible: true,
            board: [[0, 1], [1, 0]]
        };

        component.onBoxClick(mockGame);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();
    });
});
