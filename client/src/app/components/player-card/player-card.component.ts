import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Player } from '@common/player';
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

    isHost(): boolean {
        return this.currentPlayer.id === this.hostId;
    }

    onRemovePlayer(): void {
        this.remove.emit(this.player.id);
    }
}
