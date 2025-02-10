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
