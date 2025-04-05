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
    TeamsCreated = 'teamsCreated',
    EventLog = 'eventLog',
}

export enum EventType {
    TurnStarted = 'Le tour a commencé',
    CombatStarted = 'Un combat a commencé',
    CombatEnded = 'Un combat a terminé',
    DoorClosed = 'Une porte a été fermée',
    DoorOpened = 'Une porte a été ouverte',
    DebugActivated = 'Debug activé',
    DebugDeactivated = 'Debug désactivé',
}