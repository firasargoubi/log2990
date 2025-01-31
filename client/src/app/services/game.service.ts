import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private http: HttpClient) {}

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${gameId}`);
    }

    updateVisibility(gameId: string, isVisible: boolean): Observable<Game> {
        return this.http.patch<Game>(`${this.baseUrl}/${gameId}`, { isVisible });
    }

    fetchGames() {
        return this.http.get<Game[]>(`${this.baseUrl}/all`);
    }

    fetchVisibleGames() {
        return this.http.get<Game[]>(`${this.baseUrl}/visible`);
    }
}
