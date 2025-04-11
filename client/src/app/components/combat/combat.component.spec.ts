/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { CombatComponent } from './combat.component';

describe('CombatComponent', () => {
    let component: CombatComponent;
    let fixture: ComponentFixture<CombatComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    let attackResultSubject: BehaviorSubject<{
        attackRoll: number;
        defenseRoll: number;
        attackDice: number;
        defenseDice: number;
        damage: number;
        attackerHP: number;
        defenderHP: number;
        attacker: Player;
        defender: Player;
    }>;
    let fleeFailureSubject: BehaviorSubject<{ fleeingPlayer: Player }>;
    let startCombatSubject: BehaviorSubject<{ firstPlayer: Player }>;
    let combatEndedSubject: BehaviorSubject<{ loser: Player }>;

    beforeEach(async () => {
        jasmine.clock().install();

        attackResultSubject = new BehaviorSubject({
            attackRoll: 5,
            defenseRoll: 3,
            attackDice: 5,
            defenseDice: 3,
            damage: 2,
            attackerHP: 6,
            defenderHP: 6,
            attacker: { id: 'player1' } as Player,
            defender: { id: 'player2' } as Player,
        });
        fleeFailureSubject = new BehaviorSubject({
            fleeingPlayer: { id: 'player1', name: 'Joueur 1', amountEscape: 2 } as Player,
        });
        startCombatSubject = new BehaviorSubject({ firstPlayer: { id: 'player1' } as Player });
        combatEndedSubject = new BehaviorSubject({ loser: { name: 'Joueur 2' } as Player });

        mockLobbyService = jasmine.createSpyObj('LobbyService', [
            'attack',
            'flee',
            'onAttackResult',
            'onStartCombat',
            'onFleeFailure',
            'onCombatEnded',
        ]);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showInfo']);

        mockLobbyService.onAttackResult.and.returnValue(attackResultSubject.asObservable());
        mockLobbyService.onFleeFailure.and.returnValue(fleeFailureSubject.asObservable());
        mockLobbyService.onStartCombat.and.returnValue(startCombatSubject.asObservable());
        mockLobbyService.onCombatEnded.and.returnValue(combatEndedSubject.asObservable());

        await TestBed.configureTestingModule({
            imports: [CombatComponent, BrowserAnimationsModule],
            providers: [
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CombatComponent);
        component = fixture.componentInstance;

        component.currentPlayer = { id: 'player1', name: 'Joueur 1', amountEscape: 0 } as Player;
        component.opponent = { id: 'player2', name: 'Joueur 2' } as Player;
        component.lobbyId = 'testLobby';
        component.gameState = { id: 'game1', players: [component.currentPlayer, component.opponent], currentPlayer: 'player1' } as GameState;

        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should start the countdown and decrement the time', () => {
        component.countDown = 3;
        component.startCountdown();

        jasmine.clock().tick(1000);
        expect(component.countDown).toBe(2);

        jasmine.clock().tick(1000);
        expect(component.countDown).toBe(1);

        component.endTimer();
    });

    it('should stop the countdown when endTimer is called', () => {
        component.countDown = 3;
        component.startCountdown();
        component.endTimer();

        expect(component.isCountdownActive()).toBeFalse();
    });

    it('should not start the countdown if combatEnded is true', () => {
        component.combatEnded = true;
        component.countDown = 5;
        component.startCountdown();

        expect(component.isCountdownActive()).toBeFalse();
    });

    it('should return true if the countdown is active', () => {
        component.countDown = 5;
        component.startCountdown();

        expect(component.isCountdownActive()).toBeTrue();

        component.endTimer();
        expect(component.isCountdownActive()).toBeFalse();
    });

    it('should call onAttack when the countdown reaches zero and canAct is true', () => {
        spyOn(component, 'onAttack');
        component.countDown = 1;
        component.canAct = true;
        component.startCountdown();

        jasmine.clock().tick(2000);
        expect(component.onAttack).toHaveBeenCalled();
    });

    it('should call attack() if onAttack() is triggered and conditions are met', () => {
        component.canAct = true;
        component.onAttack();

        expect(mockLobbyService.attack).toHaveBeenCalledWith(component.lobbyId, component.currentPlayer, component.opponent);
    });

    it('should not call attack() if canAct is false', () => {
        component.canAct = false;
        component.onAttack();

        expect(mockLobbyService.attack).not.toHaveBeenCalled();
    });

    it('should call flee() and prevent escape after 2 attempts', () => {
        component.canAct = true;
        component.currentPlayer.amountEscape = 1;

        component.onFlee();
        expect(mockLobbyService.flee).toHaveBeenCalledWith('game1', component.currentPlayer, component.opponent);

        component.currentPlayer.amountEscape = 2;
        component.onFlee();

        expect(component.canEscape).toBeFalse();
        expect(mockNotificationService.showInfo).toHaveBeenCalledWith('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
        expect(component.countDown).toBe(3);
    });

    it('should handle onAttackResult() correctly', () => {
        component.ngOnInit();

        component.endTimer();

        component.canEscape = true;

        attackResultSubject.next({
            attackRoll: 5,
            defenseRoll: 3,
            attackDice: 5,
            defenseDice: 3,
            damage: 2,
            attackerHP: 50,
            defenderHP: 40,
            attacker: component.currentPlayer,
            defender: component.opponent,
        });

        fixture.detectChanges();

        expect(component.attackDice).toBe(5);
        expect(component.defenceDice).toBe(3);
        expect(component.damage).toBe(2);
        expect(component.canAct).toBeFalse();

        expect(component.countDown).toBe(5);
        expect(component.isCountdownActive()).toBeTrue();

        component.endTimer();
    });

    it('should handle onFleeFailure() correctly', () => {
        component.ngOnInit();

        fleeFailureSubject.next({
            fleeingPlayer: { id: 'player1', name: 'Joueur 1', amountEscape: 2 } as Player,
        });

        fixture.detectChanges();

        expect(component.canEscape).toBeFalse();
        expect(component.canAct).toBeFalse();
        expect(component.countDown).toBe(3);
        expect(mockNotificationService.showInfo).toHaveBeenCalledWith("Joueur 1 n'a pas réussi à fuir le combat.");
    });

    it('should display a notification when the combat ends', () => {
        component['subscriptions'].push(
            mockLobbyService.onCombatEnded().subscribe((data) => {
                component.combatEnded = true;
                mockNotificationService.showInfo(`La partie est terminée! ${data.loser.name} a perdu !`);
            }),
        );

        mockNotificationService.showInfo.calls.reset();

        combatEndedSubject.next({ loser: { name: 'Joueur 2' } as Player });
        fixture.detectChanges();

        expect(mockNotificationService.showInfo).toHaveBeenCalledWith('La partie est terminée! Joueur 2 a perdu !');
    });

    it('should stop the countdown and unsubscribe subscriptions in ngOnDestroy', () => {
        component.countDown = 5;
        component.startCountdown();
        const subscriptionSpy = spyOn(component['subscriptions'][0], 'unsubscribe');

        component.ngOnDestroy();

        expect(component.isCountdownActive()).toBeFalse();
        expect(subscriptionSpy).toHaveBeenCalled();
    });

    describe('ngOnChanges', () => {
        it('should set currentPlayer from gameState when currentPlayer is undefined', () => {
            component.currentPlayer = undefined as any;
            component.playerTurn = 'player1';
            component.gameState = {
                id: 'game1',
                players: [
                    { id: 'player1', name: 'Joueur 1', amountEscape: 0 } as Player,
                    { id: 'player2', name: 'Joueur 2', amountEscape: 0 } as Player,
                ],
                currentPlayer: 'player1',
            } as GameState;

            component.ngOnChanges();

            expect(component.currentPlayer).toEqual(jasmine.objectContaining({ id: 'player1' }));
        });

        it('should set opponent from gameState when opponent is undefined', () => {
            component.currentPlayer = { id: 'player1', name: 'Joueur 1', amountEscape: 0 } as Player;
            component.opponent = undefined as any;
            component.gameState = {
                id: 'game1',
                players: [
                    { id: 'player1', name: 'Joueur 1', amountEscape: 0 } as Player,
                    { id: 'player2', name: 'Joueur 2', amountEscape: 0 } as Player,
                ],
                currentPlayer: 'player1',
            } as GameState;

            component.ngOnChanges();

            expect(component.opponent).toEqual(jasmine.objectContaining({ id: 'player2' }));
        });

        it('should not change currentPlayer or opponent if they are already defined', () => {
            const originalCurrentPlayer = { id: 'player1', name: 'Joueur 1', amountEscape: 0 } as Player;
            const originalOpponent = { id: 'player2', name: 'Joueur 2', amountEscape: 0 } as Player;
            component.currentPlayer = originalCurrentPlayer;
            component.opponent = originalOpponent;
            component.playerTurn = 'player1';
            component.gameState = {
                id: 'game1',
                players: [originalCurrentPlayer, originalOpponent],
                currentPlayer: 'player1',
            } as GameState;

            component.ngOnChanges();

            expect(component.currentPlayer).toBe(originalCurrentPlayer);
            expect(component.opponent).toBe(originalOpponent);
        });

        it('should leave currentPlayer as undefined if gameState does not contain a matching player (fallback using ??)', () => {
            component.currentPlayer = undefined as any;
            component.playerTurn = 'nonexistent';
            component.gameState = {
                id: 'game1',
                players: [{ id: 'playerX', name: 'Player X', amountEscape: 0 } as Player],
                currentPlayer: 'nonexistent',
            } as GameState;

            component.ngOnChanges();

            expect(component.currentPlayer).toBeUndefined();
        });

        it('should leave opponent as undefined if gameState does not contain an opponent different from currentPlayer (fallback using ??)', () => {
            const singlePlayer = { id: 'player1', name: 'Player 1', amountEscape: 0 } as Player;
            component.currentPlayer = singlePlayer;
            component.opponent = undefined as any;
            component.gameState = {
                id: 'game1',
                players: [singlePlayer],
                currentPlayer: 'player1',
            } as GameState;

            component.ngOnChanges();

            expect(component.opponent).toBeUndefined();
        });
    });

    describe('onFlee early returns', () => {
        it('should return without calling flee when gameState is null', () => {
            component.gameState = null;
            component.canAct = true;

            component.onFlee();

            expect(mockLobbyService.flee).not.toHaveBeenCalled();
        });

        it('should return without calling flee when canAct is false', () => {
            component.gameState = {
                id: 'game1',
                players: [component.currentPlayer, component.opponent],
                currentPlayer: 'player1',
            } as GameState;
            component.canAct = false;

            component.onFlee();

            expect(mockLobbyService.flee).not.toHaveBeenCalled();
        });
    });

    describe('onFlee amountEscape fallback', () => {
        it('should set currentPlayer.amountEscape to 0 if it is undefined and call flee', () => {
            component.currentPlayer.amountEscape = undefined;
            component.canAct = true;
            component.gameState = { id: 'game1', players: [component.currentPlayer, component.opponent], currentPlayer: 'player1' } as GameState;
            component.onFlee();
            expect(mockLobbyService.flee).toHaveBeenCalledWith('game1', component.currentPlayer, component.opponent);
        });

        it('should not change currentPlayer.amountEscape if it is already defined and call flee', () => {
            component.currentPlayer.amountEscape = 1;
            component.canAct = true;
            component.gameState = { id: 'game1', players: [component.currentPlayer, component.opponent], currentPlayer: 'player1' } as GameState;
            component.onFlee();
            expect(component.currentPlayer.amountEscape).toBe(1);
            expect(mockLobbyService.flee).toHaveBeenCalledWith('game1', component.currentPlayer, component.opponent);
        });
    });

    describe('Subscription Branches', () => {
        it('should handle onAttackResult else branch correctly', () => {
            component.ngOnInit();
            const newAttacker: Player = { id: 'player3', name: 'Joueur 3' } as Player;
            const newDefender: Player = { id: 'player1', name: 'Joueur 1 Updated', amountEscape: 0 } as Player;
            attackResultSubject.next({
                attackRoll: 4,
                defenseRoll: 2,
                attackDice: 4,
                defenseDice: 2,
                damage: 3,
                attackerHP: 50,
                defenderHP: 40,
                attacker: newAttacker,
                defender: newDefender,
            });
            fixture.detectChanges();
            expect(component.currentPlayer).toEqual(newDefender);
            expect(component.opponent).toEqual(newAttacker);
            expect(component.canAct).toBeTrue();
        });

        it('should handle onStartCombat if branch correctly', () => {
            component['subscriptions'].push(
                mockLobbyService.onStartCombat().subscribe((data) => {
                    component.playerTurn = data.firstPlayer.id;
                    component.isPlayerTurn = component.currentPlayer.id === data.firstPlayer.id;
                    component.canAct = component.isPlayerTurn;
                }),
            );

            startCombatSubject.next({ firstPlayer: { id: 'player2', name: 'Joueur 2' } as Player });
            fixture.detectChanges();

            expect(component.playerTurn).toBe('player2');
            expect(component.isPlayerTurn).toBeFalse();
            expect(component.canAct).toBeFalse();
        });

        it('should handle onFleeFailure else branch correctly', () => {
            component.ngOnInit();
            component.canAct = false;
            fleeFailureSubject.next({
                fleeingPlayer: { id: 'player3', name: 'Joueur 3', amountEscape: 1 } as Player,
            });
            fixture.detectChanges();
            expect(component.canAct).toBeTrue();
        });
    });

    describe('Additional Branch Coverage', () => {
        it('should set countDown to 3 when canEscape is false in onAttackResult', () => {
            component.canEscape = false;
            attackResultSubject.next({
                attackRoll: 4,
                defenseRoll: 2,
                attackDice: 4,
                defenseDice: 2,
                damage: 3,
                attackerHP: 50,
                defenderHP: 40,
                attacker: component.currentPlayer,
                defender: component.opponent,
            });
            fixture.detectChanges();
            expect(component.canAct).toBeFalse();
            expect(component.countDown).toBe(3);
            component.endTimer();
        });

        it('should handle onFleeFailure with undefined amountEscape and set canEscape to true and countDown to 5', () => {
            component.ngOnInit();
            component.currentPlayer = { id: 'player1', name: 'Test Player', amountEscape: 0 } as Player;
            fleeFailureSubject.next({
                fleeingPlayer: { id: 'player1', name: 'Test Player', amountEscape: undefined } as Player,
            });
            fixture.detectChanges();
            expect(component.canEscape).toBeTrue();
            expect(component.countDown).toBe(5);
            expect(component.canAct).toBeFalse();
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith("Test Player n'a pas réussi à fuir le combat.");
            component.endTimer();
        });

        it('should evaluate canEscape as true when currentPlayer.amountEscape is undefined (using ?? 0)', () => {
            component.ngOnInit();
            component.currentPlayer.amountEscape = undefined;

            component.canEscape = true;

            expect(component.canEscape).toBeTrue();
            component.endTimer();
        });
    });
});
