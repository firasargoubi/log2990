import { Component } from '@angular/core';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { BoardComponent } from '@app/components/board/board.component';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
    imports: [SidebarComponent, PlayAreaComponent, BoardComponent],
})
export class GamePageComponent {}
