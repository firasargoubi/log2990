import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { Game } from '@app/interfaces/game.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NotificationService } from './notification.service';

describe('GameService', () => {
    let httpMock: HttpTestingController;
    let service: GameService;
    let baseUrl: string;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(() => {
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        });

        service = TestBed.inject(GameService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should delete a game', () => {
        const gameId = '123';
        service.deleteGame(gameId).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('should handle error when deleting a game', () => {
        const gameId = '123';
        service.deleteGame(gameId).subscribe((response) => {
            expect(response).toEqual(void 0);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de supprimer le jeu');
    });

    it('should update game visibility', () => {
        const gameId = '123';
        const isVisible = true;
        const mockGame: Game = {
            id: gameId,
            name: 'Test Game',
            isVisible,
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            board: [],
        };

        service.updateVisibility(gameId, isVisible).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ isVisible });
        req.flush(mockGame);
    });

    it('should handle error when updating game visibility', () => {
        const gameId = '123';
        service.updateVisibility(gameId, true).subscribe((response) => {
            expect(response).toEqual({} as Game);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de modifier la visibilité.');
    });

    it('should update a game', () => {
        const gameId = '123';
        const gameModif: Partial<Game> = { name: 'Updated Game' };
        const mockUpdatedGame: Game = {
            id: gameId,
            name: 'Updated Game',
            isVisible: true,
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            board: [],
        };

        service.updateGame(gameId, gameModif).subscribe((game) => {
            expect(game).toEqual(mockUpdatedGame);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(gameModif);
        req.flush(mockUpdatedGame);
    });

    it('should fetch all games', () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Game 1',
                isVisible: true,
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                board: [],
            },
        ];

        service.fetchGames().subscribe((games) => {
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${baseUrl}/all`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should handle error when fetching all games', () => {
        service.fetchGames().subscribe((response) => {
            expect(response).toEqual({} as Game[]);
        });

        const req = httpMock.expectOne(`${baseUrl}/all`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de récupérer les jeux');
    });

    it('should fetch visible games', () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Game 1',
                isVisible: true,
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                board: [],
            },
        ];

        service.fetchVisibleGames().subscribe((games) => {
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${baseUrl}/visible`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should handle error when fetching visible games', () => {
        service.fetchVisibleGames().subscribe((response) => {
            expect(response).toEqual({} as Game[]);
        });

        const req = httpMock.expectOne(`${baseUrl}/visible`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de récupérer les jeux visibles.');
    });

    it('should fetch a game by ID', () => {
        const gameId = '123';
        const mockGame: Game = {
            id: gameId,
            name: 'Test Game',
            isVisible: true,
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            board: [],
        };

        service.fetchGameById(gameId).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should handle error when fetching a game by ID', () => {
        const gameId = '123';
        service.fetchGameById(gameId).subscribe((response) => {
            expect(response).toEqual({} as Game);
        });

        const req = httpMock.expectOne(`${baseUrl}/${gameId}`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de récupérer les détails du jeu.');
    });

    it('should create a game', () => {
        const mockGame: Game = {
            id: '123',
            name: 'New Game',
            isVisible: true,
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            board: [],
        };

        service.createGame(mockGame).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${baseUrl}/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockGame);
        req.flush(mockGame);
    });

    it('should handle error when creating a game', () => {
        const mockGame: Game = {
            id: '123',
            name: 'New Game',
            isVisible: true,
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            board: [],
        };

        service.createGame(mockGame).subscribe((response) => {
            expect(response).toEqual({} as Game);
        });

        const req = httpMock.expectOne(`${baseUrl}/create`);
        req.error(new ErrorEvent('Network error'));

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de créer le jeu.');
    });
});
