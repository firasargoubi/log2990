import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game.model';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/game';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    constructor(private http: HttpClient) {}

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${gameId}`);
    }

    updateVisibility(gameId: string, isVisible: boolean): Observable<Game> {
        return this.http.patch<Game>(`${API_URL}/${gameId}`, { isVisible });
    }

    updateGame(gameId: string, gameModif: Partial<Game>): Observable<Game> {
        return this.http.patch<Game>(`${API_URL}/${gameId}`, gameModif);
    }

    fetchGames() {
        return this.http.get<Game[]>(`${API_URL}/all`);
    }

    fetchVisibleGames() {
        return this.http.get<Game[]>(`${API_URL}/visible`);
    }

    fetchGameById(gameId: string) {
        return this.http.get<Game>(`${API_URL}/${gameId}`);
    }

    createGame(game: Game): Observable<Game> {
        return this.http.post<Game>(`${API_URL}/create`, game);
    }
}
