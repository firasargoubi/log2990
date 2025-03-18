// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { LobbyService } from '@app/services/lobby.service';
// import { CountdownPlayerComponent } from './countdown-player.component';

// describe('CountdownPlayerComponent', () => {
//     let component: CountdownPlayerComponent;
//     let fixture: ComponentFixture<CountdownPlayerComponent>;
//     let lobbyServiceMock: jasmine.SpyObj<LobbyService>;

//     beforeEach(async () => {
//         lobbyServiceMock = jasmine.createSpyObj('LobbyService', ['requestEndTurn']);

//         await TestBed.configureTestingModule({
//             imports: [CountdownPlayerComponent],
//             providers: [{ provide: LobbyService, useValue: lobbyServiceMock }],
//         }).compileComponents();

//         fixture = TestBed.createComponent(CountdownPlayerComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     afterEach(() => {
//         if (component.interval !== null) {
//             clearInterval(component.interval);
//         }
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize remainingTime and start countdown on ngOnInit', () => {
//         component.countdown = 60;
//         component.ngOnInit();
//         expect(component.remainingTime).toBe(60);
//         expect(component.interval).not.toBeNull();
//     });

//     it('should clear interval on ngOnDestroy', () => {
//         component.interval = window.setInterval(() => {}, 1000);
//         component.ngOnDestroy();
//         expect(component.interval).toBeNull();
//     });

//     it('should decrement remainingTime every second', (done) => {
//         component.countdown = 3;
//         component.startCountdown();

//         setTimeout(() => {
//             expect(component.remainingTime).toBe(58);
//             done();
//         }, 1000);
//     });

//     it('should call requestEndTurn when countdown reaches zero', (done) => {
//         component.countdown = 1;
//         component.lobbyId = 'test-lobby';
//         component.startCountdown();

//         setTimeout(() => {
//             expect(component.remainingTime).toBe(58);
//             expect(lobbyServiceMock.requestEndTurn).toHaveBeenCalledWith('test-lobby');
//             done();
//         }, 1000);
//     });

//     it('should reset the countdown and restart the interval', () => {
//         component.countdown = 60;
//         component.remainingTime = 30;
//         component.interval = window.setInterval(() => {}, 1000);

//         spyOn(component, 'startCountdown');
//         component.resetCountdown();

//         expect(component.remainingTime).toBe(60);
//         expect(component.interval).toBeNull();
//         expect(component.startCountdown).toHaveBeenCalled();
//     });

//     it('should return the remaining time in seconds', () => {
//         component.remainingTime = 30;
//         expect(component.getDisplayTime()).toBe('30s');
//     });

//     it('should return "Temps écoulé" when remaining time is zero', () => {
//         component.remainingTime = 0;
//         expect(component.getDisplayTime()).toBe('Temps écoulé');
//     });

//     it('should not start countdown if countdown is 0', () => {
//         component.countdown = 0;
//         component.startCountdown();
//         expect(component.interval).toBeNull();
//     });
//     it('should initialize input properties correctly', () => {
//         component.countdown = 30;
//         component.isPlayerTurn = true;
//         component.isInCombat = true;
//         component.isTransitioning = true;
//         component.lobbyId = 'test-lobby';

//         expect(component.countdown).toBe(30);
//         expect(component.isPlayerTurn).toBeTrue();
//         expect(component.isInCombat).toBeTrue();
//         expect(component.isTransitioning).toBeTrue();
//         expect(component.lobbyId).toBe('test-lobby');
//     });
// });
