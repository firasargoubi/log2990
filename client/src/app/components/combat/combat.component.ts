import { Component, Input } from '@angular/core';
// import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent {
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
    @Input() lobbyId!: string;
    isPlayerTurn: boolean = false;

    // constructor(private lobbyService: LobbyService) {}

    // ngOnInit(): void {
    //     // this.lobbyService.onCombatUpdate().subscribe((data) => {
    //     //     this.currentPlayer = data.currentPlayer;
    //     //     this.opponent = data.opponent;
    //     //     this.isPlayerTurn = data.turn === this.currentPlayer.id;
    //     // });
    // }

    attack() {
        // if (!this.isPlayerTurn) return;
        // this.lobbyService.sendCombatAction(this.lobbyId, 'attack', this.currentPlayer.id, this.opponent.id);
    }
}
