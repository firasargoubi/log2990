import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketClientService } from '@app/services/socketClient.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat',
    templateUrl: './socket-client-component.html',
    styleUrls: ['./socket-client-component.scss'],
    imports: [FormsModule, CommonModule],
})
export class ChatComponent implements OnInit, OnDestroy {
    messages: string[] = [];
    messageInput: string = '';
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
            this.messageInput = ''; // Effacer le champ après envoi
        }
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
