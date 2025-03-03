import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketClientService } from '@app/services/socketClient.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    private messageSubscription!: Subscription;

    constructor(private socketService: SocketClientService) {}

    ngOnInit(): void {
        this.messageSubscription = this.socketService.receiveMessage().subscribe((message) => {
            this.messages.push(message);
        });

        this.socketService.receiveError().subscribe((error) => {
            console.error('Erreur reçue:', error);
            this.messages.push(`Erreur: ${error}`);
        });

        this.socketService.receiveGameCreated().subscribe((data) => {
            this.createdGames.push({ gameId: data.gameId, players: [{ name: this.createPlayerName }] });
        });

        this.socketService.receivePlayerJoined().subscribe((data) => {
            console.log('coucou je suis dans receivePlayerJoined');
            const game = this.createdGames.find((g) => g.gameId === data.gameId);
            if (game) {
                console.log("coucou j'ai trouvé un jeu");
                const playerExists = game.players.some((player) => player.name === data.playerName);
                if (!playerExists) {
                    game.players.push({ name: data.playerName });
                    // Utilisez concat pour forcer une nouvelle référence
                    this.createdGames = this.createdGames.concat(); // ou utilisez [...this.createdGames]
                    console.log('Après mise à jour des joueurs dans le jeu:', game);
                }
            } else {
                this.createdGames.push({
                    gameId: data.gameId,
                    players: [{ name: data.playerName }],
                });
            }

            // Vérifiez la mise à jour de createdGames ici
            for (const createdGame of this.createdGames) {
                console.log('Partie actuelle:', createdGame);
                console.log('Liste des joueurs:', createdGame.players);
            }
        });
    }

    sendMessage(): void {
        if (this.messageInput.trim()) {
            this.socketService.sendMessage(this.messageInput);
            this.messageInput = '';
        }
    }
    createGame(): void {
        const playerName = this.createPlayerName.trim();
        if (!playerName) {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
            return;
        }
        this.socketService.createGame(playerName);
        this.createPlayerName = '';
    }

    joinGame(): void {
        const gameId = this.joinGameId.trim().toLowerCase();
        const playerName = this.joinPlayerName.trim();

        if (!gameId || !playerName) {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
            return;
        }
        console.log('Rejoindre la partie:', gameId, playerName);
        this.socketService.joinGame(gameId, playerName);
        this.joinGameId = '';
        this.joinPlayerName = '';
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
