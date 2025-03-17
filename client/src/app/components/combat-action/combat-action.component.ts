// combat-action.component.ts
import { Component } from '@angular/core';
import { CombatService } from '@app/services/combat.service';

@Component({
    selector: 'app-combat-action',
    templateUrl: './combat-action.component.html',
    styleUrls: ['./combat-action.component.scss'],
})
export class CombatActionComponent {
    constructor(private combatService: CombatService) {}

    attack() {
        this.combatService.performAttack();
    }

    escape() {
        this.combatService.performEscape();
    }
}
