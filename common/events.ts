export enum GameEvents {
    Error = 'error',
    GameStarted = 'gameStarted',
    TurnStarted = 'turnStarted',
    TurnEnded = 'turnEnded',
    MovementProcessed = 'movementProcessed',
    BoardModified = 'boardModified',
    PlayerSwitch = 'PlayerSwitch',
    PlayerTurn = 'PlayerTurn',
    PlayersBattling = 'playersBattling',
    UpdateHealth = 'update-health',
    FleeSuccess = 'fleeSuccess',
    FleeFailure = 'fleeFailure',
    AttackEnd = 'attackEnd',
    ChangedSpawn = 'changedSpawnPoint',
}
