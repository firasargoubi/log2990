import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketClientService } from '@app/services/socketClient.service';
import { Subscription } from 'rxjs';

interface CreatedGame {
    gameId: string;
    players: { name: string }[];
}
interface ChatMessage {
    playerName: string;
    message: string;
}

@Component({
    selector: 'app-chat',
    templateUrl: './socket-client-component.html',
    standalone: true,
    styleUrls: ['./socket-client-component.scss'],
    imports: [FormsModule, CommonModule],
})
export class ChatComponent implements OnInit, OnDestroy {
    messagesByGame: { [gameId: string]: ChatMessage[] } = {};
    createdGames: CreatedGame[] = [];
    messageInput: string = '';
    createPlayerName: string = '';
    joinGameId: string = '';
    joinPlayerName: string = '';
    currentPlayerName: string = '';
    currentGame: CreatedGame | null = null;
    private messageSubscription!: Subscription;

    constructor(private socketService: SocketClientService) {}

    ngOnInit(): void {
        this.messageSubscription = this.socketService.receiveMessage().subscribe((message) => {
            if (!this.messagesByGame[message.gameId]) {
                this.messagesByGame[message.gameId] = [];
            }
            this.messagesByGame[message.gameId].push({ playerName: message.playerName, message: message.message });
        });

        this.socketService.receiveError().subscribe((error) => {
            // console.error('Erreur reçue:', error);
            if (this.currentGame) {
                this.messagesByGame[this.currentGame.gameId].push({ playerName: 'Système', message: error });
            }
        });

        this.socketService.receiveGameCreated().subscribe((data) => {
            const existingGame = this.createdGames.find((g) => g.gameId === data.gameId);

            if (!existingGame) {
                const newGame: CreatedGame = { gameId: data.gameId, players: [{ name: this.createPlayerName }] };
                this.createdGames.push(newGame);
                this.messagesByGame[data.gameId] = [];
            } else {
                // console.warn("Partie déjà existante, pas d'ajout en double :", data.gameId);
            }
        });

        this.socketService.receivePlayerJoined().subscribe((data) => {
            const game = this.createdGames.find((g) => g.gameId === data.gameId);
            if (game) {
                const playerExists = game.players.some((player) => player.name === data.playerName);
                if (!playerExists) {
                    game.players.push({ name: data.playerName });
                    this.createdGames = [...this.createdGames];
                }
            } else {
                this.createdGames.push({ gameId: data.gameId, players: [{ name: data.playerName }] });
                this.messagesByGame[data.gameId] = [];
            }
            if (!this.currentGame && data.gameId) {
                this.currentGame = this.createdGames.find((g) => g.gameId === data.gameId) || null;
            }
            if (!this.messagesByGame[data.gameId]) {
                this.messagesByGame[data.gameId] = [];
            }
        });
        this.socketService.receivePreviousMessages().subscribe((data) => {
            if (!this.messagesByGame[data.gameId]) {
                this.messagesByGame[data.gameId] = [];
            }

            this.messagesByGame[data.gameId] = [...this.messagesByGame[data.gameId], ...data.messages];
        });

        this.socketService.receivePlayerListUpdated().subscribe((data) => {
            // console.log(' Mise à jour des joueurs pour la partie :', data);

            const game = this.createdGames.find((g) => g.gameId === data.gameId);
            if (game) {
                game.players = data.players;
                this.createdGames = [...this.createdGames];
            }
        });
        this.socketService.receiveChatCreated().subscribe((data) => {
            // console.log('Zone de clavardage créée pour la partie :', data.gameId);

            if (!this.messagesByGame[data.gameId]) {
                this.messagesByGame[data.gameId] = data.messages;
            }
            this.currentGame = this.createdGames.find((g) => g.gameId === data.gameId) || null;
        });
    }

    sendMessage(): void {
        if (!this.currentGame || !this.currentPlayerName) {
            return;
        }

        if (this.messageInput.trim()) {
            this.socketService.sendMessage(this.currentGame.gameId, this.messageInput, this.currentPlayerName);
            this.messageInput = '';
        }
    }
    createGame(): void {
        const playerName = this.createPlayerName.trim();
        if (!playerName) {
            return;
        }

        this.socketService.createGame(playerName);
        this.createPlayerName = '';
        this.currentPlayerName = playerName;

        this.socketService.receiveGameCreated().subscribe((data) => {
            const newGame: CreatedGame = { gameId: data.gameId, players: [{ name: playerName }] };
            this.createdGames.push(newGame);
            this.currentGame = newGame;
            this.messagesByGame[newGame.gameId] = [];
        });
    }
    joinGame(): void {
        const gameId = this.joinGameId.trim();
        const playerName = this.joinPlayerName.trim();

        if (!gameId || !playerName) {
            return;
        }

        this.socketService.joinGame(gameId, playerName);
        this.joinGameId = '';
        this.joinPlayerName = '';
        this.currentPlayerName = playerName;

        this.currentGame = this.createdGames.find((g) => g.gameId === gameId) || null;
    }
    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
