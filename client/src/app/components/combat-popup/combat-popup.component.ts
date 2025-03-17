// combat-popup.component.ts
import { Component, Input } from '@angular/core';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat-popup',
    templateUrl: './combat-popup.component.html',
    styleUrls: ['./combat-popup.component.scss'],
})
export class CombatPopupComponent {
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
    @Input() combatTimeLeft: number = 0;
    @Input() isPlayerTurn: boolean = false;
}
