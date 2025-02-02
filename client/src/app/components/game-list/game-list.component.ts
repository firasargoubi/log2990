import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Game } from '@app/interfaces/game.model';
import { ViewChild } from '@angular/core';
import { ModalCreationComponent } from '../modal-creation/modal-creation.component';
import { GameCardComponent } from '../game-card/game-card.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    imports: [ MatCardModule, MatTooltipModule, GameCardComponent, ModalCreationComponent, CommonModule],
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

    @ViewChild('modal') modal!: ModalCreationComponent;

    openModal() {
        this.modal.open();
    }

    handleModalSubmit(data: { mode: string; size: string }) {
        console.log('Données reçues :', data);
    }
}
