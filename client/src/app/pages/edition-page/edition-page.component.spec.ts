import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { SaveService } from '@app/services/save.service';
import { of } from 'rxjs';
import { EditionPageComponent } from './edition-page.component';

describe('EditionPageComponent', () => {
    let component: EditionPageComponent;
    let fixture: ComponentFixture<EditionPageComponent>;
    let router: Router;
    let saveService: SaveService;
    let errorService: ErrorService;
    let gameService: GameService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditionPageComponent],
            providers: [
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { params: of({ id: '123' }) }, // Mocking route params
                },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: SaveService, useValue: jasmine.createSpyObj('SaveService', ['alertBoardForVerification', 'saveGame']) },
                { provide: ErrorService, useValue: jasmine.createSpyObj('ErrorService', ['addMessage', 'message$']) },
                { provide: GameService, useValue: jasmine.createSpyObj('GameService', ['fetchGameById']) },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionPageComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        saveService = TestBed.inject(SaveService);
        errorService = TestBed.inject(ErrorService);
        gameService = TestBed.inject(GameService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize game properties correctly', () => {
        expect(component.game.id).toBe('123');
        expect(component.game.mode).toBe('normal');
        expect(component.game.mapSize).toBe('large');
    });

    it('should call saveService.saveGame when saveBoard is called', async () => {
        component.game.name = 'Test Game';
        component.game.description = 'Test Description';
        await component.saveBoard();
        expect(saveService.saveGame).toHaveBeenCalledWith(component.game);
    });

    it('should show error popup if game name is missing', async () => {
        component.game.description = 'Test Description';
        await component.saveBoard();
        expect(errorService.addMessage).toHaveBeenCalledWith('Error: Game name is required.\n');
    });

    it('should show error popup if game description is missing', async () => {
        component.game.name = 'Test Game';
        await component.saveBoard();
        expect(errorService.addMessage).toHaveBeenCalledWith('Error: Game description is required.\n');
    });

    it('should reset board on resetBoard call', () => {
        spyOn(window.location, 'reload');
        component.resetBoard();
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('should navigate to /admin on closePopup if saveState is true', () => {
        component.saveState = true;
        component.closePopup();
        expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should not navigate to /admin on closePopup if saveState is false', () => {
        component.saveState = false;
        component.closePopup();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should load game on loadGame call', () => {
        component.loadGame();
        expect(gameService.fetchGameById).toHaveBeenCalledWith('123');
    });
});
