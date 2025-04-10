import { GameLifecycleService } from './game-life-cycle.service';
import { Socket } from 'socket.io';
import { Player } from '@common/player';

export class EventBus {
    constructor(private gameLifeCycle: GameLifecycleService | null) {}

    setService(service: GameLifecycleService | null) {
        this.gameLifeCycle = service;
    }

    onPlayerUpdate(socket: Socket, lobbyId: string, player: Player) {
        console.log("updating players properly");
        this.gameLifeCycle.handlePlayersUpdate(socket, lobbyId, player);
    }
}
