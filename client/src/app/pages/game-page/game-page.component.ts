import { Component } from '@angular/core';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { BoardComponent } from '@app/components/board/board.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
    imports: [SidebarComponent, PlayAreaComponent, BoardComponent, TileOptionsComponent, ObjectsComponent],
})
export class GamePageComponent {
    selectedTool: number = -1; // Store the selected tool

    onToolSelected(tool: number): void {
        this.selectedTool = tool;
        console.log(`Tool selected: ${tool}`);
    }
}
