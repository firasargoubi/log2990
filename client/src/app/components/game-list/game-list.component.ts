import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Game, GameCardComponent } from '@app/components/game-card/game-card.component';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    imports: [GameCardComponent, MatCardModule],
})
export class GameListComponent {
    @Input() games: Game[] = [];
    @Output() editGame = new EventEmitter<Game>();
    @Output() deleteGame = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<Game>();
    // TODO: Ajouter et gérer événement de création de jeu avec nouveau component.
    onVisibilityChange(event: Game) {
        this.visibilityChange.emit(event);
    }
}
