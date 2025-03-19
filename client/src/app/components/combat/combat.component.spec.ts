/*import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { of } from 'rxjs';
import { CombatComponent } from './combat.component';

describe('CombatComponent', () => {
    let component: CombatComponent;
    let fixture: ComponentFixture<CombatComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    beforeEach(async () => {
        mockLobbyService = jasmine.createSpyObj('LobbyService', [
            'handleAttack',
            'attack',
            'flee',
            'updateCombatTime',
            'onAttackResult',
            'onStartCombat',
            'onGameEnded',
            'onFleeFailure',
            'getCombatUpdate',
        ]);

        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showInfo']);

        await TestBed.configureTestingModule({
            declarations: [CombatComponent],
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
        component.gameState = { id: 'game1', players: [component.currentPlayer, component.opponent] } as GameState;

        fixture.detectChanges();
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('devrait être créé', () => {
        expect(component).toBeTruthy();
    });

    it('devrait appeler handleAttack au démarrage si gameState existe', () => {
        expect(mockLobbyService.handleAttack).toHaveBeenCalledWith(
            component.currentPlayer,
            component.opponent,
            component.lobbyId,
            component.gameState as GameState,
        );
    });

    it('devrait démarrer le compte à rebours et décrémenter le temps', (done) => {
        component.countDown = 3;
        component.startCountdown();

        setTimeout(() => {
            expect(component.countDown).toBeLessThan(3);
            component.endTimer();
            done();
        }, 2001);
    });

    it('devrait stopper le compte à rebours lorsque endTimer est appelé', () => {
        component.countDown = 3;
        component.startCountdown();
        component.endTimer();

        expect(component.isCountdownActive()).toBeFalse();
    });

    it('devrait appeler attack() si onAttack() est déclenché et les conditions sont remplies', () => {
        component.canAct = true;
        component.gameState = { id: 'game1', players: [component.currentPlayer, component.opponent] } as GameState;

        component.onAttack();

        expect(mockLobbyService.attack).toHaveBeenCalledWith(component.lobbyId, component.currentPlayer, component.opponent);
    });

    it('devrait appeler flee() et empêcher la fuite après 2 tentatives', () => {
        component.canAct = true;
        component.currentPlayer.amountEscape = 1;
        component.onFlee();

        expect(mockLobbyService.flee).toHaveBeenCalledWith('game1', component.currentPlayer);

        component.currentPlayer.amountEscape = 2;
        component.onFlee();

        expect(component.canEscape).toBeFalse();
        expect(mockNotificationService.showInfo).toHaveBeenCalledWith('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
    });

    it('devrait gérer onFleeFailure() correctement', () => {
        const fleeingPlayer = { id: 'player1', name: 'Joueur 1', amountEscape: 2 } as Player;

        mockLobbyService.onFleeFailure.and.returnValue(of({ fleeingPlayer }));
        component.ngOnInit();

        expect(component.canEscape).toBeFalse();
        expect(mockNotificationService.showInfo).toHaveBeenCalledWith('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
    });

    it('devrait gérer onGameEnded()', () => {
        mockLobbyService.onCombatEnded.and.returnValue(of({}));
        component.ngOnInit();

        expect(mockNotificationService.showInfo).toHaveBeenCalledWith('La partie est terminée!');
    });

    it('devrait gérer onAttackResult()', () => {
        const attackResult = {
            attackRoll: 5,
            defenseRoll: 3,
            attackDice: 5,
            defenseDice: 3,
            damage: 2,
            attackerHP: 50,
            defenderHP: 40,
            attacker: component.currentPlayer,
            defender: component.opponent,
        };

        mockLobbyService.onAttackResult.and.returnValue(of(attackResult));
        component.ngOnInit();

        expect(component.attackDice).toEqual(5);
        expect(component.defenceDice).toEqual(3);
        expect(component.damage).toEqual(2);
        expect(component.canAct).toBeFalse();
    });

    it('devrait mettre à jour les joueurs après getCombatUpdate()', () => {
        const updatedPlayer = { ...component.currentPlayer, amountEscape: 1 } as Player;
        const updatedOpponent = { ...component.opponent } as Player;
        const gameStateUpdate = { players: [updatedPlayer, updatedOpponent] };

        mockLobbyService.getCombatUpdate.and.returnValue(of(gameStateUpdate));
        component.ngOnInit();

        expect(component.currentPlayer.amountEscape).toEqual(1);
        expect(component.canEscape).toBeTrue();
    });
});*/
