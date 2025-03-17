import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GameTileComponent } from './game-tile.component';
import { GAME_IMAGES, TileTypes, ObjectsTypes } from '@app/Consts/app.constants';
import { Tile } from '@app/interfaces/tile';
import { Player } from '@common/player';

describe('GameTileComponent', () => {
    let component: GameTileComponent;
    let fixture: ComponentFixture<GameTileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameTileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameTileComponent);
        component = fixture.componentInstance;

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
            { type: 999, expectedImage: GAME_IMAGES.default },
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
            { object: 999, expectedImage: GAME_IMAGES.undefined },
        ];

        testCases.forEach((testCase) => {
            if (testCase.object > 0) {
                component.tile = { ...component.tile, object: testCase.object };
                fixture.detectChanges();

                expect(component.getObjectImage()).toBe(testCase.expectedImage);

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

        const overlayElement = fixture.debugElement.query(By.css('.tile-overlay'));
        expect(overlayElement.classes['overlay-available-move']).toBeTrue();
    });

    it('should apply path-highlighted class when isPathHighlighted is true', () => {
        component.isPathHighlighted = true;
        fixture.detectChanges();

        const overlayElement = fixture.debugElement.query(By.css('.tile-overlay'));
        expect(overlayElement.classes['overlay-path-highlighted']).toBeTrue();
    });

    it('should display player marker when player is provided', () => {
        expect(fixture.debugElement.query(By.css('.player-marker'))).toBeNull();

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

        const playerMarker = fixture.debugElement.query(By.css('.player-marker'));
        expect(playerMarker).toBeTruthy();

        const avatarImg = playerMarker.query(By.css('.avatar-image'));
        expect(avatarImg.nativeElement.src).toContain(mockPlayer.avatar.replace('assets/', ''));
    });

    it('should apply correct classes for current player', () => {
        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            avatar: 'assets/avatar/1.jpg',
        } as Player;

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
        component.tile = undefined as unknown as Tile;
        fixture.detectChanges();

        expect(component.getTileImage()).toBe(GAME_IMAGES.default);
        expect(component.getObjectImage()).toBeNull();

        const spy = spyOn(component.tileClick, 'emit');
        const tileElement = fixture.debugElement.query(By.css('.board-tile'));
        tileElement.triggerEventHandler('click', null);

        expect(spy).toHaveBeenCalled();
    });

    it('should handle null object gracefully', () => {
        component.tile = { ...component.tile, object: null as unknown as number };
        fixture.detectChanges();

        expect(component.getObjectImage()).toBeNull();
    });
});
