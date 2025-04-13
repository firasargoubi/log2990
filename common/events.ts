export enum GameEvents {
    Connect = 'connect',
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
    AttackEnd = 'attackEnd',
    ChangedSpawn = 'changedSpawnPoint',

    FleeSuccess = 'fleeSuccess',
    FleeFailure = 'fleeFailure',
    ChatMessage = 'chatMessage',

    PlayerJoinedChat = 'playerJoinedChat',
    ChatJoined = 'chatJoined',
    EventLog = 'eventLog',
    GameOver = 'gameOver',
    InventoryFull = 'inventoryFull',
    AttackResult = 'attackResult',
    StartCombat = 'startCombat',
    CombatEnded = 'combatEnded',
    TeamsCreated = 'teamsCreated',
    HostDisconnected = 'hostDisconnected',
}

export enum EventType {
    TurnStarted = 'Le tour a commencé',
    CombatStarted = 'Un combat a commencé',
    CombatEnded = 'Un combat a terminé',
    DoorClosed = 'Une porte a été fermée',
    DoorOpened = 'Une porte a été ouverte',
    DebugActivated = 'Debug activé',
    DebugDeactivated = 'Debug désactivé',
    FlagPicked = 'Le drapeau a été ramassé',
    ItemPicked = 'Un objet a été ramassé',
    PlayerAbandonned = 'Un joueur a abandonné',
    AttackResult = "Résultat de l'attaque",
    FleeSuccess = 'Fuite réussie',
    FleeFailure = 'Fuite échouée',
}

export enum LobbyEvents {
    // Client → Serveur
    CreateLobby = 'createLobby',
    JoinLobby = 'joinLobby',
    LeaveLobby = 'leaveLobby',
    LeaveGame = 'leaveGame',
    LockLobby = 'lockLobby',
    DisconnectFromRoom = 'disconnectFromRoom',
    UpdatePlayers = 'updatePlayers',
    RequestStart = 'requestStart',
    RequestMovement = 'requestMovement',
    Teleport = 'teleport',
    EndTurn = 'endTurn',
    SetDebug = 'setDebug',
    VerifyRoom = 'verifyRoom',
    VerifyAvatars = 'verifyAvatars',
    VerifyUsername = 'verifyUsername',
    PlayerDefeated = 'playerDefeated',
    Attack = 'attack',
    Flee = 'flee',
    StartBattle = 'startBattle',
    ResolveInventory = 'resolveInventory',
    CancelInventoryChoice = 'cancelInventoryChoice',
    OpenDoor = 'openDoor',
    CloseDoor = 'closeDoor',
    CreateTeams = 'createTeams',
    SendMessage = 'sendMessage',
    GetLobby = 'getLobby',
    GetGameId = 'getGameId',

    // Serveur → Client
    LobbyCreated = 'lobbyCreated',
    LobbyLocked = 'lobbyLocked',
    LobbyUpdated = 'lobbyUpdated',
}

export enum EventsMessages {
    GameNotFound = 'Game not found.',
    TeleportError = 'Teleport error',
    LobbyNotFound = 'Lobby not found.',
    LobbyLockedOrFull = 'Lobby is locked or full.',
    InvalidGameId = 'Invalid game ID',
    InvalidLobbyId = 'Invalid lobby ID',
    InvalidCoordinates = 'Invalid coordinates',
    InvalidPlayerData = 'Invalid player data',
    InvalidGameData = 'Invalid game data',
    InvalidDoorOrLobbyData = 'Invalid door or lobby data',
    InvalidLobbyOrPlayerData = 'Invalid lobby or player data'
}


