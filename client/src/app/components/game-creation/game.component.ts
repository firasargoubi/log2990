import {Component} from '@angular/core';


@Component({
    selector: 'app-game',
})


export class Game {
    modificationDate = '';              // La dernière date de modification du jeu.
    isVisible = false;                  // La visibilité dans la page d'administration.
    name = '';
    description = '';
    mode = 0;                           // mode 0 : classique, mode 1: capture the gnome
    nbPlayers = 2;                      // Il faudrait affiché un bouton radio permettant de sélectionner le nb de Joueurs
    // grid = new Grid<Tuiles>();       // Prochain à coder.
    imageUrl = '';

}
