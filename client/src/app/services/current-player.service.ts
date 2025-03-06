import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Player } from '@common/player';

interface CurrentPlayerData {
    player: Player;
    gameId: string;
}

@Injectable({
    providedIn: 'root',
})
export class CurrentPlayerService {
    private playerSubject = new BehaviorSubject<CurrentPlayerData | null>(null);

    setCurrentPlayer(player: Player, gameId: string): void {
        this.playerSubject.next({ player, gameId });
    }

    getCurrentPlayer(): CurrentPlayerData | null {
        return this.playerSubject.value;
    }

    clear(): void {
        this.playerSubject.next(null);
    }
}
