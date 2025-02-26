import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketClientService } from '@app/services/socketClient.service';

interface Player {
    id: string;
    name: string;
}
@Component({
    selector: 'app-socket-client',
    imports: [CommonModule, FormsModule],
    templateUrl: './socket-client-component.html',
    styleUrls: ['./socket-client-component.scss'],
})
export class SocketClientComponent implements OnInit {
    gameId = '';
    playerName = '';
    messages: { playerId: string; message: string }[] = [];
    players: Player[] = [];
    newMessage = '';
    constructor(private socketService: SocketClientService) {}

    ngOnInit() {
        this.socketService.connect();
        this.connectionToServer();

        this.socketService.on('playerJoined', (players) => {
            this.players = players as Player[];
        });

        this.socketService.on('chatMessage', (data) => {
            this.messages.push(data as { playerId: string; message: string });
        });

        this.socketService.on('gameStarted', () => {
            alert('La partie a commencé !');
        });

        this.socketService.on('playerLeft', (playerId) => {
            this.players = this.players.filter((p) => p.id !== playerId);
        });

        this.socketService.on('playersList', (players) => {
            this.players = players as Player[];
        });
    }

    connectionToServer() {
        this.socketService.on('connect', () => {
            console.log(`Connexion par WebSocket réussie avec le socket ${this.socketService.socket.id}`);
        });

        this.socketService.on('connect_error', (error) => {
            console.error('Erreur de connexion WebSocket :', error);
        });

        this.socketService.on('disconnect', () => {
            console.log('Déconnecté du serveur WebSocket');
        });
    }
    createGame() {
        this.socketService.send('createGame', { gameId: this.gameId, playerName: this.playerName });
    }

    joinGame() {
        this.socketService.send('joinGame', { gameId: this.gameId, playerName: this.playerName });
    }

    sendMessage() {
        if (this.newMessage.trim()) {
            this.socketService.send('message', { gameId: this.gameId, message: this.newMessage });
            this.newMessage = '';
        }
    }

    startGame() {
        this.socketService.send('startGame', { gameId: this.gameId });
    }

    leaveGame() {
        this.socketService.send('leaveGame', { gameId: this.gameId });
    }

    getPlayers() {
        this.socketService.send('getPlayers', { gameId: this.gameId });
    }
}
