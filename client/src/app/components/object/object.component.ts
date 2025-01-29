import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-object',
    imports: [],
    templateUrl: './object.component.html',
    styleUrl: './object.component.scss',
})
export class ObjectComponent {
    @Input() instances: number;
}
