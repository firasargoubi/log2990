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
import { MAP_SIZES, MapSize, PLAYING_PAGE, PLAYING_PAGE_DESCRIPTION } from '@app/Consts/app-constants';
import { PageUrl } from '@app/Consts/route-constants';
import { ActionService } from '@app/services/action.service';
import { ChatService } from '@app/services/chat.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
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
    private actionService = inject(ActionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private subscriptions: Subscription[] = [];
    private chatService: ChatService = inject(ChatService);

    get isAnimated(): boolean {
        return this.gameState.animation || false;
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

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();

                this.getCurrentPlayer();
            } else {
                this.router.navigate([PageUrl.Home], { replaceUrl: true });
            }
        });

        if (this.gameState) {
            this.gameState.currentPlayerActionPoints = 1;
        }
    }

    onActionRequest(tile: Tile) {
        if (!this.isCurrentPlayerTurn() || this.gameState.animation) return;

        if (this.gameState.currentPlayerActionPoints <= 0) {
            this.notificationService.showError("Vous n'avez plus de points d'action.");
            return;
        }
        const action = this.actionService.getActionType(tile, this.gameState);
        if (!action) return;
        this.action = !this.action;
        if (action === 'openDoor') {
            this.lobbyService.openDoor(this.lobbyId, tile);
            return;
        }
        if (action === 'closeDoor') {
            this.lobbyService.closeDoor(this.lobbyId, tile);
            return;
        }

        if (action === 'battle') {
            const opponent = this.actionService.findOpponent(tile);
            const isSameTeam = opponent ? this.isSameTeam(this.currentPlayer, opponent) : false;
            if (isSameTeam) {
                this.isInCombat = false;
                if (opponent) {
                    this.lobbyService.startCombat(this.lobbyId, this.currentPlayer, opponent);
                }
                return;
            }
            this.isInCombat = true;
            if (opponent) {
                this.lobbyService.startCombat(this.lobbyId, this.currentPlayer, opponent);
            }
        }
    }

    handleAction() {
        this.action = !this.action;
    }

    ngOnDestroy() {
        this.abandon();
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    onMoveRequest(coordinates: Coordinates[]) {
        if (!this.gameState || !this.currentPlayer) {
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            return;
        }

        this.lobbyService.requestMovement(this.lobbyId, coordinates);
    }

    onEndTurn() {
        if (!this.gameState || !this.currentPlayer) {
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            return;
        }

        this.lobbyService.requestEndTurn(this.lobbyId);
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
        if (!this.gameState) return 'Unknown';
        const player = this.gameState.players.find((p) => p.id === this.gameState?.currentPlayer);
        return player?.name || 'Unknown';
    }

    getPlayers(): Player[] {
        return this.gameState?.players || [];
    }

    isCurrentPlayerTurn(): boolean {
        if (!this.gameState || !this.currentPlayer) {
            return false;
        }

        const result = this.gameState.currentPlayer === this.currentPlayer.id;
        return result;
    }

    abandon() {
        if (!this.gameState || !this.currentPlayer) {
            this.router.navigate([PageUrl.Home], { replaceUrl: true });
            return;
        }
        const isAnimated = this.gameState.animation || false;
        if (isAnimated) {
            return;
        }
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.disconnect();
            this.router.navigate([PageUrl.Home], { replaceUrl: true });
        }
    }

    onInfoSent(details: string) {
        if (!details) {
            this.notificationService.showError('Aucune information disponible pour cette tuile.');
            return;
        }
        const lines = details.split('\n');
        let info = '';
        lines.forEach((line) => {
            if (line.startsWith('Player:')) {
                const playerName = line.replace('Player: ', '').trim();
                info += `Joueur: ${playerName}\n`;
            } else if (line.startsWith('Item:')) {
                const itemId = parseInt(line.replace('Item: ', '').trim(), 10);
                const itemDescription = this.getItemDescription(itemId);
                info += itemDescription && itemDescription !== 'Vide' ? `Objet: ${itemDescription}\n` : `Objet inconnu (ID: ${itemId})\n`;
            } else if (line.startsWith('Tile Type:')) {
                const tileTypeId = parseInt(line.replace('Tile Type: ', '').trim(), 10);
                info += `Type de tuile: ${tileTypeId}\n`;
            }
        });
        if (!info) {
            info = 'Aucune information pertinente pour cette tuile.';
        }
        this.notificationService.showInfo(info);
    }

    getCurrentPlayer() {
        const currentPlayer = this.lobbyService.getCurrentPlayer();

        if (!currentPlayer) {
            return;
        }
        this.currentPlayer = currentPlayer;
        const socketId = this.lobbyService.getSocketId();
        if (this.currentPlayer.id !== socketId) {
            this.currentPlayer.id = socketId;
        }

        return;
    }

    syncCurrentPlayerWithGameState() {
        if (!this.gameState || !this.currentPlayer) return;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);

        if (playerInGameState) {
            if (JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
                this.currentPlayer = playerInGameState;
                this.lobbyService.setCurrentPlayer(this.currentPlayer);
            }
        }
    }

    getDeletedPlayers(): Player[] {
        return this.gameState?.deletedPlayers || [];
    }

    private setupGameListeners() {
        this.subscriptions.push(
            this.lobbyService.onStartCombat().subscribe(() => {
                this.isInCombat = true;
            }),

            this.lobbyService.onCombatEnded().subscribe((data) => {
                this.isInCombat = false;
                this.currentPlayer.amountEscape = 0;
                this.notificationService.showInfo(`Le combat est terminée! ${data.loser.name} a perdu !`);
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                this.gameState = data.gameState;
                if (this.gameState.gameMode === PLAYING_PAGE.ctf) {
                    this.isCTF = true;
                    if (!this.gameState.teams) {
                        this.lobbyService.createTeams(this.lobbyId, this.gameState.players);
                    }
                }
                this.syncCurrentPlayerWithGameState();
                this.notifyPlayerTurn(data.currentPlayer);
            }),

            this.lobbyService.onMovementProcessed().subscribe((data) => {
                this.updateGameState(data.gameState);
                this.inventoryItems = this.currentPlayer?.items ?? [];
                if (
                    !this.gameState.availableMoves.length &&
                    !this.canPerformAction() &&
                    this.isCurrentPlayerTurn() &&
                    !this.isAnimated &&
                    !this.currentPlayer.pendingItem
                ) {
                    this.lobbyService.requestEndTurn(this.lobbyId);
                }
            }),

            this.lobbyService.onError().subscribe((error) => {
                this.notificationService.showError(error);
            }),

            this.lobbyService.onLobbyUpdated().subscribe((data) => {
                if (data.lobby.id === this.lobbyId) {
                    this.lobby = data.lobby;
                    this.chatService.joinLobby(this.lobbyId);

                    const currentPlayer = this.lobby.players.find((p) => p.id === this.currentPlayer.id);
                    if (!currentPlayer) {
                        this.lobbyService.disconnectFromRoom(this.lobbyId);
                        this.router.navigate([PageUrl.Home], { replaceUrl: true });
                        return;
                    }
                    this.lobbyService.updatePlayers(this.lobby.id, this.lobby.players);
                }
            }),

            this.lobbyService.onBoardChanged().subscribe((data) => {
                this.updateGameState(data.gameState);
                if (!this.gameState.currentPlayerMovementPoints && !this.canPerformAction() && this.isCurrentPlayerTurn()) {
                    this.lobbyService.requestEndTurn(this.lobbyId);
                }
            }),

            this.lobbyService.onFleeSuccess().subscribe((data) => {
                this.isInCombat = false;
                if (this.currentPlayer.name === data.fleeingPlayer.name) {
                    this.notificationService.showInfo('Vous avez fuit le combat.');
                    return;
                }
                this.notificationService.showInfo(`${data.fleeingPlayer.name} a fui le combat.`);
            }),

            this.lobbyService.onGameOver().subscribe((data) => {
                this.abandon();
                this.notificationService.showInfo(`${data.winner} gagne(ent), La partie est terminée.`);
            }),

            this.lobbyService.teamCreated().subscribe((data) => {
                if (data) {
                    this.gameState = {
                        ...this.gameState,
                        teams: {
                            team1: data.team1Server,
                            team2: data.team2Server,
                        },
                    };
                }
            }),
        );
    }

    private isSameTeam(player1: Player, player2: Player): boolean {
        if (!this.gameState || !this.gameState.teams) {
            return false;
        }
        const { team1, team2 } = this.gameState.teams;
        return (
            (team1.some((player) => player.id === player1.id) && team1.some((player) => player.id === player2.id)) ||
            (team2.some((player) => player.id === player1.id) && team2.some((player) => player.id === player2.id))
        );
    }

    private canPerformAction(): boolean {
        if (this.gameState.currentPlayerActionPoints <= 0) {
            return false;
        }

        const playerIndex = this.gameState.players.findIndex((p) => p.id === this.currentPlayer.id);
        const playerPosition = this.gameState.playerPositions[playerIndex];

        const adjacentTiles: Coordinates[] = [
            { x: playerPosition.x, y: playerPosition.y - 1 }, // Up
            { x: playerPosition.x, y: playerPosition.y + 1 }, // Down
            { x: playerPosition.x - 1, y: playerPosition.y }, // Left
            { x: playerPosition.x + 1, y: playerPosition.y }, // Right
        ];
        for (const tile of adjacentTiles) {
            if (tile.x < 0 || tile.x >= this.gameState.board.length || tile.y < 0 || tile.y >= this.gameState.board[0].length) {
                continue;
            }
            const tileType = this.gameState.board[tile.x][tile.y] % TILE_DELIMITER;
            if (tileType === TileTypes.DoorClosed || tileType === TileTypes.DoorOpen) {
                return true;
            }
            if (this.gameState.playerPositions.findIndex((p) => p.x === tile.x && p.y === tile.y) !== -1) {
                return true;
            }
        }
        return false;
    }

    private updateGameState(newGameState: GameState): void {
        this.gameState = newGameState;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);
        if (playerInGameState) {
            this.currentPlayer = playerInGameState;
            this.lobbyService.setCurrentPlayer(this.currentPlayer);
        }

        const combatState = this.gameState.combat;
        if (!combatState || !combatState.isActive) {
            this.isInCombat = false;
        }
    }

    private setDebugMode() {
        this.debug = !this.debug;
        this.lobbyService.setDebug(this.lobbyId, this.debug);
    }

    private notifyPlayerTurn(playerId: string) {
        if (this.currentPlayer && playerId === this.currentPlayer.id) {
            this.notificationService.showSuccess(PLAYING_PAGE_DESCRIPTION.yourTurn);
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`${PLAYING_PAGE_DESCRIPTION.turnOff} ${player.name}`);
            }
        }
    }

    private getItemDescription(itemId: number): string | null {
        const itemDescriptions: Record<number, { name: string; description: string }> = {
            [ObjectsTypes.SPAWN]: { name: 'Point de départ', description: 'Le point de départ du jeu' },
        };
        return itemDescriptions[itemId]?.name || 'Vide';
    }
}
