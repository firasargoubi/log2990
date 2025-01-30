import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '@app/interfaces/game.model';

const API_URL = 'http://localhost:3000/api/game';


@Injectable({
    providedIn: 'root',
})
export class GameService {
    constructor(private http: HttpClient) {}

    deleteGame(gameId: number): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${gameId}`);
    }

    updateVisibility(gameId: number, isVisible: boolean): Observable<Game> {
        return this.http.put<Game>(`${API_URL}/${gameId}`, { isVisible });
    }
}
