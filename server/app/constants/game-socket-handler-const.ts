export enum GameSocketConstants {
    DefaultCountdown = 5,
    EscapeCountdown = 3,
    AnimationDelayMs = 150,
    MaxWinCount = 3,
    FleeRatePercent = 30,
    D4Value = 4,
    D6Value = 6,
    MaxFlee = 100,
    PlayerTeamConst = 0.5,
    CombatTurnDelay = 1000,
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
    notEnoughPlayers: "Il n'y a pas assez de joueurs pour commencer une partie CTF",
    sameTeam: 'Vous ne pouvez pas commencer un combat contre un membre de votre équipe',
};
