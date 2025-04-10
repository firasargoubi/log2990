import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';

@Component({
    selector: 'app-stats-page',
    imports: [],
    templateUrl: './stats-page.component.html',
    styleUrls: ['./stats-page.component.scss'],
})
export class StatsPageComponent {
    winnersNames: string[] = [];
    winnersAvatars: string[] = [];
    gameState!: GameState;

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras.state as {
            winner: string;
            lobbyId: string;
            gameState: GameState;
        };

        if (state) {
            this.winnersNames = Array.isArray(state.winner) ? state.winner : state.winner.split(', ').map((name) => name.trim());
            this.gameState = state.gameState;

            this.winnersAvatars = this.gameState.players.filter((player) => this.winnersNames.includes(player.name)).map((player) => player.avatar);
        } else {
            this.winnersNames = ['Unknown'];
        }

        console.log('Winners Names:', this.winnersNames);
        console.log('Winners Avatars:', this.winnersAvatars);
        console.log('Game State:', this.gameState);
    }

    return() {
        this.router.navigate([PageUrl.Home], { replaceUrl: true });
    }

    trackByName(index: number, name: string) {
        return name;
    }
}
