import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game.model';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private http: HttpClient) {}

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${gameId}`).pipe(
            catchError(() => {
                return throwError(() => new Error('Impossible de supprimer le jeu'));
            }),
        );
    }

    updateVisibility(gameId: string, isVisible: boolean): Observable<Game> {
        return this.http.patch<Game>(`${this.baseUrl}/${gameId}`, { isVisible }).pipe(
            catchError(() => {
                return throwError(() => new Error('Impossible de modifier la visibilité.'));
            }),
        );
    }

    fetchGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/all`).pipe(
            catchError(() => {
                return throwError(() => new Error('Impossible de récupérer les jeux'));
            }),
        );
    }

    fetchVisibleGames() {
        return this.http.get<Game[]>(`${this.baseUrl}/visible`).pipe(
            catchError(() => {
                return throwError(() => new Error('Impossible de récupérer les jeux visibles.'));
            }),
        );
    }
}
