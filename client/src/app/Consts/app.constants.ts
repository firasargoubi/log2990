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
