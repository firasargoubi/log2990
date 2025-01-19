import { Component,  EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-create-game-card',
    templateUrl: './create-game-card.component.html',
    styleUrls: ['./create-game-card.component.scss'],
})
export class CreateGameCardComponent {
    @Output() createGameEvent = new EventEmitter<void>();
    onCreateClick(): void {
        this.createGameEvent.emit();
    }
}
