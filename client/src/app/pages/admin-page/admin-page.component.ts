import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Game } from '@app/components/game-card/game-card.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule],
})
export class AdminPageComponent {
   
      
    games: Game[] = [
        // TODO: GET LES JEUX À PARTIR DU SERVEUR
        {
            id: 1,
            name: 'Jeu 1',
            mapSize: '10x10',
            gameMode: 'CTF',
            previewImage: '../assets/',
            description: 'Un jeu de survie palpitant.',
            lastModified: new Date(),
            isVisible: true,
        },
        {
            id: 2,
            name: 'Jeu 2',
            mapSize: '20x20',
            gameMode: 'CTF',
            previewImage: '../assets/',
            description: 'Un jeu d’exploration passionnant.',
            lastModified: new Date(),
            isVisible: true,
        },
        {
            id: 2,
            name: 'Jeu 2',
            mapSize: '20x20',
            gameMode: 'Standard',
            previewImage: '../assets/',
            description: 'Un jeu d’exploration passionnant.',
            lastModified: new Date(),
            isVisible: true,
        },
    ];

    onCreateGame() {
        window.location.href = '/create-game'; 
    }

    onEditGame(game: Game) {
        return game;
        // TODO: Implémenter  l'édition d’un jeu avec serveur et bdd
    }

    onDeleteGame(game: Game) {
        this.games = this.games.filter((g) => g.id !== game.id);
        // TODO: Implémenter  la supression d’un jeu avec serveur et bdd
    }

    onToggleVisibility(event: { game: Game; isVisible: boolean }) {
        const game = this.games.find((g) => g.id === event.game.id);
        if (game) {
            game.isVisible = event.isVisible;
        } // TODO: Implémenter la gestion de la visibilité d’un jeu avec serveur et bdd
    }
}
