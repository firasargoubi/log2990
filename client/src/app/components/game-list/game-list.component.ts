import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { Game } from '@app/interfaces/game.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameModeDialogComponent } from '@app/components/game-mode/game-mode.component';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    imports: [GameCardComponent, MatCardModule, MatTooltipModule, MatDialogModule],
})
export class GameListComponent {
    @Input() games: Game[] = [];
    @Output() editGame = new EventEmitter<Game>();
    @Output() deleteGame = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<Game>();
    constructor(
        private dialog: MatDialog,
        private router: Router,
    ) {}
    // TODO: Ajouter et gérer événement de création de jeu avec nouveau component.

    constructor(private router: Router) {}

    onVisibilityChange(event: Game) {
        this.visibilityChange.emit(event);
    }
}
