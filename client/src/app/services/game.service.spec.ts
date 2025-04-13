/* eslint-disable import/no-deprecated */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GAME_SERVICE_CONSTANTS } from '@app/consts/app-constants';
import { ApiEndpoint, ApiRoutes } from '@common/api.endpoints';
import { Game, GameSize, GameType } from '@common/game.interface';
import { environment } from 'src/environments/environment';
import { GameService } from './game.service';
import { NotificationService } from './notification.service';

describe('GameService', () => {
    let service: GameService;
    let httpMock: HttpTestingController;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let baseUrl: string;

    const mockGame: Game = {
        id: '123',
        name: 'Test Game',
        mapSize: GameSize.Medium,
        mode: GameType.Classic,
        previewImage: 'test-image.png',
        description: 'This is a test game.',
        lastModified: new Date(),
        isVisible: true,
        board: [
            [1, 2],
            [3, 4],
        ],
        objects: [],
    };

    beforeEach(() => {
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showInfo']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameService, { provide: NotificationService, useValue: notificationServiceSpy }],
        });

        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = `${environment.serverUrl}${ApiRoutes.Game}`;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('deleteGame', () => {
        it('should delete a game by ID', () => {
            const gameId = '123';

            service.deleteGame(gameId).subscribe((result) => {
                expect(result === undefined || result === null).toBeTrue();
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });

        it('should handle errors when deleting a game', () => {
            const gameId = '123';

            service.deleteGame(gameId).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorDeleteGame);
        });
    });

    describe('updateGame', () => {
        it('should update a game with given ID and modifications', () => {
            const gameId = '123';
            const updates = { name: 'Updated Game' };

            service.updateGame(gameId, updates).subscribe((result) => {
                expect(result).toEqual({ ...mockGame, ...updates });
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(updates);
            req.flush({ ...mockGame, ...updates });
        });
    });

    describe('updateVisibility', () => {
        it('should update game visibility', () => {
            const gameId = '123';
            const isVisible = false;
            const updatedGame = { ...mockGame, isVisible };

            service.updateVisibility(gameId, isVisible).subscribe((result) => {
                expect(result).toEqual(updatedGame);
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({ isVisible });
            req.flush(updatedGame);
        });

        it('should handle errors when updating visibility', () => {
            const gameId = '123';
            const isVisible = false;

            service.updateVisibility(gameId, isVisible).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorUpdateVisibility);
        });
    });

    describe('fetchGames', () => {
        it('should fetch all games', () => {
            const mockGames: Game[] = [mockGame];

            service.fetchGames().subscribe((games) => {
                expect(games).toEqual(mockGames);
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.AllGames}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockGames);
        });

        it('should handle errors when fetching games', () => {
            service.fetchGames().subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.AllGames}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorFetchGames);
        });
    });

    describe('fetchVisibleGames', () => {
        it('should fetch only visible games', () => {
            const mockVisibleGames: Game[] = [mockGame];

            service.fetchVisibleGames().subscribe((games) => {
                expect(games).toEqual(mockVisibleGames);
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.VisibleGames}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockVisibleGames);
        });

        it('should handle errors when fetching visible games', () => {
            service.fetchVisibleGames().subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.VisibleGames}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorFetchVisibleGames);
        });
    });

    describe('fetchGameById', () => {
        it('should fetch a game by ID', () => {
            const gameId = '123';

            service.fetchGameById(gameId).subscribe((game) => {
                expect(game).toEqual(mockGame);
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockGame);
        });

        it('should handle errors when fetching a game by ID', () => {
            const gameId = '123';

            service.fetchGameById(gameId).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorFetchGameDetails);
        });
    });

    describe('verifyGameName', () => {
        it('should verify if a game name is valid', () => {
            service.verifyGameName(mockGame).subscribe((result) => {
                expect(result).toBeTrue();
            });

            const req = httpMock.expectOne(`${baseUrl}/validateName`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(mockGame);
            req.flush(true);
        });

        it('should handle errors when verifying game name by completing silently', () => {
            let completed = false;

            service.verifyGameName(mockGame).subscribe({
                next: () => {
                    fail('Should not emit a value on error');
                },
                error: () => {
                    fail('Should not emit an error on error');
                },
                complete: () => {
                    completed = true;
                },
            });

            const req = httpMock.expectOne(`${baseUrl}/validateName`);
            req.error(new ErrorEvent('Network error'));

            expect(completed).toBeTrue();
        });
    });

    describe('verifyGameAccessible', () => {
        it('should verify if a game is accessible', () => {
            const gameId = '123';

            service.verifyGameAccessible(gameId).subscribe((result) => {
                expect(result).toBeTrue();
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.Validate}/${gameId}`);
            expect(req.request.method).toBe('GET');
            req.flush(true);
        });

        it('should handle errors when verifying game accessibility by completing silently', () => {
            const gameId = '123';
            let completed = false;

            service.verifyGameAccessible(gameId).subscribe({
                next: () => {
                    fail('Should not emit a value on error');
                },
                error: () => {
                    fail('Should not emit an error on error');
                },
                complete: () => {
                    completed = true;
                },
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.Validate}/${gameId}`);
            req.error(new ErrorEvent('Network error'));

            expect(completed).toBeTrue();
        });
    });

    describe('createGame', () => {
        it('should create a new game', () => {
            service.createGame(mockGame).subscribe((result) => {
                expect(result).toEqual(mockGame);
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.Create}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(mockGame);
            req.flush(mockGame);
        });

        it('should handle errors when creating a game', () => {
            service.createGame(mockGame).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                },
            });

            const req = httpMock.expectOne(`${baseUrl}${ApiEndpoint.Create}`);
            req.error(new ErrorEvent('Network error'));

            expect(notificationServiceSpy.showError).toHaveBeenCalledWith(GAME_SERVICE_CONSTANTS.errorCreateGame);
        });
    });
});
