import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatSnackBar', ['open']);
        TestBed.configureTestingModule({
            providers: [NotificationService, { provide: MatSnackBar, useValue: spy }],
        });

        service = TestBed.inject(NotificationService);
        snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call MatSnackBar.open with success-notification class', () => {
        const message = 'Success message';
        service.showSuccess(message);
        expect(snackBarSpy.open).toHaveBeenCalledWith(
            message,
            'Fermer',
            jasmine.objectContaining({
                duration: 3000,
                panelClass: ['success-notification'],
            }),
        );
    });

    it('should call MatSnackBar.open with error-notification class', () => {
        const message = 'Error message';
        service.showError(message);
        expect(snackBarSpy.open).toHaveBeenCalledWith(
            message,
            'Fermer',
            jasmine.objectContaining({
                duration: 3000,
                panelClass: ['error-notification'],
            }),
        );
    });

    it('should call MatSnackBar.open with info-notification class', () => {
        const message = 'Info message';
        service.showInfo(message);
        expect(snackBarSpy.open).toHaveBeenCalledWith(
            message,
            'Fermer',
            jasmine.objectContaining({
                duration: 3000,
                panelClass: ['info-notification'],
            }),
        );
    });
});
