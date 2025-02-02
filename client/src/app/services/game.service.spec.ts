import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { Game } from '@app/interfaces/game.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GameService', () => {
    let httpMock: HttpTestingController;
    let service: GameService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
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
});
