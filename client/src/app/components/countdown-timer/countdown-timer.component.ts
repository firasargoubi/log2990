import { Component, Input } from '@angular/core';

const countdown = 60;
const delay = 1000;

@Component({
    selector: 'app-countdown-timer',
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.css'],
})
export class CountdownComponent {
    @Input() countdown: number = countdown; // Voir cmt implementer

    constructor() {
        setInterval(() => {
            if (this.countdown > 0) {
                this.countdown--;
            }
        }, delay);
    }
}
