import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Coordinates } from '@common/coordinates';
import { Tile } from '@common/game.interface';
import { AttackResult } from '@common/socket-interfaces';

export interface AnimationState {
    isAnimating: boolean;
    type: 'move' | 'door' | 'teleport' | 'combat' | 'none';
    playerId: string;
    data?: any;
    actionId?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AnimationService {
    private animationState = new BehaviorSubject<AnimationState>({
        isAnimating: false,
        type: 'none',
        playerId: '',
    });

    private readonly ANIMATION_DURATIONS = {
        move: 300, // ms per tile
        door: 200,
        teleport: 500,
        combat: 1000,
    };

    constructor() {}

    getAnimationState(): Observable<AnimationState> {
        return this.animationState.asObservable();
    }

    // Start a movement animation
    async animateMovement(playerId: string, path: Coordinates[], actionId: string): Promise<void> {
        return new Promise((resolve) => {
            this.animationState.next({
                isAnimating: true,
                type: 'move',
                playerId,
                data: { path },
                actionId,
            });

            // Calculate total animation time based on path length
            const duration = path.length * this.ANIMATION_DURATIONS.move;

            setTimeout(() => {
                this.animationState.next({
                    isAnimating: false,
                    type: 'none',
                    playerId: '',
                });
                resolve();
            }, duration);
        });
    }

    // Start a door animation
    async animateDoor(playerId: string, tile: Tile, isOpening: boolean, actionId: string): Promise<void> {
        return new Promise((resolve) => {
            this.animationState.next({
                isAnimating: true,
                type: 'door',
                playerId,
                data: { tile, isOpening },
                actionId,
            });

            setTimeout(() => {
                this.animationState.next({
                    isAnimating: false,
                    type: 'none',
                    playerId: '',
                });
                resolve();
            }, this.ANIMATION_DURATIONS.door);
        });
    }

    // Start a teleport animation
    async animateTeleport(playerId: string, from: Coordinates, to: Coordinates, actionId: string): Promise<void> {
        return new Promise((resolve) => {
            this.animationState.next({
                isAnimating: true,
                type: 'teleport',
                playerId,
                data: { from, to },
                actionId,
            });

            setTimeout(() => {
                this.animationState.next({
                    isAnimating: false,
                    type: 'none',
                    playerId: '',
                });
                resolve();
            }, this.ANIMATION_DURATIONS.teleport);
        });
    }

    // Start a combat animation
    async animateCombat(attacker: string, defender: string, attackResult: AttackResult, actionId: string): Promise<void> {
        return new Promise((resolve) => {
            this.animationState.next({
                isAnimating: true,
                type: 'combat',
                playerId: attacker,
                data: { defender, attackResult },
                actionId,
            });

            setTimeout(() => {
                this.animationState.next({
                    isAnimating: false,
                    type: 'none',
                    playerId: '',
                });
                resolve();
            }, this.ANIMATION_DURATIONS.combat);
        });
    }
}
