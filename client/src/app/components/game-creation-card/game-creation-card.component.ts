import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface GameCreation {
    id: number;
    name: string;
    mapSize: string;
    mode: string;
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
}

@Component({
    selector: 'app-game-creation-card',
    templateUrl: './game-creation-card.component.html',
    styleUrls: ['./game-creation-card.component.scss'],
    imports: [MatCardModule, MatTooltipModule, MatButtonModule, MatSlideToggleModule],
})
export class GameCreationCardComponent {
    @Input() game!: GameCreation;
}
