/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { Game, GameSize, GameType } from '@common/game.interface';
import { of, throwError } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';
import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: SpyObj<GameService>;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGames']);
        gameServiceSpy.fetchGames.and.returnValue(
            of([
                {
                    id: '1',
                    name: 'Test Game',
                    mapSize: GameSize.small,
                    mode: GameType.capture,
                    previewImage: '',
                    description: '',
                    lastModified: new Date(),
                    isVisible: false,
                    board: [],
                },
            ]),
        );

        await TestBed.configureTestingModule({
            imports: [AdminPageComponent],
            providers: [{ provide: GameService, useValue: gameServiceSpy }, provideHttpClientTesting(), provideRouter(routes), provideAnimations()],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on init', () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Test Game',
                mapSize: GameSize.small,
                mode: GameType.capture,
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: false,
                board: [],
                objects: [],
            },
        ];
        gameService.fetchGames.and.returnValue(of(mockGames));

        component.ngOnInit();

        expect(gameService.fetchGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should call fetchGames on onDeleteGame', () => {
        spyOn(component as any, 'fetchGames').and.callThrough();
        component.onDeleteGame();
        expect(component['fetchGames']).toHaveBeenCalled();
    });

    it('should call fetchGames on onToggleVisibility', () => {
        spyOn(component as any, 'fetchGames').and.callThrough();
        component.onToggleVisibility();
        expect(component['fetchGames']).toHaveBeenCalled();
    });
    it('should show success notification only on the first fetchGames call', () => {
        const notificationService = TestBed.inject(NotificationService);
        spyOn(notificationService, 'showSuccess');

        component['isFirstLoad'] = true;

        component['fetchGames']();

        expect(notificationService.showSuccess).toHaveBeenCalledWith('Jeux chargés avec succès');

        component['fetchGames']();

        expect(notificationService.showSuccess).toHaveBeenCalledTimes(1);
    });

    it('should show error notification when fetchGames fails', () => {
        const notificationService = TestBed.inject(NotificationService);
        spyOn(notificationService, 'showError');

        gameService.fetchGames.and.returnValue(throwError(() => new Error('error')));

        component['fetchGames']();

        expect(notificationService.showError).toHaveBeenCalledWith('Chargement des jeux impossible, réessayez plus tard.');
    });
});
