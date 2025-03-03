import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketClientService } from '@app/services/socketClient.service';
import { Subscription } from 'rxjs';

interface CreatedGame {
    gameId: string;
    players: { name: string }[];
}

@Component({
    selector: 'app-chat',
    templateUrl: './socket-client-component.html',
    standalone: true,
    styleUrls: ['./socket-client-component.scss'],
    imports: [FormsModule, CommonModule],
})
export class ChatComponent implements OnInit, OnDestroy {
    messages: string[] = [];
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
            this.messages.push(`${message.playerName}: ${message.message}`);
        });

        this.socketService.receiveError().subscribe((error) => {
            console.error('Erreur reçue:', error);
            this.messages.push(`Erreur: ${error}`);
        });

        this.socketService.receiveGameCreated().subscribe((data) => {
            const existingGame = this.createdGames.find((g) => g.gameId === data.gameId);
            if (!existingGame) {
                this.createdGames.push({ gameId: data.gameId, players: [{ name: this.createPlayerName }] });
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
            }
        });
    }

    sendMessage(): void {
        if (!this.currentPlayerName) {
            this.messages.push('Vous devez être dans une partie pour envoyer un message.');
            return;
        }

        let activeGame = this.createdGames.find((g) => g.players.some((p) => p.name.toLowerCase() === this.currentPlayerName.toLowerCase()));

        if (!activeGame && this.joinGameId) {
            activeGame = this.createdGames.find((g) => g.gameId === this.joinGameId);
        }

        if (!activeGame) {
            this.messages.push('Vous devez être dans une partie pour envoyer un message.');
            return;
        }

        if (this.messageInput.trim()) {
            this.socketService.sendMessage(activeGame.gameId, this.messageInput, this.currentPlayerName);
            this.messageInput = '';
        }
    }

    createGame(): void {
        const playerName = this.createPlayerName.trim();
        if (!playerName) {
            this.messages.push('Veuillez entrer un nom.');
            return;
        }

        this.socketService.createGame(playerName);
        this.createPlayerName = '';
        this.currentPlayerName = playerName;

        this.socketService.receiveGameCreated().subscribe((data) => {
            const existingGame = this.createdGames.find((g) => g.gameId === data.gameId);
            if (!existingGame) {
                const newGame: CreatedGame = { gameId: data.gameId, players: [{ name: playerName }] };
                this.createdGames.push(newGame);
                this.currentGame = newGame;
            }
        });
    }

    joinGame(): void {
        const gameId = this.joinGameId.trim();
        const playerName = this.joinPlayerName.trim();

        if (!gameId || !playerName) {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
            return;
        }

        this.socketService.joinGame(gameId, playerName);
        this.joinGameId = '';
        this.joinPlayerName = '';
        this.currentPlayerName = playerName;
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
