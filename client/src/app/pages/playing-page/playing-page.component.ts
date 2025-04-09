/* eslint-disable max-lines */
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { MAP_SIZES, MapSize, PLAYING_PAGE, PLAYING_PAGE_DESCRIPTION } from '@app/consts/app-constants';
import { PageUrl } from '@app/consts/route-constants';
import { GameInteractionService } from '@app/services/game-interaction.service';
import { GameListenerService } from '@app/services/game-listener.service';
import { GameUtilsService } from '@app/services/game-utils.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownPlayerComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent, CombatComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    action: boolean = false;
    currentPlayer: Player;
    lobbyId: string = '';
    opponent: Player | null = null;
    gameState: GameState;
    tileInfo: Tile;
    isCTF: boolean = false;
    isInCombat: boolean = false;
    lobby: GameLobby;
    inventoryItems: number[] = [];
    private debug: boolean = false;
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private gameListenerService = inject(GameListenerService);
    private gameInteractionService = inject(GameInteractionService);
    private gameUtilsService = inject(GameUtilsService);
    private subscriptions: Subscription[] = [];

    get isAnimated(): boolean {
        return this.gameState?.animation ?? false;
    }

    get isPlayerTurn(): boolean {
        return this.gameState?.currentPlayer === this.currentPlayer?.id;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === PLAYING_PAGE.debugKey && this.currentPlayer.isHost) {
            this.setDebugMode();
        }
    }

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.getCurrentPlayer();
                this.subscriptions = this.gameListenerService.setupGameListeners({
                    lobbyId: this.lobbyId,
                    currentPlayer: this.currentPlayer,
                    updateState: (state) => this.updateGameState(state),
                    abandon: () => this.abandon(),
                    syncPlayer: () => this.syncCurrentPlayerWithGameState(),
                    notifyTurn: (id) => this.notifyPlayerTurn(id),
                    getGameState: () => this.gameState,
                });
            } else {
                this.router.navigate([PageUrl.Home], { replaceUrl: true });
            }
        });
    }
    ngOnDestroy(): void {
        this.abandon();
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
    onActionRequest(tile: Tile): void {
        this.gameInteractionService.handleActionRequest(tile, this.currentPlayer, this.gameState, this.lobbyId);
    }
    onMoveRequest(coords: Coordinates[]): void {
        this.gameInteractionService.requestMovement(this.currentPlayer, this.gameState, this.lobbyId, coords);
    }

    handleAction() {
        this.action = !this.action;
    }
    abandon(): void {
        this.gameInteractionService.abandonGame(this.gameState, this.currentPlayer, this.lobbyId, this.router);
    }

    onEndTurn(): void {
        this.gameInteractionService.endTurn(this.currentPlayer, this.gameState, this.lobbyId);
    }

    getGameName(): string {
        return PLAYING_PAGE_DESCRIPTION.gameName;
    }

    getMapSize(): string {
        if (!this.gameState) return 'Unknown';
        const size = this.gameState.board.length;
        if (size === MapSize.SMALL) return MAP_SIZES.small;
        if (size === MapSize.MEDIUM) return MAP_SIZES.medium;
        return MAP_SIZES.large;
    }

    getPlayerCount(): number {
        return this.gameState?.players.length || 0;
    }

    getActivePlayer(): string {
        return this.gameUtilsService.getActivePlayerName(this.gameState);
    }

    getPlayers(): Player[] {
        return this.gameState?.players || [];
    }

    isCurrentPlayerTurn(): boolean {
        return this.gameState?.currentPlayer === this.currentPlayer?.id;
    }

    onInfoSent(details: string): void {
        if (!details) {
            this.notificationService.showError('Aucune information disponible pour cette tuile.');
            return;
        }
        const lines = details.split('\n');
        let info = '';
        lines.forEach((line) => {
            if (line.startsWith('Player:')) {
                const name = line.replace('Player: ', '').trim();
                info += `Joueur: ${name}\n`;
            } else if (line.startsWith('Item:')) {
                const itemId = parseInt(line.replace('Item: ', '').trim(), 10);
                const description = this.gameUtilsService.getItemDescription(itemId);
                info += description !== 'Vide' ? `Objet: ${description}\n` : `Objet inconnu (ID: ${itemId})\n`;
            } else if (line.startsWith('Tile Type:')) {
                const tileTypeId = parseInt(line.replace('Tile Type: ', '').trim(), 10);
                info += `Type de tuile: ${tileTypeId}\n`;
            }
        });
        this.notificationService.showInfo(info || 'Aucune information pertinente pour cette tuile.');
    }

    getCurrentPlayer(): void {
        const player = this.lobbyService.getCurrentPlayer();
        if (player) {
            this.currentPlayer = player;
            const socketId = this.lobbyService.getSocketId();
            if (this.currentPlayer.id !== socketId) {
                this.currentPlayer.id = socketId;
            }
        }
    }
    syncCurrentPlayerWithGameState(): void {
        if (!this.gameState || !this.currentPlayer) return;
        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);
        if (playerInGameState && JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
            this.currentPlayer = playerInGameState;
            this.lobbyService.setCurrentPlayer(this.currentPlayer);
        }
    }

    getDeletedPlayers(): Player[] {
        return this.gameState?.deletedPlayers || [];
    }

    private updateGameState(newGameState: GameState): void {
        this.gameState = newGameState;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);
        if (playerInGameState) {
            this.currentPlayer = playerInGameState;
            this.inventoryItems = this.currentPlayer?.items ?? [];
            this.lobbyService.setCurrentPlayer(this.currentPlayer);
        }

        const combatState = this.gameState.combat;
        if (!combatState || !combatState.isActive) {
            this.isInCombat = false;
        }
    }

    private setDebugMode(): void {
        this.debug = !this.debug;
        this.lobbyService.setDebug(this.lobbyId, this.debug);
    }
    private notifyPlayerTurn(playerId: string): void {
        if (this.currentPlayer?.id === playerId) {
            this.notificationService.showSuccess(PLAYING_PAGE_DESCRIPTION.yourTurn);
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`${PLAYING_PAGE_DESCRIPTION.turnOff} ${player.name}`);
            }
        }
    }
}
