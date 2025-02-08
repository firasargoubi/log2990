import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game.model';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private notificationService = inject(NotificationService);
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private http: HttpClient) {}

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${gameId}`).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de supprimer le jeu');
                return EMPTY;
            }),
        );
    }

    updateGame(gameId: string, gameModif: Partial<Game>): Observable<Game> {
        return this.http.patch<Game>(`${this.baseUrl}/${gameId}`, gameModif);
    }

    updateVisibility(gameId: string, isVisible: boolean): Observable<Game> {
        return this.http.patch<Game>(`${this.baseUrl}/${gameId}`, { isVisible }).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de modifier la visibilité.');
                return EMPTY;
            }),
        );
    }

    fetchGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/all`).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de récupérer les jeux');
                return EMPTY;
            }),
        );
    }

    fetchVisibleGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/visible`).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de récupérer les jeux visibles.');
                return EMPTY;
            }),
        );
    }

    fetchGameById(gameId: string): Observable<Game> {
        return this.http.get<Game>(`${this.baseUrl}/${gameId}`).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de récupérer les détails du jeu.');
                return EMPTY;
            }),
        );
    }

    createGame(game: Game): Observable<Game> {
        return this.http.post<Game>(`${this.baseUrl}/create`, game).pipe(
            catchError(() => {
                this.notificationService.showError('Impossible de créer le jeu.');
                return EMPTY;
            }),
        );
    }
}
