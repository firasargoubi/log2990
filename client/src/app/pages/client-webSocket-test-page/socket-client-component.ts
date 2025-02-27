import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketClientService } from '@app/services/socketClient.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat',
    templateUrl: './socket-client-component.html',
    standalone: true,
    styleUrls: ['./socket-client-component.scss'],
    imports: [FormsModule, CommonModule],
})
export class ChatComponent implements OnInit, OnDestroy {
    messages: string[] = [];
    createdGames: string[] = []; // Liste locale des jeux créés
    messageInput: string = '';
    createGameId: string = ''; // ID pour créer une partie
    createPlayerName: string = ''; // Nom du joueur pour créer une partie
    joinGameId: string = ''; // ID pour rejoindre une partie
    joinPlayerName: string = ''; // Nom du joueur pour rejoindre une partie
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
    }

    sendMessage(): void {
        if (this.messageInput.trim()) {
            this.socketService.sendMessage(this.messageInput);
            this.messageInput = ''; // Effacer le champ après l'envoi
        }
    }
    createGame(): void {
        const gameId = this.createGameId.trim().toLowerCase();
        const playerName = this.createPlayerName.trim();

        if (!gameId || !playerName) {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
            return;
        }
        if (this.createdGames.includes(gameId)) {
            this.messages.push(`Le jeu "${gameId}" existe déjà.`);
            return;
        }
        console.log('Envoi de la création du jeu:', gameId, playerName);
        this.socketService.createGame(gameId, playerName);
        this.createdGames.push(gameId);
        this.createGameId = '';
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
