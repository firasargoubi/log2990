/* eslint-disable @typescript-eslint/no-explicit-any */
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { Coordinates } from '@common/coordinates';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { DefaultMovementStrategy } from './default-movement-strategy';

describe('DefaultMovementStrategy', () => {
    let strategy: DefaultMovementStrategy;
    let mockService: sinon.SinonStubbedInstance<VirtualPlayerService>;
    let config: VirtualMovementConfig;
    const playerIndex = 0;

    beforeEach(() => {
        mockService = sinon.createStubInstance(VirtualPlayerService);
        strategy = new DefaultMovementStrategy(mockService as unknown as VirtualPlayerService);

        config = {
            gameState: {
                board: [],
                playerPositions: [{ x: 0, y: 0 }],
                teams: {
                    team1: [],
                    team2: [],
                },
                players: [],
                id: '',
                turnCounter: 0,
                currentPlayer: '',
                availableMoves: [],
                shortestMoves: [],
                spawnPoints: [{ x: 10, y: 10 }], // Point de spawn pour le joueur 0
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
                debug: false,
                gameMode: '',
            },
            virtualPlayer: {
                items: [],
                name: 'TestBot',
                pendingItem: 0,
                id: '',
                avatar: '',
                isHost: false,
                life: 0,
                maxLife: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                winCount: 0,
            },
            lobbyId: 'test-lobby',
            getGameState: () => config.gameState,
            boardService: {} as any,
            callbacks: {} as any,
        };
    });

    describe('determineTarget', () => {
        it('should return the move closest to spawn point', () => {
            const availableMoves = [
                { x: 5, y: 5 },
                { x: 8, y: 8 },
                { x: 12, y: 12 },
            ];
            const expectedMove = { x: 8, y: 8 };

            mockService['getClosest'].withArgs(config.gameState.spawnPoints[playerIndex], availableMoves).returns(expectedMove);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);

            expect(result).to.deep.equal(expectedMove);
            // expect(mockService['getClosest'].calledOnceWithExactly(config.gameState.spawnPoints[playerIndex], availableMoves)).to.be.true;
        });

        it('should handle empty available moves by returning spawn point', () => {
            const availableMoves: Coordinates[] = [];
            const spawnPoint = config.gameState.spawnPoints[playerIndex];

            mockService['getClosest'].withArgs(spawnPoint, availableMoves).returns(spawnPoint);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);

            expect(result).to.deep.equal(spawnPoint);
        });

        it('should use the correct spawn point for the player index', () => {
            const testPlayerIndex = 1;
            config.gameState.spawnPoints[testPlayerIndex] = { x: 20, y: 20 };
            const availableMoves = [{ x: 15, y: 15 }];
            const expectedMove = { x: 15, y: 15 };

            mockService['getClosest'].withArgs(config.gameState.spawnPoints[testPlayerIndex], availableMoves).returns(expectedMove);

            const result = strategy.determineTarget(config, availableMoves, testPlayerIndex);

            expect(result).to.deep.equal(expectedMove);
            // expect(mockService['getClosest'].calledWith(config.gameState.spawnPoints[testPlayerIndex], availableMoves)).to.be.true;
        });
    });
});
