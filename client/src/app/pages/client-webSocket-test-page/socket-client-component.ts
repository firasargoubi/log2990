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
    messageInput: string = '';
    gameId: string = '';
    playerName: string = '';
    private messageSubscription!: Subscription;

    constructor(private socketService: SocketClientService) {}

    ngOnInit(): void {
        this.messageSubscription = this.socketService.receiveMessage().subscribe((message) => {
            this.messages.push(message);
        });
    }

    sendMessage(): void {
        if (this.messageInput.trim()) {
            this.socketService.sendMessage(this.messageInput);
            this.messageInput = ''; // Effacer le champ après l'envoi
        }
    }

    createGame(): void {
        if (this.gameId.trim() && this.playerName.trim()) {
            console.log(this.gameId, this.playerName);
            this.socketService.createGame(this.gameId, this.playerName);
        } else {
            this.messages.push('Veuillez entrer un ID de jeu et un nom.');
        }
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
