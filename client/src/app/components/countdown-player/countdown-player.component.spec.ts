import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { BehaviorSubject, of } from 'rxjs';
import { CountdownPlayerComponent } from './countdown-player.component';

describe('CountdownPlayerComponent', () => {
    let component: CountdownPlayerComponent;
    let fixture: ComponentFixture<CountdownPlayerComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

    // Créer un mock pour isInCombat$
    const mockIsInCombat$ = new BehaviorSubject<boolean>(false);

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('LobbyService', ['requestEndTurn', 'updateCombatTime', 'onCombatUpdate']);
        // Configuration du mock pour onCombatUpdate
        spy.onCombatUpdate.and.returnValue(of({ timeLeft: 30 }));
        // Exposer isInCombat$ comme propriété
        Object.defineProperty(spy, 'isInCombat$', {
            get: () => mockIsInCombat$,
        });

        await TestBed.configureTestingModule({
            imports: [],
            providers: [{ provide: LobbyService, useValue: spy }],
        }).compileComponents();

        lobbyServiceSpy = TestBed.inject(LobbyService) as jasmine.SpyObj<LobbyService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownPlayerComponent);
        component = fixture.componentInstance;
        // Réinitialiser les valeurs par défaut
        component.countdown = 60;
        component.isPlayerTurn = false;
        component.isTransitioning = false;
        component.lobbyId = 'test-lobby';
        component.isInCombat = false;
        component.isAnimated = false;
        // Réinitialiser l'état du mock
        mockIsInCombat$.next(false);
        // Espionner la méthode startCountdown
        spyOn(component, 'startCountdown').and.callThrough();
        spyOn(component, 'pauseCountdown').and.callThrough();
        // Réinitialiser les compteurs
        if (component.interval !== null) {
            clearInterval(component.interval);
            component.interval = null;
        }
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize with correct values', () => {
        fixture.detectChanges();
        expect(component.remainingTime).toBe(60);
        expect(component.message).toBe('--');
    });

    it('should subscribe to isInCombat$ on init', () => {
        fixture.detectChanges();
        expect(component.isInCombat).toBeFalsy();

        // Simuler le changement d'état de combat
        mockIsInCombat$.next(true);
        expect(component.isInCombat).toBeTruthy();
        expect(component.pauseCountdown).toHaveBeenCalled();

        mockIsInCombat$.next(false);
        expect(component.isInCombat).toBeFalsy();
        expect(component.startCountdown).toHaveBeenCalledWith(component.remainingTime);
    });

    it('should decrement remainingTime during countdown', fakeAsync(() => {
        fixture.detectChanges();
        component.startCountdown(10);
        expect(component.remainingTime).toBe(60);

        tick(1000); // Avancer le temps de 1 seconde
        expect(component.remainingTime).toBe(59);

        // Nettoyer l'intervalle pour les tests
        if (component.interval !== null) {
            clearInterval(component.interval);
            component.interval = null;
        }
    }));

    it('should pause countdown correctly', () => {
        fixture.detectChanges();
        component.remainingTime = 30;
        component.startCountdown(component.remainingTime);

        // Vérifier que l'intervalle existe
        expect(component.interval).not.toBeNull();

        component.pauseCountdown();

        // Vérifier que l'intervalle a été arrêté
        expect(component.interval).toBeNull();
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(30);
    });

    it('should resume countdown correctly', () => {
        fixture.detectChanges();
        component.remainingTime = 25;

        // S'assurer que l'intervalle est null avant de reprendre
        component.interval = null;

        component.resumeCountdown();

        // Vérifier que onCombatUpdate a été appelé
        expect(lobbyServiceSpy.onCombatUpdate).toHaveBeenCalled();
        // Vérifier que le temps restant a été mis à jour
        expect(component.remainingTime).toBe(30); // valeur de retour du mock
        // Vérifier que startCountdown a été appelé
        expect(component.startCountdown).toHaveBeenCalledWith(30);
    });

    it('should not restart countdown if interval already exists when resuming', () => {
        fixture.detectChanges();
        component.remainingTime = 40;

        // Simuler un intervalle existant
        component.interval = 123;

        // Réinitialiser le compteur d'appels pour startCountdown
        (component.startCountdown as jasmine.Spy).calls.reset();

        component.resumeCountdown();

        // Vérifier que onCombatUpdate a été appelé
        expect(lobbyServiceSpy.onCombatUpdate).toHaveBeenCalled();
        // Vérifier que le temps restant a été mis à jour
        expect(component.remainingTime).toBe(30); // valeur de retour du mock
        // Vérifier que startCountdown n'a PAS été appelé
        expect(component.startCountdown).not.toHaveBeenCalled();
    });

    it('should get display time correctly when time remains', () => {
        fixture.detectChanges();
        component.remainingTime = 42;
        expect(component.getDisplayTime()).toBe('42s');
    });

    it('should get display time correctly when time is up', () => {
        fixture.detectChanges();
        component.remainingTime = 0;
        expect(component.getDisplayTime()).toBe('Temps écoulé');
    });

    it('should unsubscribe and clear interval on destroy', () => {
        fixture.detectChanges();

        // Simuler un intervalle actif
        component.interval = window.setInterval(() => {}, 1000);

        // Créer un espion pour la méthode unsubscribe
        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        component['combatStatusSubscription'] = subscriptionSpy;

        component.ngOnDestroy();

        // Vérifier que l'intervalle a été supprimé
        expect(component.interval).toBeNull();
        // Vérifier que l'abonnement a été annulé
        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();
    });

    it('should handle unsubscribe safely when subscription is null', () => {
        fixture.detectChanges();

        // S'assurer que la souscription est nulle
        component['combatStatusSubscription'] = null;

        // Vérifier qu'aucune erreur n'est levée
        expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle interval correctly when timer reaches zero', fakeAsync(() => {
        fixture.detectChanges();
        component.remainingTime = 1;
        component.startCountdown(component.remainingTime);

        tick(1000); // Avancer le temps de 1 seconde
        expect(component.remainingTime).toBe(0);
    }));

    it('should handle the while loop condition when isAnimated is true', fakeAsync(() => {
        fixture.detectChanges();
        component.remainingTime = 1;
        component.isAnimated = true;

        // Simuler la fin de l'animation après un court délai
        setTimeout(() => {
            component.isAnimated = false;
        }, 500);

        component.startCountdown(component.remainingTime);
        tick(1000); // Avancer le temps de 1 seconde pour que le compteur atteigne 0
        tick(500); // Attendre que l'animation se termine

        // Nettoyer l'intervalle pour les tests
        if (component.interval !== null) {
            clearInterval(component.interval);
            component.interval = null;
        }
    }));
});
