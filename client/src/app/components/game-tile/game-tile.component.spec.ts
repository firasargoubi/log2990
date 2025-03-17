import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GAME_IMAGES, ObjectsTypes, TileTypes } from '@app/Consts/app.constants';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { GameTileComponent } from './game-tile.component';

describe('GameTileComponent', () => {
    let component: GameTileComponent;
    let fixture: ComponentFixture<GameTileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameTileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameTileComponent);
        component = fixture.componentInstance;

        // Set basic tile properties
        component.tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 0,
            y: 0,
            id: '0-0',
        };

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the correct tile image based on tile type', () => {
        const testCases = [
            { type: TileTypes.Grass, expectedImage: GAME_IMAGES.grass },
            { type: TileTypes.Water, expectedImage: GAME_IMAGES.water },
            { type: TileTypes.Ice, expectedImage: GAME_IMAGES.ice },
            { type: TileTypes.DoorClosed, expectedImage: GAME_IMAGES.doorClosed },
            { type: TileTypes.DoorOpen, expectedImage: GAME_IMAGES.doorOpen },
            { type: TileTypes.Wall, expectedImage: GAME_IMAGES.wall },
            { type: 999, expectedImage: GAME_IMAGES.default }, // Invalid type should show default
        ];

        testCases.forEach((testCase) => {
            component.tile = { ...component.tile, type: testCase.type };
            fixture.detectChanges();

            expect(component.getTileImage()).toBe(testCase.expectedImage);

            const imgElement = fixture.debugElement.query(By.css('.tile-image'));
            expect(imgElement.nativeElement.src).toContain(testCase.expectedImage.replace('assets/', ''));
        });
    });

    it('should render the correct object image based on object type', () => {
        // First test with no object (should return null)
        component.tile = { ...component.tile, object: 0 };
        fixture.detectChanges();
        expect(component.getObjectImage()).toBeNull();

        const testCases = [
            { object: ObjectsTypes.BOOTS, expectedImage: GAME_IMAGES.boots },
            { object: ObjectsTypes.SWORD, expectedImage: GAME_IMAGES.sword },
            { object: ObjectsTypes.POTION, expectedImage: GAME_IMAGES.potion },
            { object: ObjectsTypes.WAND, expectedImage: GAME_IMAGES.wand },
            { object: ObjectsTypes.CRYSTAL, expectedImage: GAME_IMAGES.crystalBall },
            { object: ObjectsTypes.JUICE, expectedImage: GAME_IMAGES.berryJuice },
            { object: ObjectsTypes.SPAWN, expectedImage: GAME_IMAGES.vortex },
            { object: ObjectsTypes.RANDOM, expectedImage: GAME_IMAGES.gnome },
            { object: 999, expectedImage: GAME_IMAGES.undefined }, // Invalid type should show undefined
        ];

        testCases.forEach((testCase) => {
            if (testCase.object > 0) {
                // Skip no object case as we tested it above
                component.tile = { ...component.tile, object: testCase.object };
                fixture.detectChanges();

                expect(component.getObjectImage()).toBe(testCase.expectedImage);

                // Check if object image exists
                const objectImgElement = fixture.debugElement.query(By.css('.object-image'));
                expect(objectImgElement).toBeTruthy();
                expect(objectImgElement.nativeElement.src).toContain(testCase.expectedImage.replace('assets/', ''));
            }
        });
    });

    it('should emit tileClick event when clicked', () => {
        const spy = spyOn(component.tileClick, 'emit');
        const tileElement = fixture.debugElement.query(By.css('.board-tile'));

        tileElement.triggerEventHandler('click', null);

        expect(spy).toHaveBeenCalledWith(component.tile);
    });

    it('should apply available-move class when isAvailableMove is true', () => {
        component.isAvailableMove = true;
        fixture.detectChanges();

        const tileElement = fixture.debugElement.query(By.css('.board-tile'));
        expect(tileElement.classes['available-move']).toBeTrue();
    });

    it('should apply path-highlighted class when isPathHighlighted is true', () => {
        component.isPathHighlighted = true;
        fixture.detectChanges();

        const tileElement = fixture.debugElement.query(By.css('.board-tile'));
        expect(tileElement.classes['path-highlighted']).toBeTrue();
    });

    it('should display player marker when player is provided', () => {
        // First test with no player
        expect(fixture.debugElement.query(By.css('.player-marker'))).toBeNull();

        // Then add a player
        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            avatar: 'assets/avatar/1.jpg',
        } as Player;

        component.player = {
            player: mockPlayer,
            isCurrentPlayer: false,
            isLocalPlayer: false,
        };

        fixture.detectChanges();

        // Should now have a player marker
        const playerMarker = fixture.debugElement.query(By.css('.player-marker'));
        expect(playerMarker).toBeTruthy();

        // Should have the correct avatar
        const avatarImg = playerMarker.query(By.css('.avatar-image'));
        expect(avatarImg.nativeElement.src).toContain(mockPlayer.avatar.replace('assets/', ''));
    });

    it('should apply correct classes for current player', () => {
        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            avatar: 'assets/avatar/1.jpg',
        } as Player;

        // Test current player
        component.player = {
            player: mockPlayer,
            isCurrentPlayer: true,
            isLocalPlayer: false,
        };

        fixture.detectChanges();

        const playerMarker = fixture.debugElement.query(By.css('.player-marker'));
        expect(playerMarker.classes['current-player']).toBeTrue();
        expect(playerMarker.classes['local-player']).toBeFalsy();
    });

    it('should apply correct classes for local player', () => {
        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            avatar: 'assets/avatar/1.jpg',
        } as Player;

        // Test local player
        component.player = {
            player: mockPlayer,
            isCurrentPlayer: false,
            isLocalPlayer: true,
        };

        fixture.detectChanges();

        const playerMarker = fixture.debugElement.query(By.css('.player-marker'));
        expect(playerMarker.classes['current-player']).toBeFalsy();
        expect(playerMarker.classes['local-player']).toBeTrue();
    });

    it('should apply both classes for player who is both current and local', () => {
        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            avatar: 'assets/avatar/1.jpg',
        } as Player;

        // Test player who is both current and local
        component.player = {
            player: mockPlayer,
            isCurrentPlayer: true,
            isLocalPlayer: true,
        };

        fixture.detectChanges();

        const playerMarker = fixture.debugElement.query(By.css('.player-marker'));
        expect(playerMarker.classes['current-player']).toBeTrue();
        expect(playerMarker.classes['local-player']).toBeTrue();
    });

    it('should handle undefined tile gracefully', () => {
        // Setting tile to undefined should not cause errors
        component.tile = undefined as unknown as Tile;
        fixture.detectChanges();

        expect(component.getTileImage()).toBe(GAME_IMAGES.default);
        expect(component.getObjectImage()).toBeNull();

        // Should still be able to click
        const spy = spyOn(component.tileClick, 'emit');
        const tileElement = fixture.debugElement.query(By.css('.board-tile'));
        tileElement.triggerEventHandler('click', null);

        // Will emit undefined but should not throw
        expect(spy).toHaveBeenCalled();
    });

    it('should handle null object gracefully', () => {
        component.tile = { ...component.tile, object: null as unknown as number };
        fixture.detectChanges();

        expect(component.getObjectImage()).toBeNull();
    });
});
