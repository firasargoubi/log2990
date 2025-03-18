import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameListener } from '@app/services/game-listener.service';
import { PlayerService } from '@app/services/player.service';
import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

@Component({
    selector: 'app-playing-page',
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Input() player!: Player;
    @Output() remove = new EventEmitter<string>();
    lobbyId: string = '';

    constructor(
        private gameListener: GameListener,
        private playerService: PlayerService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.gameListener.initializeGame(lobbyId);
            } else {
                this.router.navigate(['/home', { replaceUrl: true }]);
            }
        });
    }

    onActionRequest(tile: Tile) {
        this.gameListener.onActionRequest(tile);
    }

    onAttackClick(playerId: string) {
        this.gameListener.onAttackClick(playerId, this.lobbyId);
    }

    onMoveRequest(coordinates: Coordinates[]) {
        this.gameListener.onMoveRequest(coordinates);
    }

    onEndTurn() {
        this.gameListener.onEndTurn();
    }

    ngOnDestroy() {
        this.gameListener.ngOnDestroy();
        this.playerService.ngOnDestroy();
    }
}
