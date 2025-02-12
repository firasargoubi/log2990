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
    bear: 'assets/avatar/2.jpg',
    castor: 'assets/avatar/3.jpg',
    squirrel1: 'assets/avatar/4.jpg',
    owl: 'assets/avatar/5.jpg',
    rabbit: 'assets/avatar/6.jpg',
    squirrel2: 'assets/avatar/7.jpg',
    pigeon: 'assets/avatar/8.jpg',
    rat: 'assets/avatar/9.jpg',
    fox: 'assets/avatar/10.jpg',
    dear: 'assets/avatar/11.jpg',
    raccoon: 'assets/avatar/12.jpg',

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
};

export const GAME_MODES = {
    classic: 'Classique',
    capture: 'Capture',
};

// Map Size Translation Dictionary
export const GAME_SIZE = {
    small: 'Petite',
    medium: 'Moyenne',
    large: 'Grande',
};

export const OBJECT_NAMES = {
    boots: 'Bottes de vitesse',
    sword: 'Épée de puissance',
    potion: 'Potion de soin',
    wand: 'Baguette magique',
    crystalBall: 'Boule de cristal',
    berryJuice: 'Jus de baies',
    vortex: 'Vortex',
    gnome: 'Gnome',
    undefined: 'Objet inconnu',
};

export const OBJECTS_DESCRIPTION = {
    boots: 'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!',
    sword: 'Cette épée effectue plus de dégats sur vos ennemis!',
    potion: 'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...',
    wand: "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
    crystal: "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis.",
    berryJuice: 'Ne paniquez pas, ce nectar soignera toutes vos blessures!',
    vortex: "Cet objet indique l'endroit où une bataille épique est sur le point d'avoir lieu",
    gnome: 'Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...',
    undefined: 'Objet inconnu',
};
export const EDITION_PAGE_CONSTANTS = {
    errorGameNameRequired: 'Le nom du jeu est requis.',
    errorGameDescriptionRequired: 'La description du jeu est requise.',
    errorInvalidName: 'Le nom est invalide.',
    successGameLoaded: 'Jeu chargé avec succès.',
    errorGameLoad: 'Impossible de charger le jeu.',
    successGameSaved: 'Jeu sauvegardé avec succès.',
};
export const MAP_SIZES = {
    small: 'small',
    medium: 'medium',
    large: 'large',
};

export const OBJECT_COUNT = {
    small: 2,
    medium: 4,
    large: 6,
};
