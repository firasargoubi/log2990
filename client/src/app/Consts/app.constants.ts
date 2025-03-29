import { GameSize, GameType } from '@common/game.interface';

export const APP_CONSTANTS = {
    notificationDelay: 3000,
    actionLabel: 'Fermer',
};

export enum ObjectsTypes {
    BOOTS = 0,
    SWORD = 1,
    POTION = 2,
    WAND = 3,
    CRYSTAL = 4,
    JUICE = 5,
    SPAWN = 6,
    RANDOM = 7,
}

export { GameSize, GameType };

export enum TileTypes {
    Grass = 1,
    Water = 2,
    Ice = 3,
    DoorClosed = 4,
    DoorOpen = 5,
    Wall = 6,
}

export enum MapSize {
    SMALL = 10,
    MEDIUM = 15,
    LARGE = 20,
}

export enum ObjectAmount {
    SMALL = 2,
    MEDIUM = 4,
    LARGE = 6,
}

export interface GameMode {
    type: GameType;
    size: GameSize;
}

export const DEFAULT_STAT_VALUE = 4;
export const SIX_VALUE_DICE = 6;
export const MAX_OBJECTS = 7;
export const MAX_TILE = 6;
export const PULLING_INTERVAL = 5000;
export const WANTED_TILE_PERCENTAGE = 0.5;
export const OBJECT_MULTIPLIER = 10;
export const RIGHT_CLICK = 2;
export const TIMEOUT_START_COMBAT = 1000;
export const TURN_START_TIME = 30;
export const PAD_TIME_VALUE = 10;

export const GAME_CARD_CONSTANTS = {
    successDeleteMessage: 'Jeu supprimé avec succès',
    errorDeleteMessage: 'Impossible de supprimer le jeu',
    successVisibilityMessage: 'Visibilité du jeu mise à jour',
    errorVisibilityMessage: 'Impossible de modifier la visibilité',
};

export const MAIN_PAGE_CONSTANTS = {
    successJoinMessage: 'Salle Rejointe',
    errorFullLobbyMessage: 'La salle est pleine',
    errorLockedLobbyMessage: 'La salle est verrouillée',
    errorJoinMessage: 'Impossible de rejoindre la salle',
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
    errorLobbyCreation: 'Impossible de créer le lobby',
    errorMissingBonuses: 'Veuillez attribuer le bonus de +2 pour la vie ou la vitesse et le bonus de dé (6 faces) pour l’attaque ou la défense.',
    errorEmptyBonuses: 'Veuillez remplir toutes les conditions de bonus.',
};

export const EDITION_PAGE_CONSTANTS = {
    errorGameNameRequired: 'Le nom du jeu est requis.',
    errorGameDescriptionRequired: 'La description du jeu est requise.',
    errorInvalidSpawns: 'Il faut mettre tous les points de departs.',
    errorInvalidMinTiles: 'Il faut que la moitie soit couverte de tuiles de terrain (eau, glace, terre).',
    errorInvalidAccess: 'Il faut pouvoir acceder a toutes les tuiles',
    errorInvalidDoors: "Une de vos portes n'est pas valide",
    errorGameNameExists: 'Ce nom de jeu existe déjà.',
    successGameLoaded: 'Jeu chargé avec succès.',
    errorGameLoad: 'Impossible de charger le jeu.',
    successGameSaved: 'Jeu sauvegardé avec succès.',
};
export const WAITING_PAGE_CONSTANTS = {
    gameLocked: 'La partie est verrouillée',
    gameUnlocked: 'La partie est déverrouillée',
    errorStartGame: 'Impossible de démarrer la partie',
    errorPlayerKicked: "Vous avez été expulsé par l'administrateur",
    lobbyCancelled: 'La partie a été annulée',
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

export const GAME_SIZE = {
    small: 'Petite',
    medium: 'Moyenne',
    large: 'Grande',
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

export const PLAYING_PAGE = {
    debugKey: 'd',
    lobbyIdParam: 'id',
    homeRoute: '/home',
    defaultActionPoints: 1,
    ctf: 'capture',
};

export const PLAYING_PAGE_DESCRIPTION = {
    combatFlee: 'Vous avez fuit le combat.',
    endCombat: 'a fini son combat',
    gameName: 'Forest Adventure',
    yourTurn: "C'est votre tour!",
    turnOff: "C'est le tour de",
    fleeYou: 'Vous avez fui le combat.',
    hasFled: 'a fui le combat.',
    hasFinishedCombat: 'a fini son combat',
};

export const DELAY_COUNTDOWN = 1000;

export const WAITING_PAGE = {
    lobbyIdParam: 'id',
    playerIdParam: 'playerId',

    defaultPlayerId: '0000',
    defaultPlayerName: 'Unknown',
    defaultHostId: '0000',

    lobbyCancelled: "La partie a été annulée, l'hôte a quitté le lobby.",
    gameLocked: 'La partie est désormais verrouillée.',
    errorStartGame: 'Impossible de démarrer la partie. Veuillez réessayer.',
};
