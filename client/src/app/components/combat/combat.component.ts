import { Component, inject, Input, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';
import { GameState } from '@common/game-state';

@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit {
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
    @Input() lobbyId!: string;
    @Input() gameState: GameState | null = null;
    isPlayerTurn: boolean = false;
    playerTurn: string = '';
    private lobbyService = inject(LobbyService);

    ngOnInit() {
        if (this.gameState) {
            console.log('game state exists and handleAttack is called');
            this.lobbyService.handleAttack(this.currentPlayer, this.opponent, this.lobbyId, this.gameState);
        } else {
            console.log('gameState is null or undefined');
        }
        this.lobbyService.getPlayerTurn().subscribe((data) => {
            console.log('PLAYER TURN TO DATA PLAYER TURN ');
            this.playerTurn = data.playerTurn;
            console.log(this.playerTurn);
        });
    }

    getPlayerTurn(): boolean {
        console.log(this.playerTurn);
        return this.currentPlayer.id === this.playerTurn;
    }
}
