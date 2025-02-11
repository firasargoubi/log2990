import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ErrorService {
    message = new Subject<string>();
    message$ = this.message.asObservable();
    addMessage(message: string): void {
        this.message.next(message);
        this.message.next('\n');
    }
    showError(message: string) {
        console.error(message);
    }
}
