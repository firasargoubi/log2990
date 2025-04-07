/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualPlayerDialogComponent } from './virtual-player-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '@app/services/notification.service';
import { CommonModule } from '@angular/common';

describe('VirtualPlayerDialogComponent', () => {
    let component: VirtualPlayerDialogComponent;
    let fixture: ComponentFixture<VirtualPlayerDialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<VirtualPlayerDialogComponent>>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showError']);

        await TestBed.configureTestingModule({
            imports: [CommonModule, VirtualPlayerDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualPlayerDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should generate random bonuses on init', () => {
        expect(component.generatedBonuses).toBeDefined();
        expect(component.generatedBonuses.attack).toBeDefined();
        expect(component.generatedBonuses.defense).toBeDefined();
        expect(component.generatedBonuses.life || component.generatedBonuses.speed).toBeDefined();
    });

    it('should set selectedProfile and regenerate bonuses when selectProfile is called', () => {
        component.selectProfile('aggressive');
        expect(component.selectedProfile).toBe('aggressive');
        expect(component.generatedBonuses).toBeDefined();
    });

    it('should show error when onConfirm is called without a selected profile', () => {
        component.selectedProfile = null;
        component.onConfirm();
        expect(mockNotificationService.showError).toHaveBeenCalledWith('Veuillez sélectionner un profil');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog with virtual player when onConfirm is called with a selected profile', () => {
        component.selectedProfile = 'defensive';
        component.generatedBonuses = { life: 2, attack: 'D6', defense: 'D4' };
        component.onConfirm();
        expect(mockDialogRef.close).toHaveBeenCalled();
        const virtualPlayer = mockDialogRef.close.calls.argsFor(0)[0];
        expect(virtualPlayer).toBeDefined();
        expect(virtualPlayer.life).toBe(6);
        expect(virtualPlayer.speed).toBe(4);
        expect(virtualPlayer.attack).toBe(4);
        expect(virtualPlayer.defense).toBe(4);
        expect(virtualPlayer.maxLife).toBe(6);
        expect(virtualPlayer.virtualPlayerData).toEqual({ profile: 'defensive' });
    });

    it('should use 0 as bonus for life if generatedBonuses.life is falsy', () => {
        component.selectedProfile = 'aggressive';
        component.generatedBonuses = { attack: 'D4', defense: 'D6' };
        component.onConfirm();
        expect(mockDialogRef.close).toHaveBeenCalled();
        const virtualPlayer = mockDialogRef.close.calls.argsFor(0)[0];
        expect(virtualPlayer.life).toBe(4);
        expect(virtualPlayer.maxLife).toBe(4);
    });

    it('should close dialog on cancel', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
});
