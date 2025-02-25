import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-player-info',
    templateUrl: './player-info.component.html',
    styleUrls: ['./player-info.component.scss'],
})
export class PlayerInfoComponent {
    @Input() player = {
        name: 'John Doe',
        avatar: 'assets/avatar.png',
        health: { current: 30, max: 50 },
        speed: 10,
        attack: 15,
        attackDice: 'D6',
        defense: 12,
        defenseDice: 'D4',
        movement: 5,
        actions: 3,
    };
}
