export const APP_CONSTANTS = {
    notificationDelay: 3000,
    actionLabel: 'Fermer',
};

export enum GameType {
    Classic = 'classic',
    Capture = 'capture',
}

export enum GameSize {
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
}

export interface GameMode {
    type: GameType;
    size: GameSize;
}
export const GAME_CARD_CONSTANTS = {
    successDeleteMessage: 'Jeu supprimé avec succès',
    errorDeleteMessage: 'Impossible de supprimer le jeu',
    successVisibilityMessage: 'Visibilité du jeu mise à jour',
    errorVisibilityMessage: 'Impossible de modifier la visibilité',
};
export const ADMIN_PAGE_CONSTANTS = {
    successFetchMessage: 'Jeux chargés avec succès',
    errorFetchMessage: 'Chargement des jeux impossible, réessayez plus tard.',
};
export const GAME_SERVICE_CONSTANTS = {
    errorDeleteGame: 'Impossible de supprimer le jeu',
    errorUpdateVisibility: 'Impossible de modifier la visibilité.',
    errorFetchGames: 'Impossible de récupérer les jeux',
    errorFetchVisibleGames: 'Impossible de récupérer les jeux visibles.',
    errorFetchGameDetails: 'Impossible de récupérer les détails du jeu.',
    errorCreateGame: 'Impossible de créer le jeu.',
};

export const CREATE_PAGE_CONSTANTS = {
    errorRefreshGames: 'Erreur lors du rafraîchissement des jeux',
    errorLoadingGames: 'Erreur lors du chargement des jeux',
    errorGameDeleted: 'Ce jeu a été supprimé ou sa visibilité a changéee entre temps, Veuillez choisir un autre jeu.',
};

export const GAME_IMAGES = {
    fawn: 'assets/avatar/1.jpg',
    bear:    'assets/avatar/2.jpg',
    castor:    'assets/avatar/3.jpg',
    squirrel1:    'assets/avatar/4.jpg',
    owl:    'assets/avatar/5.jpg',
    rabbit:    'assets/avatar/6.jpg',
    squirrel2:    'assets/avatar/7.jpg',
    pigeon:    'assets/avatar/8.jpg',
    rat:    'assets/avatar/9.jpg',
    fox:    'assets/avatar/10.jpg',
    dear:    'assets/avatar/11.jpg',
    raccoon:    'assets/avatar/12.jpg',

    water: 'assets/tiles/water.png',
    grass: 'assets/tiles/grass.png',
    ice: 'assets/tiles/ice2.png',
    wall: 'assets/tiles/wall.png',
    doorClosed: 'assets/tiles/door_c.png',
    doorOpen: 'assets/tiles/door_o.png',
    default: 'assets/tiles/grass.png',

    boots: 'assets/objects/boots.png',
    sword: 'assets/objects/sword.png',
    potion: 'assets/objects/potion.png',
    wand: 'assets/objects/wand.png',
    crystalBall: 'assets/objects/crystal_ball.png',
    berryJuice: 'assets/objects/berry-juice.png',
    vortex: 'assets/objects/vortex.png',
    gnome: 'assets/objects/gnome.png',
    undefined: 'assets/objects/undefined.png',
    
}