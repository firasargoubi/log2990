export enum GameSocketConstants {
    DefaultCountdown = 5,
    EscapeCountdown = 3,
    TimeOutMovement = 150,
    FleeingChancePercentage = 100,
}

export const gameSocketMessages = {
    lobbyNotFound: 'Lobby not found.',
    onlyHostStart: 'Only the host can start the game.',
    failedStartGame: 'Failed to start game:',
    gameNotFound: 'Game not found.',
    notYourTurn: "It's not your turn.",
    failedEndTurn: 'Failed to end turn:',
    movementError: 'Movement error: ',
    turnError: 'Turn error:',
};
