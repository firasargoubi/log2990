// combat-notification.component.ts
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-combat-notification',
    templateUrl: './combat-notification.component.html',
    styleUrls: ['./combat-notification.component.scss'],
})
export class CombatNotificationComponent {
    @Input() message: string = '';
}
