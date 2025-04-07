import { Component, Input } from '@angular/core';
import { GameLobby } from '@common/game-lobby';

@Component({
    selector: 'app-game-controls',
    imports: [],
    templateUrl: './game-controls.component.html',
    styleUrl: './game-controls.component.scss',
})
export class GameControlsComponent {
    @Input() lobby: GameLobby;
}
