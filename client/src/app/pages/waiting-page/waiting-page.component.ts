import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

const RANDOM = 1000;
const RANDOM_MAX = 9000;

@Component({
    selector: 'app-waiting-page',
    imports: [RouterLink],
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingPageComponent implements OnInit {
    randomNumber: number;

    ngOnInit() {
        this.generateRandomNumber();
    }

    generateRandomNumber() {
        this.randomNumber = Math.floor(RANDOM + Math.random() * RANDOM_MAX);
    }
}
