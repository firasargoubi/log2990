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
    gameId: string = '';
    playerName: string = '';
    private messageSubscription!: Subscription;

    constructor(private socketService: SocketClientService) {}

    ngOnInit(): void {
        this.messageSubscription = this.socketService.receiveMessage().subscribe((message) => {
            this.messages.push(message);
        });

        // Écoute des erreurs
        // this.socketService.receiveError().subscribe((error) => {
        //     console.error('Erreur reçue:', error);
        //     this.messages.push(`Erreur: ${error}`);
        // });
    }

    sendMessage(): void {
        if (this.messageInput.trim()) {
            this.socketService.sendMessage(this.messageInput);
            this.messageInput = ''; // Effacer le champ après l'envoi
        }
    }
    createGame(): void {
        this.gameId = this.gameId.trim().toLowerCase(); // Normaliser l'ID
        this.playerName = this.playerName.trim();

        if (!this.gameId || !this.playerName) {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
            return;
        }
        if (this.createdGames.includes(this.gameId)) {
            this.messages.push(`Le jeu "${this.gameId}" existe déjà.`);
            return;
        }
        console.log('Envoi de la création du jeu:', this.gameId, this.playerName);
        this.socketService.createGame(this.gameId, this.playerName);
        this.createdGames.push(this.gameId);
    }
    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
