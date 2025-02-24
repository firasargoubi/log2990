import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Player } from '@common/player'; // Importer le modèle de joueur
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
    selector: 'app-player-card',
    templateUrl: './player-card.component.html',
    styleUrls: ['./player-card.component.scss'],
    imports: [MatCardModule, MatTooltipModule],
})
export class PlayerCardComponent {
    @Input() player!: Player;
    @Input() currentPlayer: Player;
    @Input() hostId: string = '';
    @Output() remove = new EventEmitter<string>();

    isHost(player: Player): boolean {
        return player.id === this.hostId;
    }

    onRemovePlayer(): void {
        this.remove.emit(this.player.id);
    }
}
